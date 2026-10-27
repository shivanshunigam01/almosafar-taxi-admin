import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import {
  assertDriverTransition,
  buildRideRequest,
  canPassengerCancelRide,
  createRideId,
  estimateTripFare,
  fareConfigurationSchema,
  generateDemoPassengerPin,
  transitionRide,
  type FareConfiguration,
  type Ride,
  type VehicleCategory,
} from "@almosafar/shared";
import { logActivity } from "./activity";
import { requireAuthContext, requireRole } from "./auth-context";

initializeApp();

const db = getFirestore();

async function getFareConfig(zoneId: string, category: VehicleCategory) {
  const snaps = await db
    .collection("fareConfigurations")
    .where("zoneId", "==", zoneId)
    .where("category", "==", category)
    .limit(1)
    .get();
  if (snaps.empty) {
    throw new HttpsError("failed-precondition", "Fare configuration not found.");
  }
  return fareConfigurationSchema.parse(snaps.docs[0].data()) as FareConfiguration;
}

export const createRideRequest = onCall({ cors: true }, async (request) => {
  const ctx = requireAuthContext(request);
  requireRole(ctx, ["passenger"]);

  const data = request.data as {
    zoneId: string;
    category: VehicleCategory;
    pickup: Ride["pickup"];
    dropoff: Ride["dropoff"];
    paymentMethodId?: string;
  };

  if (!data?.zoneId || !data?.category || !data?.pickup || !data?.dropoff) {
    throw new HttpsError("invalid-argument", "Missing ride fields.");
  }

  const fareConfig = await getFareConfig(data.zoneId, data.category);
  const fareEstimate = estimateTripFare({
    pickup: data.pickup,
    dropoff: data.dropoff,
    fareConfig,
  });

  const ride = buildRideRequest({
    passengerId: ctx.entityId,
    zoneId: data.zoneId,
    category: data.category,
    pickup: data.pickup,
    dropoff: data.dropoff,
    fareEstimate,
    paymentMethodId: data.paymentMethodId,
    isDemoData: true,
  });
  ride.id = createRideId();

  await db.collection("rides").doc(ride.id).set(ride);
  await logActivity(`Ride requested (${ride.id})`, { rideId: ride.id, passengerId: ctx.entityId });
  return { ride };
});

export const cancelRideAsPassenger = onCall({ cors: true }, async (request) => {
  const ctx = requireAuthContext(request);
  requireRole(ctx, ["passenger"]);
  const { rideId, reason } = request.data as { rideId: string; reason: string };
  if (!rideId || !reason) throw new HttpsError("invalid-argument", "rideId and reason required.");

  const ref = db.collection("rides").doc(rideId);
  const snap = await ref.get();
  if (!snap.exists) throw new HttpsError("not-found", "Ride not found.");
  const ride = snap.data() as Ride;
  if (ride.passengerId !== ctx.entityId) {
    throw new HttpsError("permission-denied", "Not your ride.");
  }
  const policy = canPassengerCancelRide(ride.status);
  if (!policy.allowed) throw new HttpsError("failed-precondition", policy.message);

  const next = transitionRide({
    ride,
    toStatus: "cancelled",
    actorId: ctx.entityId,
    actorRole: "passenger",
    note: reason,
  });
  const withMeta: Ride = {
    ...next,
    cancellationReason: reason,
    cancelledAt: next.updatedAt,
  };
  await ref.set(withMeta);
  await logActivity(`Ride cancelled (${rideId})`, { rideId });
  return { ride: withMeta };
});

export const acceptRideAsDriver = onCall({ cors: true }, async (request) => {
  const ctx = requireAuthContext(request);
  requireRole(ctx, ["driver"]);
  const { rideId } = request.data as { rideId: string };
  if (!rideId) throw new HttpsError("invalid-argument", "rideId required.");

  const driverSnap = await db.collection("drivers").doc(ctx.entityId).get();
  if (!driverSnap.exists) throw new HttpsError("failed-precondition", "Driver profile missing.");
  const driver = driverSnap.data() as { vehicleId?: string; isOnline?: boolean };
  if (!driver.isOnline) {
    throw new HttpsError("failed-precondition", "Go online to accept rides.");
  }
  if (!driver.vehicleId) {
    throw new HttpsError("failed-precondition", "Driver has no vehicle.");
  }

  const ref = db.collection("rides").doc(rideId);
  const ride = await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) throw new HttpsError("not-found", "Ride not found.");
    const current = snap.data() as Ride;
    assertDriverTransition(current, ctx.entityId, "accepted");
    const next = transitionRide({
      ride: current,
      toStatus: "accepted",
      actorId: ctx.entityId,
      actorRole: "driver",
      driverId: ctx.entityId,
      vehicleId: driver.vehicleId,
      note: "Driver accepted (callable transaction)",
    });
    const withPin = { ...next, demoPassengerPin: generateDemoPassengerPin() };
    tx.set(ref, withPin);
    return withPin;
  });

  await logActivity(`Ride accepted (${rideId})`, { rideId, driverId: ctx.entityId });
  return { ride };
});

