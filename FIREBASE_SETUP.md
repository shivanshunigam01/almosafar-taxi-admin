# Firebase setup — Almosafar Taxi (connected demo)

This monorepo uses **Firebase as BaaS** (Firestore + Auth + Callable Cloud Functions). There is **no custom Express/Nest server**. Privileged writes use **Cloud Functions + Admin SDK**; clients use **Security Rules** for reads and cannot assign admin roles or tamper with fares on rides.

## 1. Create a Firebase project

1. Open [Firebase Console](https://console.firebase.google.com/) → **Add project** (e.g. `almosafar-taxi-demo`).
2. Enable **Google Analytics** only if you want it (optional for demo).

## 2. Register apps (same project)

### Passenger & driver (Expo)

1. **Add app** → **Android** (add iOS later if needed).
2. Package names:
   - Passenger: `com.almosafar.taxi.passenger`
   - Driver: `com.almosafar.taxi.driver`
3. Copy **Firebase config** (`apiKey`, `projectId`, etc.) into each app’s env (see `.env.example`).

### Admin (Next.js)

1. **Add app** → **Web**.
2. Copy config into `apps/admin/.env.local` using `NEXT_PUBLIC_FIREBASE_*` keys.

## 3. Enable Authentication

1. **Build → Authentication → Sign-in method**.
2. Enable **Email/Password**.
3. Do **not** add admin users manually in the console for production-like demos — use the **seed script** so **custom claims** (`role`, `entityId`) are set only via Admin SDK.

## 4. Create Firestore

1. **Build → Firestore Database → Create database**.
2. Start in **production mode** (we deploy rules from this repo).
3. Choose a region (e.g. `nam5` / closest to Baghdad demo).

## 5. Local tooling

Install Firebase CLI (once):

```bash
npm install -g firebase-tools
firebase login
```

From repo root:

```bash
cd firebase
firebase use --add
# select your project
```

## 6. Deploy rules, indexes, and functions

```bash
npm run build:shared
cd firebase/functions
npm install
npm run build
cd ..
firebase deploy --only firestore:rules,firestore:indexes,functions
```

Callable functions (region **us-central1**):

- `createRideRequest` — server-side fare snapshot on ride document
- `cancelRideAsPassenger`, `acceptRideAsDriver`, `rejectRideAsDriver`, `transitionRideAsDriver`
- `setDriverOnline`
- `adminAssignDriver`, `adminUpdateFareConfiguration`

## 7. Authorized demo seed (Admin SDK)

**Never** commit service account JSON or `DEMO_SEED_PASSWORD`.

1. **Project settings → Service accounts → Generate new private key** → save outside the repo.
2. Set environment variables (PowerShell example):

```powershell
$env:GOOGLE_APPLICATION_CREDENTIALS="C:\path\to\service-account.json"
$env:FIREBASE_PROJECT_ID="your-project-id"
$env:DEMO_SEED_PASSWORD="YourLongDemoPassword12!"
# optional:
$env:DEMO_ADMIN_EMAIL="demo.admin@almosafar.example.com"
```

3. Run seed:

```bash
npm run build:shared
npm run firebase:seed
```

This creates:

- Firestore collections: `zones`, `fareConfigurations`, `passengers`, `drivers`, `vehicles`, `paymentMethods`, `rides`, `activityLogs`, `users`, `_meta/health`
- Auth users for seeded passengers/drivers + admin email above
- Custom claims: `role` + `entityId` (clients **cannot** set these)

Share **only** the demo password with testers via a secure channel — not in APKs or git.

## 8. Environment files

Copy root `.env.example` into:

- `apps/passenger/.env` — `EXPO_PUBLIC_FIREBASE_*`
- `apps/driver/.env` — same keys
- `apps/admin/.env.local` — `NEXT_PUBLIC_FIREBASE_*`

If variables are **missing**, apps stay in **local demo mode** (single-device, in-memory). UI shows that connected mode was **not** verified.

## 9. Security model (summary)

| Data | Client read | Client write |
|------|-------------|--------------|
| `users` | Own profile / admin | **Denied** |
| `fareConfigurations` | Authenticated | **Denied** (admin callable) |
| `rides` | Owner passenger/driver, admin, open `requested` for drivers | **Denied** (callables + transactions) |
| `payments` | Owner / admin | **Denied** |

Ride documents store **`fareEstimate` / `fareFinal` snapshots** at booking/completion time; changing `fareConfigurations` does not rewrite old rides.

## 10. Troubleshooting

- **Permission denied after sign-in:** Re-run seed; sign out/in to refresh ID token claims.
- **Functions not found:** Deploy functions; ensure Expo/Next use same `projectId`.
- **Health check fails:** Deploy rules allowing read on `_meta/health`.
- **Cross-device sync:** Both mobile apps must use Firebase mode, sign in, and passenger must create ride via **callable** (connected flow in app).

See `FIREBASE_E2E_CHECKLIST.md` for manual validation steps.

## 11. Mobile APKs and EAS (optional)

Firebase config in **Expo** apps uses the same `EXPO_PUBLIC_FIREBASE_*` keys as local `.env`. For **store-less demo APKs**, build with EAS and optionally inject the same keys as EAS project secrets so installed APKs use connected mode without rebuilding locally.

- Package names must match Firebase Android app registrations (§2).
- Separate EAS projects for passenger and driver — see `APK_BUILD_GUIDE.md`.
- APK build does **not** deploy Cloud Functions; run §6 before connected demos.

## 12. Related docs

| Document | Purpose |
|----------|---------|
| `APK_BUILD_GUIDE.md` | EAS login, profiles, build commands |
| `CLIENT_DEMO_GUIDE.md` | Demo scripts (local vs Firebase) |
| `QA_REPORT.md` | Latest automated test/build results |
| `RELEASE_CHECKLIST.md` | Pre-handoff checklist |
