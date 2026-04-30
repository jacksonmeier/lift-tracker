# Lift Tracker

A personal workout tracker. Static site, no backend, no account. All data lives
in `localStorage` on the device you used to log it.

Built with Vite + React + TypeScript, Tailwind CSS, Recharts, React Router.
Deploys to GitHub Pages.

## Features

- **Lifts** — manage a catalog of lifts grouped by category.
- **Workouts** — start/finish a session, add exercises, log sets (weight, reps,
  warmup, done). Mobile-first; numeric keyboards on weight/reps fields.
- **Progress** — per-lift charts: top working-set weight, estimated 1RM (Epley),
  weekly volume, and a PR table. Filter by 4 weeks / 12 weeks / all time.
- **Backup** — export current data as JSON; import to restore or move to another
  device.

## Run locally

```bash
npm install
npm run dev          # http://localhost:5173/lift-tracker/
npm run dev -- --host  # also expose to LAN for phone testing
```

Other scripts:

```bash
npm run typecheck    # tsc -b --noEmit
npm run build        # type-check + production build into dist/
npm run preview      # serve the built dist/ locally
```

## Deploy to GitHub Pages

1. Push to GitHub. The repo name should match the `base` in `vite.config.ts`
   (currently `/lift-tracker/`). Change both if you fork or rename.
2. In the repo on GitHub: **Settings → Pages → Build and deployment → Source:
   GitHub Actions**.
3. Push to `main`. The `Deploy to GitHub Pages` workflow at
   `.github/workflows/deploy.yml` builds with `npm ci && npm run build` and
   publishes `dist/`. The first deploy takes a couple of minutes; subsequent
   pushes deploy automatically.
4. The site lives at `https://<user>.github.io/lift-tracker/`.

A `public/404.html` ships alongside the build so deep-link refreshes
(e.g., `…/lift-tracker/progress`) bounce through to the SPA correctly.

## How export/import sync works

There is no server. Every device keeps its own state in `localStorage` under
the key `lift-tracker-data`. To move data between devices (or back it up):

1. **Settings → Export workouts.json** on the source device. The browser
   downloads the file.
2. Transfer the file to the target device (AirDrop, email, cloud drive — any
   way you'd move a file).
3. **Settings → Import workouts.json** on the target device, pick the file,
   and confirm. Import **replaces** the current state on that device — it does
   not merge.

The exported file is a plain JSON document with `schemaVersion: 1`, an array
of `lifts`, and an array of `workouts`. Hand-editable if you ever need to.
