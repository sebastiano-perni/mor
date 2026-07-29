# MOR Platform

A modern High-Performance Computing (HPC) cluster management and job scheduling web application.

## Containerized Launch (Recommended)

To deploy and run the entire stack on a containerized server using Docker Compose:

```bash
docker compose up --build
```

This will automatically spin up:
- **PostgreSQL 17** container on port `5432` with health checks.
- **Application** container running the Express API (`5000`) and Vite Frontend (`3000`).
- **Database Dump Import**: Automatically imports `dump.dump` via `pg_restore` on initial database spin-up.

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
