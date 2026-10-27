# QA Report — Almosafar Taxi (final integration)

**Run date:** 2026-10-27 (Asia/Kolkata)  
**Environment:** Windows 10, Node 20+, repo `almosafar-taxi` monorepo  
**Agent:** Automated checks on this machine; no physical Android devices or Firebase project credentials in CI.

---

## Executive summary

| Area | Status |
|------|--------|
| Shared build + unit tests | **Pass** (7/7) |
| Workspace TypeScript | **Pass** |
| Next.js admin production build | **Pass** |
| Firebase Cloud Functions compile | **Pass** |
| Expo Doctor (passenger & driver) | **20/20** (after React 19 + RN 0.88 lockfile alignment) |
| EAS Android APK builds | **Not produced** — not logged in (`eas whoami` → *Not logged in*); placeholder EAS project IDs |
| npm `ci` | **Pass** (retry after initial `EBUSY` when parallel npm was running) |
| Two-phone Firebase E2E | **Not run** (requires your project + devices) |
| Android install/launch smoke | **Not run** (`adb` not on PATH) |

**No APK download URLs** — EAS did not complete a successful build in this session.

---

## Commands and results

### Dependency install

| Command | Result |
|---------|--------|
| `npm install` (root) | **Pass** — 1063 packages audited |
| `npm ci` | **Pass** on clean retry (~9 min); first attempt failed with `EBUSY` during overlapping installs |

### Shared package

| Command | Result |
|---------|--------|
| `npm run build:shared` | **Pass** |
| `npm run test` | **Pass** — 4 files, **7 tests** |

Test coverage (local / static):

- **Fare calculation** — `packages/shared/src/__tests__/fare.test.ts`
- **Ride lifecycle transitions** — `lifecycle.test.ts`
- **Driver claim / duplicate accept (local repo)** — `driver-claim.test.ts`
- **Firestore rules (static file assertions)** — `firestore-rules.test.ts` (not emulator)

### TypeScript (all workspaces)

| Command | Result |
|---------|--------|
| `npm run typecheck` | **Pass** — `@almosafar/admin`, `driver`, `passenger`, `shared`, `ui` |

### Admin (Next.js)

| Command | Result |
|---------|--------|
| `npm run build -w @almosafar/admin` | **Pass** — 18 static routes, production bundle |

Deploy artifact: `apps/admin/.next` (run `npm run start -w @almosafar/admin` after build).

### Firebase functions

| Command | Result |
|---------|--------|
| `npm run build --prefix firebase/functions` | **Pass** (`tsc`) |

Deploy (not run here): `npm run firebase:deploy` with `firebase login` and project selected.

### Expo Doctor

Run from each app directory:

```powershell
cd apps/passenger; npx expo-doctor
cd apps/driver;   npx expo-doctor
```

| App | Score | Notes |
|-----|-------|--------|
| Passenger | **20/20** | After unified `react@19.3.0`, root `react-native@0.88.0` in lockfile, default Expo Metro config (SDK 58 auto-monorepo). |
| Driver | **20/20** | Same as passenger |

TypeScript SDK warning mitigated via `expo.install.exclude: ["typescript"]` in app `package.json`.

### EAS / APK

| Command | Result |
|---------|--------|
| `npx eas-cli@latest whoami` | **Not logged in** (exit 1) |
| `eas build -p android --profile passenger-apk --non-interactive` | **Blocked** — *An Expo user account is required* |

**Blockers for APK:**

1. `eas login` or set `EXPO_TOKEN` for CI.
2. Create/link EAS projects and set real IDs (replace placeholders in `app.config.ts` or env):
   - `EAS_PROJECT_ID_PASSENGER`
   - `EAS_PROJECT_ID_DRIVER`
3. Android keystore (EAS can generate on first interactive build).
4. Optional: `EXPO_PUBLIC_FIREBASE_*` in EAS secrets for connected demo APKs.

### Android smoke (local)

| Check | Result |
|-------|--------|
| `adb devices` | **Skipped** — Android platform tools not installed / not on PATH |

---

## Application verification (logic / code paths)

### Passenger (`apps/passenger`)

- **Local seeded mode:** In-memory `LocalDemoDataService` when Firebase env unset; demo banner visible.
- **Connected mode:** When `EXPO_PUBLIC_FIREBASE_*` set — Auth + callable `createRideRequest`, ride subscription.
- **Package ID:** `com.almosafar.taxi.passenger`
- **EAS profile:** `passenger-apk` (`android.buildType: apk`, internal distribution)

### Driver (`apps/driver`)

- **Local mode:** Same pattern; accept/reject and lifecycle in local repository.
- **Connected mode:** Callables for online status, accept (transaction), transitions.
- **Package ID:** `com.almosafar.taxi.driver`
- **EAS profile:** `driver-apk`

### Admin (`apps/admin`)

- **Local login:** Email containing `admin`, any password → `LocalAdminDataService`.
- **Firebase login:** Seeded admin user + custom claims → `FirestoreAdminDataService`.
- **Modules:** Dashboard, rides, passengers, drivers, vehicles, fares, zones, pricing, bookings, payments, reports, settings, activity.

---

## Simulated vs production integrations

| Feature | Demo / simulated | Production-style (when configured) |
|---------|------------------|-------------------------------------|
| Data store | Local in-memory seed | Firestore + Auth |
| Ride writes | Local service | Cloud Functions callables only |
| Live GPS / routing | Map UI + simulated movement | Google Maps key optional; not full fleet telematics |
| Payments | UI + demo payment methods | No real PSP/charge |
| Push notifications | Not implemented | Not in scope |
| Admin auth (local) | String match on email | N/A |
| Admin auth (cloud) | N/A | Firebase Auth + `role: admin` claim |

---

## Critical issues fixed in this pass

- Restored workspace tooling after partial `npm ci` (`npm install` + full test/typecheck/build re-run).
- EAS monorepo hooks: `installCommand` / `prebuildCommand` on shared `eas.json` base profile.
- Workspace `installConfig.hoistingLimits` for mobile and admin packages.
- Root `overrides.react-native: 0.88.0` to align native version (may require clean install to fully dedupe).

---

## Recommended follow-up (human)

1. Complete `APK_BUILD_GUIDE.md` steps (login, `eas init`, builds).
2. Run `FIREBASE_E2E_CHECKLIST.md` on two Android devices.
3. Deploy admin to Vercel/Node host with `NEXT_PUBLIC_*` env.
4. Optional: add `@firebase/rules-unit-testing` emulator suite for rules (currently static test only).

---

## Sign-off

**Automated regression:** Pass for build, typecheck, shared tests, admin production build, functions compile.  
**Release artifacts:** APKs **not** verified; admin build **ready** for hosting.  
**Connected E2E:** **Not validated** on this machine.
