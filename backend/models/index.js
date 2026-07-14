const User = require('./User');
const Worker = require('./Worker');
const WorkerPermission = require('./WorkerPermission');
const Deployment = require('./Deployment');
const Review = require('./Review');

Worker.hasMany(WorkerPermission, { foreignKey: 'worker_id' });
WorkerPermission.belongsTo(Worker, { foreignKey: 'worker_id' });

User.hasMany(Deployment, { foreignKey: 'user_id' });
Deployment.belongsTo(User, { foreignKey: 'user_id' });

Worker.hasMany(Deployment, { foreignKey: 'worker_id' });
Deployment.belongsTo(Worker, { foreignKey: 'worker_id' });

Deployment.hasOne(Review, { foreignKey: 'deployment_id' });
Review.belongsTo(Deployment, { foreignKey: 'deployment_id' });

module.exports = { User, Worker, WorkerPermission, Deployment, Review };