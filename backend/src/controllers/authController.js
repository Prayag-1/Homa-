const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const { buildTokenPair } = require('../utils/authTokens');
const {
  sanitizeString,
  validatePagination,
} = require('../utils/queryHelpers');
const { sanitizeString: sanitizeContentString } = require('../utils/sanitize');
const {
  normalizePhoneNumber,
  normalizeEmail,
  generateVerificationCode,
  hashVerificationCode,
  sendVerificationCode,
} = require('../utils/verification');
const { getMembershipTier } = require('../utils/loyalty');

const isProduction = process.env.NODE_ENV === 'production';
const normalizeSameSite = (value) => {
  const normalized = String(value || '').toLowerCase();
  if (normalized === 'none' || normalized === 'lax' || normalized === 'strict') {
    return normalized;
  }
  return isProduction ? 'none' : 'lax';
};

const cookieOptions = {
  httpOnly: true,
  secure: process.env.COOKIE_SECURE
    ? process.env.COOKIE_SECURE === 'true'
    : isProduction,
  sameSite: normalizeSameSite(process.env.COOKIE_SAMESITE),
  path: '/api/v1/auth',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone || user.phoneNumber,
  phoneNumber: user.phoneNumber,
  birthday: user.birthday,
  address: user.address,
  role: user.role,
  loyaltyPoints: user.loyaltyPoints || 0,
  membershipTier: getMembershipTier(user.loyaltyPoints || 0),
  verificationMethod: user.verificationMethod,
  isVerified: user.isVerified,
  isActive: user.isActive,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const isStrongPassword = (pwd) => (
  typeof pwd === 'string' &&
  pwd.length >= 8 &&
  /[A-Z]/.test(pwd) &&
  /[0-9]/.test(pwd)
);

const createVerificationPayload = (target) => {
  const code = generateVerificationCode();
  return {
    target,
    code,
    codeHash: hashVerificationCode(code),
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    attempts: 0,
    lastSentAt: new Date(),
  };
};

const resolveVerificationMethod = (preferredMethod, email, phoneNumber, target) => {
  if (preferredMethod === 'email' || preferredMethod === 'phone') {
    return preferredMethod;
  }

  if (normalizeEmail(email) || normalizeEmail(target)) {
    return 'email';
  }

  if (normalizePhoneNumber(phoneNumber) || normalizePhoneNumber(target)) {
    return 'phone';
  }

  return null;
};

const findUserByIdentifier = async (identifier) => {
  const email = normalizeEmail(identifier);
  const phoneNumber = normalizePhoneNumber(identifier);

  if (email) return User.findOne({ email }).select('+password +verification.codeHash +verification.expiresAt');
  if (phoneNumber) return User.findOne({ phoneNumber }).select('+password +verification.codeHash +verification.expiresAt');
  return null;
};

const register = async (req, res, next) => {
  try {
    const { name, email, phoneNumber, password, birthday, address, verificationMethod } = req.body;
    const normalizedEmail = normalizeEmail(email);
    const normalizedPhone = normalizePhoneNumber(phoneNumber);

    if (!isStrongPassword(password)) {
      return next(new ApiError(
        400,
        'Password must be at least 8 characters with one uppercase letter and one number',
      ));
    }

    if (!normalizedPhone) {
      return res.status(400).json({
        success: false,
        message: 'A valid phone number is required',
      });
    }

    const method = resolveVerificationMethod(
      verificationMethod,
      normalizedEmail,
      normalizedPhone,
      req.body.target,
    );
    const target = method === 'email' ? normalizedEmail : normalizedPhone;

    if (!target) {
      return res.status(400).json({
        success: false,
        message: method === 'email'
          ? 'A valid email address is required for email verification'
          : 'A valid phone number is required for phone verification',
      });
    }

    const query = method === 'email' ? { email: target } : { phoneNumber: target };
    const existingUser = await User.findOne(query).select('+password +verification.codeHash +verification.expiresAt');
    const verification = createVerificationPayload(target);

    let user;

    if (existingUser) {
      if (existingUser.isVerified) {
        return res.status(409).json({
          success: false,
          message: `${verificationMethod === 'email' ? 'Email' : 'Phone number'} already registered`,
        });
      }

      existingUser.name = name;
      existingUser.password = password;
      existingUser.birthday = birthday;
      existingUser.address = address;
      existingUser.phoneNumber = normalizedPhone;
      existingUser.verificationMethod = method;
      existingUser.verification = verification;
      user = await existingUser.save();
    } else {
      user = await User.create({
        name,
        email: method === 'email' ? target : normalizedEmail || undefined,
        phoneNumber: normalizedPhone,
        password,
        birthday,
        address,
        verificationMethod: method,
        isVerified: false,
        verification,
      });
    }

    await sendVerificationCode({
      method,
      target,
      code: verification.code,
    });

    res.status(201).json({
      success: true,
      message: `Verification code sent to your ${method}`,
      data: {
        user: sanitizeUser(user),
        verificationRequired: true,
        verificationMethod: method,
        target,
      },
    });
  } catch (error) {
    next(error);
  }
};

const verifyAccount = async (req, res, next) => {
  try {
    const { verificationMethod, target, code } = req.body;
    const normalizedTarget = normalizeEmail(target) || normalizePhoneNumber(target);
    const method = verificationMethod || (normalizeEmail(target) ? 'email' : 'phone');

    if (!normalizedTarget) {
      return res.status(400).json({
        success: false,
        message:
          method === 'email'
            ? 'A valid email address is required'
            : 'A valid phone number is required',
      });
    }

    const query = method === 'email'
      ? { email: normalizedTarget }
      : { phoneNumber: normalizedTarget };

    const user = await User.findOne(query).select(
      '+password +verification.codeHash +verification.expiresAt +verification.attempts +verification.lastSentAt',
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(200).json({
        success: true,
        message: 'Account already verified',
        data: { user: sanitizeUser(user) },
      });
    }

    if (!user.verification?.codeHash || !user.verification?.expiresAt) {
      return res.status(400).json({
        success: false,
        message: 'Verification code not available, request a new one',
      });
    }

    if (user.verification.expiresAt.getTime() < Date.now()) {
      return res.status(400).json({
        success: false,
        message: 'Verification code expired, request a new one',
      });
    }

    const maxAttempts = 5;
    if ((user.verification.attempts || 0) >= maxAttempts) {
      return res.status(429).json({
        success: false,
        message: 'Too many verification attempts, request a new code',
      });
    }

    const normalizedCode = String(code).trim();
    if (!/^\d{6}$/.test(normalizedCode)) {
      return res.status(400).json({ success: false, message: 'Invalid verification code' });
    }

    user.verification.attempts += 1;
    const codeHash = hashVerificationCode(normalizedCode);
    const storedHash = String(user.verification.codeHash || '');
    const matches = codeHash === storedHash;

    if (!matches) {
      await user.save();
      return res.status(400).json({ success: false, message: 'Invalid verification code' });
    }

    user.isVerified = true;
    user.verification = undefined;
    await user.save();

    const { accessToken, refreshToken } = buildTokenPair(user._id);
    res.cookie('refreshToken', refreshToken, cookieOptions);

    res.status(200).json({
      success: true,
      message: 'Account verified successfully',
      data: {
        accessToken,
        user: sanitizeUser(user),
      },
    });
  } catch (error) {
    next(error);
  }
};

const resendVerificationCode = async (req, res, next) => {
  try {
    const { verificationMethod, target } = req.body;
    const normalizedTarget = normalizeEmail(target) || normalizePhoneNumber(target);
    const method = verificationMethod || (normalizeEmail(target) ? 'email' : 'phone');

    if (!normalizedTarget) {
      return res.status(400).json({
        success: false,
        message:
          method === 'email'
            ? 'A valid email address is required'
            : 'A valid phone number is required',
      });
    }

    const query = method === 'email'
      ? { email: normalizedTarget }
      : { phoneNumber: normalizedTarget };

    const user = await User.findOne(query).select(
      '+verification.codeHash +verification.expiresAt +verification.attempts +verification.lastSentAt',
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(200).json({
        success: true,
        message: 'Account already verified',
      });
    }

    const verification = createVerificationPayload(normalizedTarget);
    user.verification = verification;
    await user.save();

    await sendVerificationCode({
      method,
      target: normalizedTarget,
      code: verification.code,
    });

    res.status(200).json({
      success: true,
      message: 'Verification code resent',
      data: {},
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { identifier, password } = req.body;
    const user = await findUserByIdentifier(identifier);

    if (!user || !(await user.comparePassword(password))) {
      return next(new ApiError(401, 'Invalid email or password'));
    }

    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: 'Account is not verified yet',
      });
    }

    const { accessToken, refreshToken } = buildTokenPair(user._id);
    res.cookie('refreshToken', refreshToken, cookieOptions);

    res.status(200).json({
      success: true,
      data: {
        accessToken,
        user: sanitizeUser(user),
      },
    });
  } catch (error) {
    next(error);
  }
};

