# Diabetes Roller Coaster 🎢

Personal website built with **Next.js 16 App Router** (Turbopack) and React Server Components. Features live glucose data from Nightscout visualised as an animated roller coaster, Finch wellness tracking, and Apple Health integration.

## Pages

| Route | Description |
|---|---|
| `/` | Home — hero, about, projects, live glucose preview |
| `/diabetes` | Nightscout dashboard — animated roller coaster viz, A1C, TIR, fun stats, hourly patterns, wellness correlations |
| `/finch` | Finch wellness — check-in streak, goal completion, top goals, self-care areas, mood |
| `/health` | Apple Health activity — daily metric rollups from HealthKit via Firebase |

## Tech Stack

- **Framework**: Next.js 16 (App Router, Turbopack, React Server Components)
- **Styling**: Tailwind CSS 4 + shadcn/ui (dark theme)
- **Language**: TypeScript 6
- **Fonts**: Inter + JetBrains Mono via `next/font/google`
- **Data**: Nightscout API (glucose + treatments), Firebase Cloud Functions (Finch + Apple Health)

## Getting Started

```bash
# 1. Install dependencies
pnpm install

# 2. Copy env template and fill in your values
cp .env.example .env.local

# 3. Start dev server
pnpm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

| Variable | Description |
|---|---|
| `NIGHTSCOUT_URL` | Your Nightscout instance URL (publicly readable, no trailing slash) |
| `FINCH_ENDPOINT` | Firebase Cloud Function endpoint for Finch + Apple Health data |

See `.env.example` for the template.

## Scripts

| Command | Description |
|---|---|
| `pnpm run dev` | Start development server on port 3000 |
| `pnpm run build` | Production build |
| `pnpm run start` | Start production server |
| `pnpm run typecheck` | Run TypeScript type checking |
| `pnpm run test` | Run unit tests with Jest |

## Data Sources

- **Nightscout**: Publicly readable CGM data (mg/dL), displayed in mmol/L. Provides SGV readings, trend direction, and treatments (carbs/boluses).
- **Finch**: Daily wellness summaries — mood scores, completed goals, reflections, breathing sessions — via Firebase Cloud Function.
- **Apple Health**: HealthKit metrics (steps, energy, heart rate, etc.) uploaded via iOS Shortcut → Firebase → Cloud Function.

## Project Structure

```
app/
├── api/
│   ├── finch/route.ts       # Finch data proxy
│   └── nightscout/route.ts  # Nightscout data proxy with caching
├── diabetes/page.tsx         # Main glucose dashboard
├── finch/page.tsx            # Finch wellness page
├── health/page.tsx           # Apple Health activity page
└── page.tsx                  # Home page

components/
├── diabetes/                 # Roller coaster viz, stats, etc.
├── finch/                    # Finch-specific components
├── health/                   # Health page components
├── home/                     # Home page sections
├── layout/                   # Nav, live glucose badge
└── ui/                       # shadcn/ui primitives

lib/
├── correlation.ts            # Pearson correlation for wellness ↔ glucose
├── finch.ts                  # Finch API client + data transforms
├── nightscout.ts             # Nightscout API client + stats computation
└── utils.ts                  # Shared helpers (glucose colours, mmol conversion, etc.)
```
