# MOR Platform

A modern High-Performance Computing (HPC) cluster management and job scheduling web application.

## Local Launch

To start the entire stack (PostgreSQL database, Express API server, and Vite React application):

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
- Manual DB schema push: `pnpm db:push`
- Manual DB seeding: `pnpm db:seed`
