'use strict';

function isSupportAdmin(userId, env = process.env) {
  return String(env.SUPPORT_ADMIN_USER_IDS || '')
    .split(',').map((id) => id.trim()).filter(Boolean).includes(String(userId));
}

function parseTicket(body = {}) {
  const subject = String(body.subject || '').trim();
  const message = String(body.message || '').trim();
  const category = String(body.category || 'other').trim();
  if (subject.length < 5 || subject.length > 200) {
    throw new Error('Support subject must contain 5–200 characters.');
  }
  if (message.length < 10 || message.length > 5000) {
    throw new Error('Support message must contain 10–5000 characters.');
  }
  if (!['billing', 'employee', 'assignment', 'other'].includes(category)) {
    throw new Error('Unsupported support category.');
  }
  return { subject, message, category };
}

function parseReply(body = {}) {
  const message = String(body.message || '').trim();
  if (message.length < 2 || message.length > 5000) {
    throw new Error('Reply must contain 2–5000 characters.');
  }
  return message;
}

module.exports = { isSupportAdmin, parseTicket, parseReply };
