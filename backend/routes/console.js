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
  RuntimeJob,
  ApprovalRequest,
} = require('../models');

const router = express.Router();

function summarize(deployments, taskRuns, executions, runtimeJobs, approvals) {
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
    updates_available: deployments.filter((deployment) => deployment.Worker && deployment.installed_version !== deployment.Worker.version).length,
    tasks_total: taskRuns.length,
    tasks_completed: completedTasks.length,
    tasks_failed: failedTasks.length,
    task_success_rate: taskRuns.length > 0 ? completedTasks.length / taskRuns.length : 0,
    average_task_duration_ms: completedTasks.length > 0 ? Math.round(totalDuration / completedTasks.length) : 0,
    estimated_minutes_saved: minutesSaved,
    capability_executions: executions.length,
    capability_success_rate: finishedExecutions.length > 0 ? successfulExecutions.length / finishedExecutions.length : 0,
    records_read: executions.reduce((sum, execution) => sum + Number(execution.records_read || 0), 0),
    records_created: executions.reduce((sum, execution) => sum + Number(execution.records_created || 0), 0),
    records_updated: executions.reduce((sum, execution) => sum + Number(execution.records_updated || 0), 0),
    records_deleted: executions.reduce((sum, execution) => sum + Number(execution.records_deleted || 0), 0),
    queued_jobs: runtimeJobs.filter((job) => job.status === 'queued').length,
    running_jobs: runtimeJobs.filter((job) => job.status === 'running').length,
    jobs_waiting_approval: runtimeJobs.filter((job) => job.status === 'waiting_approval').length,
    pending_approvals: approvals.filter((approval) => approval.status === 'pending').length,
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
    for (const deployment of deployments) {
      if (deployment.Worker && deployment.installed_version !== deployment.Worker.version && deployment.update_status === 'current') {
        deployment.setDataValue('update_status', 'update_available');
      }
    }

    const deploymentIds = deployments.map((deployment) => deployment.id);
    const [taskRuns, executions, events, runtimeJobs, approvals] = deploymentIds.length === 0
      ? [[], [], [], [], []]
      : await Promise.all([
          TaskRun.findAll({ where: { deployment_id: deploymentIds }, order: [['createdAt', 'DESC']], limit: 500 }),
          CapabilityExecution.findAll({ where: { deployment_id: deploymentIds }, order: [['createdAt', 'DESC']], limit: 1000 }),
          DeploymentEvent.findAll({ where: { deployment_id: deploymentIds }, order: [['createdAt', 'DESC']], limit: 100 }),
          RuntimeJob.findAll({ where: { deployment_id: deploymentIds }, order: [['createdAt', 'DESC']], limit: 100 }),
          ApprovalRequest.findAll({
            where: { deployment_id: deploymentIds, status: 'pending' },
            include: [{ model: Deployment, include: [Worker] }],
            order: [['requested_at', 'ASC']],
          }),
        ]);

    return res.json({
      metrics: summarize(deployments, taskRuns, executions, runtimeJobs, approvals),
      deployments,
      pending_approvals: approvals,
      runtime_jobs: runtimeJobs,
      recent_tasks: taskRuns.slice(0, 100),
      recent_events: events,
    });
  } catch (error) {
    console.error('Console overview failed:', error);
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

    const [taskRuns, executions, events, runtimeJobs, approvals] = await Promise.all([
      TaskRun.findAll({ where: { deployment_id: deployment.id }, order: [['createdAt', 'DESC']], limit: 500 }),
      CapabilityExecution.findAll({ where: { deployment_id: deployment.id }, order: [['createdAt', 'DESC']], limit: 1000 }),
      DeploymentEvent.findAll({ where: { deployment_id: deployment.id }, order: [['createdAt', 'DESC']], limit: 200 }),
      RuntimeJob.findAll({ where: { deployment_id: deployment.id }, order: [['createdAt', 'DESC']], limit: 200 }),
      ApprovalRequest.findAll({ where: { deployment_id: deployment.id }, order: [['requested_at', 'DESC']], limit: 200 }),
    ]);

    return res.json({
      deployment,
      metrics: summarize([deployment], taskRuns, executions, runtimeJobs, approvals),
      task_runs: taskRuns,
      capability_executions: executions,
      runtime_jobs: runtimeJobs,
      approvals,
      events,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Unable to load deployment metrics.' });
  }
});

module.exports = router;
