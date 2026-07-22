const User = require('./User');
const Worker = require('./Worker');
const WorkerPermission = require('./WorkerPermission');
const ConnectorDefinition = require('./ConnectorDefinition');
const WorkspaceConnection = require('./WorkspaceConnection');
const ConnectionSecret = require('./ConnectionSecret');
const WorkspaceResource = require('./WorkspaceResource');
const Deployment = require('./Deployment');
const DeploymentConnection = require('./DeploymentConnection');
const DeploymentCapabilityGrant = require('./DeploymentCapabilityGrant');
const DeploymentEvent = require('./DeploymentEvent');
const TaskRun = require('./TaskRun');
const CapabilityExecution = require('./CapabilityExecution');
const InterviewSession = require('./InterviewSession');
const InterviewMessage = require('./InterviewMessage');
const SampleAssignment = require('./SampleAssignment');
const Subscription = require('./Subscription');
const RuntimeJob = require('./RuntimeJob');
const ApprovalRequest = require('./ApprovalRequest');
const Review = require('./Review');
const WorkforceBundle = require('./WorkforceBundle');
const WorkforceBundleMember = require('./WorkforceBundleMember');

Worker.hasMany(WorkerPermission, { foreignKey: 'worker_id' });
WorkerPermission.belongsTo(Worker, { foreignKey: 'worker_id' });

WorkforceBundle.belongsToMany(Worker, {
  through: WorkforceBundleMember,
  foreignKey: 'workforce_bundle_id',
  otherKey: 'worker_id',
  as: 'Members',
});
Worker.belongsToMany(WorkforceBundle, {
  through: WorkforceBundleMember,
  foreignKey: 'worker_id',
  otherKey: 'workforce_bundle_id',
  as: 'WorkforceBundles',
});
WorkforceBundle.hasMany(WorkforceBundleMember, {
  foreignKey: 'workforce_bundle_id',
  as: 'Memberships',
});
WorkforceBundleMember.belongsTo(WorkforceBundle, { foreignKey: 'workforce_bundle_id' });
Worker.hasMany(WorkforceBundleMember, { foreignKey: 'worker_id' });
WorkforceBundleMember.belongsTo(Worker, { foreignKey: 'worker_id' });

User.hasMany(WorkspaceConnection, { foreignKey: 'user_id' });
WorkspaceConnection.belongsTo(User, { foreignKey: 'user_id' });
ConnectorDefinition.hasMany(WorkspaceConnection, { foreignKey: 'connector_definition_id' });
WorkspaceConnection.belongsTo(ConnectorDefinition, { foreignKey: 'connector_definition_id' });
WorkspaceConnection.hasMany(ConnectionSecret, { foreignKey: 'workspace_connection_id' });
ConnectionSecret.belongsTo(WorkspaceConnection, { foreignKey: 'workspace_connection_id' });
WorkspaceConnection.hasMany(WorkspaceResource, { foreignKey: 'workspace_connection_id' });
WorkspaceResource.belongsTo(WorkspaceConnection, { foreignKey: 'workspace_connection_id' });

User.hasMany(InterviewSession, { foreignKey: 'user_id' });
InterviewSession.belongsTo(User, { foreignKey: 'user_id' });
Worker.hasMany(InterviewSession, { foreignKey: 'worker_id' });
InterviewSession.belongsTo(Worker, { foreignKey: 'worker_id' });
InterviewSession.hasMany(InterviewMessage, { foreignKey: 'interview_session_id' });
InterviewMessage.belongsTo(InterviewSession, { foreignKey: 'interview_session_id' });

User.hasMany(SampleAssignment, { foreignKey: 'user_id' });
SampleAssignment.belongsTo(User, { foreignKey: 'user_id' });
Worker.hasMany(SampleAssignment, { foreignKey: 'worker_id' });
SampleAssignment.belongsTo(Worker, { foreignKey: 'worker_id' });
InterviewSession.hasMany(SampleAssignment, { foreignKey: 'interview_session_id' });
SampleAssignment.belongsTo(InterviewSession, { foreignKey: 'interview_session_id' });

