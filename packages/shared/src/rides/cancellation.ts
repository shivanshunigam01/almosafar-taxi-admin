import type { RideStatus } from "../schemas/ride";
import { canTransitionRideStatus } from "./transitions";

export interface PassengerCancellationPolicy {
  /** Statuses where passenger-initiated cancel is allowed. */
  allowedStatuses: RideStatus[];
  /** Human-readable rules for UI. */
  rules: string[];
}

export const PASSENGER_CANCELLATION_POLICY: PassengerCancellationPolicy = {
  allowedStatuses: ["requested", "accepted", "driver_arriving"],
  rules: [
    "You may cancel for free while the driver has not started the trip.",
    "Once the trip is in progress, contact demo support — cancellation is restricted.",
    "Cancelled trips are marked clearly in trip history (demo data).",
  ],
};

export function canPassengerCancelRide(status: RideStatus): {
  allowed: boolean;
  message: string;
} {
  if (!canTransitionRideStatus(status, "cancelled")) {
    return {
      allowed: false,
      message:
        status === "in_progress"
          ? "Trip already started. Cancellation is not available in the demo app."
          : "This trip can no longer be cancelled.",
    };
  }
  if (!PASSENGER_CANCELLATION_POLICY.allowedStatuses.includes(status)) {
    return {
      allowed: false,
      message: "Cancellation is not permitted at this stage.",
    };
  }
  return { allowed: true, message: "You can cancel this trip request." };
}
