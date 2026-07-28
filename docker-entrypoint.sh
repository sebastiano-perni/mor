#!/usr/bin/env bash

set -e

echo "========================================="
echo " Installing dependencies (Node $(node -v))..."
echo "========================================="
pnpm install

echo "Waiting for PostgreSQL database to be ready at postgres:5432..."
until pg_isready -h postgres -U postgres -d mor_db >/dev/null 2>&1; do
  echo -n "."
  sleep 1
done
echo ""
echo "PostgreSQL database is ready!"

export PGPASSWORD="${PGPASSWORD:-postgres}"

if [ -f /app/dump.dump ]; then
  echo "Found Replit database dump (dump.dump)."
  echo "Using pg_restore version: $(pg_restore --version)"
  echo "Importing dump into PostgreSQL..."
  pg_restore -h postgres -U postgres -d mor_db --clean --if-exists --no-owner --no-privileges /app/dump.dump || true
  echo "Database dump import completed!"
else
  echo "Pushing database schema..."
  pnpm --filter @workspace/db run push --force

  echo "Seeding database..."
  pnpm --filter @workspace/db run seed || true
fi

echo "========================================="
echo " Starting Application Services..."
echo " Frontend : http://localhost:3000"
echo " API Server: http://localhost:5000"
echo "========================================="

pnpm --filter @workspace/api-server run dev &
pnpm --filter @workspace/mor-platform run dev &

wait -n