export const rejectRideAsDriver = onCall({ cors: true }, async (request) => {
  const ctx = requireAuthContext(request);
  requireRole(ctx, ["driver"]);
  const { rideId, note } = request.data as { rideId: string; note?: string };
  if (!rideId) throw new HttpsError("invalid-argument", "rideId required.");

  const ref = db.collection("rides").doc(rideId);
  const snap = await ref.get();
  if (!snap.exists) throw new HttpsError("not-found", "Ride not found.");
  const ride = snap.data() as Ride;
  assertDriverTransition(ride, ctx.entityId, "rejected");
  const next = transitionRide({
    ride,
    toStatus: "rejected",
    actorId: ctx.entityId,
    actorRole: "driver",
    note: note ?? "Driver declined",
  });
  await ref.set(next);
  return { ride: next };
});

export const transitionRideAsDriver = onCall({ cors: true }, async (request) => {
  const ctx = requireAuthContext(request);
  requireRole(ctx, ["driver"]);
  const { rideId, toStatus, note } = request.data as {
    rideId: string;
    toStatus: Ride["status"];
    note?: string;
  };
  if (!rideId || !toStatus) throw new HttpsError("invalid-argument", "rideId and toStatus required.");

  const ref = db.collection("rides").doc(rideId);
  const snap = await ref.get();
  if (!snap.exists) throw new HttpsError("not-found", "Ride not found.");
  const ride = snap.data() as Ride;
  assertDriverTransition(ride, ctx.entityId, toStatus);
  let next = transitionRide({
    ride,
    toStatus,
    actorId: ctx.entityId,
    actorRole: "driver",
    note,
  });
  if (toStatus === "completed") {
    next = {
      ...next,
      fareFinal: next.fareEstimate,
      completedAt: next.updatedAt,
    };
  }
  if (toStatus === "in_progress") {
    next = { ...next, driverLiveLocation: ride.pickup.geo };
  }
  await ref.set(next);
  if (toStatus === "completed") {
    await logActivity(`Ride completed (${rideId})`, { rideId });
  }
  return { ride: next };
});

export const setDriverOnline = onCall({ cors: true }, async (request) => {
  const ctx = requireAuthContext(request);
  requireRole(ctx, ["driver"]);
  const { isOnline } = request.data as { isOnline: boolean };
  if (typeof isOnline !== "boolean") {
    throw new HttpsError("invalid-argument", "isOnline must be boolean.");
  }
  const ref = db.collection("drivers").doc(ctx.entityId);
  await ref.set(
    { isOnline, updatedAt: new Date().toISOString() },
    { merge: true }
  );
  await logActivity(`Driver ${isOnline ? "online" : "offline"}`, { driverId: ctx.entityId });
  return { ok: true, isOnline };
});

export const adminAssignDriver = onCall({ cors: true }, async (request) => {
  const ctx = requireAuthContext(request);
  requireRole(ctx, ["admin"]);
  const { rideId, driverId } = request.data as { rideId: string; driverId: string };
  if (!rideId || !driverId) throw new HttpsError("invalid-argument", "rideId and driverId required.");

  const driverSnap = await db.collection("drivers").doc(driverId).get();
  if (!driverSnap.exists) throw new HttpsError("not-found", "Driver not found.");
  const vehicleId = (driverSnap.data() as { vehicleId?: string }).vehicleId;
  if (!vehicleId) throw new HttpsError("failed-precondition", "Driver has no vehicle.");

  const ref = db.collection("rides").doc(rideId);
  const ride = await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) throw new HttpsError("not-found", "Ride not found.");
    const current = snap.data() as Ride;
    if (current.status !== "requested" && current.status !== "accepted") {
      throw new HttpsError("failed-precondition", "Ride cannot be assigned in this status.");
    }
    const next = transitionRide({
      ride: current,
      toStatus: "accepted",
      actorId: ctx.uid,
      actorRole: "admin",
      driverId,
      vehicleId,
      note: "Admin assigned driver",
    });
    tx.set(ref, { ...next, demoPassengerPin: generateDemoPassengerPin() });
    return next;
  });

  await logActivity(`Admin assigned driver to ${rideId}`, { rideId, driverId });
  return { ride };
});

