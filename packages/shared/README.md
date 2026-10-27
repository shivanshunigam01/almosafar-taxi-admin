# @almosafar/shared

Shared TypeScript models, Zod validation, fare calculation, ride lifecycle rules, and demo seed data for Almosafar Taxi.

## Ride lifecycle

```
requested → accepted → driver_arriving → in_progress → completed
```

Exceptional: `rejected` (from `requested`), `cancelled` (from any active state).

See `RIDE_LIFECYCLE_DOC` and `RIDE_STATUS_TRANSITIONS` in `src/rides/transitions.ts`.

## Demo data

All seeded entities use IDs prefixed with `demo_` and `isDemoData: true`. Import demo bundle:

```ts
import { getDemoSeedBundle, DEMO_DISCLAIMER } from "@almosafar/shared/demo";
```

## Scripts

```bash
npm run build -w @almosafar/shared
npm run typecheck -w @almosafar/shared
```

Build output is emitted to `dist/` for consumption by Expo and Next.js apps.
