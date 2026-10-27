# APK build guide — Almosafar Passenger & Driver

Standalone **internal distribution APKs** via [EAS Build](https://docs.expo.dev/build/introduction/). Each app is a **separate Expo project** with its own slug, EAS project ID, and Android application ID.

---

## Prerequisites

- Node **20+** (EAS base profile uses **22.14.0** on builders)
- npm workspaces installed at repo root: `npm install`
- [Expo account](https://expo.dev/signup)
- EAS CLI: `npx eas-cli@latest` (tested with **26.x**)
- Optional: Firebase env vars in EAS for connected-demo APKs

---

## Android package IDs (must stay unique)

| App | Package | Expo slug |
|-----|---------|-----------|
| Passenger | `com.almosafar.taxi.passenger` | `almosafar-taxi-passenger` |
| Driver | `com.almosafar.taxi.driver` | `almosafar-taxi-driver` |

Configured in `apps/passenger/app.config.ts` and `apps/driver/app.config.ts`.

---

## EAS profiles (already configured)

Both `apps/passenger/eas.json` and `apps/driver/eas.json` define:

- **`passenger-apk`** / **`driver-apk`** — `distribution: internal`, `android.buildType: apk`
- **`development`** — dev client APK, internal
- **Monorepo:** root `package.json` `postinstall` runs `npm run build:shared` after `npm ci`/`npm install` on EAS (do not use unsupported `installCommand` in `eas.json`)
- **Demo banner default:** `EXPO_PUBLIC_ALMOSAFAR_DEMO_MODE=true` on base profile

---

## One-time setup per app

### 1. Log in to Expo

```powershell
npx eas-cli@latest login
npx eas-cli@latest whoami
```

For CI, use a [robot token](https://docs.expo.dev/accounts/programmatic-access/):

```powershell
$env:EXPO_TOKEN = "your-token"
```

### 2. Link or create EAS projects

From **each** app directory:

**Passenger:**

```powershell
cd "C:\Users\Admin\Desktop\uber clone\apps\passenger"
npx eas-cli@latest init
```

Choose *Create new project* or link existing. Copy the **project ID** into one of:

- `EAS_PROJECT_ID_PASSENGER` (recommended), or
- Replace `REPLACE_WITH_EAS_PROJECT_ID_PASSENGER` in `app.config.ts` (avoid committing real IDs if policy requires env-only).

**Driver:**

```powershell
cd "C:\Users\Admin\Desktop\uber clone\apps\driver"
npx eas-cli@latest init
```

Set `EAS_PROJECT_ID_DRIVER` or update `REPLACE_WITH_EAS_PROJECT_ID_DRIVER`.

### 3. Android credentials

First build may prompt for keystore generation (interactive). For CI:

```powershell
npx eas-cli@latest credentials -p android
```

### 4. Optional Firebase secrets (connected demo)

In [expo.dev](https://expo.dev) → Project → Secrets, or via CLI:

```powershell
npx eas-cli@latest env:create --name EXPO_PUBLIC_FIREBASE_API_KEY --value "..." --environment production
# Repeat for AUTH_DOMAIN, PROJECT_ID, STORAGE_BUCKET, MESSAGING_SENDER_ID, APP_ID
```

If omitted, APKs run in **local demo mode** (single-device in-memory data).

---

## Build commands

**Only treat an APK as released when EAS reports `Finished` and provides an artifact URL.**

### Passenger APK

```powershell
cd "C:\Users\Admin\Desktop\uber clone\apps\passenger"
npx eas-cli@latest build --platform android --profile passenger-apk
```

Non-interactive (CI, after login/token + credentials exist):

```powershell
npx eas-cli@latest build --platform android --profile passenger-apk --non-interactive
```

### Driver APK

```powershell
cd "C:\Users\Admin\Desktop\uber clone\apps\driver"
npx eas-cli@latest build --platform android --profile driver-apk
```

---

## Download and install

After success, EAS prints a build page URL, e.g. `https://expo.dev/accounts/<account>/projects/<slug>/builds/<id>`.

- Open on device or download `.apk` from the build artifact link.
- Enable *Install unknown apps* for the browser/file manager used.
- Install **both** APKs side-by-side (different package IDs).

**This integration run:** no successful builds — **no download links**. Blocker: `eas whoami` → not logged in.

---

## Local sanity before cloud build

```powershell
cd "C:\Users\Admin\Desktop\uber clone"
npm run build:shared
npm run typecheck
cd apps/passenger
npx expo-doctor
```

Expect **19/20** in a monorepo with Next.js admin on React 18 (duplicate React check). If native build fails on EAS, run `npm install` at root and ensure `packages/shared/dist` is produced by `prebuildCommand`.

---

## Troubleshooting

| Symptom | Action |
|---------|--------|
| *Expo user account required* | `eas login` or `EXPO_TOKEN` |
| *Invalid projectId* | Run `eas init`; set `EAS_PROJECT_ID_*` |
| *Cannot find module @almosafar/shared* | Confirm `prebuildCommand` runs `npm run build:shared` from repo root |
| Metro / duplicate React | See `QA_REPORT.md`; build from EAS uses Linux clean install |
| Firebase permission denied in APK | Set EAS env vars; deploy rules/functions; re-seed users |

---

## Version bumps

Bump `version` in each `app.config.ts` before client demos. EAS profile uses `"appVersionSource": "local"`.
