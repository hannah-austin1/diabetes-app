# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Artifacts

### Personal Website (`artifacts/personal-site`)
- **Framework**: Next.js 15 App Router with React Server Components
- **UI library**: shadcn/ui (new-york style, dark theme CSS variables)
- **Fonts**: Inter (sans) + JetBrains Mono (mono) via `next/font/google`
- **Preview path**: `/`
- **Port**: 25158

**Pages:**
- `/` — Home: hero, about, projects, live glucose preview
- `/diabetes` — Full Nightscout dashboard: roller coaster, A1C, TIR, fun stats, hourly patterns
- `/diabetes/weekly` — 13-week table with CSV export
- `/health` — Apple Health activity page, daily metric rollups (live from Firebase `getFinchData`)
- `/finch` — Finch wellness: check-in streak, goal completion, top goals, self-care areas, mood, Apple Health snapshot (live from Firebase `getFinchData`)

**Component structure (Next.js conventions):**
```
components/
  ui/           ← shadcn: button, card, badge, progress, separator, table
  layout/       ← nav.tsx (client, uses usePathname)
  diabetes/     ← stats.tsx, roller-coaster-viz.tsx (accepts FinchEvent[]), preview.tsx, stats-loading.tsx, weekly-export-button.tsx
  home/         ← hero-section.tsx, about-section.tsx, projects-section.tsx
lib/
  nightscout.ts ← Nightscout fetch + WeeklyReport computation + mock fallback
  finch.ts      ← Firebase `getFinchData` fetcher (DailySummary[]) + summarizeFinch, eventsForWindow, rollupHealth
  utils.ts      ← cn(), mmol conversion, glucoseColor, trendArrow, a1cLabel, date helpers
app/
  layout.tsx    ← root layout, fonts, Nav, footer
  page.tsx      ← home
  diabetes/page.tsx
  diabetes/weekly/page.tsx
  finch/page.tsx
  health/page.tsx
```

**Design system:**
- Dark theme via CSS variables in `globals.css` (`--background`, `--card`, `--primary`, etc.)
- shadcn tokens map to Tailwind colors (`background`, `card`, `primary`, `muted`, `border`, etc.)
- Custom `glucose.*` colour tokens: `glucose-green/orange/red/yellow/blue/purple`
- `bg-mesh` utility for radial gradient background

**Nightscout:** `https://hgjaustin-nightscout.fly.dev` (publicly readable, no auth)
- Data in mg/dL internally; displayed in mmol/L (÷ 18.0182)
- In-range: 3.9–10.0 mmol/L
- Falls back to deterministic mock data on fetch failure (no hydration mismatch)
- Revalidation: 5 min (diabetes), 1 hour (weekly)

**Finch + Apple Health (single pipeline):** Both `/finch` and `/health` fetch from one Firebase Cloud Function:

- Endpoint: `https://europe-west1-diabetes-45626.cloudfunctions.net/getFinchData` (public, no auth)
- Response: `{ ok, from, to, days, data: DailySummary[] }` — one summary per calendar day with mood, scheduled/completed goals (with text/emoji/areas/date), reflections, good vibes count, breathing sessions count, and a `health` record of HealthKit metrics (`Steps`, etc.) keyed by HKQuantityType identifier.
- Refresh cycle: an iOS Shortcut on the phone uploads Finch export + Apple Health snapshot to Firestore; this site re-fetches once per hour (`revalidate: 3600`).
- `lib/finch.ts` owns the wire types, `fetchFinchData()`, `summarizeFinch()` (streaks, completion rate, top goals, area counts, avg mood), `rollupHealth()` (per-metric daily breakdown + averages), and `eventsForWindow()` for the coaster overlay.
- Coaster overlay: `RollerCoasterViz` accepts `FinchEvent[]` of kind `goal` / `breathing` / `reflection`. Currently empty until the Cloud Function emits per-goal timestamps (`ts` or `completedAt` on `CompletedGoal`) — code is forward-compatible and lights up automatically once timestamps arrive.

### API Server (`artifacts/api-server`)
- **Framework**: Express 5
- **Port**: 8080
- **Preview path**: `/api`

### Canvas / Mockup Sandbox (`artifacts/mockup-sandbox`)
- **Preview path**: `/__mockup`

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
