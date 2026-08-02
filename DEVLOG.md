# Dev Log

Running record of what changed, decisions made, and issues hit — kept so there's real material for interview stories later, not just "I built an app."

## 2026-08-03 — Initial scaffolding

**What was done:**
- Set up Node.js locally via `nvm` (no system Node was installed on this machine).
- Scaffolded `frontend/` with Vite's `react-ts` template.
- Scaffolded `backend/` by hand: Express + TypeScript + SQLite, with a `tasks` table (id, title, tags, done, created_at) and full CRUD routes (`GET /tasks` with search, `POST /tasks`, `PATCH /tasks/:id`, `DELETE /tasks/:id`).
- Smoke-tested the backend manually (`/health`, create a task, list tasks) — all working before first commit.

**Decisions:**
- Used SQLite over Postgres for zero-setup local dev. All queries use parameterized statements (`?` placeholders) instead of string interpolation — deliberate, since the companion project (`vuln-lab`) exists specifically to show what happens when you *don't* do this (SQL injection).
- Kept the backend framework-free (plain Express) rather than reaching for Nest/tRPC, to stay close to the fundamentals while still learning.

**Issues hit:**
- `node` was not installed and there was no `nvm` on the machine — installed `nvm` locally (no sudo) and used it to get Node 24 LTS.
- Started with `better-sqlite3`, but `npm install` failed compiling its native C++ addon (`g++: No such file or directory` — no C++ build toolchain on this machine). Rather than installing system build tools, switched to Node's built-in `node:sqlite` module (stable in Node 22+) — same `.prepare().run/get/all()` API, zero native dependencies. One gotcha: its `result.changes`/`lastInsertRowid` are `BigInt`, so `=== 0` comparisons needed `Number(...)` wrapping.

**Next up:** wire the frontend to the API, then add search/tag UI.
