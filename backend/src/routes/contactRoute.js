const express = require('express');
const ContactInquiry = require('../models/ContactInquiry');
const { sendWithResolvedConfig } = require('../services/smtpService');

const router = express.Router();

const contactRecipient = process.env.CONTACT_EMAIL_TO || process.env.ADMIN_EMAIL || 'info.homanepal@gmail.com';

const sanitize = (value) => String(value ?? '').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

router.post('/', async (req, res, next) => {
  try {
    const { name, email, subject, message } = req.body || {};

    const missing = [];
    if (!String(name || '').trim()) missing.push('name');
    if (!String(email || '').trim()) missing.push('email');
    if (!String(subject || '').trim()) missing.push('subject');
    if (!String(message || '').trim()) missing.push('message');

    if (missing.length > 0) {
      return res.status(400).json({ message: `Missing required fields: ${missing.join(', ')}` });
    }

    const safeName = sanitize(String(name).trim());
    const safeEmail = sanitize(String(email).trim());
    const safeSubject = sanitize(String(subject).trim());
    const safeMessage = sanitize(String(message).trim());

    if (!isValidEmail(String(email).trim())) {
      return res.status(400).json({ message: 'Invalid email format.' });
    }

    await ContactInquiry.create({
      name: safeName,
      email: safeEmail,
      subject: safeSubject,
      message: safeMessage,
    });

    const text = [
      `Name: ${safeName}`,
      `Email: ${safeEmail}`,
      `Subject: ${safeSubject}`,
      '',
      'Message:',
      safeMessage,
    ].join('\n');

    const html = `
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="font-family: Arial, sans-serif; color: #111827; border-collapse: collapse;">
        <tr>
          <td style="padding: 0 0 20px 0;">
            <div style="font-size: 20px; font-weight: 700; margin-bottom: 6px;">New Contact Form Submission</div>
            <div style="font-size: 13px; color: #6b7280;">A visitor submitted the contact form.</div>
          </td>
        </tr>
        <tr>
          <td style="padding: 0 0 20px 0;">
            <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border: 1px solid #e5e7eb; border-collapse: collapse;">
              <tr>
                <td style="padding: 12px 16px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #6b7280; border-bottom: 1px solid #e5e7eb;">Name</td>
                <td style="padding: 12px 16px; font-size: 14px; border-bottom: 1px solid #e5e7eb;">${safeName}</td>
              </tr>
              <tr>
                <td style="padding: 12px 16px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #6b7280; border-bottom: 1px solid #e5e7eb;">Email</td>
                <td style="padding: 12px 16px; font-size: 14px; border-bottom: 1px solid #e5e7eb;">${safeEmail}</td>
              </tr>
              <tr>
                <td style="padding: 12px 16px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #6b7280;">Subject</td>
                <td style="padding: 12px 16px; font-size: 14px;">${safeSubject}</td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td>
            <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #6b7280; margin-bottom: 10px;">Message</div>
            <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${safeMessage}</div>
          </td>
        </tr>
      </table>
    `;

    try {
      await sendWithResolvedConfig({
        to: contactRecipient,
        replyTo: `${safeName} <${safeEmail}>`,
        subject: `[Contact] ${safeSubject}`,
        text,
        html,
      });

      return res.status(200).json({
        message: 'Message sent successfully.',
      });
    } catch (error) {
      console.error(`Contact notification email failed: ${error.message}`);
      return res.status(503).json({
        message: error.message || 'Message saved successfully, but the notification email could not be sent.',
      });
    }
  } catch (error) {
    next(error);
  }
});

module.exports = router;
