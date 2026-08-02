# Task Manager

A full-stack task/notes manager with tagging and search, built as a learning project while preparing for software engineering roles.

## Stack

- **Backend:** Node.js, Express, TypeScript, SQLite (`better-sqlite3`)
- **Frontend:** React, TypeScript, Vite

## Why these choices

- SQLite instead of Postgres: zero setup, one less moving part while learning — easy to swap for Postgres later since all access goes through parameterized queries in `backend/src/routes`.
- Plain Express instead of a framework like NestJS: fewer abstractions to learn through while getting the fundamentals down.

## Running locally

**Backend**
```
cd backend
npm install
npm run dev   # http://localhost:4000
```

**Frontend**
```
cd frontend
npm install
npm run dev   # http://localhost:5173
```

## Project structure

```
backend/    Express API, SQLite database, CRUD routes for tasks
frontend/   React UI (Vite)
DEVLOG.md   Running log of changes, decisions, and issues hit while building this
```

## Status

- [x] Backend scaffolding + CRUD API for tasks (create, list/search, update, delete)
- [ ] Frontend UI wired up to the API
- [ ] Auth (login/signup)
- [ ] Deploy
