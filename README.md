# Task Manager

A full-stack task/notes manager with tagging, search, and auth — built as a learning
project while preparing for software engineering roles.

## Stack

- **Backend:** Node.js, Express, TypeScript, SQLite (Node's built-in `node:sqlite`), `bcryptjs` + `jsonwebtoken` for auth
- **Frontend:** React, TypeScript, Vite

## Why these choices

- SQLite instead of Postgres: zero setup, one less moving part while learning — easy to swap for Postgres later since all access goes through parameterized queries in `backend/src/routes`.
- Plain Express instead of a framework like NestJS: fewer abstractions to learn through while getting the fundamentals down.
- Auth is a JWT in an `httpOnly` cookie rather than `localStorage` or an unsigned cookie — see [`vuln-lab`](../vuln-lab) for exactly what goes wrong when auth is done the other way.

## Running locally

**Backend**
```
cd backend
npm install
cp .env.example .env   # set a real JWT_SECRET; a random one is used otherwise (sessions won't survive a restart)
npm run dev   # http://localhost:4000
```

**Frontend**
```
cd frontend
npm install
cp .env.example .env   # points the frontend at the backend URL
npm run dev   # http://localhost:5173
```

## Deployment

Backend on [Render](https://render.com) (via `render.yaml`), frontend on [Vercel](https://vercel.com).
They're on different domains, so the auth cookie is `SameSite=None; Secure` in production
(vs. `Lax` locally) — see `backend/src/routes/auth.ts`.

**Backend (Render):** New → Blueprint → select this repo → it reads `render.yaml`
(root dir `backend`, build/start commands, and a free auto-generated `JWT_SECRET`).
Set `FRONTEND_ORIGIN` to the deployed Vercel URL once you have it.

**Frontend (Vercel):** New Project → import this repo → set **Root Directory** to
`frontend` → add env var `VITE_API_URL` = the deployed Render URL → deploy.
`VITE_API_URL` is baked in at build time, so redeploy the frontend if this changes.

**Known limitation:** Render's free tier disk is ephemeral — the SQLite file resets
on redeploy/restart. Fine for a portfolio demo; a real deployment would use a
persistent disk (Render paid tier) or a hosted database.

## Project structure

```
backend/    Express API — auth (signup/login/logout/me) + CRUD routes for tasks, scoped per user
frontend/   React UI (Vite) — AuthForm gates access to TaskList
DEVLOG.md   Running log of changes, decisions, and issues hit while building this
SECURITY note: see ../vuln-lab for the deliberately-broken version of this same auth pattern
```

## Status

- [x] Backend scaffolding + CRUD API for tasks (create, list/search, update, delete)
- [x] Frontend UI wired up to the API (list, search, create, toggle done, delete)
- [x] Auth (signup/login/logout, JWT in an httpOnly cookie, tasks scoped per user)
- [ ] Deploy
