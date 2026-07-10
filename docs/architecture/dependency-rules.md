# Dependency Rules

## Frontend Dependency Rules

### Allowed Dependencies
- **Components** → Contexts, Hooks, Services, Utils
- **Services** → HTTP client only
- **Contexts** → No dependencies (except React)
- **Utils** → No dependencies (pure functions)
- **Hooks** → Contexts, Services, Utils

### Forbidden Dependencies
- **Services** → Components (no UI in services)
- **Utils** → Contexts (no state in utils)
- **Contexts** → Services (use hooks instead)
- **Features** → Other features (use shared/ instead)

### Import Direction
```
features/ → shared/
components/ → shared/
shared/ → No external dependencies
```

## Backend Dependency Rules

### Allowed Dependencies
- **Controllers** → Repositories, Services, Utils
- **Repositories** → Database only
- **Services** → Repositories, External APIs
- **Middleware** → No business logic dependencies
- **Modules** → Can depend on repositories, utils

### Forbidden Dependencies
- **Repositories** → Controllers (circular dependency)
- **Controllers** → Other controllers (use services)
- **Modules** → Other modules (use shared utils)

### Import Direction
```
modules/ → repositories/
modules/ → utils/
repositories/ → database/
utils/ → No external dependencies
```

## Cross-Boundary Rules

### Frontend → Backend
- Only via HTTP API (authFetch)
- No direct database access
- No shared code

### Backend → Frontend
- No dependencies
- Only via API responses
- No shared state

## Circular Dependency Prevention
- Use dependency injection
- Use event emitters for cross-module communication
- Shared services in utils/ or services/
