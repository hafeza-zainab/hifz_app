# Maintenance Guide

This guide explains how to safely add new features and components without breaking the project architecture.

## Architecture Principles

### Frontend
- **Feature-based organization**: Each feature has its own folder under `frontend/src/features/`
- **Shared resources**: Common components, contexts, services, and utilities go in `frontend/src/shared/`
- **Context API**: Use for global state (Auth, App, Tour)
- **Custom hooks**: Use for feature-specific state logic
- **API services**: Centralized in `frontend/src/shared/services/`

### Backend
- **Layered architecture**: Controller → Repository → Database
- **Module-based**: Each feature is a module under `backend/modules/`
- **Repositories**: Data access only, no business logic
- **Controllers**: Request handling, validation, response formatting
- **Services**: Business logic (if complex)

---

## Adding a Feature

### Frontend Feature

1. **Create feature folder**:
   ```
   frontend/src/features/your-feature/
   ├── pages/
   ├── components/
   ├── hooks/
   └── index.js
   ```

2. **Create page component**:
   ```jsx
   // frontend/src/features/your-feature/pages/YourFeaturePage.jsx
   /**
    * Feature: Your Feature
    * Purpose: Brief description
    * Features: Key features
    */
   import React from 'react';
   
   export default function YourFeaturePage() {
     return <div>Your Feature</div>;
   }
   ```

3. **Add route** in `frontend/src/App.js`:
   ```jsx
   const YourFeaturePage = lazy(() => import('./features/your-feature/pages/YourFeaturePage'));
   
   // In routes:
   <Route path="/your-feature" element={<ProtectedRoute><YourFeaturePage /></ProtectedRoute>} />
   ```

4. **Add CSS** in `frontend/src/styles/YourFeature.css`

5. **Import CSS** in `frontend/src/index.js`

### Backend Feature

1. **Create module folder**:
   ```
   backend/modules/your-feature/
   ├── your-feature.controller.js
   ├── your-feature.routes.js
   └── your-feature.repository.js
   ```

2. **Create repository**:
   ```javascript
   // backend/modules/your-feature/your-feature.repository.js
   /**
    * Repository: Your Feature
    * Purpose: Data access for your feature
    */
   const db = require("../../config/database");
   
   const getItems = () => db.all("SELECT * FROM your_table");
   
   module.exports = { getItems };
   ```

3. **Create controller**:
   ```javascript
   // backend/modules/your-feature/your-feature.controller.js
   /**
    * Controller: Your Feature
    * Purpose: Request handling for your feature
    */
   const repo = require("./your-feature.repository");
   const { formatSuccess, formatError } = require("../../utils/responseFormatter");
   
   const getItems = (req, res) => {
     try {
       const items = repo.getItems();
       res.json(formatSuccess(items));
     } catch (error) {
       res.status(500).json(formatError(error.message));
     }
   };
   
   module.exports = { getItems };
   ```

4. **Create routes**:
   ```javascript
   // backend/modules/your-feature/your-feature.routes.js
   /**
    * Routes: Your Feature
    * Purpose: Route definitions for your feature
    */
   const router = require("express").Router();
   const controller = require("./your-feature.controller");
   const authMiddleware = require("../../middleware/authMiddleware");
   
   router.get("/", authMiddleware, controller.getItems);
   
   module.exports = router;
   ```

5. **Register routes** in `backend/server.js`:
   ```javascript
   const yourFeatureRoutes = require("./modules/your-feature/your-feature.routes");
   app.use("/api/your-feature", yourFeatureRoutes);
   ```

---

## Adding an API Endpoint

### Backend

1. **Add repository method** (if new data access needed):
   ```javascript
   const getItemById = (id) => db.get("SELECT * FROM table WHERE id = ?", [id]);
   ```

2. **Add controller method**:
   ```javascript
   const getItemById = (req, res) => {
     const { id } = req.params;
     try {
       const item = repo.getItemById(id);
       if (!item) {
         return res.status(404).json(formatError("Item not found", 404));
       }
       res.json(formatSuccess(item));
     } catch (error) {
       res.status(500).json(formatError(error.message));
     }
   };
   ```

3. **Add route**:
   ```javascript
   router.get("/:id", authMiddleware, controller.getItemById);
   ```

### Frontend

1. **Add API service method**:
   ```javascript
   // frontend/src/shared/services/yourApi.js
   export const getItemById = async (id) => {
     const res = await authFetch(`/your-feature/${id}`, {}, 'getItemById');
     return res?.data;
   };
   ```

2. **Use in component**:
   ```jsx
   import { getItemById } from '../../shared/services/yourApi';
   
   const { data } = await getItemById(id);
   ```

---

## Adding a Database Table

1. **Create migration**:
   ```sql
   -- backend/database/migrations/004_add_your_table.sql
   CREATE TABLE IF NOT EXISTS your_table (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     user_id INTEGER NOT NULL,
     name TEXT NOT NULL,
     created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
     FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
   );
   
   CREATE INDEX IF NOT EXISTS idx_your_table_user ON your_table(user_id);
   ```

2. **Add repository methods**:
   ```javascript
   const createItem = (userId, name) =>
     db.run("INSERT INTO your_table (user_id, name) VALUES (?, ?)", [userId, name]);
   
   const getItemsByUser = (userId) =>
     db.all("SELECT * FROM your_table WHERE user_id = ?", [userId]);
   ```

3. **Run migration**:
   ```bash
   cd backend
   node scripts/maintenance/setup.js
   ```

