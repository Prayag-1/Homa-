const crypto = require('crypto');

const getKey = () => {
  const seed = process.env.SMTP_SETTINGS_ENCRYPTION_KEY || process.env.JWT_SECRET || 'homa-smtp-fallback-key';
  return crypto.createHash('sha256').update(String(seed)).digest();
};

const encryptText = (value) => {
  if (value === undefined || value === null || value === '') return '';

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getKey(), iv);
  const plaintext = Buffer.from(String(value), 'utf8');
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();

  return [
    'enc',
    iv.toString('base64'),
    tag.toString('base64'),
    encrypted.toString('base64'),
  ].join('.');
};

const decryptText = (payload) => {
  if (!payload) return '';
  const [prefix, ivPart, tagPart, encryptedPart] = String(payload).split('.');
  if (prefix !== 'enc' || !ivPart || !tagPart || !encryptedPart) {
    throw new Error('Invalid encrypted value');
  }

  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    getKey(),
    Buffer.from(ivPart, 'base64'),
  );
  decipher.setAuthTag(Buffer.from(tagPart, 'base64'));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedPart, 'base64')),
    decipher.final(),
  ]);

  return decrypted.toString('utf8');
};

module.exports = {
  encryptText,
  decryptText,
};
