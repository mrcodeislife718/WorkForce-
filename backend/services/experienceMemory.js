'use strict';

const { OutcomeVerification } = require('../models');

// Feedback belongs to one customer's deployment, not to a global worker profile.
async function verifiedLessonsForDeployment(deploymentId) {
  const reviews = await OutcomeVerification.findAll({
    where: { deployment_id: deploymentId, verifier_type: 'customer', status: 'verified' },
    attributes: ['evidence'],
    order: [['verified_at', 'DESC']],
    limit: 8,
  });
  return reviews
    .map((review) => String(review.evidence?.feedback || '').trim())
    .filter(Boolean)
    .map((feedback) => feedback.slice(0, 500));
}

module.exports = { verifiedLessonsForDeployment };
