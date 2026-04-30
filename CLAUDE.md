# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install
npm run dev              # http://localhost:5173/lift-tracker/
npm run dev -- --host    # also expose on the LAN for phone testing
npm run typecheck        # tsc -b --noEmit
npm run build            # tsc -b && vite build → dist/
npm run preview          # serve dist/ locally
```

There are no tests. No linter is wired up; `tsc -b --noEmit` (strict mode + `noUnusedLocals`/`noUnusedParameters`) is the only static check.

## Architecture

Personal workout tracker. Static SPA, no backend. Vite + React 18 + TypeScript + Tailwind v4 + Recharts + React Router. Deployed to GitHub Pages via `.github/workflows/deploy.yml`.

### Data flow — single source of truth

- **`src/types.ts`** is the source of truth for the data model. `AppState = { lifts, workouts, schemaVersion: 1 }`. Every other module imports from here.
- **`src/storage.ts`** is the *only* module that touches `localStorage` (key: `lift-tracker-data`). It also owns `exportJSON` / `importJSON` and the shallow schema validator (`isAppState`).
- **`src/context/AppContext.tsx`** is the *only* path to dispatch state changes. Components consume `useApp()` which returns `{ state, actions }`. `actions` wraps `dispatch` so callers don't construct action objects directly. The reducer stays pure — IDs (`uuid()`) and timestamps are generated in action creators and passed in.
- **Hydration & persistence:** state is loaded synchronously via `useReducer(reducer, undefined, load)`. A `useEffect` saves on every state change, including the first render — that idempotent first save is intentional. The earlier "dispatch HYDRATE in `useEffect`" pattern lost data under StrictMode because the save effect ran with the still-empty initial state. Don't reintroduce that race.
- **Orphan tolerance:** deleting a lift does not cascade. Old workouts keep the orphan `liftId`. Renderers must handle missing lifts gracefully (e.g., "Unknown lift" in `ExerciseCard`). Charts derive only from `workingSetsForLift` which already filters by `liftId`, so deleted lifts disappear from `/progress` automatically.

### Stats & charts

- **`src/lib/stats.ts`** — pure functions. All helpers accept an optional `since?: string` (ISO) for the `/progress` date-range filter. The PR scan uses strict `>` for "exceeds all previous." A "working set" is `!isWarmup && weight > 0 && reps > 0` — `set.completed` is **not** part of that filter.
- **`/progress` is lazy-loaded** in `src/App.tsx` via `React.lazy(() => import('./pages/Progress'))`. Recharts is the bulk of the bundle (~108 KB gzipped); keeping it off the gym-path is intentional. Don't import from `pages/Progress` or `recharts` outside that lazy chunk.

### Mobile-first UI

- Design target: 375px width, ≥44px tap targets (`min-h-11`).
- Numeric inputs use `inputMode="decimal"` (weight) / `inputMode="numeric"` (reps) on a `type="text"` input. The `NumericField` component keeps a *local* string mirror so trailing dots and partial decimals don't get clobbered while typing; it commits the parsed number to context on every keystroke (matches "persist on every edit").
- Native `<input type="date">` is used for the workout date picker. Round-trip through `isoToLocalDateInput` / `dateInputToIso` in `src/pages/Workout.tsx` preserves the original local time-of-day, so re-dating a workout doesn't reset the timestamp to midnight or shift the day across UTC.
- Completed workouts render the same `Workout` page in read-only mode (inputs disabled, Remove/Add hidden). The date picker is editable in both states by design — it's the one field worth fixing after-the-fact.

### Tailwind v4

No `tailwind.config.js`, no `postcss.config.js` — that's the v4 setup, not missing files. Configuration would go in `src/index.css` via `@theme {}` blocks if needed; currently just `@import "tailwindcss";`.

### GitHub Pages deploy

- **`vite.config.ts`** sets `base: '/lift-tracker/'`. This must match the repo name. `BrowserRouter` uses `basename={import.meta.env.BASE_URL}` to inherit it, so links work in both dev and prod without conditionals. If forking/renaming, update the base.
- **SPA deep-link refresh** is handled by the `public/404.html` redirect shim and a matching unfurl script in `index.html`. GitHub Pages returns `404.html` (with HTTP 404) for any unknown path; the shim rewrites the path into a query string and bounces to `index.html`, where the unfurl script restores the path via `history.replaceState` *before* React mounts. `pathSegmentsToKeep = 1` in `404.html` corresponds to the `/lift-tracker/` base segment — leave at 1 for any project page; set to 0 for a user/org root site.
- **`<meta http-equiv="Cache-Control" content="no-cache">`** in `index.html` is intentional. GitHub Pages serves `index.html` with `max-age=600` by default, which left home-screen-shortcut Chrome instances on stale HTML for ~10 min after each deploy. Asset URLs are content-hashed, so disabling the cache only on `index.html` costs ~1 KB per load.
- **Workflow** at `.github/workflows/deploy.yml` builds with `npm ci && npm run build` and publishes via `actions/deploy-pages@v4`. The `pages: write` and `id-token: write` permissions are required; first-time setup also needs **Settings → Pages → Source: GitHub Actions** in the repo (the workflow can't enable Pages itself).

### UUID polyfill

`src/lib/uuid.ts` wraps `crypto.randomUUID()` with a `crypto.getRandomValues()`-based RFC 4122 v4 fallback. `crypto.randomUUID()` requires a secure context — it works on `localhost` and HTTPS, but **not** on plain-HTTP LAN IPs (e.g. `192.168.x.x:5173` when running `npm run dev -- --host` for phone testing). All ID-generating action creators in `AppContext` call `uuid()`, never `crypto.randomUUID` directly.

### Sync model

There is none. Each device stores its own state in `localStorage`. Cross-device "sync" is manual: **Settings → Export workouts.json** on the source, transfer the file, **Settings → Import workouts.json** on the target. Import **replaces** state — there is no merge. The README has the user-facing version of this.
