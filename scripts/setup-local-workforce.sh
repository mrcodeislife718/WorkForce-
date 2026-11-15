#!/usr/bin/env bash
set -euo pipefail

# Run once: bash scripts/setup-local-workforce.sh
# Generates developer-only credentials without printing passwords or tokens.
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is required to generate secure local credentials." >&2
  exit 1
fi

if [[ -e backend/.env ]]; then
  echo "Existing backend/.env preserved; no credentials were replaced."
  echo "Ensure DB_NAME, DB_USER, DB_PASSWORD, JWT_SECRET and ORCA_CREDENTIAL_ENCRYPTION_KEY are configured."
  exit 0
fi

umask 077
node <<'NODE'
'use strict';
const fs = require('node:fs');
const { randomBytes } = require('node:crypto');

const template = fs.readFileSync('backend/.env.example', 'utf8');
const overrides = {
  DB_NAME: 'workforce',
  DB_USER: 'workforce',
  DB_PASSWORD: randomBytes(24).toString('hex'),
  JWT_SECRET: randomBytes(48).toString('hex'),
  ORCA_CREDENTIAL_ENCRYPTION_KEY: randomBytes(32).toString('base64'),
};
let result = template;
for (const [key, value] of Object.entries(overrides)) {
  const pattern = new RegExp('^' + key + '=.*$', 'm');
  if (!pattern.test(result)) throw new Error(key + ' was not found in the environment template.');
  result = result.replace(pattern, key + '=' + value);
}
fs.writeFileSync('backend/.env', result, { encoding: 'utf8', flag: 'wx', mode: 0o600 });
console.log('Created private backend/.env with random local PostgreSQL and application secrets.');
console.log('No Supabase account, cloud credentials, or paid service was used.');
NODE

echo
echo "Next commands:"
echo "  docker compose --env-file backend/.env up -d --build postgres"
echo "  docker compose --env-file backend/.env run --rm backend npm run seed"
echo "  docker compose --env-file backend/.env up -d backend"
echo "  curl -fsS http://localhost:5000/api/health"
