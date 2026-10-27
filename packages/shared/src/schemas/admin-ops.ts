import { z } from "zod";
import { currencyCodeSchema, entityIdSchema, isoTimestampSchema } from "./common";

export const peakHourRuleSchema = z.object({
  id: entityIdSchema,
  label: z.string().min(1).max(80),
  /** 0–6 = Sun–Sat (demo convention) */
  daysOfWeek: z.array(z.number().int().min(0).max(6)).min(1),
  startHour: z.number().int().min(0).max(23),
  endHour: z.number().int().min(0).max(23),
  multiplier: z.number().min(1).max(5),
  isActive: z.boolean(),
  isDemoData: z.boolean(),
});

export type PeakHourRule = z.infer<typeof peakHourRuleSchema>;

export const surgeRuleSchema = z.object({
  id: entityIdSchema,
  zoneId: entityIdSchema,
  label: z.string().min(1).max(80),
  multiplier: z.number().min(1).max(5),
  triggerNote: z.string().max(200).optional(),
  isActive: z.boolean(),
  isDemoData: z.boolean(),
});

export type SurgeRule = z.infer<typeof surgeRuleSchema>;

export const operationalSettingsSchema = z.object({
  id: entityIdSchema,
  defaultRegionLabel: z.string().min(1).max(120),
  defaultCurrency: currencyCodeSchema,
  driverCommissionRate: z.number().min(0).max(0.5),
  cancellationChargeMinor: z.number().int().nonnegative(),
  peakHourRules: z.array(peakHourRuleSchema),
  surgeRules: z.array(surgeRuleSchema),
  updatedAt: isoTimestampSchema,
  isDemoData: z.boolean(),
});

export type OperationalSettings = z.infer<typeof operationalSettingsSchema>;

export const driverVerificationStatusSchema = z.enum(["pending", "verified", "rejected"]);

export type DriverVerificationStatus = z.infer<typeof driverVerificationStatusSchema>;
