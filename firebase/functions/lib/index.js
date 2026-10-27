"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminSetDriverVerification = exports.adminUpdateOperationalSettings = exports.adminCancelRide = exports.adminUpdateFareConfiguration = exports.adminAssignDriver = exports.setDriverOnline = exports.transitionRideAsDriver = exports.rejectRideAsDriver = exports.acceptRideAsDriver = exports.cancelRideAsPassenger = exports.createRideRequest = void 0;
const app_1 = require("firebase-admin/app");
const firestore_1 = require("firebase-admin/firestore");
const https_1 = require("firebase-functions/v2/https");
const shared_1 = require("@almosafar/shared");
const activity_1 = require("./activity");
const auth_context_1 = require("./auth-context");
(0, app_1.initializeApp)();
const db = (0, firestore_1.getFirestore)();
async function getFareConfig(zoneId, category) {
    const snaps = await db
        .collection("fareConfigurations")
        .where("zoneId", "==", zoneId)
        .where("category", "==", category)
        .limit(1)
        .get();
    if (snaps.empty) {
        throw new https_1.HttpsError("failed-precondition", "Fare configuration not found.");
    }
    return shared_1.fareConfigurationSchema.parse(snaps.docs[0].data());
}
exports.createRideRequest = (0, https_1.onCall)({ cors: true }, async (request) => {
    const ctx = (0, auth_context_1.requireAuthContext)(request);
    (0, auth_context_1.requireRole)(ctx, ["passenger"]);
    const data = request.data;
    if (!data?.zoneId || !data?.category || !data?.pickup || !data?.dropoff) {
        throw new https_1.HttpsError("invalid-argument", "Missing ride fields.");
    }
    const fareConfig = await getFareConfig(data.zoneId, data.category);
    const fareEstimate = (0, shared_1.estimateTripFare)({
        pickup: data.pickup,
        dropoff: data.dropoff,
        fareConfig,
    });
    const ride = (0, shared_1.buildRideRequest)({
        passengerId: ctx.entityId,
        zoneId: data.zoneId,
        category: data.category,
        pickup: data.pickup,
        dropoff: data.dropoff,
        fareEstimate,
        paymentMethodId: data.paymentMethodId,
        isDemoData: true,
    });
    ride.id = (0, shared_1.createRideId)();
    await db.collection("rides").doc(ride.id).set(ride);
    await (0, activity_1.logActivity)(`Ride requested (${ride.id})`, { rideId: ride.id, passengerId: ctx.entityId });
    return { ride };
});
exports.cancelRideAsPassenger = (0, https_1.onCall)({ cors: true }, async (request) => {
    const ctx = (0, auth_context_1.requireAuthContext)(request);
    (0, auth_context_1.requireRole)(ctx, ["passenger"]);
    const { rideId, reason } = request.data;
    if (!rideId || !reason)
        throw new https_1.HttpsError("invalid-argument", "rideId and reason required.");
    const ref = db.collection("rides").doc(rideId);
    const snap = await ref.get();
    if (!snap.exists)
        throw new https_1.HttpsError("not-found", "Ride not found.");
    const ride = snap.data();
    if (ride.passengerId !== ctx.entityId) {
        throw new https_1.HttpsError("permission-denied", "Not your ride.");
    }
    const policy = (0, shared_1.canPassengerCancelRide)(ride.status);
    if (!policy.allowed)
        throw new https_1.HttpsError("failed-precondition", policy.message);
    const next = (0, shared_1.transitionRide)({
        ride,
        toStatus: "cancelled",
        actorId: ctx.entityId,
        actorRole: "passenger",
        note: reason,
    });
    const withMeta = {
        ...next,
        cancellationReason: reason,
        cancelledAt: next.updatedAt,
    };
    await ref.set(withMeta);
    await (0, activity_1.logActivity)(`Ride cancelled (${rideId})`, { rideId });
    return { ride: withMeta };
});
exports.acceptRideAsDriver = (0, https_1.onCall)({ cors: true }, async (request) => {
    const ctx = (0, auth_context_1.requireAuthContext)(request);
    (0, auth_context_1.requireRole)(ctx, ["driver"]);
    const { rideId } = request.data;
    if (!rideId)
        throw new https_1.HttpsError("invalid-argument", "rideId required.");
    const driverSnap = await db.collection("drivers").doc(ctx.entityId).get();
    if (!driverSnap.exists)
        throw new https_1.HttpsError("failed-precondition", "Driver profile missing.");
    const driver = driverSnap.data();
    if (!driver.isOnline) {
        throw new https_1.HttpsError("failed-precondition", "Go online to accept rides.");
    }
    if (!driver.vehicleId) {
        throw new https_1.HttpsError("failed-precondition", "Driver has no vehicle.");
    }
    const ref = db.collection("rides").doc(rideId);
    const ride = await db.runTransaction(async (tx) => {
        const snap = await tx.get(ref);
        if (!snap.exists)
            throw new https_1.HttpsError("not-found", "Ride not found.");
        const current = snap.data();
        (0, shared_1.assertDriverTransition)(current, ctx.entityId, "accepted");
        const next = (0, shared_1.transitionRide)({
            ride: current,
            toStatus: "accepted",
            actorId: ctx.entityId,
            actorRole: "driver",
            driverId: ctx.entityId,
            vehicleId: driver.vehicleId,
            note: "Driver accepted (callable transaction)",
        });
        const withPin = { ...next, demoPassengerPin: (0, shared_1.generateDemoPassengerPin)() };
        tx.set(ref, withPin);
        return withPin;
    });
    await (0, activity_1.logActivity)(`Ride accepted (${rideId})`, { rideId, driverId: ctx.entityId });
    return { ride };
});
exports.rejectRideAsDriver = (0, https_1.onCall)({ cors: true }, async (request) => {
    const ctx = (0, auth_context_1.requireAuthContext)(request);
    (0, auth_context_1.requireRole)(ctx, ["driver"]);
    const { rideId, note } = request.data;
    if (!rideId)
        throw new https_1.HttpsError("invalid-argument", "rideId required.");
    const ref = db.collection("rides").doc(rideId);
    const snap = await ref.get();
    if (!snap.exists)
        throw new https_1.HttpsError("not-found", "Ride not found.");
    const ride = snap.data();
    (0, shared_1.assertDriverTransition)(ride, ctx.entityId, "rejected");
    const next = (0, shared_1.transitionRide)({
        ride,
        toStatus: "rejected",
        actorId: ctx.entityId,
        actorRole: "driver",
        note: note ?? "Driver declined",
    });
    await ref.set(next);
    return { ride: next };
});
exports.transitionRideAsDriver = (0, https_1.onCall)({ cors: true }, async (request) => {
    const ctx = (0, auth_context_1.requireAuthContext)(request);
    (0, auth_context_1.requireRole)(ctx, ["driver"]);
    const { rideId, toStatus, note } = request.data;
    if (!rideId || !toStatus)
        throw new https_1.HttpsError("invalid-argument", "rideId and toStatus required.");
    const ref = db.collection("rides").doc(rideId);
    const snap = await ref.get();
    if (!snap.exists)
        throw new https_1.HttpsError("not-found", "Ride not found.");
    const ride = snap.data();
    (0, shared_1.assertDriverTransition)(ride, ctx.entityId, toStatus);
    let next = (0, shared_1.transitionRide)({
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
        await (0, activity_1.logActivity)(`Ride completed (${rideId})`, { rideId });
    }
    return { ride: next };
});
exports.setDriverOnline = (0, https_1.onCall)({ cors: true }, async (request) => {
    const ctx = (0, auth_context_1.requireAuthContext)(request);
    (0, auth_context_1.requireRole)(ctx, ["driver"]);
    const { isOnline } = request.data;
    if (typeof isOnline !== "boolean") {
        throw new https_1.HttpsError("invalid-argument", "isOnline must be boolean.");
    }
    const ref = db.collection("drivers").doc(ctx.entityId);
    await ref.set({ isOnline, updatedAt: new Date().toISOString() }, { merge: true });
    await (0, activity_1.logActivity)(`Driver ${isOnline ? "online" : "offline"}`, { driverId: ctx.entityId });
    return { ok: true, isOnline };
});
exports.adminAssignDriver = (0, https_1.onCall)({ cors: true }, async (request) => {
    const ctx = (0, auth_context_1.requireAuthContext)(request);
    (0, auth_context_1.requireRole)(ctx, ["admin"]);
    const { rideId, driverId } = request.data;
    if (!rideId || !driverId)
        throw new https_1.HttpsError("invalid-argument", "rideId and driverId required.");
    const driverSnap = await db.collection("drivers").doc(driverId).get();
    if (!driverSnap.exists)
        throw new https_1.HttpsError("not-found", "Driver not found.");
    const vehicleId = driverSnap.data().vehicleId;
    if (!vehicleId)
        throw new https_1.HttpsError("failed-precondition", "Driver has no vehicle.");
    const ref = db.collection("rides").doc(rideId);
    const ride = await db.runTransaction(async (tx) => {
        const snap = await tx.get(ref);
        if (!snap.exists)
            throw new https_1.HttpsError("not-found", "Ride not found.");
        const current = snap.data();
        if (current.status !== "requested" && current.status !== "accepted") {
            throw new https_1.HttpsError("failed-precondition", "Ride cannot be assigned in this status.");
        }
        const next = (0, shared_1.transitionRide)({
            ride: current,
            toStatus: "accepted",
            actorId: ctx.uid,
            actorRole: "admin",
            driverId,
            vehicleId,
            note: "Admin assigned driver",
        });
        tx.set(ref, { ...next, demoPassengerPin: (0, shared_1.generateDemoPassengerPin)() });
        return next;
    });
    await (0, activity_1.logActivity)(`Admin assigned driver to ${rideId}`, { rideId, driverId });
    return { ride };
});
exports.adminUpdateFareConfiguration = (0, https_1.onCall)({ cors: true }, async (request) => {
    const ctx = (0, auth_context_1.requireAuthContext)(request);
    (0, auth_context_1.requireRole)(ctx, ["admin"]);
    const { fareConfigId, patch } = request.data;
    if (!fareConfigId || !patch) {
        throw new https_1.HttpsError("invalid-argument", "fareConfigId and patch required.");
    }
    const ref = db.collection("fareConfigurations").doc(fareConfigId);
    const snap = await ref.get();
    if (!snap.exists)
        throw new https_1.HttpsError("not-found", "Fare config not found.");
    const current = snap.data();
    const currency = current.currency;
    const minor = 100;
    const updates = {
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
    if (patch.surgeMultiplier != null) {
        updates.surgeMultiplier = patch.surgeMultiplier;
    }
    if (patch.discountPercent != null) {
        updates.discountPercent = patch.discountPercent;
    }
    if (patch.isActive != null) {
        updates.isActive = patch.isActive;
    }
    await ref.set(updates, { merge: true });
    await (0, activity_1.logActivity)(`Fare config updated (${fareConfigId})`, { fareConfigId, patch });
    return { ok: true, currency };
});
exports.adminCancelRide = (0, https_1.onCall)({ cors: true }, async (request) => {
    const ctx = (0, auth_context_1.requireAuthContext)(request);
    (0, auth_context_1.requireRole)(ctx, ["admin"]);
    const { rideId, reason } = request.data;
    if (!rideId || !reason)
        throw new https_1.HttpsError("invalid-argument", "rideId and reason required.");
    const ref = db.collection("rides").doc(rideId);
    const snap = await ref.get();
    if (!snap.exists)
        throw new https_1.HttpsError("not-found", "Ride not found.");
    const ride = snap.data();
    const next = (0, shared_1.transitionRide)({
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
    await (0, activity_1.logActivity)(`Admin cancelled ride ${rideId}`, { rideId });
    return { ride: withMeta };
});
exports.adminUpdateOperationalSettings = (0, https_1.onCall)({ cors: true }, async (request) => {
    const ctx = (0, auth_context_1.requireAuthContext)(request);
    (0, auth_context_1.requireRole)(ctx, ["admin"]);
    const { patch } = request.data;
    if (!patch)
        throw new https_1.HttpsError("invalid-argument", "patch required.");
    const ref = db.collection("operationalSettings").doc("default");
    const snap = await ref.get();
    const current = snap.exists ? snap.data() : {};
    const merged = {
        ...current,
        ...patch,
        updatedAt: new Date().toISOString(),
        id: current.id ?? "demo_ops_default",
        isDemoData: true,
    };
    await ref.set(merged, { merge: true });
    await (0, activity_1.logActivity)("Operational settings updated", { patch });
    return { settings: merged };
});
exports.adminSetDriverVerification = (0, https_1.onCall)({ cors: true }, async (request) => {
    const ctx = (0, auth_context_1.requireAuthContext)(request);
    (0, auth_context_1.requireRole)(ctx, ["admin"]);
    const { driverId, status } = request.data;
    if (!driverId || !status)
        throw new https_1.HttpsError("invalid-argument", "driverId and status required.");
    const ref = db.collection("drivers").doc(driverId);
    const snap = await ref.get();
    if (!snap.exists)
        throw new https_1.HttpsError("not-found", "Driver not found.");
    await ref.set({ verificationStatus: status, updatedAt: new Date().toISOString() }, { merge: true });
    const updated = await ref.get();
    await (0, activity_1.logActivity)(`Driver verification ${status}`, { driverId });
    return { driver: updated.data() };
});
//# sourceMappingURL=index.js.map