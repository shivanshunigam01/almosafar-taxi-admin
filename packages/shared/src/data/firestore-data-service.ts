import { collection, onSnapshot } from "firebase/firestore";
import type {
  Driver,
  FareConfiguration,
  Passenger,
  PaymentMethod,
  Rating,
  ServiceZone,
  TripHistoryEntry,
  Vehicle,
  VehicleCategory,
} from "../schemas/entities";
import type { Ride } from "../schemas/ride";
import type { RideRepository } from "../repository/ride-repository";
import { FirestoreRideRepository } from "../repository/firestore-ride-repository";
import { FIRESTORE_SYNC_LABEL } from "./config";
import type { AlmosafarDataService, CloudAuthApi, RideBookingInput } from "./types";
import { FirestoreCatalogRepository } from "../firebase/firestore-catalog";
import {
  signInWithDemoCredentials,
  signOutCloud,
  subscribeCloudAuth,
  type CloudAuthSession,
} from "../firebase/auth-session";
import { createCallableClient } from "../firebase/callables";
import { parseRide } from "../validation/parse";
import { COLLECTIONS } from "../firebase/collections";
import { mapFirebaseError } from "../firebase/connection";
import { LocalDemoDataService } from "./local-data-service";
import { getDemoSeedBundle } from "../demo/seed";

export function getBundledDemoSeed() {
  return getDemoSeedBundle();
}

export class FirestoreDataService implements AlmosafarDataService {
  readonly mode = "firestore" as const;
  readonly syncLabel = FIRESTORE_SYNC_LABEL;
  readonly rideRepository: RideRepository;
  readonly cloudAuth: CloudAuthApi;

  private catalog: FirestoreCatalogRepository;
  private firestoreRepo: FirestoreRideRepository;
  private session: CloudAuthSession | null = null;
  private infrastructureVerified = false;
  private localFallback: LocalDemoDataService;

  constructor(rideRepository: RideRepository) {
    if (!(rideRepository instanceof FirestoreRideRepository)) {
      throw new Error("FirestoreDataService requires FirestoreRideRepository");
    }
    this.firestoreRepo = rideRepository;
    this.rideRepository = rideRepository;
    this.catalog = new FirestoreCatalogRepository(rideRepository.firebase.db);
    this.localFallback = new LocalDemoDataService();

    const auth = rideRepository.firebase.auth;
    const self = this;
    this.cloudAuth = {
      get infrastructureVerified() {
        return self.infrastructureVerified;
      },
      signIn: async (email: string, password: string) => {
        const session = await signInWithDemoCredentials(auth, email, password);
        self.session = session;
        return session;
      },
      signOut: async () => {
        self.session = null;
        await signOutCloud(auth);
      },
      getSession: () => self.session,
      subscribe: (listener) =>
        subscribeCloudAuth(auth, (s) => {
          self.session = s;
          listener(s);
        }),
    };
  }

  async verifyCloudConnection(): Promise<void> {
    await this.rideRepository.verifyConnection?.();
    this.infrastructureVerified = true;
  }

  async getDefaultZone(): Promise<ServiceZone> {
    const zone = await this.catalog.getDefaultZone();
    if (zone) return zone;
    return this.localFallback.getDefaultZone();
  }

  listFareConfigurations(): Promise<FareConfiguration[]> {
    return this.catalog.listFareConfigurations();
  }

  getFareConfiguration(
    zoneId: string,
    category: VehicleCategory
  ): Promise<FareConfiguration | null> {
    return this.catalog.getFareConfiguration(zoneId, category);
  }

  getPaymentMethods(passengerId: string): Promise<PaymentMethod[]> {
    return this.catalog.getPaymentMethods(passengerId);
  }

  async setDefaultPaymentMethod(
    passengerId: string,
    paymentMethodId: string
  ): Promise<void> {
    return this.localFallback.setDefaultPaymentMethod(passengerId, paymentMethodId);
  }

  registerDemoPassenger(input: {
    displayName: string;
    email: string;
    phoneE164?: string;
  }): Promise<Passenger> {
    return this.localFallback.registerDemoPassenger(input);
  }

  loginDemoPassenger(email: string): Promise<Passenger | null> {
    return this.catalog.getPassengerByEmail(email);
  }

