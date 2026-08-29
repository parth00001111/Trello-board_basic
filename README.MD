# TaskFlow

TaskFlow is a responsive Trello-style project workspace built with React, Express, and MongoDB. It includes secure cookie authentication, organizations, team members, boards, task CRUD, and persisted drag-and-drop across a five-stage workflow.

## Local setup

Requirements: Node.js 22.12+ and a MongoDB connection string.

1. Copy `backend/.env.example` to `backend/.env` and fill in `MONGO_URI` and a long random `JWT_SECRET`.
2. Copy `frontend/.env.example` to `frontend/.env` if the API is not running at `http://localhost:5000`.
3. Install dependencies in both package roots:

   ```powershell
   npm.cmd install
   npm.cmd --prefix frontend install
   ```

4. Start the API and web app in separate terminals:

   ```powershell
   npm.cmd run dev
   npm.cmd run dev:web
   ```

The web app runs at `http://localhost:5173` and the API defaults to `http://localhost:5000`.

## Production deployment

The API must be deployed first so its public HTTPS URL can be added to the Vercel build.

### Render API

Create a Web Service from the repository root with these settings:

- Build command: `npm ci --omit=dev`
- Start command: `npm start`
- Health check path: `/health`
- Node version: 22

Set these Render environment variables:

```text
MONGO_URI=mongodb+srv://...
JWT_SECRET=a-random-secret-at-least-32-characters-long
CLIENT_ORIGIN=https://your-project.vercel.app
NODE_ENV=production
COOKIE_SECURE=true
COOKIE_SAME_SITE=none
TRUST_PROXY=1
```

Do not set `PORT`; Render supplies it. Leave `DNS_SERVERS` unset so Render's system DNS is used. If MongoDB Atlas is used, its Network Access list must allow the Render service to connect. When deployment is healthy, both the Render root URL and `<render-url>/health` return JSON.

### Vercel web app

The recommended Vercel project settings are:

- Root Directory: `frontend`
- Framework Preset: Vite
- Install command: `npm ci`
- Build command: `npm run build`
- Output directory: `dist`

Set this Vercel environment variable for Production (and Preview if previews should work):

```text
VITE_API_URL=https://your-api.onrender.com
```

`VITE_API_URL` is embedded during the Vite build, so redeploy after adding or changing it. Do not include `/api`; this backend's routes are served from the API root. `frontend/vercel.json` handles BrowserRouter refreshes and direct links.

Leaving Vercel's Root Directory blank is also supported by the root `vercel.json`. In that mode, keep the output directory as `frontend/dist`; do not mix that value into a project whose Root Directory is already `frontend`.

After Vercel has its final production URL, copy that exact `https://...vercel.app` origin into Render's `CLIENT_ORIGIN` and redeploy the API. Multiple fixed origins can be comma-separated.

### Production smoke check

1. Open `<render-url>/health`; it must return `{"status":"healthy","database":"connected"}`.
2. Open the Vercel site and create an account or sign in.
3. In browser DevTools, confirm API requests go to the Render URL, never `localhost:5000`.
4. Refresh a nested workspace or board URL; Vercel should still render the app instead of returning 404.

## Verification

```powershell
npm.cmd test
npm.cmd run lint:web
npm.cmd run build:web
Get-ChildItem backend/src -Filter *.js | ForEach-Object { node --check $_.FullName }
```

## Workflow

Tasks move between Backlog, To do, In progress, Review, and Done. Reordering is optimistic in the UI and persisted by the API. If tasks were added or removed elsewhere, stale moves are rejected and the current board is restored. Workspace admins can also manage membership; removing a member safely unassigns their existing tasks.
