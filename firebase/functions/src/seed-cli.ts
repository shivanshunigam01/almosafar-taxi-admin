/**
 * Authorized one-time / repeatable demo seed (Admin SDK only).
 * Run locally with GOOGLE_APPLICATION_CREDENTIALS — never ship service account to apps.
 *
 * Usage (from firebase/functions after build):
 *   DEMO_SEED_PASSWORD='your-demo-password' npm run seed
 */
import { initializeApp, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getDemoSeedBundle } from "@almosafar/shared/demo";

type DemoAccount = {
  email: string;
  role: "passenger" | "driver" | "admin";
  entityId: string;
  password: string;
};

function initAdmin() {
  if (getApps().length) return;
  const projectId = process.env.GCLOUD_PROJECT ?? process.env.FIREBASE_PROJECT_ID;
  if (!projectId) {
    throw new Error("Set GCLOUD_PROJECT or FIREBASE_PROJECT_ID for seed.");
  }
  initializeApp({ projectId });
}

async function upsertAuthUser(account: DemoAccount): Promise<string> {
  const auth = getAuth();
  let user;
  try {
    user = await auth.getUserByEmail(account.email);
    await auth.updateUser(user.uid, { password: account.password });
  } catch {
    user = await auth.createUser({
      email: account.email,
      password: account.password,
      emailVerified: true,
    });
  }
  await auth.setCustomUserClaims(user.uid, {
    role: account.role,
    entityId: account.entityId,
  });
  return user.uid;
}

async function main() {
  const password = process.env.DEMO_SEED_PASSWORD;
  if (!password || password.length < 12) {
    console.error(
      "Set DEMO_SEED_PASSWORD (min 12 chars) in your shell — do not commit it."
    );
    process.exit(1);
  }

  initAdmin();
  const db = getFirestore();
  const seed = getDemoSeedBundle();

  const adminEmail =
    process.env.DEMO_ADMIN_EMAIL?.trim() || "demo.admin@almosafar.example.com";
  const adminEntityId = "demo_admin_console";

  const accounts: DemoAccount[] = [
    ...seed.passengers.map((p: (typeof seed.passengers)[number]) => ({
      email: p.email!,
      role: "passenger" as const,
      entityId: p.id,
      password,
    })),
    ...seed.drivers.map((d: (typeof seed.drivers)[number]) => ({
      email: d.email!,
      role: "driver" as const,
      entityId: d.id,
      password,
    })),
    {
      email: adminEmail,
      role: "admin" as const,
      entityId: adminEntityId,
      password,
    },
  ];

  const batch = db.batch();

  batch.set(db.collection("_meta").doc("health"), {
    ok: true,
    updatedAt: new Date().toISOString(),
    purpose: "connectivity_probe",
  });

  batch.set(db.collection("zones").doc(seed.zone.id), seed.zone);
  batch.set(db.collection("operationalSettings").doc("default"), seed.operationalSettings);
  batch.set(
    db.collection("adminConfiguration").doc(seed.adminConfiguration.id),
    seed.adminConfiguration
  );
  for (const t of seed.tripHistory) {
    batch.set(db.collection("tripHistory").doc(t.id), t);
  }
  for (const f of seed.fareConfigurations) {
    batch.set(db.collection("fareConfigurations").doc(f.id), f);
  }
  for (const p of seed.passengers) {
    batch.set(db.collection("passengers").doc(p.id), p);
  }
  for (const d of seed.drivers) {
    batch.set(db.collection("drivers").doc(d.id), d);
  }
  for (const v of seed.vehicles) {
    batch.set(db.collection("vehicles").doc(v.id), v);
  }
  for (const pm of seed.paymentMethods) {
    batch.set(db.collection("paymentMethods").doc(pm.id), pm);
  }
  for (const ride of seed.rides) {
    batch.set(db.collection("rides").doc(ride.id), ride);
  }
  for (const a of seed.activities) {
    batch.set(db.collection("activityLogs").doc(a.id), {
      ...a,
      occurredAt: a.occurredAt,
    });
  }

  await batch.commit();

  for (const account of accounts) {
    const uid = await upsertAuthUser(account);
    await db.collection("users").doc(uid).set(
      {
        uid,
        email: account.email,
        role: account.role,
        entityId: account.entityId,
        updatedAt: new Date().toISOString(),
        isDemoData: true,
      },
      { merge: true }
    );
    if (account.role === "passenger") {
      await db.collection("passengers").doc(account.entityId).set(
        { authUid: uid },
        { merge: true }
      );
    }
    if (account.role === "driver") {
      await db.collection("drivers").doc(account.entityId).set(
        { authUid: uid },
        { merge: true }
      );
    }
  }

  console.log("Seed complete. Demo accounts (password = DEMO_SEED_PASSWORD you set):");
  for (const a of accounts) {
    console.log(`  ${a.role.padEnd(10)} ${a.email}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
