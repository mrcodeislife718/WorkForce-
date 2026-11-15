'use strict';

function parseCustomerReview(body = {}) {
  const decision = String(body.decision || '').trim();
  if (decision !== 'accepted' && decision !== 'rejected') {
    throw new Error('Decision must be accepted or rejected.');
  }
  if (typeof body.feedback !== 'string' && body.feedback !== undefined) {
    throw new Error('Feedback must be text.');
  }
  const feedback = String(body.feedback || '').trim();
  if (feedback.length > 2000) throw new Error('Feedback must be 2000 characters or fewer.');
  if (decision === 'rejected' && feedback.length < 10) {
    throw new Error('Explain what needs to be corrected (at least 10 characters).');
  }
  const rating = body.rating == null || body.rating === '' ? null : Number(body.rating);
  if (rating !== null && (!Number.isInteger(rating) || rating < 1 || rating > 5)) {
    throw new Error('Rating must be a whole number from 1 to 5.');
  }
  const minutes = body.minutes_saved == null || body.minutes_saved === ''
    ? null : Number(body.minutes_saved);
  if (minutes !== null && (!Number.isFinite(minutes) || minutes < 0 || minutes > 1000000)) {
    throw new Error('Reported minutes saved must be between 0 and 1000000.');
  }
  return {
    status: decision === 'accepted' ? 'verified' : 'rejected',
    feedback,
    rating,
    customer_reported_minutes_saved: decision === 'accepted' ? minutes : null,
  };
}

module.exports = { parseCustomerReview };
