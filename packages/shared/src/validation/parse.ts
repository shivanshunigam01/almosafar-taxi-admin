import { z } from "zod";
import {
  adminConfigurationSchema,
  demoActivitySchema,
  driverSchema,
  fareConfigurationSchema,
  mockPaymentRecordSchema,
  passengerSchema,
  paymentMethodSchema,
  ratingSchema,
  serviceZoneSchema,
  tripHistoryEntrySchema,
  vehicleSchema,
} from "../schemas/entities";
import { rideSchema } from "../schemas/ride";

export function parsePassenger(data: unknown) {
  return passengerSchema.parse(data);
}

export function parseDriver(data: unknown) {
  return driverSchema.parse(data);
}

export function parseVehicle(data: unknown) {
  return vehicleSchema.parse(data);
}

export function parseRide(data: unknown) {
  return rideSchema.parse(data);
}

export function parseFareConfiguration(data: unknown) {
  return fareConfigurationSchema.parse(data);
}

export function parseServiceZone(data: unknown) {
  return serviceZoneSchema.parse(data);
}

export function safeParse<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown
): z.SafeParseReturnType<unknown, z.infer<T>> {
  return schema.safeParse(data);
}

export const entityParsers = {
  passenger: passengerSchema,
  driver: driverSchema,
  vehicle: vehicleSchema,
  ride: rideSchema,
  fareConfiguration: fareConfigurationSchema,
  serviceZone: serviceZoneSchema,
  paymentMethod: paymentMethodSchema,
  mockPaymentRecord: mockPaymentRecordSchema,
  rating: ratingSchema,
  tripHistoryEntry: tripHistoryEntrySchema,
  adminConfiguration: adminConfigurationSchema,
  demoActivity: demoActivitySchema,
} as const;
