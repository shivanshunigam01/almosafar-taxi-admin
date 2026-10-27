import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  where,
  type Firestore,
} from "firebase/firestore";
import type { Ride } from "../schemas/ride";
import { parseRide } from "../validation/parse";
import type { FirebaseClientConfig } from "../data/config";
import { FIRESTORE_SYNC_LABEL } from "../data/config";
import { COLLECTIONS } from "../firebase/collections";
import { probeFirestoreHealth, mapFirebaseError } from "../firebase/connection";
import { getOrInitFirebaseClient, type FirebaseClientBundle } from "../firebase/client";
import { createCallableClient, type CallableClient } from "../firebase/callables";
import { CloudConnectionError, type RideRepository } from "./ride-repository";

export class FirestoreRideRepository implements RideRepository {
  readonly mode = "firestore" as const;
  readonly syncLabel = FIRESTORE_SYNC_LABEL;

  private bundle: FirebaseClientBundle;
  private db: Firestore;
  private callables: CallableClient;

  constructor(config: FirebaseClientConfig) {
    this.bundle = getOrInitFirebaseClient(config);
    this.db = this.bundle.db;
    this.callables = createCallableClient(this.bundle.functions);
  }

  get firebase(): FirebaseClientBundle {
    return this.bundle;
  }

  async verifyConnection(): Promise<void> {
    await probeFirestoreHealth(this.db);
  }

  async createRideRequest(_ride: Ride): Promise<Ride> {
    throw new CloudConnectionError(
      "Direct ride writes are disabled. Use createRideFromBooking via Cloud Functions."
    );
  }

  /** Secure ride creation with server-side fare snapshot. */
  async createRideFromBooking(input: {
    passengerId: string;
    zoneId: string;
    category: Ride["category"];
    pickup: Ride["pickup"];
    dropoff: Ride["dropoff"];
    paymentMethodId?: string;
  }): Promise<Ride> {
    void input.passengerId;
    try {
      return await this.callables.createRideRequest({
        zoneId: input.zoneId,
        category: input.category,
        pickup: input.pickup,
        dropoff: input.dropoff,
        paymentMethodId: input.paymentMethodId,
      });
    } catch (err) {
      throw mapFirebaseError(err);
    }
  }

  async getRide(rideId: string): Promise<Ride | null> {
    try {
      const snap = await getDoc(doc(this.db, COLLECTIONS.rides, rideId));
      if (!snap.exists()) return null;
      return parseRide(snap.data());
    } catch (err) {
      throw mapFirebaseError(err);
    }
  }

  subscribeRide(
    rideId: string,
    listener: (ride: Ride | null) => void,
    onError?: (error: Error) => void
  ): () => void {
    return onSnapshot(
      doc(this.db, COLLECTIONS.rides, rideId),
      (snap) => {
        if (!snap.exists()) {
          listener(null);
          return;
        }
        try {
          listener(parseRide(snap.data()));
        } catch (e) {
          onError?.(e instanceof Error ? e : new Error("Invalid ride payload"));
        }
      },
      (err) => onError?.(mapFirebaseError(err))
    );
  }

  async cancelRideAsPassenger(
    rideId: string,
    _passengerId: string,
    reason: string
  ): Promise<Ride> {
    try {
      return await this.callables.cancelRideAsPassenger(rideId, reason);
    } catch (err) {
      throw mapFirebaseError(err);
    }
  }

  async setDriverOnline(driverId: string, isOnline: boolean): Promise<void> {
    try {
      await this.callables.setDriverOnline(isOnline);
      void driverId;
    } catch (err) {
      throw mapFirebaseError(err);
    }
  }

  async isDriverOnline(driverId: string): Promise<boolean> {
    try {
      const snap = await getDoc(doc(this.db, COLLECTIONS.drivers, driverId));
      if (!snap.exists()) return false;
      return !!(snap.data() as { isOnline?: boolean }).isOnline;
    } catch (err) {
      throw mapFirebaseError(err);
    }
  }

  subscribeOpenRideRequests(
    listener: (rides: Ride[]) => void,
    onError?: (error: Error) => void
  ): () => void {
    const q = query(
      collection(this.db, COLLECTIONS.rides),
      where("status", "==", "requested")
    );
    return onSnapshot(
      q,
      (snap) => {
        const rides: Ride[] = [];
        snap.forEach((s) => {
          try {
            const ride = parseRide(s.data());
            if (!ride.driverId) rides.push(ride);
          } catch {
            /* skip */
          }
        });
        listener(rides.sort((a, b) => a.requestedAt.localeCompare(b.requestedAt)));
      },
      (err) => onError?.(mapFirebaseError(err))
    );
  }

  async acceptRideAsDriver(params: {
    rideId: string;
    driverId: string;
    vehicleId: string;
  }): Promise<Ride> {
    void params.driverId;
    void params.vehicleId;
    try {
      return await this.callables.acceptRideAsDriver(params.rideId);
    } catch (err) {
      throw mapFirebaseError(err);
    }
  }

  async rejectRideAsDriver(params: {
    rideId: string;
    driverId: string;
    note?: string;
  }): Promise<Ride> {
    void params.driverId;
    try {
      return await this.callables.rejectRideAsDriver(params.rideId, params.note);
    } catch (err) {
      throw mapFirebaseError(err);
    }
  }

  async transitionRideAsDriver(params: {
    rideId: string;
    driverId: string;
    toStatus: Ride["status"];
    note?: string;
  }): Promise<Ride> {
    void params.driverId;
    try {
      return await this.callables.transitionRideAsDriver(
        params.rideId,
        params.toStatus,
        params.note
      );
    } catch (err) {
      throw mapFirebaseError(err);
    }
  }

  async listRidesForDriver(driverId: string): Promise<Ride[]> {
    try {
      const q = query(
        collection(this.db, COLLECTIONS.rides),
        where("driverId", "==", driverId)
      );
      const snaps = await getDocs(q);
      const rides: Ride[] = [];
      snaps.forEach((s) => {
        try {
          rides.push(parseRide(s.data()));
        } catch {
          /* skip */
        }
      });
      return rides.sort((a, b) => b.requestedAt.localeCompare(a.requestedAt));
    } catch (err) {
      throw mapFirebaseError(err);
    }
  }

  async listRidesForPassenger(passengerId: string): Promise<Ride[]> {
    try {
      const q = query(
        collection(this.db, COLLECTIONS.rides),
        where("passengerId", "==", passengerId)
      );
      const snaps = await getDocs(q);
      const rides: Ride[] = [];
      snaps.forEach((s) => {
        try {
          rides.push(parseRide(s.data()));
        } catch {
          /* skip */
        }
      });
      return rides.sort((a, b) => b.requestedAt.localeCompare(a.requestedAt));
    } catch (err) {
      throw mapFirebaseError(err);
    }
  }
}
