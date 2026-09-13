# What was fixed

Every change below is marked in the source with a `# FIX (...)` comment at the exact line/block it applies to, so you can diff against your original files easily.

## Critical authentication bugs

| File | Bug | Fix |
|---|---|---|
| `routers/auth.py` | `authenticate_user(session=SessionDep, ...)` passed the **type alias** `SessionDep` instead of an actual DB session → login crashed on every attempt. | `session: SessionDep` is now a real route parameter, so FastAPI injects an actual `Session`. |
| `auth/authentication.py` | Mixed `from jose import JWTError, jwt` with `from jwt.exceptions import InvalidTokenError` and called `jwt.decode(...)` — wrong library / wrong exception type could go uncaught. | Uses **only PyJWT**, consistently, for encode/decode/error handling. |
| `auth/authentication.py` | JWT secret key hardcoded in source (`SECRET_KEY = "09d25e09..."`.) — anyone with the code could forge tokens. | Secret now loaded from `.env` (`JWT_SECRET_KEY`), app refuses to start if it's missing. |
| `auth/authentication.py` | `get_current_active_user` checked `current_user.disabled`, but no such field existed on the model → `AttributeError` on every call. | Added `disabled: bool` to `UserBase` (so it's on the `users` table). |
| `auth/authentication.py` | `require_role` was declared `async def`, so `Depends(require_role("manager"))` received a **coroutine object**, not the actual dependency function — totally broken if ever used. | Made it a plain sync factory; it's now actually wired into routes. |
| `database/db.py` | MySQL URL with a plaintext password hardcoded in source. | Reads `DATABASE_URL` from `.env`, defaults to local SQLite. |

## Critical authorization bugs (the big one)

Almost **none of the original endpoints required a login at all**, and the few auth pieces that existed (`require_role`) were never used anywhere:

| Endpoint | Before | After |
|---|---|---|
| `POST /user/` (old) | No auth. Accepted a raw `User` model → password stored **unhashed**, and client could send `"role": "manager"` to self-promote. | Removed. Replaced by `POST /auth/register`, which hashes the password and always forces `role="user"` server-side. |
| `GET /user/`, `GET /user/{id}` | No auth. Returned raw `User` model, **leaking password hashes** to anyone. | Manager-only (`require_manager` dependency), returns `UserRead` (no password field). |
| `PATCH /user/{id}` | No auth. Accepted raw `User` model → any caller could change anyone's role/password. | Manager-only, restricted to `UserUpdate` (name/email only). |
| `DELETE /user/{id}` | No auth — anyone could delete any account. | Manager-only. |
| `PATCH /user/me` | Didn't exist. | Added: a user can update their own name/email (never their own role). |
| `POST /task/` (old) | No auth. Client could set `user_id` to **anyone**, creating tasks for other employees. | Requires login; `user_id` always comes from the JWT (`current_user.id`), never the request body. |
| `GET /task/` (old) | No auth, no filter — returned **every task from every employee** to anyone. | `GET /tasks` (renamed) requires login; employees see only their own tasks, managers see all; optional `?status=` filter added per the workflow doc. |
| `GET /task/{user_id}` (old) | No auth — classic IDOR, pass any `user_id` to read that person's tasks. | Replaced by `GET /tasks/{task_id}`: fetch a single task by its own id, with ownership check. |
| `PATCH /task/{id}`, `DELETE /task/{id}` | No auth, no ownership check — anyone could edit/delete anyone's task. | Requires login; 404 if the task doesn't exist, 403 if it exists but belongs to someone else (unless caller is a manager). |

## Other issues fixed
- `models/User`/`Task` were being returned directly as `response_model`, leaking the hashed `password` field in every user-related response. Introduced `UserRead`/`TaskRead`/`TaskCreate`/`TaskUpdate` schemas so requests/responses never expose or accept fields they shouldn't (`id`, `password`, `role`, `user_id`).
- `middleware.py` was an empty file despite the workflow doc describing a request-timing/logging middleware — implemented `LoggingMiddleware` and registered it in `main.py`.
- `main.py` had a dead `from app import auth` import immediately shadowed by the routers import — removed.
- Task router path renamed from `/task` to `/tasks` to match the workflow doc.
- Added `requirements.txt` and a `.env` with a generated secret + SQLite default so the project runs immediately with `pip install -r app/requirements.txt && uvicorn app.main:app --reload` from the project root (one level above `app/`).

## New endpoint summary
- `POST /auth/register` — create account (always role="user")
- `POST /auth/login` — get JWT (also aliased at `/auth/token` for the docs UI)
- `GET /user/me`, `PATCH /user/me` — self-service profile
- `GET /user/`, `GET /user/{id}`, `PATCH /user/{id}`, `DELETE /user/{id}` — manager-only
- `POST /tasks/`, `GET /tasks/` (`?status=`), `GET /tasks/{id}`, `PATCH /tasks/{id}`, `DELETE /tasks/{id}` — employee sees/owns their tasks, manager sees/manages all
