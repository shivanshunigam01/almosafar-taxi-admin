import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import type { Firestore } from "firebase/firestore";
import type {
  AdminConfiguration,
  DemoActivity,
  Driver,
  FareConfiguration,
  MockPaymentRecord,
  Passenger,
  PaymentMethod,
  ServiceZone,
  TripHistoryEntry,
  Vehicle,
  VehicleCategory,
} from "../schemas/entities";
import {
  adminConfigurationSchema,
  demoActivitySchema,
  driverSchema,
  fareConfigurationSchema,
  mockPaymentRecordSchema,
  passengerSchema,
  paymentMethodSchema,
  serviceZoneSchema,
  tripHistoryEntrySchema,
  vehicleSchema,
} from "../schemas/entities";
import { operationalSettingsSchema, type OperationalSettings } from "../schemas/admin-ops";
import { getDemoSeedBundle } from "../demo/seed";
import { COLLECTIONS } from "./collections";
import { mapFirebaseError } from "./connection";

export class FirestoreCatalogRepository {
  constructor(private db: Firestore) {}

  async getDefaultZone(): Promise<ServiceZone | null> {
    try {
      const snaps = await getDocs(collection(this.db, COLLECTIONS.zones));
      if (snaps.empty) return null;
      return serviceZoneSchema.parse(snaps.docs[0].data());
    } catch (e) {
      throw mapFirebaseError(e);
    }
  }

  async listFareConfigurations(): Promise<FareConfiguration[]> {
    try {
      const snaps = await getDocs(collection(this.db, COLLECTIONS.fareConfigurations));
      return snaps.docs.map((d) => fareConfigurationSchema.parse(d.data()));
    } catch (e) {
      throw mapFirebaseError(e);
    }
  }

  async getFareConfiguration(
    zoneId: string,
    category: VehicleCategory
  ): Promise<FareConfiguration | null> {
    try {
      const q = query(
        collection(this.db, COLLECTIONS.fareConfigurations),
        where("zoneId", "==", zoneId),
        where("category", "==", category)
      );
      const snaps = await getDocs(q);
      if (snaps.empty) return null;
      return fareConfigurationSchema.parse(snaps.docs[0].data());
    } catch (e) {
      throw mapFirebaseError(e);
    }
  }

  async getPassengerByEmail(email: string): Promise<Passenger | null> {
    try {
      const normalized = email.trim().toLowerCase();
      const snaps = await getDocs(collection(this.db, COLLECTIONS.passengers));
      for (const d of snaps.docs) {
        const p = passengerSchema.parse(d.data());
        if (p.email?.toLowerCase() === normalized) return p;
      }
      return null;
    } catch (e) {
      throw mapFirebaseError(e);
    }
  }

  async getDriverByEmail(email: string): Promise<Driver | null> {
    try {
      const normalized = email.trim().toLowerCase();
      const snaps = await getDocs(collection(this.db, COLLECTIONS.drivers));
      for (const d of snaps.docs) {
        const driver = driverSchema.parse(d.data());
        if (driver.email?.toLowerCase() === normalized) return driver;
      }
      return null;
    } catch (e) {
      throw mapFirebaseError(e);
    }
  }

  async getPassenger(id: string): Promise<Passenger | null> {
    try {
      const snap = await getDoc(doc(this.db, COLLECTIONS.passengers, id));
      if (!snap.exists()) return null;
      return passengerSchema.parse(snap.data());
    } catch (e) {
      throw mapFirebaseError(e);
    }
  }

  async getDriver(id: string): Promise<Driver | null> {
    try {
      const snap = await getDoc(doc(this.db, COLLECTIONS.drivers, id));
      if (!snap.exists()) return null;
      return driverSchema.parse(snap.data());
    } catch (e) {
      throw mapFirebaseError(e);
    }
  }

  async getVehicle(id: string): Promise<Vehicle | null> {
    try {
      const snap = await getDoc(doc(this.db, COLLECTIONS.vehicles, id));
      if (!snap.exists()) return null;
      return vehicleSchema.parse(snap.data());
    } catch (e) {
      throw mapFirebaseError(e);
    }
  }

  async listPassengers(): Promise<Passenger[]> {
    try {
      const snaps = await getDocs(collection(this.db, COLLECTIONS.passengers));
      return snaps.docs.map((d) => passengerSchema.parse(d.data()));
    } catch (e) {
      throw mapFirebaseError(e);
    }
  }

  async listDrivers(): Promise<Driver[]> {
    const snaps = await getDocs(collection(this.db, COLLECTIONS.drivers));
    return snaps.docs.map((d) => driverSchema.parse(d.data()));
  }

  async listVehicles(): Promise<Vehicle[]> {
    const snaps = await getDocs(collection(this.db, COLLECTIONS.vehicles));
    return snaps.docs.map((d) => vehicleSchema.parse(d.data()));
  }

  async listTripHistory(): Promise<TripHistoryEntry[]> {
    try {
      const historySnaps = await getDocs(collection(this.db, "tripHistory"));
      if (historySnaps.empty) return getDemoSeedBundle().tripHistory;
      return historySnaps.docs.map((d) => tripHistoryEntrySchema.parse(d.data()));
    } catch (e) {
      throw mapFirebaseError(e);
    }
  }

  async listMockPayments(): Promise<MockPaymentRecord[]> {
    const snaps = await getDocs(collection(this.db, COLLECTIONS.payments));
    return snaps.docs.map((d) => mockPaymentRecordSchema.parse(d.data()));
  }

  async listActivityLogs(): Promise<DemoActivity[]> {
    const snaps = await getDocs(collection(this.db, COLLECTIONS.activityLogs));
    return snaps.docs
      .map((d) => demoActivitySchema.parse(d.data()))
      .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
  }

  async getAdminConfiguration(): Promise<AdminConfiguration | null> {
    const seed = getDemoSeedBundle();
    const snap = await getDoc(
      doc(this.db, COLLECTIONS.adminConfiguration, seed.adminConfiguration.id)
    );
    if (!snap.exists()) return null;
    return adminConfigurationSchema.parse(snap.data());
  }

  async getOperationalSettings(): Promise<OperationalSettings | null> {
    const snap = await getDoc(
      doc(this.db, COLLECTIONS.operationalSettings, "default")
    );
    if (!snap.exists()) return null;
    return operationalSettingsSchema.parse(snap.data());
  }

  async getPaymentMethods(passengerId: string): Promise<PaymentMethod[]> {
    try {
      const q = query(
        collection(this.db, COLLECTIONS.paymentMethods),
        where("passengerId", "==", passengerId)
      );
      const snaps = await getDocs(q);
      return snaps.docs.map((d) => paymentMethodSchema.parse(d.data()));
    } catch (e) {
      throw mapFirebaseError(e);
    }
  }
}
