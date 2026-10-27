import { getDemoSeedBundle } from "../demo/seed";
import { computeDriverEarnings } from "../fare/driver-earnings";
import { transitionRide } from "../rides/mutations";
import { canPassengerCancelRide } from "../rides/cancellation";
import type { Ride } from "../schemas/ride";
import type { FareConfiguration } from "../schemas/entities";
import { operationalSettingsSchema } from "../schemas/admin-ops";
import type { AdminDataService, AdminFarePatch } from "./types";
import type { DriverVerificationStatus } from "../schemas/admin-ops";
import { LOCAL_SYNC_LABEL } from "../data/config";
import type { CloudAuthSession } from "../firebase/auth-session";

type RideListener = (rides: Ride[]) => void;

export class LocalAdminDataService implements AdminDataService {
  readonly mode = "local" as const;
  readonly syncLabel = LOCAL_SYNC_LABEL;

  private seed = getDemoSeedBundle();
  private rides = new Map(this.seed.rides.map((r) => [r.id, r]));
  private drivers = new Map(this.seed.drivers.map((d) => [d.id, { ...d }]));
  private fares = new Map(this.seed.fareConfigurations.map((f) => [f.id, { ...f }]));
  private ops = operationalSettingsSchema.parse({ ...this.seed.operationalSettings });
  private activities = [...this.seed.activities];
  private rideListeners = new Set<RideListener>();
  private adminSession: CloudAuthSession | null = null;
  private sessionListeners = new Set<(s: CloudAuthSession | null) => void>();

  get cloudAuth() {
    return undefined;
  }

  async signInAdmin(email: string, _password: string): Promise<CloudAuthSession> {
    if (!email.trim().toLowerCase().includes("admin")) {
      throw new Error("Local demo: use an admin email containing “admin”.");
    }
    this.adminSession = {
      uid: "local-admin",
      role: "admin",
      entityId: "demo_admin_console",
      email: email.trim(),
    };
    this.sessionListeners.forEach((fn) => fn(this.adminSession));
    return this.adminSession;
  }

  async signOutAdmin(): Promise<void> {
    this.adminSession = null;
    this.sessionListeners.forEach((fn) => fn(null));
  }

  getAdminSession() {
    return this.adminSession;
  }

  subscribeAdminSession(listener: (session: CloudAuthSession | null) => void): () => void {
    this.sessionListeners.add(listener);
    listener(this.adminSession);
    return () => this.sessionListeners.delete(listener);
  }

  getAdminConfiguration() {
    return Promise.resolve(this.seed.adminConfiguration);
  }

  getOperationalSettings() {
    return Promise.resolve(this.ops);
  }

  async updateOperationalSettings(
    patch: Partial<typeof this.ops>
  ): Promise<typeof this.ops> {
    this.ops = operationalSettingsSchema.parse({
      ...this.ops,
      ...patch,
      updatedAt: new Date().toISOString(),
    });
    return this.ops;
  }

  listZones() {
    return Promise.resolve([this.seed.zone]);
  }

  listPassengers() {
    return Promise.resolve([...this.seed.passengers]);
  }

  listDrivers() {
    return Promise.resolve([...this.drivers.values()]);
  }

  listVehicles() {
    return Promise.resolve([...this.seed.vehicles]);
  }

  listFareConfigurations() {
    return Promise.resolve([...this.fares.values()]);
  }

  listRides() {
    return Promise.resolve(
      [...this.rides.values()].sort((a, b) => b.requestedAt.localeCompare(a.requestedAt))
    );
  }

  subscribeRides(listener: RideListener): () => void {
    this.rideListeners.add(listener);
    listener([...this.rides.values()]);
    return () => this.rideListeners.delete(listener);
  }

  private emitRides() {
    const list = [...this.rides.values()];
    this.rideListeners.forEach((fn) => fn(list));
  }

  listTripHistory() {
    return Promise.resolve([...this.seed.tripHistory]);
  }

  listMockPayments() {
    return Promise.resolve([...this.seed.mockPayments]);
  }

