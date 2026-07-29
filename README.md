# MOR Platform

A modern High-Performance Computing (HPC) cluster management and job scheduling web application.

## Containerized Launch

### Option 1: Local / Cloned Repository
If you have cloned the repository locally:

```bash
docker compose up --build
```

### Option 2: Standalone Remote Deployment (No repo cloning required)
To deploy remotely on a server using **only** a single Compose file without cloning the repository:

Download or copy `docker-compose.standalone.yml` to your server and run:

```bash
docker compose -f docker-compose.standalone.yml up -d --build
```

Or deploy directly via URL:
```bash
curl -sSL https://raw.githubusercontent.com/sebastiano-perni/mor/main/docker-compose.standalone.yml | docker compose -f - up -d --build
```

This automatically pulls the build context directly from `https://github.com/sebastiano-perni/mor.git`, builds the image (including `dump.dump`), starts PostgreSQL 17, and imports the database dump automatically.

---

## Host Launch (Local Development)

To start the stack directly on host:

```bash
./run.sh
```

or using `pnpm`:

```bash
pnpm start
```

### URLs
- **Frontend App**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:5000](http://localhost:5000)

## Features & Architecture

- **Frontend**: React 19, Vite 7, Tailwind CSS v4, Radix UI, TanStack Query, Wouter.
- **Backend**: Node.js 22, Express 5, Pino Logger.
- **Database**: PostgreSQL 17, Drizzle ORM (`drizzle-kit`).
- **Monorepo Structure**: `pnpm` workspaces.
  - `artifacts/mor-platform`: Main React frontend.
  - `artifacts/api-server`: Express backend API server.
  - `lib/db`: Database models, schemas, and seeding.
  - `lib/api-spec`: OpenAPI specifications and Orval client codegen.
  - `lib/api-zod`: Shared Zod validation schemas.
  - `lib/api-client-react`: React Query hooks generated from OpenAPI spec.

## Database Management & Dumps

- Automatic import of Replit database dumps (`dump.dump`) using `pg_restore`.
- Force dump re-import in Docker: set `FORCE_DB_RESTORE=true`.
- Manual DB schema push: `pnpm db:push`
- Manual DB seeding: `pnpm db:seed`
