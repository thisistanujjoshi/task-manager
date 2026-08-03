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

## 2026-08-03 — Auth (signup/login/logout) + per-user task scoping

**What was done:**
- Added a `users` table (`username`, `password_hash`) and a `user_id` foreign key on `tasks`.
- Backend: `POST /auth/signup`, `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`. Passwords hashed with `bcryptjs`; sessions are a JWT (`jsonwebtoken`) stored in an `httpOnly`, `SameSite=Lax` cookie — never exposed to JS, never sent to the client as a raw ID.
- `requireAuth` middleware verifies the JWT and attaches `req.userId`; every `/tasks` route now filters/joins on `user_id`, and `PATCH`/`DELETE` check `id AND user_id` together so one user can never touch another's tasks (confirmed by test, see below).
- Frontend: split `App.tsx` into an auth gate — `AuthForm.tsx` (login/signup toggle) and `TaskList.tsx` (the existing task UI, now behind auth) — with a `me()` check on mount to restore the session, and a logout button in the header. All `fetch` calls now send `credentials: "include"`.
- CORS tightened from `cors()` (any origin) to an explicit origin + `credentials: true` — required for the browser to actually send/accept the cookie cross-origin; `origin: "*"` cannot be combined with credentials at all.

**Decisions:**
- JWT-in-httpOnly-cookie over `express-session`: no extra session store needed for a small local app, and it's the direct, deliberate contrast to `vuln-lab`'s broken-auth vulnerability (plaintext password + unsigned, JS-readable cookie as the "session").
- `JWT_SECRET` is read from `.env` (via Node's built-in `process.loadEnvFile()` — no `dotenv` dependency needed on Node 24) with a random-per-process fallback and a console warning if unset, rather than hardcoding a default secret or crashing on missing config.
- Deleted the local dev `data.sqlite` instead of writing a migration for the new `user_id` column — it's gitignored, disposable, and a real migration would be over-engineering for a database nobody but me has a copy of.

**Issues hit:**
- TypeScript: `req.userId` is typed `number | undefined` on `AuthedRequest` since it's only set by the `requireAuth` middleware at runtime — the type system has no way to know the middleware always runs first. Resolved with `req.userId!` at each use site rather than restructuring the types, since the non-null guarantee genuinely comes from route wiring, not from anything checkable in the handler itself.
- Leftover `vite` process from an earlier session was still holding port 5173, so a fresh `npm run dev` silently moved to 5174 — which would have made the CORS origin check fail silently in a real browser. Caught it by checking `ps aux` before trusting the "it's just testing a different port" assumption.

**Verification (no browser tool available in this session, so full curl-based, from the frontend's actual origin):**
- Signup, login (correct + wrong password), duplicate-username rejection (409), short-password rejection (400), logout, and post-logout `401` on `/tasks` — all behave correctly.
- Two independent users (alice, bob): each only sees their own tasks; bob's attempt to delete alice's task by ID returns `404`, not `403` or a silent no-op — doesn't leak whether the ID exists at all.
- Confirmed via direct DB read that stored passwords are bcrypt hashes, not plaintext.
- Confirmed the session cookie carries the `HttpOnly` flag (via the curl cookie-jar file's `#HttpOnly_` prefix).
- Ran the actual CORS preflight (`OPTIONS`) and a credentialed request with `Origin: http://localhost:5173` to confirm the browser's `fetch(..., {credentials: "include"})` calls will succeed, not just that the API works via same-origin curl.
- Still unverified: manually clicking through signup → login → create/search/toggle/delete → logout in an actual browser. That's the real check and is on the user to confirm.

**Next up:** manual in-browser confirmation, then deploy (last unchecked item).
