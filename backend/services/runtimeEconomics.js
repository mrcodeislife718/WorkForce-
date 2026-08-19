'use strict';

function finite(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function estimateModelCost(usage = {}, pricing = {}) {
  const inputTokens = finite(usage.prompt_tokens ?? usage.input_tokens);
  const outputTokens = finite(usage.completion_tokens ?? usage.output_tokens);
  const inputPerMillion = finite(pricing.input_per_million_usd ?? process.env.MODEL_INPUT_PER_MILLION_USD);
  const outputPerMillion = finite(pricing.output_per_million_usd ?? process.env.MODEL_OUTPUT_PER_MILLION_USD);
  return Number((((inputTokens / 1_000_000) * inputPerMillion) + ((outputTokens / 1_000_000) * outputPerMillion)).toFixed(6));
}

function verifiedTaskEconomics({ totalCostUsd = 0, verified = false, estimatedHumanMinutes = 0, humanHourlyCostUsd = 0 }) {
  const cost = finite(totalCostUsd);
  const minutes = finite(estimatedHumanMinutes);
  const hourly = finite(humanHourlyCostUsd);
  const laborValue = Number(((minutes / 60) * hourly).toFixed(2));
  const netValue = Number((laborValue - cost).toFixed(2));
  return {
    verified: Boolean(verified),
    total_cost_usd: Number(cost.toFixed(6)),
    estimated_human_labor_value_usd: laborValue,
    estimated_net_value_usd: netValue,
    cost_per_verified_task_usd: verified ? Number(cost.toFixed(6)) : null,
    value_to_cost_ratio: cost > 0 ? Number((laborValue / cost).toFixed(2)) : null,
  };
}

module.exports = { estimateModelCost, verifiedTaskEconomics };
