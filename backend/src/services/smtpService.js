const nodemailer = require('nodemailer');
const SmtpSettings = require('../models/SmtpSettings');
const { decryptText } = require('../utils/fieldEncryption');

const CACHE_TTL_MS = 1000 * 60 * 3;

let cache = {
  expiresAt: 0,
  record: null,
};

const clearSmtpCache = () => {
  cache = { expiresAt: 0, record: null };
};

const buildTransport = (config) => {
  if (!config) return null;

  const secure = config.encryption === 'ssl' || Number(config.port) === 465;
  const options = {
    host: config.host,
    port: Number(config.port),
    secure,
    from: `"${config.fromName}" <${config.fromEmail}>`,
  };

  if (config.username) {
    options.auth = {
      user: config.username,
      pass: config.password || '',
    };
  }

  if (config.encryption === 'tls') {
    options.requireTLS = true;
  }

  return {
    ...config,
    secure,
    transport: nodemailer.createTransport(options),
    fromHeader: options.from,
  };
};

const loadActiveDbConfig = async () => {
  if (cache.record && cache.expiresAt > Date.now()) {
    return cache.record;
  }

  const record = await SmtpSettings.findOne({ is_active: true })
    .sort({ updatedAt: -1, createdAt: -1 })
    .select('+password')
    .lean();

  if (!record) {
    cache = { expiresAt: Date.now() + CACHE_TTL_MS, record: null };
    return null;
  }

  let password;
  try {
    password = decryptText(record.password);
  } catch (error) {
    cache = { expiresAt: 0, record: null };
    throw new Error('Active SMTP profile cannot be decrypted');
  }

  const normalized = {
    source: 'db',
    id: String(record._id),
    label: record.label,
    host: record.host,
    port: Number(record.port),
    encryption: record.encryption || 'none',
    username: record.username,
    password,
    fromEmail: record.from_email,
    fromName: record.from_name,
    isActive: record.is_active,
  };

  cache = {
    expiresAt: Date.now() + CACHE_TTL_MS,
    record: normalized,
  };

  return normalized;
};

const sendWithResolvedConfig = async (message) => {
  const activeDb = await loadActiveDbConfig();
  if (!activeDb) {
    throw new Error('No active SMTP profile is configured');
  }

  const transport = buildTransport(activeDb);

  try {
    await transport.transport.sendMail({
      from: message.from || transport.fromHeader,
      ...message,
    });
    return { source: 'db', label: activeDb.label };
  } catch (error) {
    console.error(`SMTP send failed using active profile (${activeDb.label || activeDb.host}:${activeDb.port}): ${error.message}`);
    throw new Error('Active SMTP profile could not send the email');
  }
};

const getActiveSmtpSnapshot = async () => {
  try {
    const config = await loadActiveDbConfig();
    if (!config) return null;
    return {
      id: config.id,
      label: config.label,
      host: config.host,
      port: config.port,
      encryption: config.encryption,
      username: config.username,
      fromEmail: config.fromEmail,
      fromName: config.fromName,
      isActive: config.isActive,
      source: config.source,
    };
  } catch (error) {
    return null;
  }
};

const getAllSmtpSettings = async () =>
  SmtpSettings.find().sort({ is_active: -1, updatedAt: -1, createdAt: -1 }).lean();

const createSmtpSetting = async (payload) => {
  const next = await SmtpSettings.create(payload);
  if (next.is_active) {
    await SmtpSettings.updateMany({ _id: { $ne: next._id } }, { $set: { is_active: false } });
  }
  clearSmtpCache();
  return next;
};

const updateSmtpSetting = async (id, payload) => {
  const setting = await SmtpSettings.findById(id).select('+password');
  if (!setting) return null;

  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined) {
      setting[key] = value;
    }
  });

  await setting.save();

  if (setting.is_active) {
    await SmtpSettings.updateMany({ _id: { $ne: setting._id } }, { $set: { is_active: false } });
  }

  clearSmtpCache();
  return setting;
};

const migrateEnvSmtpSettings = async () => {
  const existing = await SmtpSettings.countDocuments();
  if (existing > 0) return { created: false, reason: 'already_present' };

  const envHost = process.env.SMTP_HOST || process.env.EMAIL_HOST;
  const envPort = Number(process.env.SMTP_PORT || process.env.EMAIL_PORT || 587);
  const envUser = process.env.SMTP_USER || process.env.EMAIL_USER;
  const envPass = process.env.SMTP_PASS || process.env.EMAIL_PASS;
  const envFromEmail = process.env.EMAIL_FROM || process.env.SMTP_FROM_EMAIL || process.env.ADMIN_EMAIL;
  const envFromName = process.env.EMAIL_FROM_NAME || process.env.SMTP_FROM_NAME || process.env.ADMIN_NAME || 'HOMA Beauty';
  const envEncryption = (process.env.SMTP_ENCRYPTION || process.env.EMAIL_ENCRYPTION || '').toLowerCase() || (envPort === 465 ? 'ssl' : 'none');

  if (!envHost || !envFromEmail || !envUser || !envPass) {
    return { created: false, reason: 'missing_env' };
  }

  await SmtpSettings.create({
    label: 'Migrated SMTP',
    host: envHost,
    port: envPort,
    encryption: envEncryption === 'ssl' || envEncryption === 'tls' ? envEncryption : 'none',
    username: envUser,
    password: envPass,
    from_email: envFromEmail,
    from_name: envFromName,
    is_active: true,
  });

  clearSmtpCache();
  return { created: true, reason: 'seeded_from_env' };
};

module.exports = {
  clearSmtpCache,
  getActiveSmtpSnapshot,
  getAllSmtpSettings,
  migrateEnvSmtpSettings,
  sendWithResolvedConfig,
  createSmtpSetting,
  updateSmtpSetting,
};
