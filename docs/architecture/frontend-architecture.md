# Frontend Architecture

## Overview
React SPA with React Router for navigation, Context API for state management, and modular feature-based organization.

## Technology Stack
- **Framework**: React 19.2.5
- **Router**: React Router DOM 7.14.1
- **Build**: Create React App (react-scripts 5.0.1)
- **Charts**: Recharts 3.8.1
- **HTTP**: Custom authFetch wrapper

## Folder Structure
```
frontend/src/
├── App.js                 # Main app with routes and providers
├── index.js              # Entry point
├── components/           # Root-level components (TourBanner, Walkthrough)
├── features/             # Feature modules
│   ├── auth/            # Authentication pages
│   ├── similarity/      # Similarity search
│   ├── diary/           # Diary entries
│   ├── flashcards/      # Flashcard system
│   ├── coach/           # AI coach
│   ├── scheduler/       # Time management
│   └── analytics/       # Performance analytics
├── shared/              # Shared resources
│   ├── components/      # Reusable components (Navbar, ThemeBanner)
│   ├── context/         # React contexts (Auth, App, Tour)
│   ├── services/        # API service modules
│   └── utils/           # Utility functions
└── styles/              # CSS files
```

## Key Patterns

### State Management
- **AuthContext**: User authentication state, token management
- **AppContext**: Shared similarity search state
- **TourContext**: Onboarding tour state
- Local hooks for feature-specific state (useCoachStateMachine, diary form hooks)

### Routing
- Lazy loading with React.lazy() for all page routes
- ProtectedRoute wrapper for authenticated routes
- Auto-search navigation from Coach to Similarity

### API Layer
- Centralized authFetch wrapper in shared/services/http.js
- Feature-specific API modules (authApi, similarityApi, diaryApi, etc.)
- Automatic token injection and 401 handling

### Component Organization
- Feature-based folder structure
- Components grouped by feature
- Shared components in shared/components/
- Page components in features/*/pages/

## Data Flow
```
User Action → Component → Context/State → API Service → Backend → Context Update → Re-render
```

## Performance Optimizations
- Route lazy loading (8 routes)
- Feature-level code splitting (ImmersiveView, SequenceFlowchart)
- Context provider memoization
- API response caching (fetchSurahs)
