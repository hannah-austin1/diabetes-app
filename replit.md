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
- `/health` — Apple Health activity page (placeholder + setup guide; requires Health Auto Export iOS app)

**Component structure (Next.js conventions):**
```
components/
  ui/           ← shadcn: button, card, badge, progress, separator, table
  layout/       ← nav.tsx (client, uses usePathname)
  diabetes/     ← stats.tsx, roller-coaster-viz.tsx, preview.tsx, stats-loading.tsx, weekly-export-button.tsx
  home/         ← hero-section.tsx, about-section.tsx, projects-section.tsx
lib/
  nightscout.ts ← Nightscout fetch + WeeklyReport computation + mock fallback
  utils.ts      ← cn(), mmol conversion, glucoseColor, trendArrow, a1cLabel, date helpers
app/
  layout.tsx    ← root layout, fonts, Nav, footer
  page.tsx      ← home
  diabetes/page.tsx
  diabetes/weekly/page.tsx
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

**Apple Health:** No public web API — requires Health Auto Export (iOS) to POST to `/api/health`. Page shows placeholder stats + 4-step setup guide.

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
