# System Architecture

## Overview

Quran Similarity App is a React + Express application backed by SQLite.

- `frontend/` contains the React app.
- `backend/` contains the Express API, database access, migrations, seed/import scripts, and local data files.
- `backend/data/` contains runtime or imported data. Treat SQLite sidecar files (`*.db-wal`, `*.db-shm`) as generated files.

## Backend Layout

```text
backend/
  server.js                  Express app entry point
  config/                    Shared configuration and database connection
  database/
    schema.sql               Base schema
    migrations/              Incremental SQL migrations
  middleware/                Cross-cutting Express middleware
  modules/                   Feature modules
    auth/
    ayah/
    similarity/
    diary/
    analytics/
    tasks/
    themes/
    coach/
  scripts/                   Setup, import, generation, and debug scripts
  utils/                     Shared backend helpers
```

Each backend feature module generally follows this pattern:

- `*.routes.js` defines API endpoints.
- `*.controller.js` handles request/response work.
- `*.model.js`, `*.repository.js`, or `*.service.js` owns database and business logic.

## Frontend Layout

```text
frontend/src/
  App.js                     Route tree and app providers
  index.js                   React entry point and global style imports
  features/                  Page-level product areas
    auth/
    similarity/
    diary/
    flashcards/
    analytics/
    coach/
    tasks/
  shared/
    components/              Reusable UI components
    context/                 React providers
    services/                API clients
    utils/                   Shared calculations/constants
  styles/                    Global and feature CSS files
```

Prefer placing new UI close to the feature that owns it. Move a component into `shared/components/` only when more than one feature uses it.

## Runtime Flow

1. React calls API helpers in `frontend/src/shared/services/`.
2. API requests hit `backend/server.js` routes under `/api/...`.
3. Route files delegate to controllers.
4. Controllers call models, repositories, or services.
5. Database access reads from `backend/data/quran.db`.

## Setup Flow

From the project root:

```bash
npm run backend:setup
npm run backend:dev
npm run frontend
```

Run the frontend and backend in separate terminals.
