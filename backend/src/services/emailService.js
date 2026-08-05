/**
 * Email (SMTP) notification service.
 * Sends messages via nodemailer using the configured SMTP transport.
 */

const nodemailer = require('nodemailer');

/**
 * Build a nodemailer transporter from the SMTP config object.
 * @param {object} smtp
 * @returns {import('nodemailer').Transporter}
 */
const createTransporter = (smtp) => {
  return nodemailer.createTransport({
    host: smtp.host,
    port: parseInt(smtp.port) || 587,
    secure: parseInt(smtp.port) === 465,
    auth: {
      user: smtp.user,
      pass: smtp.pass,
    },
    tls: {
      rejectUnauthorized: false, // Allow self-signed certs in dev
    },
  });
};

/**
 * Send an email notification.
 * @param {object} opts
 * @param {object} opts.smtp         - SMTP config { host, port, user, pass, fromEmail, fromName }
 * @param {string} opts.to           - Recipient email address (manager)
 * @param {string} opts.subject      - Email subject
 * @param {string} opts.text         - Plain-text body
 * @param {string} [opts.html]       - Optional HTML body
 */
const sendEmail = async ({ smtp, to, subject, text, html }) => {
  if (!smtp?.host || !smtp?.user || !smtp?.pass) {
    throw new Error('Email credentials not configured (SMTP host, user, and pass required).');
  }
  if (!to) {
    throw new Error('No recipient email address configured.');
  }

  const transporter = createTransporter(smtp);

  const fromLabel = smtp.fromName
    ? `"${smtp.fromName}" <${smtp.fromEmail || smtp.user}>`
    : smtp.fromEmail || smtp.user;

  const info = await transporter.sendMail({
    from: fromLabel,
    to,
    subject,
    text,
    html: html || text.replace(/\n/g, '<br>'),
  });

  return { status: 'sent', to, messageId: info.messageId };
};

/**
 * Replace template variables in a string.
 * @param {string} template
 * @param {Record<string, string>} vars
 * @returns {string}
 */
const buildContent = (template, vars) => {
  let msg = template;
  Object.entries(vars).forEach(([key, value]) => {
    msg = msg.replace(new RegExp(`{${key}}`, 'g'), value ?? '');
  });
  return msg;
};

module.exports = { sendEmail, buildContent };
