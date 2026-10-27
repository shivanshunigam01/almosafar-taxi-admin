import { z } from "zod";
import { CURRENCY_MINOR_UNITS, DEFAULT_CURRENCY, type CurrencyCode } from "../constants/currency";

export const isoTimestampSchema = z
  .string()
  .datetime({ offset: true, message: "Expected ISO-8601 timestamp with offset" });

export const entityIdSchema = z
  .string()
  .min(3)
  .max(128)
  .regex(/^[a-zA-Z0-9_-]+$/, "ID must be alphanumeric with _ or -");

export const geoPointSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export type GeoPoint = z.infer<typeof geoPointSchema>;

export const addressSchema = z.object({
  label: z.string().min(1).max(500),
  geo: geoPointSchema,
});

export type Address = z.infer<typeof addressSchema>;

export const currencyCodeSchema = z.enum(["IQD", "SAR", "USD", "AED"]).default(DEFAULT_CURRENCY);

/** Money stored as integer minor units + currency code. */
export const moneySchema = z.object({
  currency: currencyCodeSchema,
  amountMinor: z.number().int().nonnegative(),
});

export type Money = z.infer<typeof moneySchema>;

export function moneyFromMajor(
  amountMajor: number,
  currency: CurrencyCode = DEFAULT_CURRENCY
): Money {
  const minor = CURRENCY_MINOR_UNITS[currency];
  return {
    currency,
    amountMinor: Math.round(amountMajor * minor),
  };
}

export function moneyToMajor(money: Money): number {
  const minor = CURRENCY_MINOR_UNITS[money.currency as CurrencyCode];
  return money.amountMinor / minor;
}

export function formatMoney(money: Money, locale = "en-SA"): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: money.currency,
  }).format(moneyToMajor(money));
}
