import type { CloudAuthApi } from "../data/types";
import type { DataBackendMode } from "../data/types";
import type { CloudAuthSession } from "../firebase/auth-session";
import type {
  AdminConfiguration,
  Driver,
  FareConfiguration,
  MockPaymentRecord,
  Passenger,
  ServiceZone,
  TripHistoryEntry,
  Vehicle,
} from "../schemas/entities";
import type { OperationalSettings, DriverVerificationStatus } from "../schemas/admin-ops";
import type { DemoActivity } from "../schemas/entities";
import type { Ride } from "../schemas/ride";

export interface AdminFarePatch {
  baseFareMajor?: number;
  perKmMajor?: number;
  perMinuteMajor?: number;
  minimumFareMajor?: number;
  bookingFeeMajor?: number;
  surgeMultiplier?: number;
  discountPercent?: number;
  isActive?: boolean;
}

export interface AdminDataService {
  readonly mode: DataBackendMode;
  readonly syncLabel: string;
  readonly cloudAuth?: CloudAuthApi;

  signInAdmin(email: string, password: string): Promise<CloudAuthSession>;
  signOutAdmin(): Promise<void>;
  getAdminSession(): CloudAuthSession | null;
  subscribeAdminSession(listener: (session: CloudAuthSession | null) => void): () => void;

  getAdminConfiguration(): Promise<AdminConfiguration>;
  getOperationalSettings(): Promise<OperationalSettings>;
  updateOperationalSettings(
    patch: Partial<
      Pick<
        OperationalSettings,
        | "defaultRegionLabel"
        | "defaultCurrency"
        | "driverCommissionRate"
        | "cancellationChargeMinor"
        | "peakHourRules"
        | "surgeRules"
      >
    >
  ): Promise<OperationalSettings>;

  listZones(): Promise<ServiceZone[]>;
  listPassengers(): Promise<Passenger[]>;
  listDrivers(): Promise<Driver[]>;
  listVehicles(): Promise<Vehicle[]>;
  listFareConfigurations(): Promise<FareConfiguration[]>;
  listRides(): Promise<Ride[]>;
  subscribeRides(listener: (rides: Ride[]) => void, onError?: (e: Error) => void): () => void;
  listTripHistory(): Promise<TripHistoryEntry[]>;
  listMockPayments(): Promise<MockPaymentRecord[]>;
  listActivityLogs(): Promise<DemoActivity[]>;

  assignDriverToRide(rideId: string, driverId: string): Promise<Ride>;
  cancelRideAsAdmin(rideId: string, reason: string): Promise<Ride>;
  updateFareConfiguration(fareConfigId: string, patch: AdminFarePatch): Promise<FareConfiguration>;
  setDriverVerification(
    driverId: string,
    status: DriverVerificationStatus
  ): Promise<Driver>;

  exportRidesCsv(): Promise<string>;
}
