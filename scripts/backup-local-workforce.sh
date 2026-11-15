#!/usr/bin/env bash
set -euo pipefail

# Local-development backup. Treat output as sensitive customer data.
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"
if [[ ! -f backend/.env ]]; then
  echo "backend/.env is missing. Run bash scripts/setup-local-workforce.sh first." >&2
  exit 1
fi
if ! docker compose version >/dev/null 2>&1; then
  echo "Docker Compose is required." >&2
  exit 1
fi
umask 077
mkdir -p backups/workforce
chmod 700 backups/workforce
dest="backups/workforce/workforce-$(date -u +%Y%m%dT%H%M%SZ).dump"
trap 'if [[ -f "$dest" && ! -s "$dest" ]]; then rm -f "$dest"; fi' EXIT

docker compose --env-file backend/.env exec -T postgres \
  sh -c 'exec pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --format=custom' > "$dest"
if [[ ! -s "$dest" ]]; then
  echo "Database backup was empty." >&2
  exit 1
fi
echo "Created local PostgreSQL backup: $dest"
echo "Keep this file out of Git and store a securely encrypted copy off-device."
