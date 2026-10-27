import type { RideStatus } from "../schemas/ride";

/** Allowed transitions keyed by current status. */
export const RIDE_STATUS_TRANSITIONS: Record<RideStatus, RideStatus[]> = {
  requested: ["accepted", "rejected", "cancelled"],
  accepted: ["driver_arriving", "cancelled"],
  driver_arriving: ["in_progress", "cancelled"],
  in_progress: ["completed", "cancelled"],
  completed: [],
  rejected: [],
  cancelled: [],
};

export const RIDE_LIFECYCLE_DOC = `
Ride lifecycle (Almosafar Taxi demo)

Happy path:
  requested → accepted → driver_arriving → in_progress → completed

Exception paths:
  requested → rejected   (driver/admin declines)
  *       → cancelled    (from any non-terminal active state)

Terminal states (no further transitions):
  completed | rejected | cancelled
`.trim();

export class InvalidRideTransitionError extends Error {
  readonly from: RideStatus;
  readonly to: RideStatus;

  constructor(from: RideStatus, to: RideStatus) {
    super(`Invalid ride transition: ${from} → ${to}`);
    this.name = "InvalidRideTransitionError";
    this.from = from;
    this.to = to;
  }
}

export function canTransitionRideStatus(from: RideStatus, to: RideStatus): boolean {
  if (from === to) return false;
  return RIDE_STATUS_TRANSITIONS[from].includes(to);
}

export function assertRideTransition(from: RideStatus, to: RideStatus): void {
  if (!canTransitionRideStatus(from, to)) {
    throw new InvalidRideTransitionError(from, to);
  }
}

export function isTerminalRideStatus(status: RideStatus): boolean {
  return RIDE_STATUS_TRANSITIONS[status].length === 0;
}