export const adminUpdateFareConfiguration = onCall({ cors: true }, async (request) => {
  const ctx = requireAuthContext(request);
  requireRole(ctx, ["admin"]);
  const { fareConfigId, patch } = request.data as {
    fareConfigId: string;
    patch: {
      baseFareMajor?: number;
      perKmMajor?: number;
      perMinuteMajor?: number;
      minimumFareMajor?: number;
      bookingFeeMajor?: number;
    };
  };
  if (!fareConfigId || !patch) {
    throw new HttpsError("invalid-argument", "fareConfigId and patch required.");
  }

  const ref = db.collection("fareConfigurations").doc(fareConfigId);
  const snap = await ref.get();
  if (!snap.exists) throw new HttpsError("not-found", "Fare config not found.");
  const current = snap.data() as Record<string, unknown>;
  const currency = current.currency as string;
  const minor = 100;

  const updates: Record<string, unknown> = {
    updatedAt: new Date().toISOString(),
  };
  if (patch.baseFareMajor != null) {
    updates.baseFareMinor = Math.round(patch.baseFareMajor * minor);
  }
  if (patch.perKmMajor != null) {
    updates.perKmMinor = Math.round(patch.perKmMajor * minor);
  }
  if (patch.perMinuteMajor != null) {
    updates.perMinuteMinor = Math.round(patch.perMinuteMajor * minor);
  }
  if (patch.minimumFareMajor != null) {
    updates.minimumFareMinor = Math.round(patch.minimumFareMajor * minor);
  }
  if (patch.bookingFeeMajor != null) {
    updates.bookingFeeMinor = Math.round(patch.bookingFeeMajor * minor);
  }

  if ((patch as { surgeMultiplier?: number }).surgeMultiplier != null) {
    updates.surgeMultiplier = (patch as { surgeMultiplier: number }).surgeMultiplier;
  }
  if ((patch as { discountPercent?: number }).discountPercent != null) {
    updates.discountPercent = (patch as { discountPercent: number }).discountPercent;
  }
  if ((patch as { isActive?: boolean }).isActive != null) {
    updates.isActive = (patch as { isActive: boolean }).isActive;
  }

  await ref.set(updates, { merge: true });
  await logActivity(`Fare config updated (${fareConfigId})`, { fareConfigId, patch });
  return { ok: true, currency };
});

export const adminCancelRide = onCall({ cors: true }, async (request) => {
  const ctx = requireAuthContext(request);
  requireRole(ctx, ["admin"]);
  const { rideId, reason } = request.data as { rideId: string; reason: string };
  if (!rideId || !reason) throw new HttpsError("invalid-argument", "rideId and reason required.");

  const ref = db.collection("rides").doc(rideId);
  const snap = await ref.get();
  if (!snap.exists) throw new HttpsError("not-found", "Ride not found.");
  const ride = snap.data() as Ride;
  const next = transitionRide({
    ride,
    toStatus: "cancelled",
    actorId: ctx.uid,
    actorRole: "admin",
    note: reason,
  });
  const withMeta = {
    ...next,
    cancellationReason: reason,
    cancelledAt: next.updatedAt,
  };
  await ref.set(withMeta);
  await logActivity(`Admin cancelled ride ${rideId}`, { rideId });
  return { ride: withMeta };
});

export const adminUpdateOperationalSettings = onCall({ cors: true }, async (request) => {
  const ctx = requireAuthContext(request);
  requireRole(ctx, ["admin"]);
  const { patch } = request.data as { patch: Record<string, unknown> };
  if (!patch) throw new HttpsError("invalid-argument", "patch required.");

  const ref = db.collection("operationalSettings").doc("default");
  const snap = await ref.get();
  const current = snap.exists ? snap.data() : {};
  const merged = {
    ...current,
    ...patch,
    updatedAt: new Date().toISOString(),
    id: (current as { id?: string }).id ?? "demo_ops_default",
    isDemoData: true,
  };
  await ref.set(merged, { merge: true });
  await logActivity("Operational settings updated", { patch });
  return { settings: merged };
});

export const adminSetDriverVerification = onCall({ cors: true }, async (request) => {
  const ctx = requireAuthContext(request);
  requireRole(ctx, ["admin"]);
  const { driverId, status } = request.data as {
    driverId: string;
    status: "pending" | "verified" | "rejected";
  };
  if (!driverId || !status) throw new HttpsError("invalid-argument", "driverId and status required.");

  const ref = db.collection("drivers").doc(driverId);
  const snap = await ref.get();
  if (!snap.exists) throw new HttpsError("not-found", "Driver not found.");
  await ref.set(
    { verificationStatus: status, updatedAt: new Date().toISOString() },
    { merge: true }
  );
  const updated = await ref.get();
  await logActivity(`Driver verification ${status}`, { driverId });
  return { driver: updated.data() };
});
