# Local PostgreSQL (portable, no admin rights required)

This machine has no system-wide PostgreSQL install and no admin shell available,
so we're running the official EDB portable binaries directly out of this folder
instead of installing a Windows service.

- Binaries: `tools/pgsql/` (PostgreSQL 16.6, extracted from EDB's zip distribution)
- Data directory: `tools/pgdata/`
- Port: `5433` (chosen to avoid clashing with any other local Postgres on 5432)
- Superuser: `postgres` / password `postgres` (trust auth locally — fine for dev only)
- Database: `hirelens`

Neither `tools/pgsql/` nor `tools/pgdata/` are committed to git (see `.gitignore`) —
they're a local dev convenience, not part of the repo.

## Start the server

```bash
tools/pgsql/bin/pg_ctl.exe -D tools/pgdata -l tools/pgdata/logfile.txt -o "-p 5433" start
```

## Stop the server

```bash
tools/pgsql/bin/pg_ctl.exe -D tools/pgdata stop
```

## Connect with psql

```bash
tools/pgsql/bin/psql.exe -h localhost -p 5433 -U postgres -d hirelens
```

## Connection string

```
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/hirelens"
```

## Moving to a real Postgres later

Nothing in the app depends on this being portable — it's a standard Postgres 16
server. To move to a managed instance (Neon/Supabase/Railway/RDS/etc.), just
swap `DATABASE_URL` in `backend/.env` and re-run `npx prisma migrate deploy`.
