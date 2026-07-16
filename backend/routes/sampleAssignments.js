const express = require('express');
const auth = require('../middleware/auth');
const {
  Worker,
  InterviewSession,
  SampleAssignment,
  RuntimeJob,
} = require('../models');

const router = express.Router();

async function ownedAssignment(userId, id) {
  return SampleAssignment.findOne({
    where: { id, user_id: userId },
    include: [Worker, InterviewSession],
  });
}

router.post('/', auth, async (req, res) => {
  try {
    const interview = await InterviewSession.findOne({
      where: {
        id: req.body.interview_session_id,
        user_id: req.user.id,
        worker_id: req.body.worker_id,
        status: 'completed',
      },
    });
    if (!interview) {
      return res.status(409).json({ error: 'Complete the digital employee interview before assigning sample work.' });
    }
    const worker = await Worker.findOne({ where: { id: req.body.worker_id, status: 'published' } });
    if (!worker) return res.status(404).json({ error: 'Digital employee was not found.' });

    const title = String(req.body.title || '').trim();
    const instructions = String(req.body.instructions || '').trim();
    if (title.length < 3 || instructions.length < 20) {
      return res.status(400).json({ error: 'Provide a title and detailed sample instructions of at least 20 characters.' });
    }

    const assignment = await SampleAssignment.create({
      user_id: req.user.id,
      worker_id: worker.id,
      interview_session_id: interview.id,
      title,
      instructions,
      input_data: req.body.input_data || {},
      status: 'queued',
    });
    await RuntimeJob.create({
      sample_assignment_id: assignment.id,
      job_type: 'sample_assignment',
      payload: {},
      status: 'queued',
      max_attempts: Number(process.env.SAMPLE_MAX_ATTEMPTS || 3),
      run_after: new Date(),
    });

    return res.status(202).json({ assignment: await ownedAssignment(req.user.id, assignment.id) });
  } catch (error) {
    return res.status(400).json({ error: error.message || 'Unable to queue sample work.' });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const assignment = await ownedAssignment(req.user.id, req.params.id);
    if (!assignment) return res.status(404).json({ error: 'Sample assignment was not found.' });
    return res.json({ assignment });
  } catch (error) {
    return res.status(500).json({ error: 'Unable to load sample assignment.' });
  }
});

router.post('/:id/review', auth, async (req, res) => {
  try {
    const assignment = await ownedAssignment(req.user.id, req.params.id);
    if (!assignment) return res.status(404).json({ error: 'Sample assignment was not found.' });
    if (assignment.status !== 'completed') {
      return res.status(409).json({ error: 'Only completed sample work can be reviewed.' });
    }
    const rating = Number(req.body.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be an integer from 1 to 5.' });
    }
    await assignment.update({
      status: 'reviewed',
      rating,
      feedback: String(req.body.feedback || '').trim() || null,
      reviewed_at: new Date(),
    });
    return res.json({ assignment: await ownedAssignment(req.user.id, assignment.id) });
  } catch (error) {
    return res.status(400).json({ error: error.message || 'Unable to review sample work.' });
  }
});

module.exports = router;
