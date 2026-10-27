import { httpsCallable, type Functions } from "firebase/functions";
import type { VehicleCategory } from "../schemas/entities";
import type { Ride } from "../schemas/ride";
import type { Address } from "../schemas/common";
import { parseRide } from "../validation/parse";
import { operationalSettingsSchema, type OperationalSettings } from "../schemas/admin-ops";
import { driverSchema, type Driver } from "../schemas/entities";
import type { DriverVerificationStatus } from "../schemas/admin-ops";

export function createCallableClient(functions: Functions) {
  return {
    createRideRequest: async (input: {
      zoneId: string;
      category: VehicleCategory;
      pickup: Address;
      dropoff: Address;
      paymentMethodId?: string;
    }): Promise<Ride> => {
      const fn = httpsCallable(functions, "createRideRequest");
      const res = await fn(input);
      const data = res.data as { ride: unknown };
      return parseRide(data.ride);
    },
    cancelRideAsPassenger: async (rideId: string, reason: string): Promise<Ride> => {
      const fn = httpsCallable(functions, "cancelRideAsPassenger");
      const res = await fn({ rideId, reason });
      return parseRide((res.data as { ride: unknown }).ride);
    },
    acceptRideAsDriver: async (rideId: string): Promise<Ride> => {
      const fn = httpsCallable(functions, "acceptRideAsDriver");
      const res = await fn({ rideId });
      return parseRide((res.data as { ride: unknown }).ride);
    },
    rejectRideAsDriver: async (rideId: string, note?: string): Promise<Ride> => {
      const fn = httpsCallable(functions, "rejectRideAsDriver");
      const res = await fn({ rideId, note });
      return parseRide((res.data as { ride: unknown }).ride);
    },
    transitionRideAsDriver: async (
      rideId: string,
      toStatus: Ride["status"],
      note?: string
    ): Promise<Ride> => {
      const fn = httpsCallable(functions, "transitionRideAsDriver");
      const res = await fn({ rideId, toStatus, note });
      return parseRide((res.data as { ride: unknown }).ride);
    },
    setDriverOnline: async (isOnline: boolean): Promise<boolean> => {
      const fn = httpsCallable(functions, "setDriverOnline");
      const res = await fn({ isOnline });
      return (res.data as { isOnline: boolean }).isOnline;
    },
    adminAssignDriver: async (rideId: string, driverId: string): Promise<Ride> => {
      const fn = httpsCallable(functions, "adminAssignDriver");
      const res = await fn({ rideId, driverId });
      return parseRide((res.data as { ride: unknown }).ride);
    },
    adminUpdateFareConfiguration: async (
      fareConfigId: string,
      patch: Record<string, unknown>
    ): Promise<void> => {
      const fn = httpsCallable(functions, "adminUpdateFareConfiguration");
      await fn({ fareConfigId, patch });
    },
    adminCancelRide: async (rideId: string, reason: string): Promise<Ride> => {
      const fn = httpsCallable(functions, "adminCancelRide");
      const res = await fn({ rideId, reason });
      return parseRide((res.data as { ride: unknown }).ride);
    },
    adminUpdateOperationalSettings: async (
      patch: Record<string, unknown>
    ): Promise<OperationalSettings> => {
      const fn = httpsCallable(functions, "adminUpdateOperationalSettings");
      const res = await fn({ patch });
      return operationalSettingsSchema.parse((res.data as { settings: unknown }).settings);
    },
    adminSetDriverVerification: async (
      driverId: string,
      status: DriverVerificationStatus
    ): Promise<Driver> => {
      const fn = httpsCallable(functions, "adminSetDriverVerification");
      const res = await fn({ driverId, status });
      return driverSchema.parse((res.data as { driver: unknown }).driver);
    },
  };
}

export type CallableClient = ReturnType<typeof createCallableClient>;
