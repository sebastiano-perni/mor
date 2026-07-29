#!/usr/bin/env bash

set -e

echo "========================================="
echo " Starting MOR Platform Container"
echo " Node Version: $(node -v)"
echo "========================================="

# Set environment defaults
export DATABASE_URL="${DATABASE_URL:-postgres://postgres:postgres@postgres:5432/mor_db}"
export PORT="${PORT:-5000}"
export VITE_PORT="${VITE_PORT:-3000}"
export BASE_PATH="${BASE_PATH:-/}"
export API_TARGET="${API_TARGET:-http://localhost:5000}"

# Auto-correct DATABASE_URL host if pointing to localhost in container network
if [[ "$DATABASE_URL" == *"@localhost:"* || "$DATABASE_URL" == *"@127.0.0.1:"* ]]; then
  if getent hosts postgres >/dev/null 2>&1 || ping -c 1 postgres >/dev/null 2>&1; then
    echo "Adjusting DATABASE_URL host from localhost -> postgres for container network..."
    DATABASE_URL=$(echo "$DATABASE_URL" | sed -E 's/@(localhost|127\.0\.0\.1):/@postgres:/')
    export DATABASE_URL
  fi
fi

# Ensure dependencies are installed if mounted as volume
if [ ! -d "node_modules" ] || [ ! -d "artifacts/mor-platform/node_modules" ]; then
  echo "Node modules missing, running pnpm install..."
  pnpm install
fi

# Parse DB connection parameters from DATABASE_URL or defaults
DB_HOST=$(echo "$DATABASE_URL" | sed -E 's|.*://[^@]+@([^:/]+).*|\1|')
DB_PORT=$(echo "$DATABASE_URL" | sed -E 's|.*://[^@]+@[^:/]+:([0-9]+).*|\1|')
[ "$DB_PORT" = "$DATABASE_URL" ] && DB_PORT="5432"
DB_USER=$(echo "$DATABASE_URL" | sed -E 's|.*://([^:]+):.*|\1|')
DB_PASSWORD=$(echo "$DATABASE_URL" | sed -E 's|.*://[^:]+:([^@]+)@.*|\1|')
DB_NAME=$(echo "$DATABASE_URL" | sed -E 's|.*://[^/]+/([^?]+).*|\1|')

export PGPASSWORD="${DB_PASSWORD:-postgres}"

echo "Waiting for PostgreSQL database to be ready at ${DB_HOST}:${DB_PORT}..."
until pg_isready -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER:-postgres}" -d "${DB_NAME:-mor_db}" >/dev/null 2>&1; do
  echo -n "."
  sleep 1
done
echo ""
echo "PostgreSQL database is ready!"

# Check table count in database
TABLE_COUNT=$(psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER:-postgres}" -d "${DB_NAME:-mor_db}" -tAc "SELECT count(*) FROM information_schema.tables WHERE table_schema='public';" 2>/dev/null || echo "0")

if [ "$TABLE_COUNT" = "0" ] || [ "$FORCE_DB_RESTORE" = "true" ]; then
  if [ -f /app/dump.dump ] || [ -f ./dump.dump ]; [ -f /app/dump.dump ] && DUMP_PATH="/app/dump.dump" || DUMP_PATH="./dump.dump"; [ -f "$DUMP_PATH" ]; then
    echo "Found database dump (${DUMP_PATH})."
    echo "Using pg_restore version: $(pg_restore --version)"
    echo "Importing dump into PostgreSQL database '${DB_NAME:-mor_db}'..."
    pg_restore -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER:-postgres}" -d "${DB_NAME:-mor_db}" --clean --if-exists --no-owner --no-privileges "$DUMP_PATH" || true
    echo "Database dump import completed successfully!"
  else
    echo "No dump file found. Pushing database schema..."
    pnpm --filter @workspace/db run push --force

    echo "Seeding database..."
    pnpm --filter @workspace/db run seed || true
  fi
else
  echo "Database already contains tables (count: ${TABLE_COUNT}). Skipping initial restore."
  echo "(Set FORCE_DB_RESTORE=true if you wish to overwrite existing database data)."
fi

echo "========================================="
echo " Starting Application Services..."
echo " Frontend : http://localhost:${VITE_PORT}"
echo " API Server: http://localhost:${PORT}"
echo "========================================="

pnpm --filter @workspace/api-server run dev &
pnpm --filter @workspace/mor-platform run dev &

wait -n
