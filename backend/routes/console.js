const express = require('express');
const { Op } = require('sequelize');
const auth = require('../middleware/auth');
const {
  Deployment,
  Worker,
  DeploymentConnection,
  WorkspaceConnection,
  ConnectorDefinition,
  TaskRun,
  CapabilityExecution,
  DeploymentEvent,
} = require('../models');

const router = express.Router();

function summarize(deployments, taskRuns, executions) {
  const completedTasks = taskRuns.filter((task) => task.status === 'completed');
  const failedTasks = taskRuns.filter((task) => task.status === 'failed');
  const finishedExecutions = executions.filter((execution) => ['succeeded', 'failed', 'denied'].includes(execution.status));
  const successfulExecutions = executions.filter((execution) => execution.status === 'succeeded');
  const totalDuration = completedTasks.reduce((sum, task) => sum + Number(task.duration_ms || 0), 0);
  const minutesSaved = completedTasks.reduce((sum, task) => sum + Number(task.estimated_minutes_saved || 0), 0);

  return {
    deployment_count: deployments.length,
    active_deployments: deployments.filter((deployment) => deployment.status === 'active').length,
    paused_deployments: deployments.filter((deployment) => deployment.status === 'paused').length,
    degraded_deployments: deployments.filter((deployment) => deployment.status === 'degraded').length,
    tasks_total: taskRuns.length,
    tasks_completed: completedTasks.length,
    tasks_failed: failedTasks.length,
    task_success_rate: taskRuns.length > 0 ? completedTasks.length / taskRuns.length : 0,
    average_task_duration_ms: completedTasks.length > 0 ? Math.round(totalDuration / completedTasks.length) : 0,
    estimated_minutes_saved: minutesSaved,
    capability_executions: executions.length,
    capability_success_rate:
      finishedExecutions.length > 0 ? successfulExecutions.length / finishedExecutions.length : 0,
    records_read: executions.reduce((sum, execution) => sum + execution.records_read, 0),
    records_created: executions.reduce((sum, execution) => sum + execution.records_created, 0),
    records_updated: executions.reduce((sum, execution) => sum + execution.records_updated, 0),
    records_deleted: executions.reduce((sum, execution) => sum + execution.records_deleted, 0),
  };
}

router.get('/overview', auth, async (req, res) => {
  try {
    const deployments = await Deployment.findAll({
      where: { user_id: req.user.id, status: { [Op.ne]: 'uninstalled' } },
      attributes: { exclude: ['telemetry_token_hash'] },
      include: [
        { model: Worker },
        {
          model: DeploymentConnection,
          include: [{ model: WorkspaceConnection, include: [{ model: ConnectorDefinition }] }],
        },
      ],
      order: [['createdAt', 'DESC']],
    });
    const deploymentIds = deployments.map((deployment) => deployment.id);
    const [taskRuns, executions, events] = deploymentIds.length === 0
      ? [[], [], []]
      : await Promise.all([
          TaskRun.findAll({ where: { deployment_id: deploymentIds } }),
          CapabilityExecution.findAll({ where: { deployment_id: deploymentIds } }),
          DeploymentEvent.findAll({
            where: { deployment_id: deploymentIds },
            order: [['createdAt', 'DESC']],
            limit: 100,
          }),
        ]);

    return res.json({
      metrics: summarize(deployments, taskRuns, executions),
      deployments,
      recent_events: events,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Unable to load ORCA Console metrics.' });
  }
});

router.get('/deployments/:id/metrics', auth, async (req, res) => {
  try {
    const deployment = await Deployment.findOne({
      where: { id: req.params.id, user_id: req.user.id },
      attributes: { exclude: ['telemetry_token_hash'] },
      include: [{ model: Worker }],
    });
    if (!deployment) return res.status(404).json({ error: 'Deployment was not found.' });

    const [taskRuns, executions, events] = await Promise.all([
      TaskRun.findAll({
        where: { deployment_id: deployment.id },
        order: [['createdAt', 'DESC']],
        limit: 500,
      }),
      CapabilityExecution.findAll({
        where: { deployment_id: deployment.id },
        order: [['createdAt', 'DESC']],
        limit: 1000,
      }),
      DeploymentEvent.findAll({
        where: { deployment_id: deployment.id },
        order: [['createdAt', 'DESC']],
        limit: 200,
      }),
    ]);

    return res.json({
      deployment,
      metrics: summarize([deployment], taskRuns, executions),
      task_runs: taskRuns,
      capability_executions: executions,
      events,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Unable to load deployment metrics.' });
  }
});

module.exports = router;
