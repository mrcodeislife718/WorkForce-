const express = require('express');
const auth = require('../middleware/auth');
const {
  Worker,
  WorkerPermission,
  InterviewSession,
  InterviewMessage,
} = require('../models');
const { generateText } = require('../services/modelProvider');

const router = express.Router();

function systemPrompt(worker) {
  const capabilities = (worker.WorkerPermissions || [])
    .map((permission) => `${permission.capability_key}: ${permission.description}`)
    .join('\n');
  return [
    `You are interviewing as the ORCA digital employee named ${worker.name}.`,
    `Job description: ${worker.description || ''}`,
    'Be truthful about your limits. Do not claim access to tools, data, credentials, or workspaces that have not been connected.',
    'Ask focused questions about the customer goal, workflow, success criteria, approvals, escalation rules, data boundaries, and expected volume.',
    'Explain how your universal capabilities can map to compatible customer-selected tools without assuming a specific platform.',
    `Available capability requirements:\n${capabilities || 'No capabilities declared.'}`,
  ].join('\n\n');
}

async function ownedSession(userId, id) {
  return InterviewSession.findOne({
    where: { id, user_id: userId },
    include: [
      { model: Worker, include: [WorkerPermission] },
      { model: InterviewMessage, order: [['sequence_number', 'ASC']] },
    ],
  });
}

router.post('/', auth, async (req, res) => {
  try {
    const worker = await Worker.findOne({
      where: { id: req.body.worker_id, status: 'published' },
      include: [WorkerPermission],
    });
    if (!worker) return res.status(404).json({ error: 'Digital employee was not found.' });
    const goal = String(req.body.goal || '').trim();
    if (goal.length < 10) return res.status(400).json({ error: 'Describe the work goal in at least 10 characters.' });

    const generated = await generateText({
      system: systemPrompt(worker),
      messages: [{ role: 'customer', content: `My goal is: ${goal}\nStart the interview.` }],
      maxTokens: 800,
    });

    const session = await InterviewSession.create({
      user_id: req.user.id,
      worker_id: worker.id,
      goal,
      status: 'active',
      model_provider: generated.provider,
      model_id: generated.model,
    });
    await InterviewMessage.bulkCreate([
      {
        interview_session_id: session.id,
        role: 'customer',
        content: goal,
        sequence_number: 1,
      },
      {
        interview_session_id: session.id,
        role: 'digital_employee',
        content: generated.text,
        sequence_number: 2,
        model_provider: generated.provider,
        model_id: generated.model,
      },
    ]);

    return res.status(201).json({ session: await ownedSession(req.user.id, session.id) });
  } catch (error) {
    const status = error.code === 'MODEL_PROVIDER_NOT_CONFIGURED' ? 503 : 400;
    return res.status(status).json({ error: error.message || 'Unable to start interview.' });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const session = await ownedSession(req.user.id, req.params.id);
    if (!session) return res.status(404).json({ error: 'Interview was not found.' });
    return res.json({ session });
  } catch (error) {
    return res.status(500).json({ error: 'Unable to load interview.' });
  }
});

router.post('/:id/messages', auth, async (req, res) => {
  try {
    const session = await ownedSession(req.user.id, req.params.id);
    if (!session) return res.status(404).json({ error: 'Interview was not found.' });
    if (session.status !== 'active') return res.status(409).json({ error: 'Interview is not active.' });
    const content = String(req.body.content || '').trim();
    if (!content) return res.status(400).json({ error: 'Message content is required.' });

    const existing = [...session.InterviewMessages].sort((a, b) => a.sequence_number - b.sequence_number);
    const nextSequence = existing.length + 1;
    await InterviewMessage.create({
      interview_session_id: session.id,
      role: 'customer',
      content,
      sequence_number: nextSequence,
    });

    const generated = await generateText({
      system: systemPrompt(session.Worker),
      messages: [
        ...existing.map((message) => ({ role: message.role, content: message.content })),
        { role: 'customer', content },
      ],
      maxTokens: 1000,
    });
    await InterviewMessage.create({
      interview_session_id: session.id,
      role: 'digital_employee',
      content: generated.text,
      sequence_number: nextSequence + 1,
      model_provider: generated.provider,
      model_id: generated.model,
    });

    return res.json({ session: await ownedSession(req.user.id, session.id) });
  } catch (error) {
    const status = error.code === 'MODEL_PROVIDER_NOT_CONFIGURED' ? 503 : 400;
    return res.status(status).json({ error: error.message || 'Unable to continue interview.' });
  }
});

router.post('/:id/complete', auth, async (req, res) => {
  try {
    const session = await ownedSession(req.user.id, req.params.id);
    if (!session) return res.status(404).json({ error: 'Interview was not found.' });
    if (session.status !== 'active') return res.status(409).json({ error: 'Interview is not active.' });

    const messages = [...session.InterviewMessages].sort((a, b) => a.sequence_number - b.sequence_number);
    const generated = await generateText({
      system: 'Summarize this hiring interview into a factual deployment brief. Include goal, success criteria, required approvals, escalation rules, expected volume, data boundaries, and unanswered risks. Do not invent facts.',
      messages: messages.map((message) => ({ role: message.role, content: message.content })),
      maxTokens: 1200,
    });
    await session.update({
      status: 'completed',
      summary: generated.text,
      completed_at: new Date(),
      model_provider: generated.provider,
      model_id: generated.model,
    });

    return res.json({ session: await ownedSession(req.user.id, session.id) });
  } catch (error) {
    const status = error.code === 'MODEL_PROVIDER_NOT_CONFIGURED' ? 503 : 400;
    return res.status(status).json({ error: error.message || 'Unable to complete interview.' });
  }
});

module.exports = router;
