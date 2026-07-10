# Request Life Cycle

## Frontend Request Life Cycle

### API Request
```
1. User action (button click, form submit)
2. Component calls API service function
3. Service calls authFetch()
4. authFetch adds JWT token to headers
5. fetch() sends HTTP request
6. Response received
7. authFetch handles 401 (auto-logout)
8. Response parsed
9. Service returns data to component
10. Component updates state/context
11. Re-render with new data
```

### Navigation Request
```
1. User clicks link or programmatic navigate
2. React Router matches route
3. Lazy-loaded component loads
4. Suspense shows fallback if loading
5. Component mounts
6. useEffect hooks run
7. Data fetched if needed
8. Component renders
```

## Backend Request Life Cycle

### API Request
```
1. HTTP request received
2. Morgan logs request
3. CORS middleware checks origin
4. Helmet sets security headers
5. Rate limiter checks limits
6. Auth middleware verifies JWT (if protected)
7. Router matches route
8. Controller method executes
9. Repository queries database (if needed)
10. Database returns data
11. Controller formats response
12. Error handler catches errors
13. Response sent with status code
14. Morgan logs response
```

### AI Request
```
1. Coach request received
2. Controller validates request
3. Prompt builder constructs prompt
4. Context data injected
5. Anthropic API called
6. Rate limiter checks limits
7. AI processes request
8. Response received
9. Response parsed
10. Data extracted
11. Response formatted
12. Sent to frontend
```

## Error Handling Flow

### Frontend Error
```
1. API call fails
2. authFetch catches error
3. Error returned to service
4. Service returns error to component
5. Component displays error message
6. User can retry or cancel
```

### Backend Error
```
1. Error occurs in controller/repository
2. Error handler middleware catches
3. Error logged
4. Appropriate status code set
5. Error message formatted
6. Response sent to frontend
```

### 401 Unauthorized
```
1. Request with invalid/expired token
2. Auth middleware rejects
3. 401 response sent
4. Frontend authFetch detects 401
5. AuthContext.logout() called
6. Token cleared
7. User redirected to login
```
