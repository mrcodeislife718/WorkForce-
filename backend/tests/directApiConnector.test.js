const test = require('node:test');
const assert = require('node:assert/strict');
const rest = require('../connectors/universal/GenericRestConnector');

test('direct business API registers local employee without third-party install endpoint', async () => {
  const result = await rest.installDigitalEmployee({
    connection: { configuration: { lifecycle_mode: 'direct' } },
    deployment: { id: 'deployment-42' },
  });
  assert.deepEqual(result, {
    ok: true,
    external_installation_id: 'workforce-direct:deployment-42',
    installation_scope: 'workforce_only',
  });
  const paused = await rest.pauseDigitalEmployee({
    connection: { configuration: { lifecycle_mode: 'direct' } },
  });
  assert.equal(paused.ok, true);
  assert.equal(paused.control_scope, 'workforce_only');
  assert.equal(paused.action, 'pause');
});

test('direct API default mode does not invent remote installation', async () => {
  const result = await rest.installDigitalEmployee({
    connection: { configuration: { operations: {} } },
    deployment: { id: 'deployment-1' },
  });
  assert.equal(result.external_installation_id, 'workforce-direct:deployment-1');
});

test('provider verification checks both account and approved resource using actual requests', async () => {
  const called = [];
  const original = rest.request;
  rest.request = async ({ operation }) => {
    called.push(operation.path);
    return { status: 200, ok: true };
  };
  try {
    const validation = await rest.validateConnection({
      connection: { configuration: { operations: {
        health: { method: 'GET', path: '/user' },
        verify: { method: 'GET', path: '/repos/customer/project/issues' },
      } } },
      secrets: {},
    });
    assert.equal(validation.ok, true);
    assert.deepEqual(called, ['/user', '/repos/customer/project/issues']);
    const bad = await rest.validateConnection({
      connection: { configuration: { operations: {
        health: { method: 'GET', path: '/user' },
        verify: { method: 'POST', path: '/payments' },
      } } },
      secrets: {},
    });
    assert.equal(bad.ok, false);
    assert.equal(called.length, 3); // health called; unsafe verification is not.
  } finally {
    rest.request = original;
  }
});

test('operation destinations cannot be supplied as absolute URL or escaped network path', async () => {
  const opts = { configuration: {
    base_url: 'https://api.github.com',
    allowed_hosts: ['api.github.com'],
  }, secrets: {}, input: {} };
  await assert.rejects(rest.request({
    ...opts, operation: { method: 'GET', path: 'https://evil.example.com/private' },
  }), /must be relative/);
  await assert.rejects(rest.request({
    ...opts, operation: { method: 'GET', path: '//127.0.0.1/secrets' },
  }), /must be relative/);
  await assert.rejects(rest.request({
    ...opts, operation: { method: 'GET', path: '\\\\private\\\\data' },
  }), /must be relative/);
});
