const crypto = require('crypto');

const normalizePhoneNumber = (value) => {
  if (typeof value !== 'string') return '';

  const trimmed = value.trim().replace(/[()\s.-]/g, '');
  if (!trimmed) return '';

  const candidate = trimmed.startsWith('+') ? `+${trimmed.slice(1).replace(/\D/g, '')}` : trimmed.replace(/\D/g, '');
  const normalized = candidate.startsWith('+') ? candidate : `+${candidate}`;

  return /^\+[1-9]\d{9,14}$/.test(normalized) ? normalized : '';
};

const generateVerificationCode = () => {
  const code = crypto.randomInt(0, 1000000).toString().padStart(6, '0');
  return code;
};

const hashVerificationCode = (code) =>
  crypto.createHash('sha256').update(String(code)).digest('hex');

const sendVerificationCode = async ({ phoneNumber, code }) => {
  const mode =
    process.env.PHONE_VERIFICATION_MODE ||
    (process.env.NODE_ENV === 'production' ? 'webhook' : 'console');

  if (mode === 'console') {
    console.info(`[phone-verification] ${phoneNumber}: ${code}`);
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
      body: JSON.stringify({ phoneNumber, code }),
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
  generateVerificationCode,
  hashVerificationCode,
  sendVerificationCode,
};
