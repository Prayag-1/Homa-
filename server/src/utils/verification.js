const crypto = require('crypto');
const transporter = require('../config/email');

const normalizePhoneNumber = (value) => {
  if (typeof value !== 'string') return '';

  const trimmed = value.trim().replace(/[()\s.-]/g, '');
  if (!trimmed) return '';

  const candidate = trimmed.startsWith('+')
    ? `+${trimmed.slice(1).replace(/\D/g, '')}`
    : trimmed.replace(/\D/g, '');
  const normalized = candidate.startsWith('+') ? candidate : `+${candidate}`;

  return /^\+[1-9]\d{9,14}$/.test(normalized) ? normalized : '';
};

const normalizeEmail = (value) => {
  if (typeof value !== 'string') return '';
  const normalized = value.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized) ? normalized : '';
};

const generateVerificationCode = () => crypto.randomInt(0, 1000000).toString().padStart(6, '0');

const hashVerificationCode = (code) =>
  crypto.createHash('sha256').update(String(code)).digest('hex');

const sendVerificationCode = async ({ method, target, code }) => {
  const normalizedMethod = method === 'email' ? 'email' : 'phone';

  if (process.env.NODE_ENV !== 'production' && process.env.VERIFICATION_MODE === 'console') {
    process.stdout.write(`[verification:${normalizedMethod}] ${target}: ${code}\n`);
    return;
  }

  if (normalizedMethod === 'email') {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      throw new Error('Email transport is not configured');
    }

    try {
      await transporter.sendMail({
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: target,
        subject: 'Your HOMA verification code',
        text: `Your verification code is ${code}. It expires in 10 minutes.`,
        html: `<p>Your verification code is <strong>${code}</strong>.</p><p>It expires in 10 minutes.</p>`,
      });
      return;
    } catch (error) {
      if (process.env.NODE_ENV === 'production') {
        throw error;
      }

      process.stdout.write(
        `[verification:email:fallback] ${target}: ${code} (email delivery failed: ${error.message})\n`,
      );
      return;
    }
  }

  const mode = process.env.PHONE_VERIFICATION_MODE || (process.env.NODE_ENV === 'production' ? 'webhook' : 'console');

  if (mode === 'console') {
    process.stdout.write(`[phone-verification] ${target}: ${code}\n`);
    return;
  }

  if (mode === 'webhook') {
    const endpoint = process.env.PHONE_VERIFICATION_WEBHOOK_URL;
    if (!endpoint) {
      throw new Error('PHONE_VERIFICATION_WEBHOOK_URL is required when PHONE_VERIFICATION_MODE=webhook');
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber: target, code }),
    });

    if (!response.ok) {
      throw new Error('Unable to deliver phone verification code');
    }
    return;
  }

  throw new Error(`Unsupported PHONE_VERIFICATION_MODE: ${mode}`);
};

module.exports = {
  normalizePhoneNumber,
  normalizeEmail,
  generateVerificationCode,
  hashVerificationCode,
  sendVerificationCode,
};
