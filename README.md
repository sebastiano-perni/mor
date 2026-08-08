# MOR Platform

A web application for HPC cluster management and job scheduling.

## Requirements

- [Docker](https://docs.docker.com/get-docker/) (recommended), **or** Node.js 20.19+ / 22.12+ with `pnpm` and PostgreSQL 17

## Run

Copy `.env.example` to `.env`, then:

```bash
./run.sh
```

- Frontend: http://localhost:3000
- API: http://localhost:5000

## Limitations

- Only tested on Linux
- Without Docker, requires a running local PostgreSQL instance
