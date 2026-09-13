# Taskboard — Employee Task Manager (frontend)

A Vite + React frontend for the Employee Task Manager API, styled with MUI
(Material Design) in a custom navy/teal theme.

## Setup

```bash
npm install
npm run dev
```

The app runs at `http://localhost:5173` and expects the FastAPI backend at
`http://localhost:8000` (set in `.env` as `VITE_API_URL`).

**Backend CORS:** make sure the backend's `.env` has
`CORS_ORIGINS=http://localhost:5173` (already set by default) and that the
backend is running before you sign in.

## What's included

- **Login / Register** (`/login`, `/register`) — JWT is stored in
  `localStorage` and attached to every API call automatically.
- **My tasks** (`/tasks`) — create, edit, delete tasks; filter by status.
  Employees see only their own tasks; managers see everyone's and can tell
  whose task is whose (`#<user id>` badge).
- **Profile** (`/profile`) — update your own name/email.
- **Team** (`/team`, manager-only) — list every account, edit name/email, or
  remove an account. Hidden entirely from non-managers (both the nav item
  and the route itself, which redirects if visited directly).

## Structure

```
src/
  api/            axios calls per resource (auth, tasks, users)
  context/        AuthContext — current user, login/logout/register
  components/     Layout (app bar + drawer), route guards, dialogs, chips
  pages/          one file per screen
  theme.js        MUI theme tokens (palette, typography, component overrides)
```

## Notes

- Route guards (`ProtectedRoute`) redirect to `/login` if signed out, and
  send non-managers away from `/team` if they try to visit it directly —
  but the **real** enforcement of who can see/edit what lives in the
  backend, not here. The frontend just hides UI a person shouldn't act on.
- A 401 from the API (expired/invalid token) automatically clears the
  stored token and returns to `/login` (see `src/api/client.js`).
