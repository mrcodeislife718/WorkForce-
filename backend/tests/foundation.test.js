const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');

process.env.ORCA_CREDENTIAL_ENCRYPTION_KEY = crypto.randomBytes(32).toString('base64');
process.env.ORCA_CREDENTIAL_KEY_VERSION = '1';

const { encryptSecret, decryptSecret, redactSecret } = require('../services/credentialVault');
const { isPrivateAddress } = require('../connectors/security/networkGuard');
const registry = require('../connectors/registerBuiltins')();

test('credential vault encrypts and authenticates connector secrets', () => {
  const encrypted = encryptSecret('real-secret-value');
  assert.notEqual(encrypted.encrypted_value, 'real-secret-value');
  assert.equal(decryptSecret(encrypted), 'real-secret-value');
  assert.equal(redactSecret('1234567890abcdef'), '1234…cdef');
});

test('network guard identifies local and private addresses', () => {
  assert.equal(isPrivateAddress('127.0.0.1'), true);
  assert.equal(isPrivateAddress('10.10.0.2'), true);
  assert.equal(isPrivateAddress('192.168.1.2'), true);
  assert.equal(isPrivateAddress('::1'), true);
  assert.equal(isPrivateAddress('8.8.8.8'), false);
});

test('real universal adapters are registered without fake native adapters', () => {
  assert.equal(registry.has('generic-rest'), true);
  assert.equal(registry.has('generic-webhook'), true);
  assert.equal(registry.has('slack'), false);
  assert.equal(registry.has('google-workspace'), false);
});
