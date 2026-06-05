const router = require('express').Router();
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const {
  register,
  verifyAccount,
  resendVerificationCode,
  login,
  me,
  logout,
  refreshToken,
} = require('../controllers/authController');
const {
  registerSchema,
  loginSchema,
  verifySchema,
  resendSchema,
} = require('../validators/authValidators');

router.post('/register', validate(registerSchema), register);
router.post('/verify', validate(verifySchema), verifyAccount);
router.post('/resend-verification', validate(resendSchema), resendVerificationCode);
router.post('/login', validate(loginSchema), login);
router.get('/me', protect, me);
router.post('/logout', logout);
router.post('/refresh', refreshToken);

module.exports = router;
