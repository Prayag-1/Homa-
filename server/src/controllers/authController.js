const crypto = require('crypto');
const User = require('../models/User');
const { buildTokenPair } = require('../utils/authTokens');
const {
  normalizePhoneNumber,
  normalizeEmail,
  generateVerificationCode,
  hashVerificationCode,
  sendVerificationCode,
} = require('../utils/verification');

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/api/v1/auth',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  phoneNumber: user.phoneNumber,
  birthday: user.birthday,
  address: user.address,
  role: user.role,
  verificationMethod: user.verificationMethod,
  isVerified: user.isVerified,
  isActive: user.isActive,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

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
      existingUser.verificationMethod = method;
      existingUser.verification = verification;
      user = await existingUser.save();
    } else {
      user = await User.create({
        name,
        email: method === 'email' ? target : undefined,
        phoneNumber: method === 'phone' ? target : undefined,
        password,
        birthday,
        address,
        verificationMethod: method,
        isVerified: false,
        verification,
      });
    }

    await sendVerificationCode({
      method: verificationMethod,
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
        ...(process.env.NODE_ENV !== 'production' && {
          devVerificationCode: verification.code,
        }),
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

    user.verification.attempts += 1;
    const codeHash = hashVerificationCode(code);
    const matches =
      codeHash.length === user.verification.codeHash.length &&
      crypto.timingSafeEqual(Buffer.from(codeHash, 'hex'), Buffer.from(user.verification.codeHash, 'hex'));

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
      data: {
        ...(process.env.NODE_ENV !== 'production' && {
          devVerificationCode: verification.code,
        }),
      },
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
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
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

const logout = async (req, res, next) => {
  try {
    res.clearCookie('refreshToken', { ...cookieOptions, maxAge: undefined });
    res.status(200).json({ success: true, message: 'Logged out' });
  } catch (error) {
    next(error);
  }
};

const refreshToken = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) {
      return res.status(401).json({ success: false, message: 'Refresh token not found' });
    }

    const decoded = require('jsonwebtoken').verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || !user.isActive || !user.isVerified) {
      return res.status(401).json({
        success: false,
        message: 'User not found, deactivated, or unverified',
      });
    }

    const { accessToken } = buildTokenPair(user._id);
    res.status(200).json({ success: true, data: { accessToken } });
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
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
};
