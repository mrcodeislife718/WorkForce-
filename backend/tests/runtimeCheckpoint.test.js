const test = require('node:test');
const assert = require('node:assert/strict');
const { shouldRestoreCheckpoint } = require('../services/runtimeCheckpoint');

test('a stale saved checkpoint never rewinds already recorded action progress', () => {
  assert.equal(shouldRestoreCheckpoint(
    { payload: { next_action_index: 3 } },
    { next_action_index: 2 },
  ), false);
});

test('newer saved checkpoints can restore interrupted work', () => {
  assert.equal(shouldRestoreCheckpoint(
    { payload: { next_action_index: 1 } },
    { next_action_index: 2 },
  ), true);
});

test('unknown checkpoint or empty task state cannot be restored', () => {
  assert.equal(shouldRestoreCheckpoint({ payload: {} }, null), false);
  assert.equal(shouldRestoreCheckpoint({}, { next_action_index: 2 }), false);
});
