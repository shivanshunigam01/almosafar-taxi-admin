import type { AlmosafarDataService } from "../data/types";
import type { AdminDataService, AdminFarePatch } from "./types";
import type { DriverVerificationStatus } from "../schemas/admin-ops";
import { createCallableClient } from "../firebase/callables";
import { FirestoreRideRepository } from "../repository/firestore-ride-repository";
import { FirestoreCatalogRepository } from "../firebase/firestore-catalog";
import type { CloudAuthSession } from "../firebase/auth-session";
import { getDemoSeedBundle } from "../demo/seed";
import type { FareConfiguration } from "../schemas/entities";

export class FirestoreAdminDataService implements AdminDataService {
  readonly mode = "firestore" as const;
  readonly syncLabel: string;
  readonly cloudAuth: NonNullable<AlmosafarDataService["cloudAuth"]>;

  private core: AlmosafarDataService;
  private catalog: FirestoreCatalogRepository;
  private callables: ReturnType<typeof createCallableClient>;

  constructor(core: AlmosafarDataService) {
    if (core.mode !== "firestore" || !core.cloudAuth) {
      throw new Error("FirestoreAdminDataService requires Firestore core with cloudAuth.");
    }
    if (!(core.rideRepository instanceof FirestoreRideRepository)) {
      throw new Error("Expected FirestoreRideRepository");
    }
    this.core = core;
    this.cloudAuth = core.cloudAuth;
    this.syncLabel = core.syncLabel;
    this.catalog = new FirestoreCatalogRepository(core.rideRepository.firebase.db);
    this.callables = createCallableClient(core.rideRepository.firebase.functions);
  }

  private assertAdmin() {
    const session = this.cloudAuth.getSession();
    if (!session || session.role !== "admin") {
      throw new Error("Admin sign-in required.");
    }
    return session;
  }

  async signInAdmin(email: string, password: string): Promise<CloudAuthSession> {
    const session = await this.cloudAuth.signIn(email, password);
    if (session.role !== "admin") {
      await this.cloudAuth.signOut();
      throw new Error("This account is not an administrator.");
    }
    return session;
  }

  signOutAdmin() {
    return this.cloudAuth.signOut();
  }

  getAdminSession() {
    const s = this.cloudAuth.getSession();
    return s?.role === "admin" ? s : null;
  }

  subscribeAdminSession(listener: (session: CloudAuthSession | null) => void) {
    return this.cloudAuth.subscribe((s) => {
      listener(s?.role === "admin" ? s : null);
    });
  }

  async getAdminConfiguration() {
    this.assertAdmin();
    return (await this.catalog.getAdminConfiguration()) ?? getDemoSeedBundle().adminConfiguration;
  }

  async getOperationalSettings() {
    this.assertAdmin();
    const doc = await this.catalog.getOperationalSettings();
    return doc ?? getDemoSeedBundle().operationalSettings;
  }

  updateOperationalSettings(patch: Parameters<AdminDataService["updateOperationalSettings"]>[0]) {
    this.assertAdmin();
    return this.callables.adminUpdateOperationalSettings(patch);
  }

  async listZones() {
    this.assertAdmin();
    const z = await this.catalog.getDefaultZone();
    return z ? [z] : [getDemoSeedBundle().zone];
  }

  listPassengers() {
    this.assertAdmin();
    return this.catalog.listPassengers();
  }

  listDrivers() {
    this.assertAdmin();
    return this.catalog.listDrivers();
  }

  listVehicles() {
    this.assertAdmin();
    return this.catalog.listVehicles();
  }

  listFareConfigurations() {
    this.assertAdmin();
    return this.catalog.listFareConfigurations();
  }

  async listRides(): Promise<import("../schemas/ride").Ride[]> {
    this.assertAdmin();
    if (!this.core.subscribeAllRides) return [];
    return new Promise((resolve) => {
      const unsub = this.core.subscribeAllRides!((rides) => {
        unsub();
        resolve(rides);
      });
    });
  }

  subscribeRides(listener: (rides: import("../schemas/ride").Ride[]) => void, onError?: (e: Error) => void) {
    this.assertAdmin();
    if (!this.core.subscribeAllRides) {
      listener([]);
      return () => undefined;
    }
    return this.core.subscribeAllRides(listener, onError);
  }

  listTripHistory() {
    this.assertAdmin();
    return this.catalog.listTripHistory();
  }

  listMockPayments() {
    this.assertAdmin();
    return this.catalog.listMockPayments();
  }

  listActivityLogs() {
    this.assertAdmin();
    return this.catalog.listActivityLogs();
  }

  assignDriverToRide(rideId: string, driverId: string) {
    this.assertAdmin();
    return this.callables.adminAssignDriver(rideId, driverId);
  }

  cancelRideAsAdmin(rideId: string, reason: string) {
    this.assertAdmin();
    return this.callables.adminCancelRide(rideId, reason);
  }

  async updateFareConfiguration(
    fareConfigId: string,
    patch: AdminFarePatch
  ): Promise<FareConfiguration> {
    this.assertAdmin();
    await this.callables.adminUpdateFareConfiguration(fareConfigId, { ...patch });
    const list = await this.listFareConfigurations();
    const updated = list.find((f) => f.id === fareConfigId);
    if (!updated) throw new Error("Fare config not found after update.");
    return updated;
  }

  setDriverVerification(driverId: string, status: DriverVerificationStatus) {
    this.assertAdmin();
    return this.callables.adminSetDriverVerification(driverId, status);
  }

  async exportRidesCsv(): Promise<string> {
    const rides: import("../schemas/ride").Ride[] = await this.listRides();
    const header = "rideId,status,passengerId,driverId,pickup,dropoff,requestedAt\n";
    const rows = rides
      .map(
        (r: import("../schemas/ride").Ride) =>
          `${r.id},${r.status},${r.passengerId},${r.driverId ?? ""},"${r.pickup.label}","${r.dropoff.label}",${r.requestedAt}`
      )
      .join("\n");
    return header + rows;
  }
}
