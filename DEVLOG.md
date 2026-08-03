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

## 2026-08-03 — Wired frontend to the API

**What was done:**
- Replaced the untouched Vite starter page in `App.tsx` with a real UI: search bar, create form, task list with a checkbox to toggle done and a delete button.
- Added `src/api.ts` — a thin typed fetch wrapper (`listTasks`, `createTask`, `updateTask`, `deleteTask`) so `App.tsx` doesn't deal with raw `fetch` calls or error-shape parsing directly.
- Added `.env.example` (`VITE_API_URL`) so the API base URL isn't hardcoded — defaults to `http://localhost:4000` if unset.
- Removed the unused starter assets (`react.svg`, `vite.svg`, `hero.png`, `public/icons.svg`) and rewrote `App.css` for the actual task-list UI, reusing the existing light/dark CSS variables from `index.css` instead of introducing new ones.

**Decisions:**
- Kept `done` as `number` (0/1) in the `Task` type to match what SQLite actually returns, but typed `updateTask`'s patch argument as `done?: boolean` separately — matches what the PATCH route expects on the wire, avoids leaking a storage detail into the update call's type.

**Issues hit:**
- Type error: passed a `boolean` where the `Task`-derived patch type expected `number` for `done`. Fixed by giving `updateTask` its own inline patch type instead of reusing `Pick<Task, ...>`.
- No browser automation tool was available in this session to click through the UI directly. Verified instead via: `tsc --noEmit` (clean), both dev servers running and compiling, and a CORS preflight + GET check against the backend from the frontend's origin (`http://localhost:5173`) to confirm the browser-side fetch calls will actually succeed. Manual browser check by the user is still the real verification step.

**Next up:** manually confirm in-browser, then move on to auth (login/signup).