  listActivityLogs() {
    return Promise.resolve([...this.activities].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt)));
  }

  async assignDriverToRide(rideId: string, driverId: string): Promise<Ride> {
    const ride = this.rides.get(rideId);
    const driver = this.drivers.get(driverId);
    if (!ride || !driver?.vehicleId) throw new Error("Ride or driver not found.");
    const next = transitionRide({
      ride,
      toStatus: "accepted",
      actorId: "demo_admin_console",
      actorRole: "admin",
      driverId,
      vehicleId: driver.vehicleId,
      note: "Admin assigned driver (local demo)",
    });
    this.rides.set(rideId, next);
    this.emitRides();
    return next;
  }

  async cancelRideAsAdmin(rideId: string, reason: string): Promise<Ride> {
    const ride = this.rides.get(rideId);
    if (!ride) throw new Error("Ride not found.");
    const policy = canPassengerCancelRide(ride.status);
    if (!policy.allowed && ride.status !== "requested" && ride.status !== "accepted") {
      throw new Error("Ride cannot be cancelled in this status.");
    }
    const next = transitionRide({
      ride,
      toStatus: "cancelled",
      actorId: "demo_admin_console",
      actorRole: "admin",
      note: reason,
    });
    const withMeta = {
      ...next,
      cancellationReason: reason,
      cancelledAt: next.updatedAt,
    };
    this.rides.set(rideId, withMeta);
    this.emitRides();
    return withMeta;
  }

  async updateFareConfiguration(
    fareConfigId: string,
    patch: AdminFarePatch
  ): Promise<FareConfiguration> {
    const current = this.fares.get(fareConfigId);
    if (!current) throw new Error("Fare config not found.");
    const minor = 100;
    const next: FareConfiguration = {
      ...current,
      updatedAt: new Date().toISOString(),
      baseFareMinor:
        patch.baseFareMajor != null
          ? Math.round(patch.baseFareMajor * minor)
          : current.baseFareMinor,
      perKmMinor:
        patch.perKmMajor != null ? Math.round(patch.perKmMajor * minor) : current.perKmMinor,
      perMinuteMinor:
        patch.perMinuteMajor != null
          ? Math.round(patch.perMinuteMajor * minor)
          : current.perMinuteMinor,
      minimumFareMinor:
        patch.minimumFareMajor != null
          ? Math.round(patch.minimumFareMajor * minor)
          : current.minimumFareMinor,
      bookingFeeMinor:
        patch.bookingFeeMajor != null
          ? Math.round(patch.bookingFeeMajor * minor)
          : current.bookingFeeMinor,
      surgeMultiplier: patch.surgeMultiplier ?? current.surgeMultiplier,
      discountPercent: patch.discountPercent ?? current.discountPercent,
      isActive: patch.isActive ?? current.isActive,
    };
    this.fares.set(fareConfigId, next);
    return next;
  }

  async setDriverVerification(driverId: string, status: DriverVerificationStatus) {
    const d = this.drivers.get(driverId);
    if (!d) throw new Error("Driver not found.");
    const next = { ...d, verificationStatus: status, updatedAt: new Date().toISOString() };
    this.drivers.set(driverId, next);
    return next;
  }

  async exportRidesCsv(): Promise<string> {
    const rides = await this.listRides();
    const header = "rideId,status,passengerId,driverId,pickup,dropoff,requestedAt\n";
    const rows = rides
      .map(
        (r) =>
          `${r.id},${r.status},${r.passengerId},${r.driverId ?? ""},"${r.pickup.label}","${r.dropoff.label}",${r.requestedAt}`
      )
      .join("\n");
    return header + rows;
  }

  /** KPI helper for dashboard */
  computeSettlementPreview() {
    const completed = [...this.rides.values()].filter((r) => r.status === "completed");
    let grossMinor = 0;
    let netMinor = 0;
    const currency = this.ops.defaultCurrency;
    for (const r of completed) {
      const gross = r.fareFinal?.total ?? r.fareEstimate?.total;
      if (!gross) continue;
      grossMinor += gross.amountMinor;
      netMinor += computeDriverEarnings(gross).driverNet.amountMinor;
    }
    return { currency, grossMinor, netMinor, tripCount: completed.length };
  }
}
