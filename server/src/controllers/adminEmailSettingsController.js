const Joi = require('joi');
const ApiError = require('../utils/ApiError');
const {
  getAllSmtpSettings,
  getActiveSmtpSnapshot,
  createSmtpSetting,
  updateSmtpSetting,
  sendWithResolvedConfig,
} = require('../services/smtpService');

const settingSchema = Joi.object({
  label: Joi.string().trim().max(100).required(),
  host: Joi.string().trim().max(255).required(),
  port: Joi.number().integer().min(1).max(65535).required(),
  encryption: Joi.string().valid('none', 'ssl', 'tls').required(),
  username: Joi.string().trim().max(200).required(),
  password: Joi.string().max(512).allow('', null).optional(),
  fromEmail: Joi.string().trim().email().max(255).required(),
  fromName: Joi.string().trim().max(120).required(),
  isActive: Joi.boolean().default(false),
});

const responseShape = (item) => ({
  id: String(item._id || item.id),
  label: item.label,
  host: item.host,
  port: item.port,
  encryption: item.encryption,
  username: item.username,
  fromEmail: item.from_email,
  fromName: item.from_name,
  isActive: item.is_active,
  createdAt: item.createdAt,
  updatedAt: item.updatedAt,
});

const listEmailSettings = async (req, res, next) => {
  try {
    const items = await getAllSmtpSettings();
    const active = items.find((item) => item.is_active) || null;

    res.json({
      success: true,
      data: {
        items: items.map(responseShape),
        activeId: active ? String(active._id) : null,
      },
      message: 'SMTP settings retrieved successfully',
    });
  } catch (error) {
    next(error);
  }
};

const createEmailSetting = async (req, res, next) => {
  try {
    const { error, value } = settingSchema.validate(req.body, { stripUnknown: true });
    if (error) return next(new ApiError(400, error.details[0].message));

    if (!value.password) {
      return next(new ApiError(400, 'Password is required'));
    }

    const created = await createSmtpSetting({
      label: value.label,
      host: value.host,
      port: value.port,
      encryption: value.encryption,
      username: value.username,
      password: value.password,
      from_email: value.fromEmail,
      from_name: value.fromName,
      is_active: value.isActive,
    });

    res.status(201).json({
      success: true,
      data: responseShape(created),
      message: 'SMTP setting created successfully',
    });
  } catch (error) {
    next(error);
  }
};

const updateEmailSetting = async (req, res, next) => {
  try {
    const { error, value } = settingSchema.validate(req.body, { stripUnknown: true });
    if (error) return next(new ApiError(400, error.details[0].message));

    const payload = {
      label: value.label,
      host: value.host,
      port: value.port,
      encryption: value.encryption,
      username: value.username,
      from_email: value.fromEmail,
      from_name: value.fromName,
      is_active: value.isActive,
    };

    if (value.password) {
      payload.password = value.password;
    }

    const updated = await updateSmtpSetting(req.params.id, payload);
    if (!updated) return next(new ApiError(404, 'SMTP setting not found'));

    res.json({
      success: true,
      data: responseShape(updated),
      message: 'SMTP setting updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

const sendTestEmail = async (req, res, next) => {
  try {
    const schema = Joi.object({
      recipientEmail: Joi.string().email().max(255).optional().allow(''),
      subject: Joi.string().max(120).optional(),
    });
    const { error, value } = schema.validate(req.body, { stripUnknown: true });
    if (error) return next(new ApiError(400, error.details[0].message));

    const recipientEmail = value.recipientEmail || req.user?.email;
    if (!recipientEmail) {
      return next(new ApiError(400, 'A recipient email is required for the test message'));
    }

    const active = await getActiveSmtpSnapshot();
    if (!active) {
      return next(new ApiError(400, 'No active SMTP profile is configured'));
    }

    const result = await sendWithResolvedConfig({
      to: recipientEmail,
      subject: value.subject || 'HOMA SMTP test email',
      text: `This is a test email from ${active.label}.`,
      html: `<p>This is a test email from <strong>${active.label}</strong>.</p>`,
    });

    res.json({
      success: true,
      data: {
        recipientEmail,
        source: result.source,
        label: result.label,
      },
      message: 'Test email sent successfully.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listEmailSettings,
  createEmailSetting,
  updateEmailSetting,
  sendTestEmail,
};
