# Release checklist — Almosafar Taxi demo

Use before handing APKs + admin URL to client stakeholders.

---

## 1. Repository health

- [ ] `npm install` at repo root succeeds
- [ ] `npm run build:shared` passes
- [ ] `npm run test` — **7/7** tests pass
- [ ] `npm run typecheck` — all workspaces pass
- [ ] `npm run build -w @almosafar/admin` passes
- [ ] `npm run build --prefix firebase/functions` passes
- [ ] `npx expo-doctor` in `apps/passenger` and `apps/driver` — document if **19/20** (monorepo React)

---

## 2. Firebase (connected demo)

- [ ] Firebase project created; Auth email/password enabled
- [ ] `firebase deploy` — rules, indexes, functions (`npm run firebase:deploy`)
- [ ] Seed run with service account + `DEMO_SEED_PASSWORD` (`npm run firebase:seed`)
- [ ] `apps/passenger/.env` and `apps/driver/.env` — `EXPO_PUBLIC_FIREBASE_*`
- [ ] `apps/admin/.env.local` — `NEXT_PUBLIC_FIREBASE_*`
- [ ] `FIREBASE_E2E_CHECKLIST.md` completed on two devices + browser

---

## 3. EAS / Android APKs

- [ ] `eas login` or `EXPO_TOKEN` configured
- [ ] `eas init` — passenger project ID → `EAS_PROJECT_ID_PASSENGER`
- [ ] `eas init` — driver project ID → `EAS_PROJECT_ID_DRIVER`
- [ ] Android credentials configured in EAS
- [ ] `eas build -p android --profile passenger-apk` — **Finished** + artifact URL recorded
- [ ] `eas build -p android --profile driver-apk` — **Finished** + artifact URL recorded
- [ ] APKs installed on test devices; cold start smoke test
- [ ] Package IDs verified: `com.almosafar.taxi.passenger`, `com.almosafar.taxi.driver`

**Do not** mark APKs released without EAS **successful** build status.

---

## 4. Admin deployment

- [ ] Production env vars set on host (`NEXT_PUBLIC_FIREBASE_*`, demo flag if needed)
- [ ] `next build` on CI or locally matches deployed commit
- [ ] `/login` — admin seed user works in Firebase mode
- [ ] HTTPS URL shared with client

---

## 5. Security & secrets

- [ ] No service account JSON in git
- [ ] No `DEMO_SEED_PASSWORD` in repo or APK
- [ ] Firestore rules deny client writes on `rides`, `users`, fare tampering
- [ ] Demo accounts rotated or project isolated for non-prod

---

## 6. Client documentation bundle

- [ ] `CLIENT_DEMO_GUIDE.md` — modes and script
- [ ] `APK_BUILD_GUIDE.md` — rebuild instructions
- [ ] `FIREBASE_SETUP.md` — ops handoff
- [ ] `QA_REPORT.md` — latest automated run date
- [ ] This checklist archived with build URLs and version numbers

---

## 7. Versioning

- [ ] `version` in passenger/driver `app.config.ts` bumped for release
- [ ] Changelog or tag noted (if using git tags)

---

## Sign-off

| Role | Name | Date | Notes |
|------|------|------|-------|
| Engineering | | | |
| QA | | | |
| Client demo | | | |

**Last automated integration (agent):** 2026-10-27 — tests/builds pass; **APKs not built** (EAS auth required).
