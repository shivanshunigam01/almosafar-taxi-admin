import { createDemoId } from "../constants/ids";
import type { Address } from "../schemas/common";
import type { VehicleCategory } from "../schemas/entities";
import type { Ride, RideFareBreakdown } from "../schemas/ride";
import { rideSchema } from "../schemas/ride";

export function createRideId(): string {
  return createDemoId(`ride_${Date.now()}`);
}

export function buildRideRequest(params: {
  passengerId: string;
  zoneId: string;
  category: VehicleCategory;
  pickup: Address;
  dropoff: Address;
  fareEstimate: RideFareBreakdown;
  paymentMethodId?: string;
  isDemoData?: boolean;
}): Ride {
  const now = new Date().toISOString();
  const ride: Ride = {
    id: createRideId(),
    passengerId: params.passengerId,
    zoneId: params.zoneId,
    category: params.category,
    status: "requested",
    pickup: params.pickup,
    dropoff: params.dropoff,
    statusHistory: [
      {
        status: "requested",
        at: now,
        actorId: params.passengerId,
        actorRole: "passenger",
        note: "Ride requested",
      },
    ],
    fareEstimate: params.fareEstimate,
    paymentMethodId: params.paymentMethodId,
    requestedAt: now,
    updatedAt: now,
    isDemoData: params.isDemoData ?? true,
  };
  return rideSchema.parse(ride);
}