User.hasMany(Subscription, { foreignKey: 'user_id' });
Subscription.belongsTo(User, { foreignKey: 'user_id' });
Worker.hasMany(Subscription, { foreignKey: 'worker_id' });
Subscription.belongsTo(Worker, { foreignKey: 'worker_id' });

User.hasMany(Deployment, { foreignKey: 'user_id' });
Deployment.belongsTo(User, { foreignKey: 'user_id' });
Worker.hasMany(Deployment, { foreignKey: 'worker_id' });
Deployment.belongsTo(Worker, { foreignKey: 'worker_id' });
Deployment.belongsTo(Deployment, { as: 'ManagerDeployment', foreignKey: 'manager_deployment_id' });
Deployment.hasMany(Deployment, { as: 'ManagedDeployments', foreignKey: 'manager_deployment_id' });

Deployment.hasMany(DeploymentConnection, { foreignKey: 'deployment_id' });
DeploymentConnection.belongsTo(Deployment, { foreignKey: 'deployment_id' });
WorkspaceConnection.hasMany(DeploymentConnection, { foreignKey: 'workspace_connection_id' });
DeploymentConnection.belongsTo(WorkspaceConnection, { foreignKey: 'workspace_connection_id' });

Deployment.hasMany(DeploymentCapabilityGrant, { foreignKey: 'deployment_id' });
DeploymentCapabilityGrant.belongsTo(Deployment, { foreignKey: 'deployment_id' });
DeploymentConnection.hasMany(DeploymentCapabilityGrant, { foreignKey: 'deployment_connection_id' });
DeploymentCapabilityGrant.belongsTo(DeploymentConnection, { foreignKey: 'deployment_connection_id' });

Deployment.hasMany(DeploymentEvent, { foreignKey: 'deployment_id' });
DeploymentEvent.belongsTo(Deployment, { foreignKey: 'deployment_id' });
DeploymentConnection.hasMany(DeploymentEvent, { foreignKey: 'deployment_connection_id' });
DeploymentEvent.belongsTo(DeploymentConnection, { foreignKey: 'deployment_connection_id' });

Deployment.hasMany(TaskRun, { foreignKey: 'deployment_id' });
TaskRun.belongsTo(Deployment, { foreignKey: 'deployment_id' });
Deployment.hasMany(CapabilityExecution, { foreignKey: 'deployment_id' });
CapabilityExecution.belongsTo(Deployment, { foreignKey: 'deployment_id' });
DeploymentConnection.hasMany(CapabilityExecution, { foreignKey: 'deployment_connection_id' });
CapabilityExecution.belongsTo(DeploymentConnection, { foreignKey: 'deployment_connection_id' });
TaskRun.hasMany(CapabilityExecution, { foreignKey: 'task_run_id' });
CapabilityExecution.belongsTo(TaskRun, { foreignKey: 'task_run_id' });

Deployment.hasMany(RuntimeJob, { foreignKey: 'deployment_id' });
RuntimeJob.belongsTo(Deployment, { foreignKey: 'deployment_id' });
SampleAssignment.hasMany(RuntimeJob, { foreignKey: 'sample_assignment_id' });
RuntimeJob.belongsTo(SampleAssignment, { foreignKey: 'sample_assignment_id' });
Deployment.hasMany(ApprovalRequest, { foreignKey: 'deployment_id' });
ApprovalRequest.belongsTo(Deployment, { foreignKey: 'deployment_id' });
RuntimeJob.hasMany(ApprovalRequest, { foreignKey: 'runtime_job_id' });
ApprovalRequest.belongsTo(RuntimeJob, { foreignKey: 'runtime_job_id' });

Deployment.hasOne(Review, { foreignKey: 'deployment_id' });
Review.belongsTo(Deployment, { foreignKey: 'deployment_id' });

module.exports = {
  User,
  Worker,
  WorkerPermission,
  ConnectorDefinition,
  WorkspaceConnection,
  ConnectionSecret,
  WorkspaceResource,
  InterviewSession,
  InterviewMessage,
  SampleAssignment,
  Subscription,
  Deployment,
  DeploymentConnection,
  DeploymentCapabilityGrant,
  DeploymentEvent,
  TaskRun,
  CapabilityExecution,
  RuntimeJob,
  ApprovalRequest,
  Review,
  WorkforceBundle,
  WorkforceBundleMember,
};
