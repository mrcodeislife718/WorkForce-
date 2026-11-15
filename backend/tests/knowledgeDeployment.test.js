const test = require('node:test');
const assert = require('node:assert/strict');
const { canDeployWithoutConnections } = require('../services/knowledgeDeployment');

test('written work can be performed without outside-tool access', () => {
  assert.equal(canDeployWithoutConnections([]), true);
});

test('employees declaring external permissions still need their approved tools', () => {
  assert.equal(canDeployWithoutConnections([{ capability_key: 'email.send' }]), false);
  assert.equal(canDeployWithoutConnections(undefined), true);
});