const me = async (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      user: sanitizeUser(req.user),
    },
  });
};

const adminGetUsers = async (req, res, next) => {
  try {
    const {
      search = '',
      page = 1,
      limit = 20,
      role = 'user',
    } = req.query;

    const { safePage: pageNumber, safeLimit: pageSize, skip } = validatePagination(page, limit, 100, 20);
    const query = {};

    if (role && role !== 'all') {
      query.role = role;
    }

    const searchTerm = sanitizeString(search, 100);
    if (searchTerm) {
      const safeSearch = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { name: { $regex: safeSearch, $options: 'i' } },
        { email: { $regex: safeSearch, $options: 'i' } },
        { phoneNumber: { $regex: safeSearch, $options: 'i' } },
      ];
    }

    const [items, total] = await Promise.all([
      User.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize),
      User.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: {
        items: items.map(sanitizeUser),
        page: pageNumber,
        limit: pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
    });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    res.clearCookie('refreshToken', { ...cookieOptions, maxAge: undefined });
    res.status(200).json({ success: true, message: 'Logged out' });
  } catch (error) {
    next(error);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    if (!req.cookies?.refreshToken) {
      return next(new ApiError(401, 'No refresh token'));
    }

    let decoded;
    try {
      decoded = jwt.verify(req.cookies.refreshToken, process.env.JWT_REFRESH_SECRET, {
        algorithms: ['HS256'],
      });
    } catch (err) {
      res.clearCookie('refreshToken', { ...cookieOptions, maxAge: undefined });
      return next(new ApiError(401, 'Invalid refresh token'));
    }

    const user = await User.findById(decoded.id);

    if (!user || !user.isActive || !user.isVerified) {
      return next(new ApiError(401, 'User not found, deactivated, or unverified'));
    }

    const { accessToken } = buildTokenPair(user._id);
    res.status(200).json({ success: true, data: { accessToken } });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    // SECURITY: scoped to req.user._id to prevent IDOR
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    if (user.role === 'admin') {
      return next(new ApiError(403, 'Forbidden'));
    }

    const { name, birthday, address, skinType, phoneNumber } = req.body;

    if (name) user.name = sanitizeContentString(name);
    if (birthday) user.birthday = birthday;
    if (skinType) user.skinType = skinType;
    
    if (phoneNumber) {
      const normalized = normalizePhoneNumber(phoneNumber);
      user.phoneNumber = normalized || phoneNumber;
      user.phone = normalized || phoneNumber;
    }

    if (address) {
      user.address = {
        line1: address.line1 !== undefined ? address.line1 : user.address.line1,
        line2: address.line2 !== undefined ? address.line2 : user.address.line2,
        city: address.city !== undefined ? address.city : user.address.city,
        state: address.state !== undefined ? address.state : user.address.state,
        postalCode: address.postalCode !== undefined ? address.postalCode : user.address.postalCode,
        country: address.country !== undefined ? address.country : user.address.country,
      };
    }

    const updatedUser = await user.save();
    
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: sanitizeUser(updatedUser),
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  verifyAccount,
  resendVerificationCode,
  login,
  me,
  logout,
  refreshToken,
  updateProfile,
  adminGetUsers,
};