  getPassenger(id: string): Promise<Passenger | null> {
    return this.catalog.getPassenger(id);
  }

  async createRideFromBooking(input: RideBookingInput): Promise<Ride> {
    return this.firestoreRepo.createRideFromBooking(input);
  }

  createRideRequest(_ride: Ride): Promise<Ride> {
    return this.rideRepository.createRideRequest(_ride);
  }

  getRide(rideId: string): Promise<Ride | null> {
    return this.rideRepository.getRide(rideId);
  }

  subscribeRide(
    rideId: string,
    listener: (ride: Ride | null) => void,
    onError?: (error: Error) => void
  ): () => void {
    return this.rideRepository.subscribeRide(rideId, listener, onError);
  }

  cancelRideAsPassenger(
    rideId: string,
    passengerId: string,
    reason: string
  ): Promise<Ride> {
    void passengerId;
    return this.rideRepository.cancelRideAsPassenger(rideId, passengerId, reason);
  }

  listRidesForPassenger(passengerId: string): Promise<Ride[]> {
    return this.rideRepository.listRidesForPassenger(passengerId);
  }

  listTripHistory(passengerId: string): Promise<TripHistoryEntry[]> {
    return this.localFallback.listTripHistory(passengerId);
  }

  submitRating(rating: Rating): Promise<void> {
    return this.localFallback.submitRating(rating);
  }

  getDriver(id: string): Promise<Driver | null> {
    return this.catalog.getDriver(id);
  }

  getVehicle(id: string): Promise<Vehicle | null> {
    return this.catalog.getVehicle(id);
  }

  loginDemoDriver(email: string): Promise<Driver | null> {
    return this.catalog.getDriverByEmail(email);
  }

  setDriverOnline(driverId: string, isOnline: boolean): Promise<void> {
    return this.rideRepository.setDriverOnline(driverId, isOnline);
  }

  isDriverOnline(driverId: string): Promise<boolean> {
    return this.rideRepository.isDriverOnline(driverId);
  }

  subscribeOpenRideRequests(
    listener: (rides: Ride[]) => void,
    onError?: (error: Error) => void
  ): () => void {
    return this.rideRepository.subscribeOpenRideRequests(listener, onError);
  }

  acceptRideAsDriver(params: {
    rideId: string;
    driverId: string;
    vehicleId: string;
  }): Promise<Ride> {
    return this.rideRepository.acceptRideAsDriver(params);
  }

  rejectRideAsDriver(params: {
    rideId: string;
    driverId: string;
    note?: string;
  }): Promise<Ride> {
    return this.rideRepository.rejectRideAsDriver(params);
  }

  transitionRideAsDriver(params: {
    rideId: string;
    driverId: string;
    toStatus: Ride["status"];
    note?: string;
  }): Promise<Ride> {
    return this.rideRepository.transitionRideAsDriver(params);
  }

  listRidesForDriver(driverId: string): Promise<Ride[]> {
    return this.rideRepository.listRidesForDriver(driverId);
  }

  subscribeAllRides(
    listener: (rides: Ride[]) => void,
    onError?: (error: Error) => void
  ): () => void {
    const db = this.firestoreRepo.firebase.db;
    return onSnapshot(
      collection(db, COLLECTIONS.rides),
      (snap) => {
        const rides: Ride[] = [];
        snap.forEach((s) => {
          try {
            rides.push(parseRide(s.data()));
          } catch {
            /* skip */
          }
        });
        listener(rides.sort((a, b) => b.requestedAt.localeCompare(a.requestedAt)));
      },
      (err) => onError?.(mapFirebaseError(err))
    );
  }

  async adminAssignDriver(rideId: string, driverId: string): Promise<Ride> {
    const callables = createCallableClient(this.firestoreRepo.firebase.functions);
    return callables.adminAssignDriver(rideId, driverId);
  }

  async adminUpdateFareConfiguration(
    fareConfigId: string,
    patch: {
      baseFareMajor?: number;
      perKmMajor?: number;
      perMinuteMajor?: number;
      minimumFareMajor?: number;
      bookingFeeMajor?: number;
    }
  ): Promise<void> {
    const callables = createCallableClient(this.firestoreRepo.firebase.functions);
    await callables.adminUpdateFareConfiguration(fareConfigId, patch);
  }
}
