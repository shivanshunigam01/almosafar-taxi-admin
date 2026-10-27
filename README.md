# Almosafar Taxi (demo monorepo)

Client-ready taxi ride-hailing **demo**: passenger app, driver app, and admin dashboard sharing TypeScript models, fare logic, and seeded demo data.

> **Demo disclaimer:** All passengers, drivers, payments, and trips are fictional sample data unless connected to a real backend in a later phase. Never present demo data as real customer or payment information.

## Repository layout

| Path | Description |
|------|-------------|
| `apps/passenger` | Expo passenger app (evolved from preserved legacy clone) |
| `apps/driver` | Expo driver app (foundation shell) |
| `apps/admin` | Next.js App Router admin site |
| `packages/shared` | Models, Zod validation, fare calculator, ride transitions, demo seed |
| `packages/ui` | Shared web UI (demo banner for admin) |
| `Uber-Clone-ReactNative/` | **Preserved upstream reference** — not modified |

## Ride lifecycle

```
requested → accepted → driver_arriving → in_progress → completed
```

Also: `rejected` (from `requested`), `cancelled` (from active states). Implemented in `@almosafar/shared` (`RIDE_STATUS_TRANSITIONS`, `transitionRide`).

## Prerequisites

- Node.js **20+** (tested with Node 24)
- npm **10+** (workspace monorepo uses **npm lockfiles** at root after first install)

## Installation

```bash
cd "uber clone"
npm install
npm run build
```

`npm run build` compiles `@almosafar/shared` and `@almosafar/ui` to `dist/` (required before Expo/Next consume workspace packages).

## Environment

Copy the root template and per-app templates:

```bash
copy .env.example .env
copy apps\passenger\.env.example apps\passenger\.env
copy apps\driver\.env.example apps\driver\.env
copy apps\admin\.env.example apps\admin\.env.local
```

| Variable | Purpose |
|----------|---------|
| `ALMOSAFAR_DEMO_MODE` / `EXPO_PUBLIC_ALMOSAFAR_DEMO_MODE` / `NEXT_PUBLIC_ALMOSAFAR_DEMO_MODE` | Show demo banners and seeded data (default on in development) |
| `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` | Optional Google Places on passenger home (fallback demo locations if unset) |
| Firebase / Supabase vars | Reserved for realtime sync phase |

**Development vs production:** Demo mode defaults to **on** when env vars are unset and `NODE_ENV !== "production"`. Set explicit `*_DEMO_MODE=false` for production builds once a real backend is wired.

## Run applications

```bash
npm run passenger   # Expo passenger @ Metro
npm run driver      # Expo driver
npm run admin       # Next.js http://localhost:3000
```

## Typecheck all workspaces

```bash
npm run typecheck
```

## Package manager strategy

This monorepo uses **npm workspaces** (`package.json` → `workspaces`). A single `package-lock.json` at the repository root is created/updated by `npm install` (consistent with the original clone’s npm + lockfile approach).

## Next phases (not in this foundation)

- Firebase or Supabase realtime ride sync across devices
- EAS Android APK profiles for passenger and driver
- Full driver ride acceptance UI and passenger booking → live status
- Admin auth and fare editing against cloud data

## Legacy reference

The original [Uber-Clone-ReactNative](https://github.com/muddasir03/Uber-Clone-ReactNative) project remains in `Uber-Clone-ReactNative/` for comparison. Passenger app code was **reimplemented in TypeScript** under `apps/passenger` using the same screen flow and assets.
