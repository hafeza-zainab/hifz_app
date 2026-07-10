C:\quran-similarity-app\backend\scripts\maintenance\MIGRATION README.md
# Sky-Only Theme Migration

This package contains all updated files for reducing the app from a
5-theme architecture (forest, sky, mountain, oasis, ship) to Sky only.

---

## Deployment Order

**Run this before deploying new code — data first, then code.**

```bash
# 1. Preview what will change (no writes)
node scripts/maintenance/migrateToSkyOnly.js --dry-run

# 2. Run the migration
node scripts/maintenance/migrateToSkyOnly.js --yes

# 3. Deploy updated files (see below)
```

---

## Files to Replace

Copy each file from this package over its counterpart in the repo.

### Backend

| File | What Changed |
|---|---|
| `repositories/theme.repository.js` | `VALID_THEMES` reduced to `Set(["sky"])`; `getActive` and `getAll` now filter on `theme_id = 'sky'` to guard against legacy rows; `incrementStreak` update query also pins to `theme_id = 'sky'` |
| `scripts/maintenance/seedDemoThemes.js` | `ALL_THEMES` reduced to `["sky"]` |
| `scripts/maintenance/migrateToSkyOnly.js` | **NEW** — one-time DB migration (see above) |

### Frontend

| File | What Changed |
|---|---|
| `scenes/index.js` | Already correct — no change needed |
| `ImmersiveView.jsx` | No logic change; comment added noting sky-only fallback |
| `ImmersiveView.css` (component-level) | Removed Forest/Ship/Garden `@keyframes`; deduplicated `bird-fly`; kept all Sky animations |
| `src/styles/ImmersiveView.css` (global) | Same cleanup as above; merged duplicate `window-flicker` into a single canonical rule using `--base-opacity` CSS var |
| `utils/sceneHelpers.js` | Removed: `generateForestPlants`, `generateForestTrees`, `generateForestAnimals`, `generateLakeElements`, `generateTreeOfLife`, `generateForestEnvironment`, `getBaseForestLayers`, `generateConstellation` (singular draft). Kept all Sky helpers. |
| `utils/canvasUtils.js` | Removed: `drawClassicPalm`, `drawOasisPalm`, `drawPalm` (export), `drawFishShape`. Kept all Sky-compatible utilities. |

---

## Files to Delete from the Repo

```
scenes/Forest.js
scenes/Mountain.js
scenes/Oasis.js
scenes/Ship.js
modules/themes/theme.model.js   ← already deprecated; now fully redundant
```

---

## File NOT Included — Action Required

### `src/utils/themeRegistry.js`

This file was not in the provided codebase but is imported by `ImmersiveView.jsx`:

```js
import { getTheme, resolveThemeId } from '../../utils/themeRegistry';
```

You must update it manually:

1. Remove metadata entries for `forest`, `mountain`, `oasis`, `ship`.
2. Keep only the `sky` entry.
3. Update `resolveThemeId` to always return `'sky'` (or just pass through, since
   `ImmersiveView` already falls back to `SCENES.sky` for unknown IDs).

Example of what to remove:

```js
// DELETE these from the registry map:
forest:   { name: 'Forest',   icon: '🌲', tagline: '...', milestones: [...] },
mountain: { name: 'Mountain', icon: '⛰️', tagline: '...', milestones: [...] },
oasis:    { name: 'Oasis',    icon: '🌴', tagline: '...', milestones: [...] },
ship:     { name: 'Ship',     icon: '⛵', tagline: '...', milestones: [...] },

// KEEP:
sky: { name: 'Celestial Sky', icon: '✨', tagline: '...', milestones: [...] },
```

---

## Files Unchanged (no action needed)

| File | Reason |
|---|---|
| `modules/themes/theme.controller.js` | Delegates to `VALID_THEMES` — auto-correct once repo updated |
| `modules/themes/theme.routes.js` | Route definitions are theme-agnostic |
| `services/themeApi.js` | API plumbing; no theme names hardcoded |
| `scripts/debug/checkStreakData.js` | Reads DB generically |
| `scripts/maintenance/populateDemo.js` | Populates `diary_logs`, not `user_themes` |
| `styles/ThemeBanner.css` | Generic UI styles; no theme names |
| `styles/ThemeSelector.css` | Generic UI styles; no theme names |
| `styles/StreakBanner.css` | Generic UI styles; no theme names |

---

## What the Migration Script Does

`migrateToSkyOnly.js` is idempotent and transactional:

1. Counts and deletes all `user_themes` rows where `theme_id != 'sky'`.
2. For each user that had any theme row:
   - If they already have a `sky` row → ensures `is_active = 1`.
   - If they have no `sky` row → inserts one with `streak = 0`.
3. Verifies zero non-sky rows remain.
4. Rolls back the entire transaction on any error.

Users who had a non-sky active theme will land on sky with their
sky streak preserved (or starting fresh at 0 if they never touched sky).

---

## Removed Animations Summary

The following `@keyframes` were removed from both CSS files as they
belonged exclusively to deleted themes:

**Forest:** `plant-grow`, `tree-appear`, `fruit-sway`, `lily-float`,
`ripple-expand`, `lake-shimmer`, `canopy-pulse`, `leaf-fall`,
`ray-drift`, `fog-drift`, `animal-idle-0` through `animal-idle-5`,
`petal-drift`, `particle-float`, `legendary-sky-pulse`

**Ship:** `flag-wave`, `wave-drift`

**Garden (unused theme):** `garden-sway`, `butterfly-path`

**Oasis/Garden:** `fountain-spray`

**Kept for Sky:** `star-twinkle`, `stars-subtle-twinkle`, `star-pulse`,
`star-appear`, `shooting-star`, `shooting-star-move`, `constellation-draw`,
`aurora-flow`, `aurora-flow-2`, `aurora-pulse`, `nebula-drift`,
`nebula-breathe`, `galaxy-rotate`, `moon-ring-pulse`, `firefly-float`,
`lantern-sway`, `pool-shimmer`, `window-flicker`, `bird-fly`