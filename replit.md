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
- **Framework**: Next.js 15 with React Server Components
- **Preview path**: `/`
- **Port**: 25158
- **Key pages**:
  - `/` — Home page with hero, about, projects, and live glucose preview
  - `/diabetes` — Full Nightscout glucose dashboard with roller coaster animation
- **Nightscout**: `https://hgjaustin-nightscout.fly.dev` (publicly readable, no auth)
- **Key components**:
  - `components/roller-coaster-viz.tsx` — Canvas-animated glucose roller coaster (client)
  - `components/diabetes-stats.tsx` — Current BG, A1C, TIR stats (server)
  - `lib/nightscout.ts` — Nightscout API fetching + fallback mock data
  - `lib/utils.ts` — Glucose color helpers, trend arrows, time formatting
- **Data revalidation**: 5 minutes (ISR)

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
