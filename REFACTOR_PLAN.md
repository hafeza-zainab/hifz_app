
You can put something like this into `REFACTOR_PLAN.md`:

---

# Refactor Progress Log

## Initial State

Project size:

* ~200 files
* React frontend
* Express backend
* Large custom Quran memorization platform
* Features:

  * Similarity database
  * Flashcards
  * Coach AI
  * Analytics
  * Diary tracking
  * Quran quality heatmap
  * Immersive theme system

Before any cleanup:

* Git was not initialized.
* No safe rollback point existed.
* Large files (>1000 lines) existed.
* Unknown dead code and unused files were present.

---

# Phase 1 — Create Recovery Point

Initialized Git repository.

```bash
git init
git add .
git commit -m "initial project snapshot"
```

Result:

* Full project snapshot saved.
* Refactoring can now be reversed safely.

Commit:

```text
0e55f52
initial project snapshot
```

---

# Phase 2 — Dependency Audit

Checked dependencies.

## Root package.json

Verified usage:

### helmet

Used in:

```text
backend/server.js
```

Kept.

### morgan

Used in:

```text
backend/server.js
```

Kept.

### node-fetch

Search results:

```bash
git grep "require('node-fetch')"
git grep 'require("node-fetch")'
git grep "from 'node-fetch'"
git grep 'from "node-fetch"'
```

Returned nothing.

Decision:

```bash
npm uninstall node-fetch
```

Removed safely.

---

# Phase 3 — Dead File Investigation

Ran:

```bash
knip
```

Initial report showed:

* 125 unused files
* Many false positives

Manual verification performed before deletion.

---

# Phase 4 — Script Cleanup

Investigated backend scripts.

Found duplicate files:

```text
check-streak-data.js
checkstreakdata.js
```

Verified:

```bash
git grep "check-streak-data"
git grep "checkstreakdata"
```

Result:

```text
checkstreakdata.js
```

Only acted as wrapper.

Removed:

```text
backend/scripts/checkstreakdata.js
```

Kept:

```text
backend/scripts/check-streak-data.js
```

because package.json references it.

---

# Phase 5 — useCanvaScene Investigation

Found:

```text
useCanvasScene.js
```

referencing:

```text
useCanvaScene.js
```

Search:

```bash
git grep "useCanvasScene"
git grep "useCanvaScene"
```

Result:

* Actual project uses:

```text
useCanvasScene.js
```

* useCanvaScene.js was only legacy compatibility.

Deleted.

Attempted restore:

```bash
git restore ...
git checkout HEAD ...
```

Failed because file never existed in Git snapshot.

Decision:

Keep deleted.

No impact on build.

---

# Phase 6 — Large File Analysis

Measured largest files.

Results:

| File                  | Lines |
| --------------------- | ----: |
| Mountain.js           |  1595 |
| Ship.js               |  1002 |
| CoachPage.jsx         |   690 |
| SequenceFlowchart.jsx |   556 |

Conclusion:

These are future refactor targets.

No changes yet.

---

# Phase 7 — Import Dependency Analysis

Installed:

```bash
npm install -g madge
```

Attempted graph generation:

```bash
madge --image graph.svg frontend/src
madge --image backend.svg backend
```

Failed because:

```text
Graphviz not installed
```

However dependency analysis still completed.

---

# Phase 8 — ImmersiveView Verification

Checked usage.

Searches:

```bash
git grep "ImmersiveView"
git grep "<ImmersiveView"
git grep "themeId="
```

Result:

```text
ThemeBanner
  -> ImmersiveView
```

ImmersiveView is active and required.

Not removable.

---

# Phase 9 — Unused File Verification

Investigated files reported by Knip.

## QuestionEditor.jsx

Referenced in:

```text
REFACTOR_PLAN.md
QuestionEditor.jsx
```

No active imports found.

Candidate for future deletion after manual feature verification.

---

## LoadingSpinner.jsx

Search results:

```bash
git grep "LoadingSpinner"
```

Only component file itself exists.

No component usage.

Deleted.

---

## StreakBanner.jsx

Search results:

```bash
git grep "StreakBanner"
```

Only component file itself exists.

No component usage.

Deleted.

---

## constants.js

Search results:

```bash
git grep "from.*constants"
```

No imports.

Deleted.

---

## ForestSimulation.js

Search results:

```bash
git grep "ForestSimulation"
```

Only file itself.

Deleted.

---

# Phase 10 — Recovery

Accidentally deleted files.

Recovered from Recycle Bin:

```text
ForestSimulation.js
```

Restored successfully.

Current status should be verified before final cleanup.

---

# Phase 11 — Build Verification

Executed:

```bash
cd frontend
npm run build
```

Result:

```text
Build successful
```

Generated production bundle.

No build errors.

Only ESLint warnings remain.

---

# Current ESLint Warnings

## CoachComponents.jsx

```text
Missing dependency:
editVal.length
```

---

## CoachPage.jsx

Unused:

```text
getAuthHeader
HOME_OPTIONS
setSimilarities
setProgress
```

Safe cleanup candidate.

---

## tipParser.js

```text
Unnecessary escape character
```

Safe cleanup candidate.

---

## Forest.js

Unused:

```text
useRef
clamp
lerp
postCount
```

Safe cleanup candidate.

---

## Mountain.js

Three warnings:

```text
missing dependency: canvasRef
```

Requires careful review.

Do not auto-fix.

---

## Ship.js

One warning:

```text
missing dependency: canvasRef
```

Requires careful review.

Do not auto-fix.

---

# Current Project Health

## Build Status

✅ Production build succeeds

## Git Status

✅ Repository initialized

## Backup Status

✅ Safe rollback point exists

## Dependency Status

✅ node-fetch removed

## Dead Code Status

⚠ Some cleanup completed

## Large Files

⚠ Still need decomposition

### Highest Priority Refactor Targets

1. Mountain.js (1595 lines)
2. Ship.js (1002 lines)
3. CoachPage.jsx (690 lines)
4. SequenceFlowchart.jsx (556 lines)

---

# Recommended Next Step

Before any feature work:

1. Commit current state

```bash
git add .
git commit -m "cleanup and dependency audit complete"
```

2. Fix all safe ESLint warnings.

3. Re-run:

```bash
npm run build
npx eslint src --ext .js,.jsx
knip
```

4. Only after warnings are reduced, start AI-assisted decomposition of:

```text
CoachPage.jsx
SequenceFlowchart.jsx
Mountain.js
Ship.js
```

These files represent the highest maintenance risk in the codebase.
