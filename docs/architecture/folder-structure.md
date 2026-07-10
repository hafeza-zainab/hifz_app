# Folder Structure

## Project Root
```
quran-similarity-app/
├── frontend/             # React SPA
├── backend/              # Express API
├── docs/                 # Documentation
└── node_modules/         # Dependencies
```

## Frontend Structure
```
frontend/
├── public/               # Static assets
├── src/
│   ├── components/       # Root-level components
│   ├── features/         # Feature modules
│   │   ├── auth/
│   │   ├── similarity/
│   │   ├── diary/
│   │   ├── flashcards/
│   │   ├── coach/
│   │   ├── scheduler/
│   │   └── analytics/
│   ├── shared/           # Shared resources
│   │   ├── components/
│   │   ├── context/
│   │   ├── services/
│   │   └── utils/
│   ├── styles/           # CSS files
│   ├── data/             # Static data
│   ├── App.js            # Main app
│   └── index.js          # Entry point
├── package.json
└── README.md
```

## Backend Structure
```
backend/
├── data/                 # SQLite database
├── database/             # Schema and migrations
│   ├── schema.sql
│   └── migrations/
├── modules/              # Feature modules
│   ├── auth/
│   ├── ayah/
│   ├── diary/
│   ├── coach/
│   ├── scheduler/
│   ├── flashcard/
│   ├── analytics/
│   └── theme/
├── repositories/         # Data access layer
├── middleware/           # Express middleware
├── config/               # Configuration
├── scripts/              # Database scripts
│   ├── maintenance/
│   ├── import/
│   └── debug/
├── server.js             # Entry point
├── package.json
└── README.md
```

## Documentation Structure
```
docs/
├── architecture/         # Architecture docs
├── 01-*.md               # Phase 1 docs
├── 02-*.md               # Phase 2 docs
├── ...
└── 19-*.md               # Phase 9 docs
```

## Organizational Principles
1. **Feature-based**: Frontend features organized by domain
2. **Layered**: Backend follows controller/repository pattern
3. **Shared**: Common resources in shared/ folder
4. **Separated**: Frontend and backend are separate applications
