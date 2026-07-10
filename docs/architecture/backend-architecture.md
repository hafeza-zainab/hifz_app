# Backend Architecture

## Overview
Express REST API with SQLite database, modular controller/repository pattern, and AI integration via Anthropic Claude.

## Technology Stack
- **Framework**: Express 4.22.2
- **Database**: SQLite3 6.0.1
- **Auth**: JWT (jsonwebtoken 9.0.3)
- **Security**: Helmet 8.0.0, bcryptjs 3.0.3
- **AI**: Anthropic Claude API (claude-sonnet-4-6)
- **Logging**: Morgan 1.10.0

## Folder Structure
```
backend/
├── server.js              # Express server setup
├── config/               # Configuration
│   └── database.js       # SQLite connection
├── middleware/           # Express middleware
│   ├── authMiddleware.js # JWT verification
│   ├── errorHandler.js   # Error handling
│   ├── rateLimiter.js    # Rate limiting
│   └── validate.js       # Request validation
├── modules/              # Feature modules
│   ├── auth/            # Authentication
│   ├── ayah/            # Quran verse data
│   ├── diary/           # Diary entries
│   ├── coach/           # AI coach
│   ├── scheduler/       # Time management
│   ├── flashcard/       # Flashcards
│   ├── analytics/       # Performance analytics
│   └── theme/           # UI themes
├── repositories/        # Data access layer
├── scripts/             # Database scripts
│   ├── maintenance/     # Setup and migrations
│   ├── import/          # Data import
│   └── debug/           # Debugging utilities
└── data/                # SQLite database file
```

## Key Patterns

### Module Structure
Each module follows controller/repository pattern:
- **Controller**: Request handling, business logic
- **Repository**: Database operations
- **Routes**: Route definitions
- **Service** (optional): Complex business logic

### Authentication
- JWT-based authentication
- Token stored in localStorage (frontend)
- Auth middleware verifies token on protected routes
- Automatic token expiration handling

### AI Integration
- Coach module integrates with Anthropic Claude
- Prompt builder constructs context-aware prompts
- System prompts for different coach capabilities
- Rate limiting for AI endpoints

### Error Handling
- Centralized error handler middleware
- Consistent error response format
- HTTP status codes for different error types

## Data Flow
```
Request → Middleware → Controller → Repository → Database → Response
                ↓
            AI Service (coach module)
```

## Security
- Helmet for HTTP headers
- Rate limiting on all routes
- Password hashing with bcrypt
- JWT token verification
- CORS configuration
