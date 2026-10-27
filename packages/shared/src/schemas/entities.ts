import { z } from "zod";
import {
  addressSchema,
  entityIdSchema,
  isoTimestampSchema,
  moneySchema,
} from "./common";

export const vehicleCategorySchema = z.enum([
  "economy",
  "comfort",
  "premium",
  "xl",
  "accessible",
]);

export type VehicleCategory = z.infer<typeof vehicleCategorySchema>;

export const serviceZoneSchema = z.object({
  id: entityIdSchema,
  name: z.string().min(1).max(120),
  /** Demo: simple bounding box; production would use GeoJSON. */
  bounds: z.object({
    northEast: z.object({ latitude: z.number(), longitude: z.number() }),
    southWest: z.object({ latitude: z.number(), longitude: z.number() }),
  }),
  isActive: z.boolean(),
  currency: z.enum(["IQD", "SAR", "USD", "AED"]),
  createdAt: isoTimestampSchema,
  updatedAt: isoTimestampSchema,
  isDemoData: z.boolean(),
});

export type ServiceZone = z.infer<typeof serviceZoneSchema>;

export const passengerSchema = z.object({
  id: entityIdSchema,
  displayName: z.string().min(1).max(120),
  phoneE164: z.string().regex(/^\+[1-9]\d{6,14}$/).optional(),
  email: z.string().email().optional(),
  ratingAverage: z.number().min(0).max(5).optional(),
  createdAt: isoTimestampSchema,
  updatedAt: isoTimestampSchema,
  isDemoData: z.boolean(),
});

export type Passenger = z.infer<typeof passengerSchema>;

export const driverSchema = z.object({
  id: entityIdSchema,
  displayName: z.string().min(1).max(120),
  email: z.string().email().optional(),
  phoneE164: z.string().regex(/^\+[1-9]\d{6,14}$/).optional(),
  licenseNumber: z.string().min(1).max(64).optional(),
  isOnline: z.boolean(),
  currentLocation: z
    .object({
      geo: z.object({ latitude: z.number(), longitude: z.number() }),
      updatedAt: isoTimestampSchema,
    })
    .optional(),
  ratingAverage: z.number().min(0).max(5).optional(),
  vehicleId: entityIdSchema.optional(),
  verificationStatus: z.enum(["pending", "verified", "rejected"]).optional(),
  createdAt: isoTimestampSchema,
  updatedAt: isoTimestampSchema,
  isDemoData: z.boolean(),
});

export type Driver = z.infer<typeof driverSchema>;

export const vehicleSchema = z.object({
  id: entityIdSchema,
  driverId: entityIdSchema,
  category: vehicleCategorySchema,
  make: z.string().min(1).max(64),
  model: z.string().min(1).max(64),
  color: z.string().min(1).max(32),
  plateNumber: z.string().min(1).max(16),
  year: z.number().int().min(1990).max(2100),
  createdAt: isoTimestampSchema,
  updatedAt: isoTimestampSchema,
  isDemoData: z.boolean(),
});

export type Vehicle = z.infer<typeof vehicleSchema>;

export const paymentMethodTypeSchema = z.enum([
  "cash",
  "card_mock",
  "wallet_mock",
  "corporate_mock",
]);

export type PaymentMethodType = z.infer<typeof paymentMethodTypeSchema>;

export const paymentMethodSchema = z.object({
  id: entityIdSchema,
  passengerId: entityIdSchema,
  type: paymentMethodTypeSchema,
  label: z.string().min(1).max(80),
  /** Last four digits for mock cards only — never real PAN. */
  mockLastFour: z.string().length(4).regex(/^\d{4}$/).optional(),
  isDefault: z.boolean(),
  isDemoData: z.boolean(),
});

export type PaymentMethod = z.infer<typeof paymentMethodSchema>;

export const mockPaymentStatusSchema = z.enum([
  "pending",
  "authorized_mock",
  "captured_mock",
  "failed_mock",
  "refunded_mock",
]);

export const mockPaymentRecordSchema = z.object({
  id: entityIdSchema,
  rideId: entityIdSchema,
  passengerId: entityIdSchema,
  paymentMethodId: entityIdSchema,
  status: mockPaymentStatusSchema,
  amount: moneySchema,
  /** Explicit marker — not a real payment processor reference. */
  mockProcessorReference: z.string().min(1).max(64),
  createdAt: isoTimestampSchema,
  updatedAt: isoTimestampSchema,
  isDemoData: z.literal(true),
});

export type MockPaymentRecord = z.infer<typeof mockPaymentRecordSchema>;

export const ratingSchema = z.object({
  id: entityIdSchema,
  rideId: entityIdSchema,
  fromPassengerId: entityIdSchema.optional(),
  fromDriverId: entityIdSchema.optional(),
  toDriverId: entityIdSchema.optional(),
  toPassengerId: entityIdSchema.optional(),
  score: z.number().int().min(1).max(5),
  comment: z.string().max(500).optional(),
  createdAt: isoTimestampSchema,
  isDemoData: z.boolean(),
});

export type Rating = z.infer<typeof ratingSchema>;

export const tripHistoryEntrySchema = z.object({
  id: entityIdSchema,
  rideId: entityIdSchema,
  passengerId: entityIdSchema,
  driverId: entityIdSchema.optional(),
  pickup: addressSchema,
  dropoff: addressSchema,
  completedAt: isoTimestampSchema.optional(),
  fareTotal: moneySchema,
  vehicleCategory: vehicleCategorySchema,
  isDemoData: z.boolean(),
});

export type TripHistoryEntry = z.infer<typeof tripHistoryEntrySchema>;

export const fareConfigurationSchema = z.object({
  id: entityIdSchema,
  zoneId: entityIdSchema,
  category: vehicleCategorySchema,
  currency: z.enum(["IQD", "SAR", "USD", "AED"]),
  baseFareMinor: z.number().int().nonnegative(),
  perKmMinor: z.number().int().nonnegative(),
  perMinuteMinor: z.number().int().nonnegative(),
  minimumFareMinor: z.number().int().nonnegative(),
  bookingFeeMinor: z.number().int().nonnegative(),
  surgeMultiplier: z.number().min(1).max(5).default(1),
  /** Optional percentage discount applied to subtotal before minimum fare check (0–100). */
  discountPercent: z.number().min(0).max(100).optional(),
  isActive: z.boolean(),
  effectiveFrom: isoTimestampSchema,
  updatedAt: isoTimestampSchema,
  isDemoData: z.boolean(),
});

export type FareConfiguration = z.infer<typeof fareConfigurationSchema>;

export const adminConfigurationSchema = z.object({
  id: entityIdSchema,
  appName: z.string().min(1).max(120),
  supportEmail: z.string().email(),
  defaultZoneId: entityIdSchema,
  demoModeEnforced: z.boolean(),
  maintenanceMode: z.boolean(),
  updatedAt: isoTimestampSchema,
  isDemoData: z.boolean(),
});

export type AdminConfiguration = z.infer<typeof adminConfigurationSchema>;

export const demoActivityTypeSchema = z.enum([
  "ride_created",
  "ride_status_changed",
  "driver_went_online",
  "driver_went_offline",
  "fare_config_updated",
  "admin_login_mock",
]);

export const demoActivitySchema = z.object({
  id: entityIdSchema,
  type: demoActivityTypeSchema,
  message: z.string().min(1).max(500),
  entityRef: z.string().optional(),
  occurredAt: isoTimestampSchema,
  isDemoData: z.literal(true),
});

export type DemoActivity = z.infer<typeof demoActivitySchema>;
