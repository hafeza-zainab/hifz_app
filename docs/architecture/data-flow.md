# Data Flow

## Frontend Data Flow

### Authentication Flow
```
User enters credentials
  → LoginPage component
  → authApi.loginUser()
  → POST /api/auth/login
  → Backend validates
  → Returns JWT token
  → AuthContext stores token
  → localStorage persists token
  → Redirect to protected route
```

### Similarity Search Flow
```
User selects Surah/Ayah
  → SearchBar component
  → AppContext.setSourceAyah()
  → similarityApi.fetchSimilarities()
  → GET /api/similarity?surah=X&ayah=Y
  → Backend queries database
  → Returns similar verses
  → AppContext.setResults()
  → SimilarityList renders results
  → User clicks result
  → SidePanel opens
  → AI tip generates (if first visit)
  → Tip saved to user_tips
```

### Diary Entry Flow
```
User selects entry type
  → DiaryPage component
  → Form component (e.g., MurajahForm)
  → User fills form
  → diaryApi.createEntry()
  → POST /api/diary/murajah
  → Backend validates and saves
  → Returns success
  → DiaryPage refreshes timeline
  → Streak updates
```

### Coach Chat Flow
```
User sends message
  → CoachPage component
  → useCoachChat hook
  → coachApi.sendChat()
  → POST /api/coach/chat
  → Backend constructs prompt
  → Calls Anthropic API
  → Returns AI response
  → CoachPage displays response
```

## Backend Data Flow

### Request Processing
```
HTTP Request
  → Express middleware (CORS, helmet, rate limiter)
  → Auth middleware (if protected route)
  → Route handler
  → Controller
  → Repository (if DB operation)
  → Database
  → Repository returns data
  → Controller formats response
  → Response sent
```

### AI Request Flow
```
Coach request
  → Controller
  → Prompt builder
  → Constructs context-aware prompt
  → Anthropic API call
  → AI response
  → Parse response
  → Return to frontend
```

## State Management Flow

### Context Updates
```
Component dispatches action
  → Context provider
  → State update
  → Re-render consumers
  → UI updates
```

### Local Storage
```
AuthContext
  → Token stored on login
  → Token removed on logout
  → Token loaded on app start

TourContext
  → Completion flag stored
  → Flag checked on app start
  → Auto-start tour if not completed
```
