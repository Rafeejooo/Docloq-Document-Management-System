#!/bin/sh
# DocLoq Backend Entrypoint
# Loads Docker Swarm secrets as environment variables and optionally runs migrations.

# Load secrets from /run/secrets/ as env vars
# Each secret file name becomes the env var name (uppercased)
if [ -d /run/secrets ]; then
  for f in /run/secrets/*; do
    if [ -f "$f" ]; then
      varname=$(basename "$f" | tr '[:lower:]' '[:upper:]')
      export "$varname"="$(cat "$f")"
    fi
  done
fi

# Run database migrations if this replica is the migration leader
if [ "$RUN_MIGRATIONS" = "true" ]; then
  echo "[Entrypoint] Running database migrations..."
  npx drizzle-kit migrate
  echo "[Entrypoint] Migrations complete."
fi

exec "$@"
