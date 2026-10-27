import { z } from "zod";
import {
  addressSchema,
  entityIdSchema,
  isoTimestampSchema,
  moneySchema,
} from "./common";
import { vehicleCategorySchema } from "./entities";

/**
 * Documented ride lifecycle (happy path):
 * requested → accepted → driver_arriving → in_progress → completed
 *
 * Terminal / exceptional: rejected, cancelled
 */
export const rideStatusSchema = z.enum([
  "requested",
  "accepted",
  "driver_arriving",
  "in_progress",
  "completed",
  "rejected",
  "cancelled",
]);

export type RideStatus = z.infer<typeof rideStatusSchema>;

export const ACTIVE_RIDE_STATUSES: RideStatus[] = [
  "requested",
  "accepted",
  "driver_arriving",
  "in_progress",
];

export const TERMINAL_RIDE_STATUSES: RideStatus[] = [
  "completed",
  "rejected",
  "cancelled",
];

export const rideStatusHistoryEntrySchema = z.object({
  status: rideStatusSchema,
  at: isoTimestampSchema,
  actorId: entityIdSchema.optional(),
  actorRole: z.enum(["passenger", "driver", "admin", "system"]).optional(),
  note: z.string().max(500).optional(),
});

export type RideStatusHistoryEntry = z.infer<typeof rideStatusHistoryEntrySchema>;

export const rideFareBreakdownSchema = z.object({
  baseFare: moneySchema,
  distanceComponent: moneySchema,
  timeComponent: moneySchema,
  bookingFee: moneySchema,
  surgeComponent: moneySchema.optional(),
  discountComponent: moneySchema.optional(),
  total: moneySchema,
  distanceKm: z.number().nonnegative(),
  durationMinutes: z.number().nonnegative(),
  fareConfigId: entityIdSchema,
  computedAt: isoTimestampSchema,
});

export type RideFareBreakdown = z.infer<typeof rideFareBreakdownSchema>;

export const rideSchema = z.object({
  id: entityIdSchema,
  passengerId: entityIdSchema,
  driverId: entityIdSchema.optional(),
  vehicleId: entityIdSchema.optional(),
  zoneId: entityIdSchema,
  category: vehicleCategorySchema,
  status: rideStatusSchema,
  pickup: addressSchema,
  dropoff: addressSchema,
  statusHistory: z.array(rideStatusHistoryEntrySchema).min(1),
  fareEstimate: rideFareBreakdownSchema.optional(),
  fareFinal: rideFareBreakdownSchema.optional(),
  paymentMethodId: entityIdSchema.optional(),
  mockPaymentId: entityIdSchema.optional(),
  requestedAt: isoTimestampSchema,
  updatedAt: isoTimestampSchema,
  completedAt: isoTimestampSchema.optional(),
  cancelledAt: isoTimestampSchema.optional(),
  cancellationReason: z.string().max(300).optional(),
  /** Updated during active trip for map preview (demo simulation or live GPS). */
  driverLiveLocation: z
    .object({
      latitude: z.number(),
      longitude: z.number(),
    })
    .optional(),
  /** Demo passenger verification PIN (4 digits) — not real security. */
  demoPassengerPin: z.string().length(4).regex(/^\d{4}$/).optional(),
  isDemoData: z.boolean(),
});

export type Ride = z.infer<typeof rideSchema>;
