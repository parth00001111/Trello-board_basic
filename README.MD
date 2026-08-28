# TaskFlow

TaskFlow is a responsive Trello-style project workspace built with React, Express, and MongoDB. It includes secure cookie authentication, organizations, team members, boards, task CRUD, and persisted drag-and-drop across a five-stage workflow.

## Local setup

Requirements: Node.js 20.19+ (or 22.12+) and a MongoDB connection string.

1. Copy `.env.example` to `.env` and fill in `MONGO_URI` and a long random `JWT_SECRET`.
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

## Verification

```powershell
npm.cmd run lint:web
npm.cmd run build:web
Get-ChildItem backend/src -Filter *.js | ForEach-Object { node --check $_.FullName }
```

## Workflow

Tasks move between Backlog, To do, In progress, Review, and Done. Reordering is optimistic in the UI and persisted by the API; stale concurrent moves are detected and refreshed.
