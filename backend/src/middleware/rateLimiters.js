const rateLimit = require('express-rate-limit');

const createLimiter = (windowMinutes, max, message) => rateLimit({
  windowMs: windowMinutes * 60 * 1000,
  max,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message },
  handler: (req, res, next, options) => {
    process.stderr.write(`Rate limit hit: ${req.ip} on ${req.path}\n`);
    res.status(429).json(options.message);
  },
});

const authLimiter = createLimiter(
  15,
  10,
  'Too many attempts. Please try again in 15 minutes.',
);
const reviewLimiter = createLimiter(
  60,
  3,
  'You can only submit 3 reviews per hour.',
);
const exportLimiter = createLimiter(
  60,
  10,
  'Too many export requests. Try again later.',
);
const paymentLimiter = createLimiter(
  1,
  10,
  'Too many payment attempts. Please wait before trying again.',
);
const generalLimiter = createLimiter(
  1,
  300,
  'Too many requests. Please slow down.',
);
const passwordResetLimiter = createLimiter(
  60,
  5,
  'Too many password reset requests. Try again later.',
);
const adminAuthLimiter = createLimiter(
  15,
  5,
  'Too many admin login attempts. Account may be locked.',
);

module.exports = {
  authLimiter,
  reviewLimiter,
  exportLimiter,
  paymentLimiter,
  generalLimiter,
  passwordResetLimiter,
  adminAuthLimiter,
};
