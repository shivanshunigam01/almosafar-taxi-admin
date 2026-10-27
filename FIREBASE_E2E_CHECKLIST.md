# End-to-end Firebase demo checklist

Use **two physical devices** (or one device + emulator) plus **admin browser**. Complete `FIREBASE_SETUP.md` first (deploy rules/functions, run seed, configure env).

**Legend:** ✅ validated in automation or agent run · ⬜ requires your Firebase project + devices · ❌ not run

## Preconditions

| Step | Status |
|------|--------|
| Firebase project created | ⬜ |
| Auth email/password enabled | ⬜ |
| Rules + indexes + functions deployed | ⬜ |
| Seed script run with `DEMO_SEED_PASSWORD` | ⬜ |
| Passenger + driver `.env` with `EXPO_PUBLIC_FIREBASE_*` | ⬜ |
| Admin `.env.local` with `NEXT_PUBLIC_FIREBASE_*` | ⬜ |

## Flow: Phone A (passenger) → Phone B (driver) → Admin

| # | Action | Expected | Status |
|---|--------|----------|--------|
| 1 | Phone A: open passenger app, **do not** force local demo | Data mode shows Firebase connected label | ⬜ |
| 2 | Phone A: sign in `demo.passenger.sara@example.com` + seed password | Auth succeeds; profile loads | ⬜ |
| 3 | Phone A: request ride (Baghdad pickup/dropoff) | Callable `createRideRequest`; ride `requested` in Firestore | ⬜ |
| 4 | Phone B: driver app, sign in `demo.driver.khalid@example.com` | Auth succeeds | ⬜ |
| 5 | Phone B: go **online** | Callable `setDriverOnline`; `drivers.isOnline` true | ⬜ |
| 6 | Phone B: incoming request appears | Real-time query `status==requested` | ⬜ |
| 7 | Phone B: **accept** within countdown | Callable transaction; single winner if two drivers | ⬜ |
| 8 | Phone A: searching / active screen updates | `subscribeRide` → `accepted` / later statuses | ⬜ |
| 9 | Phone B: complete trip flow to **completed** | Status transitions via callables | ⬜ |
| 10 | Phone A: sees completed state / receipt path | Real-time ride doc | ⬜ |
| 11 | Admin browser: sign in admin email from seed | Custom claim `role: admin` | ⬜ |
| 12 | Admin: live rides table shows completed ride | `subscribeAllRides` | ⬜ |

## Security spot checks

| Check | Expected | Status |
|-------|----------|--------|
| Client Firestore write to `rides` (devtools) | **Denied** | ⬜ |
| Client sets `users.role` to `admin` | **Denied** | ⬜ |
| Passenger callable accept ride | **Denied** | ⬜ |
| Admin fare bump + new ride | New ride uses new base; old ride `fareEstimate` unchanged | ⬜ |

## Automated checks (this repo)

| Command | Result (last run: 2026-10-27) |
|---------|-------------------------------|
| `npm install` (root) | ✅ Pass |
| `npm run build:shared` | ✅ Pass |
| `npm run test` (shared) | ✅ **7/7** pass |
| `npm run typecheck` (all workspaces) | ✅ Pass |
| `npm run build -w @almosafar/admin` | ✅ Pass |
| `npm run build --prefix firebase/functions` | ✅ Pass |
| `npx expo-doctor` (passenger & driver) | ✅ **20/20** |
| EAS APK build | ❌ **Not executed** (`eas whoami` → not logged in) |
| Physical two-phone test | ❌ **Not executed** (no Firebase project/credentials/devices in agent environment) |

Full detail: `QA_REPORT.md`.

## Agent honesty statement

Implementation includes rules, callables, seed CLI, and client wiring. **Cross-device E2E has not been live-validated** without your Firebase project, deployed functions, and real devices. Local-only demo mode remains available when env is unset.