---

## Adding a Prompt

1. **Create prompt file**:
   ```javascript
   // backend/modules/coach/prompts/yourFeature.prompt.js
   module.exports = `
   You are an AI assistant for Quran memorization.
   
   Your task is to [describe task].
   
   Guidelines:
   - [guideline 1]
   - [guideline 2]
   `;
   ```

2. **Import in promptBuilder**:
   ```javascript
   const YOUR_FEATURE_PROMPT = require("./prompts/yourFeature.prompt");
   ```

3. **Add to buildSystemPrompt**:
   ```javascript
   if (state === "your_feature") {
     activeModule = YOUR_FEATURE_PROMPT;
     moduleName = "YOUR_FEATURE";
   }
   ```

4. **Export**:
   ```javascript
   module.exports = {
     buildSystemPrompt,
     // ... existing exports
     YOUR_FEATURE_PROMPT,
   };
   ```

---

## Adding a Script

1. **Create script file**:
   ```javascript
   // backend/scripts/maintenance/yourScript.js
   /**
    * Purpose: Brief description
    * Usage: node scripts/maintenance/yourScript.js
    */
   "use strict";
   
   const db = require("../../config/database");
   
   async function main() {
     console.log("Starting script...");
     // Your logic here
     console.log("Script completed.");
   }
   
   main().catch(console.error);
   ```

2. **Add to package.json** (if needed):
   ```json
   "scripts": {
     "your:script": "node scripts/maintenance/yourScript.js"
   }
   ```

3. **Document in scripts/README.md**

---

## Adding a Page

1. **Create page component** in `frontend/src/features/your-feature/pages/`
2. **Add lazy import** in `frontend/src/App.js`
3. **Add route** in `frontend/src/App.js`
4. **Add CSS** in `frontend/src/styles/`
5. **Import CSS** in `frontend/src/index.js`

---

## Adding a Service

### Backend Service (for complex business logic)

1. **Create service file**:
   ```javascript
   // backend/modules/your-feature/your-feature.service.js
   /**
    * Service: Your Feature
    * Purpose: Business logic for your feature
    */
   const repo = require("./your-feature.repository");
   
   const processItem = async (data) => {
     // Complex business logic here
     const result = repo.createItem(data.userId, data.name);
     return result;
   };
   
   module.exports = { processItem };
   ```

2. **Use in controller**:
   ```javascript
   const service = require("./your-feature.service");
   
   const createItem = async (req, res) => {
     try {
       const result = await service.processItem(req.body);
       res.json(formatSuccess(result));
     } catch (error) {
       res.status(500).json(formatError(error.message));
     }
   };
   ```

### Frontend Service (API calls)

1. **Create service file** in `frontend/src/shared/services/`
2. **Use authFetch for authenticated calls**
3. **Use publicFetch for public calls**
4. **Return unwrapped data for convenience**

---

## Adding a Repository

1. **Create repository file** in `backend/repositories/` or `backend/modules/your-feature/`
2. **Use parameterized queries only** (no SQL injection risk)
3. **Keep methods simple** (data access only)
4. **Add comments for complex queries**

Example:
```javascript
const db = require("../config/database");

const getItem = (id) => db.get("SELECT * FROM table WHERE id = ?", [id]);
const getItems = () => db.all("SELECT * FROM table");
const createItem = (data) => db.run("INSERT INTO table (col1, col2) VALUES (?, ?)", [data.col1, data.col2]);

module.exports = { getItem, getItems, createItem };
```

---

## Common Patterns

### Error Handling
```javascript
try {
  const result = await someOperation();
  res.json(formatSuccess(result));
} catch (error) {
  res.status(500).json(formatError(error.message));
}
```

### Authentication
```javascript
const authMiddleware = require("../../middleware/authMiddleware");
router.get("/protected", authMiddleware, controller.method);
```

### Validation
```javascript
const { validateRequest } = require("../../middleware/validate");
router.post("/", validateRequest(yourSchema), controller.method);
```

### Context Usage
```javascript
const { user } = useAuthContext();
const { results, setResults } = useAppContext();
```

### API Call
```javascript
const data = await authFetch('/api/endpoint', { method: 'POST', body: JSON.stringify(payload) }, 'operationName');
```

---

## What to Avoid

### Don't
- Put business logic in repositories
- Put data access in controllers
- Mix concerns (e.g., UI logic in services)
- Use string concatenation in SQL queries
- Hardcode API URLs
- Skip error handling
- Forget to add header comments
- Break the folder structure

### Do
- Keep controllers thin
- Keep repositories simple
- Use services for complex logic
- Use parameterized queries
- Use environment variables
- Handle errors gracefully
- Add header comments
- Follow existing patterns

---

## Testing Your Changes

1. **Frontend**:
   - Start dev server: `npm run frontend`
   - Test in browser
   - Check console for errors
   - Test on mobile viewport

2. **Backend**:
   - Start dev server: `npm run backend:dev`
   - Test endpoints with Postman/curl
   - Check server logs
   - Test authentication

3. **Integration**:
   - Test full user flows
   - Test error states
   - Test loading states
   - Test with different user roles

---

## Code Review Checklist

- [ ] Header comment added
- [ ] Follows existing patterns
- [ ] No hardcoded values
- [ ] Error handling implemented
- [ ] No console.log in production code
- [ ] SQL queries use parameters
- [ ] Environment variables used
- [ ] File follows naming conventions
- [ ] Folder structure respected
- [ ] No breaking changes
