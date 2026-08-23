const test = require('node:test');
const assert = require('node:assert/strict');
const { estimateModelCost, verifiedTaskEconomics } = require('../services/runtimeEconomics');

test('estimates model cost from token usage', () => {
  const cost = estimateModelCost(
    { prompt_tokens: 1_000_000, completion_tokens: 500_000 },
    { input_per_million_usd: 2, output_per_million_usd: 8 },
  );
  assert.equal(cost, 6);
});

test('calculates verified task economics', () => {
  const economics = verifiedTaskEconomics({
    totalCostUsd: 5,
    verified: true,
    estimatedHumanMinutes: 120,
    humanHourlyCostUsd: 50,
  });
  assert.equal(economics.cost_per_verified_task_usd, 5);
  assert.equal(economics.estimated_human_labor_value_usd, 100);
  assert.equal(economics.estimated_net_value_usd, 95);
  assert.equal(economics.value_to_cost_ratio, 20);
});
