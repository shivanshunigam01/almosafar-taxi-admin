# Almosafar Taxi — Admin (Next.js)

Desktop-first admin dashboard with **Arabic/English** (RTL), **local seeded demo**, and **Firebase** connected mode via `@almosafar/shared` `createAdminDataServiceAsync`.

## Run

```bash
npm install
npm run build:shared
npm run admin
```

Open [http://localhost:3000](http://localhost:3000) → redirects to `/dashboard` after login.

### Login

| Mode | Credentials |
|------|-------------|
| **Local demo** (no Firebase env) | Email containing `admin` (e.g. `demo.admin@local.test`), any password |
| **Firebase** | Admin user from [FIREBASE_SETUP.md](../../FIREBASE_SETUP.md) seed |

## Modules

Dashboard KPIs, live rides (assign/cancel), passengers, drivers (verification), vehicles, fare config, zones, pricing rules (commission, cancellation, peak/surge demo), booking history, mock payments/settlements, CSV export, settings, activity log.

See [ADMIN_REMAINING.md](./ADMIN_REMAINING.md) for follow-ups.
