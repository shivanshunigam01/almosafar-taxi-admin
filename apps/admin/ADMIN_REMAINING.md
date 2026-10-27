# Admin dashboard — remaining work

## Validated locally

- `npm run typecheck` (monorepo)
- `npm run build -w @almosafar/admin`

## Not yet implemented / follow-ups

1. **Firestore writes for operational settings** — Cloud Function `adminUpdateOperationalSettings` should validate with `operationalSettingsSchema` before merge (currently merges raw patch).
2. **Peak / surge rule editors** — UI is read-only lists; add forms to toggle `isActive` and edit multipliers in local + callable patch.
3. **Passenger / vehicle CRUD** — read-only tables; create/update would need new callables and rules.
4. **Real-time activity log** — poll or `onSnapshot` on `activityLogs` (currently load-on-mount).
5. **Chart library** — dashboard uses CSS bars; optional Recharts for production polish.
6. **ESLint** — no root ESLint config for admin; add `eslint-config-next` when desired.
7. **E2E tests** — Playwright/Cypress not configured; manual checklist in `FIREBASE_E2E_CHECKLIST.md`.
8. **Deploy** — redeploy Cloud Functions after adding `adminCancelRide`, `adminSetDriverVerification`, `adminUpdateOperationalSettings`.

## Security notes

- Admin credentials only via Firebase seed (`DEMO_SEED_PASSWORD`); never bundled in client.
- Local demo admin accepts emails containing `admin` — **development only**.
