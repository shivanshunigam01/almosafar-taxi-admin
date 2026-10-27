# Client demo guide — Almosafar Taxi

Quick paths for stakeholder demos: **offline single-device**, **two-phone local** (separate memories), and **connected Firebase** (real sync).

---

## What you are showing

- **Passenger app** — book ride, track status, receipt (IQD / Baghdad-oriented copy, EN + AR where wired).
- **Driver app** — go online, incoming request, accept/reject, trip phases, PIN, earnings/history.
- **Admin dashboard** — operations overview, live rides, fares, users (web).

**Demo banner:** When demo mode is on (`EXPO_PUBLIC_ALMOSAFAR_DEMO_MODE` / defaults in EAS profile), UI indicates demo/simulated behavior.

---

## Mode A — Fastest (no Firebase)

**Best for:** UI walkthrough on one or two phones without backend setup.

1. Install APKs or run Expo dev client **without** `EXPO_PUBLIC_FIREBASE_*` in env.
2. **Passenger:** Sign in with any demo email from seed docs (e.g. `demo.passenger.sara@example.com`) — local auth accepts demo users from bundled seed.
3. **Driver:** Sign in as `demo.driver.khalid@example.com` (local).
4. Request a ride on passenger; complete flow on driver.

**Limitation:** Each app uses **its own in-memory store**. Two phones **do not sync** in this mode. For cross-device, use Mode C.

**Simulated in this mode:** GPS/track animation, payment capture, external dispatch APIs.

---

## Mode B — Admin local (browser)

1. From repo root: `npm run admin`
2. Open `http://localhost:3000/login`
3. Sign in with any email containing **`admin`** (password arbitrary) — e.g. `demo.admin@local.test`
4. Browse dashboard, rides, fares, settings.

**Simulated:** Data is `LocalAdminDataService` (in-memory), not shared with mobile unless Firebase mode is used.

---

## Mode C — Connected Firebase (production-style BaaS)

**Best for:** Real-time passenger ↔ driver ↔ admin on one Firebase project.

**Setup:** Follow `FIREBASE_SETUP.md` (deploy rules/functions, seed, env files).

### Seeded accounts (after `npm run firebase:seed`)

Password = value you set in **`DEMO_SEED_PASSWORD`** (never committed).

| Role | Email |
|------|--------|
| Passenger | `demo.passenger.sara@example.com` |
| Passenger | `demo.passenger.omar@example.com` |
| Driver | `demo.driver.khalid@example.com` |
| Driver | `demo.driver.layla@example.com` |
| Admin | `demo.admin@almosafar.example.com` (or `DEMO_ADMIN_EMAIL`) |

### Demo script (~15 minutes)

1. **Admin (optional prep):** Sign in on web; confirm fares/zones loaded.
2. **Driver phone:** Sign in → **Go online** (callable `setDriverOnline`).
3. **Passenger phone:** Sign in → set pickup/dropoff (Baghdad presets) → **Request ride** (`createRideRequest`).
4. **Driver:** Incoming card → **Accept** within countdown.
5. **Both:** Walk through *arriving → picked up → completed* on driver; passenger screen updates via Firestore subscription.
6. **Admin:** Refresh rides list — show completed ride and fare snapshot unchanged if you later edit fare config.

Detailed checklist: `FIREBASE_E2E_CHECKLIST.md`.

---

## Admin production demo (hosted)

After `npm run build -w @almosafar/admin`:

- Deploy `apps/admin` to Vercel/Node with `NEXT_PUBLIC_FIREBASE_*` and `NEXT_PUBLIC_ALMOSAFAR_DEMO_MODE=true` if desired.
- Or run locally: `npm run start -w @almosafar/admin` (port 3000 default for `next start`).

---

## APKs for client devices

Build via `APK_BUILD_GUIDE.md`. Install passenger + driver APKs on two Android devices for Mode C.

**Honesty for clients:**

| Capability | Status |
|------------|--------|
| End-to-end ride state machine | Implemented (local + Firebase) |
| Fare rules / IQD | Implemented; tests in shared package |
| Real payments | **Not integrated** — UI only |
| Live fleet GPS backend | **Simulated** in app |
| Push notifications | **Not in scope** |
| Custom server | **None** — Firebase callables only |

---

## Language / RTL

- Driver and passenger include Arabic/English toggles where implemented.
- Admin supports EN/AR labels on key screens.

---

## Support contacts during demo

If Firebase errors appear:

- Re-seed and re-login (refresh token claims).
- Confirm same `PROJECT_ID` on mobile env and deployed functions (region **us-central1**).
- See troubleshooting in `FIREBASE_SETUP.md`.
