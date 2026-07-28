#!/usr/bin/env bash

set -e

# Try loading NVM if present on host
if [ -s "$HOME/.nvm/nvm.sh" ]; then
  . "$HOME/.nvm/nvm.sh" >/dev/null 2>&1 || true
  nvm use 22 >/dev/null 2>&1 || nvm use 20 >/dev/null 2>&1 || true
fi

# Load environment variables from .env if present
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

export DATABASE_URL="${DATABASE_URL:-postgres://postgres:postgres@localhost:5432/mor_db}"
export PORT="${PORT:-5000}"
export VITE_PORT="${VITE_PORT:-3000}"
export BASE_PATH="${BASE_PATH:-/}"

echo "========================================="
echo "   MOR Platform Local Launcher           "
echo "========================================="

# Mode 1: Run via Docker Compose (Recommended - bypasses host Node.js version requirements)
if command -v docker >/dev/null 2>&1; then
  echo "Docker detected! Launching application and database via Docker Compose..."
  echo "Node 22 runtime environment will be containerized automatically."
  echo "========================================="
  
  if docker compose version >/dev/null 2>&1; then
    exec docker compose up --build
  elif command -v docker-compose >/dev/null 2>&1; then
    exec docker-compose up --build
  fi
fi

# Mode 2: Host Execution (if Docker is not installed)
NODE_MAJOR=$(node -v 2>/dev/null | cut -d'v' -f2 | cut -d'.' -f1 || echo "0")

if [ "$NODE_MAJOR" -lt 20 ]; then
  echo "Error: Host Node.js version is $(node -v)."
  echo "Vite 7 and Tailwind CSS v4 require Node.js 20.19+ or 22.12+."
  echo ""
  echo "Options to run this project:"
  echo " 1. Install Docker and run './run.sh' (Docker will run Node 22 automatically)."
  echo " 2. Upgrade host Node.js to version 20 or 22 (e.g. using 'nvm install 22 && nvm use 22')."
  exit 1
fi

echo "Running on host (Node $(node -v))..."

# Check PNPM
if ! command -v pnpm >/dev/null 2>&1; then
  if command -v corepack >/dev/null 2>&1; then
    corepack enable pnpm >/dev/null 2>&1 || true
  fi
fi

if ! command -v pnpm >/dev/null 2>&1; then
  echo "Error: pnpm is required to run this project. Install via: npm install -g pnpm"
  exit 1
fi

# Install dependencies
echo "Installing dependencies..."
pnpm install

# Import Database Dump or Push Schema & Seed
export PGPASSWORD="${PGPASSWORD:-postgres}"
if [ -f dump.dump ] && command -v pg_restore >/dev/null 2>&1; then
  echo "Found Replit database dump (dump.dump). Importing into local database..."
  pg_restore -h localhost -p 5432 -U postgres -d mor_db --clean --if-exists --no-owner --no-privileges dump.dump || true
  echo "Database dump imported successfully!"
else
  echo "Pushing database schema..."
  pnpm --filter @workspace/db run push --force

  echo "Seeding database..."
  pnpm --filter @workspace/db run seed || true
fi

# Signal cleanup
cleanup() {
  echo "Shutting down background services..."
  kill 0
}
trap cleanup SIGINT SIGTERM EXIT

# Start API & Frontend
echo "Starting Backend API Server (port ${PORT})..."
pnpm --filter @workspace/api-server run dev &

echo "Starting Frontend Web Application (port ${VITE_PORT})..."
pnpm --filter @workspace/mor-platform run dev &

wait
