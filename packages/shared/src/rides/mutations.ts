import type { Ride, RideStatus, RideStatusHistoryEntry } from "../schemas/ride";
import { rideSchema } from "../schemas/ride";
import { assertRideTransition } from "./transitions";

export interface TransitionRideParams {
  ride: Ride;
  toStatus: RideStatus;
  at?: string;
  actorId?: string;
  actorRole?: RideStatusHistoryEntry["actorRole"];
  note?: string;
  driverId?: string;
  vehicleId?: string;
}

export function transitionRide(params: TransitionRideParams): Ride {
  const {
    ride,
    toStatus,
    at = new Date().toISOString(),
    actorId,
    actorRole,
    note,
    driverId,
    vehicleId,
  } = params;

  assertRideTransition(ride.status, toStatus);

  const historyEntry: RideStatusHistoryEntry = {
    status: toStatus,
    at,
    actorId,
    actorRole,
    note,
  };

  const next: Ride = {
    ...ride,
    status: toStatus,
    updatedAt: at,
    statusHistory: [...ride.statusHistory, historyEntry],
    driverId: driverId ?? ride.driverId,
    vehicleId: vehicleId ?? ride.vehicleId,
  };

  if (toStatus === "completed") {
    next.completedAt = at;
  }
  if (toStatus === "cancelled") {
    next.cancelledAt = at;
  }

  return rideSchema.parse(next);
}
