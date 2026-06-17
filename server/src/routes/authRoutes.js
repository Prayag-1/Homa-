const router = require('express').Router();
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiters');
const {
  register,
  verifyAccount,
  resendVerificationCode,
  login,
  me,
  logout,
  refreshToken,
  updateProfile,
} = require('../controllers/authController');
const {
  registerSchema,
  loginSchema,
  verifySchema,
  resendSchema,
  updateProfileSchema,
} = require('../validators/authValidators');

router.post('/register', authLimiter, validate(registerSchema), register);
router.post('/verify', validate(verifySchema), verifyAccount);
router.post('/resend-verification', validate(resendSchema), resendVerificationCode);
router.post('/login', authLimiter, validate(loginSchema), login);
router.get('/me', protect, me);
router.put('/profile', protect, validate(updateProfileSchema), updateProfile);
router.post('/logout', logout);
router.post('/refresh', refreshToken);

module.exports = router;
