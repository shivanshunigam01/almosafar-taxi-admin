import type { Ride, RideStatus } from "../schemas/ride";
import { assertRideTransition, canTransitionRideStatus } from "./transitions";

export class DriverAuthorizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DriverAuthorizationError";
  }
}

export class RideClaimError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RideClaimError";
  }
}

/** Statuses a driver may advance on an assigned ride. */
export const DRIVER_ACTION_STATUSES: RideStatus[] = [
  "driver_arriving",
  "in_progress",
  "completed",
];

export function assertDriverAssigned(ride: Ride, driverId: string): void {
  if (!ride.driverId) {
    throw new DriverAuthorizationError("Ride has no assigned driver.");
  }
  if (ride.driverId !== driverId) {
    throw new DriverAuthorizationError("You are not assigned to this ride.");
  }
}

export function assertDriverTransition(
  ride: Ride,
  driverId: string,
  toStatus: RideStatus
): void {
  if (toStatus === "rejected") {
    if (ride.status !== "requested") {
      throw new DriverAuthorizationError("Can only reject open requests.");
    }
    return;
  }
  if (toStatus === "accepted") {
    if (ride.status !== "requested") {
      throw new RideClaimError("Ride is no longer available.");
    }
    if (ride.driverId) {
      throw new RideClaimError("Ride already claimed by another driver.");
    }
    return;
  }
  assertDriverAssigned(ride, driverId);
  if (!canTransitionRideStatus(ride.status, toStatus)) {
    assertRideTransition(ride.status, toStatus);
  }
}

export function generateDemoPassengerPin(): string {
  return String(1000 + Math.floor(Math.random() * 9000));
}
