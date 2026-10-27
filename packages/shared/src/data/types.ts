import type { Address } from "../schemas/common";

import type { Driver, FareConfiguration, Passenger, PaymentMethod, Rating, ServiceZone, TripHistoryEntry, Vehicle, VehicleCategory } from "../schemas/entities";

import type { Ride } from "../schemas/ride";

import type { RideRepository } from "../repository/ride-repository";

import type { CloudAuthSession } from "../firebase/auth-session";



export type DataBackendMode = "local" | "firestore";



export interface CloudAuthApi {

  /** True after health probe succeeded (rules + network). Auth may still be required. */

  readonly infrastructureVerified: boolean;

  signIn(email: string, password: string): Promise<CloudAuthSession>;

  signOut(): Promise<void>;

  getSession(): CloudAuthSession | null;

  subscribe(listener: (session: CloudAuthSession | null) => void): () => void;

}



export interface RideBookingInput {

  passengerId: string;

  zoneId: string;

  category: VehicleCategory;

  pickup: Address;

  dropoff: Address;

  paymentMethodId?: string;

}



export interface AlmosafarDataService {

  readonly mode: DataBackendMode;

  readonly syncLabel: string;

  readonly rideRepository: RideRepository;

  readonly cloudAuth?: CloudAuthApi;



  getDefaultZone(): ServiceZone | Promise<ServiceZone>;

  listFareConfigurations(): Promise<FareConfiguration[]>;

  getFareConfiguration(

    zoneId: string,

    category: VehicleCategory

  ): Promise<FareConfiguration | null>;



  getPaymentMethods(passengerId: string): Promise<PaymentMethod[]>;

  setDefaultPaymentMethod(passengerId: string, paymentMethodId: string): Promise<void>;



  registerDemoPassenger(input: {

    displayName: string;

    email: string;

    phoneE164?: string;

  }): Promise<Passenger>;

  loginDemoPassenger(email: string): Promise<Passenger | null>;

  getPassenger(id: string): Promise<Passenger | null>;



  /** Preferred in cloud mode — server-side fare snapshot via Cloud Functions. */

  createRideFromBooking(input: RideBookingInput): Promise<Ride>;

  createRideRequest(ride: Ride): Promise<Ride>;

  getRide(rideId: string): Promise<Ride | null>;

  subscribeRide(

    rideId: string,

    listener: (ride: Ride | null) => void,

    onError?: (error: Error) => void

  ): () => void;

  cancelRideAsPassenger(

    rideId: string,

    passengerId: string,

    reason: string

  ): Promise<Ride>;



  listRidesForPassenger(passengerId: string): Promise<Ride[]>;

  listTripHistory(passengerId: string): Promise<TripHistoryEntry[]>;



  submitRating(rating: Rating): Promise<void>;



  getDriver(id: string): Promise<Driver | null>;

  getVehicle(id: string): Promise<Vehicle | null>;



  loginDemoDriver(email: string): Promise<Driver | null>;

  setDriverOnline(driverId: string, isOnline: boolean): Promise<void>;

  isDriverOnline(driverId: string): Promise<boolean>;



  subscribeOpenRideRequests(

    listener: (rides: Ride[]) => void,

    onError?: (error: Error) => void

  ): () => void;



  acceptRideAsDriver(params: {

    rideId: string;

    driverId: string;

    vehicleId: string;

  }): Promise<Ride>;



  rejectRideAsDriver(params: {

    rideId: string;

    driverId: string;

    note?: string;

  }): Promise<Ride>;



  transitionRideAsDriver(params: {

    rideId: string;

    driverId: string;

    toStatus: Ride["status"];

    note?: string;

  }): Promise<Ride>;



  listRidesForDriver(driverId: string): Promise<Ride[]>;



  /** Admin (cloud + signed-in admin only). */

  subscribeAllRides?(

    listener: (rides: Ride[]) => void,

    onError?: (error: Error) => void

  ): () => void;

  adminAssignDriver?(rideId: string, driverId: string): Promise<Ride>;

  adminUpdateFareConfiguration?(

    fareConfigId: string,

    patch: {

      baseFareMajor?: number;

      perKmMajor?: number;

      perMinuteMajor?: number;

      minimumFareMajor?: number;

      bookingFeeMajor?: number;

    }

  ): Promise<void>;



  startLocalDriverSimulation?(rideId: string): void;

  stopLocalDriverSimulation?(rideId: string): void;

}


