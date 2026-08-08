# MOR Platform

A web application demo for HPC cluster management and job scheduling. Built for the EIT Digital I&E Summer School in Ankara.

## Requirements

- [Docker](https://docs.docker.com/get-docker/) (recommended), **or** Node.js with `pnpm` and PostgreSQL 17

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
