import type { CurrencyCode } from "../constants/currency";
import type { FareConfiguration } from "../schemas/entities";
import type { Money } from "../schemas/common";
import { moneyFromMajor, type GeoPoint } from "../schemas/common";
import type { RideFareBreakdown } from "../schemas/ride";

export interface FareCalculationInput {
  fareConfig: FareConfiguration;
  distanceKm: number;
  durationMinutes: number;
  /** When set, overrides fareConfig.surgeMultiplier */
  surgeMultiplier?: number;
  computedAt?: string;
}

/** Haversine distance in kilometers between two WGS84 points. */
export function distanceKmBetween(a: GeoPoint, b: GeoPoint): number {
  const R = 6371;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function minor(currency: CurrencyCode, amountMinor: number): Money {
  return { currency, amountMinor: Math.round(amountMinor) };
}

export function calculateFare(input: FareCalculationInput): RideFareBreakdown {
  const {
    fareConfig,
    distanceKm,
    durationMinutes,
    surgeMultiplier = fareConfig.surgeMultiplier ?? 1,
    computedAt = new Date().toISOString(),
  } = input;

  const currency = fareConfig.currency as CurrencyCode;

  const baseFare = minor(currency, fareConfig.baseFareMinor);
  const distanceComponent = minor(
    currency,
    Math.round(distanceKm * fareConfig.perKmMinor)
  );
  const timeComponent = minor(
    currency,
    Math.round(durationMinutes * fareConfig.perMinuteMinor)
  );
  const bookingFee = minor(currency, fareConfig.bookingFeeMinor);

  const subtotalMinor =
    baseFare.amountMinor +
    distanceComponent.amountMinor +
    timeComponent.amountMinor +
    bookingFee.amountMinor;

  const surgedMinor = Math.round(subtotalMinor * surgeMultiplier);
  const surgeExtraMinor = surgedMinor - subtotalMinor;

  const discountPct = fareConfig.discountPercent ?? 0;
  const discountMinor =
    discountPct > 0 ? Math.round((surgedMinor * discountPct) / 100) : 0;
  const afterDiscountMinor = Math.max(0, surgedMinor - discountMinor);
  const minimumApplied = Math.max(afterDiscountMinor, fareConfig.minimumFareMinor);
  const total = minor(currency, minimumApplied);

  const surgeComponent =
    surgeExtraMinor > 0 ? minor(currency, surgeExtraMinor) : undefined;
  const discountComponent =
    discountMinor > 0 ? minor(currency, discountMinor) : undefined;

  return {
    baseFare,
    distanceComponent,
    timeComponent,
    bookingFee,
    surgeComponent,
    discountComponent,
    total,
    distanceKm,
    durationMinutes,
    fareConfigId: fareConfig.id,
    computedAt,
  };
}

/** Demo helper: estimate duration from distance at average city speed. */
export function estimateDurationMinutes(distanceKm: number, avgSpeedKmh = 28): number {
  if (distanceKm <= 0) return 0;
  return Math.max(1, Math.round((distanceKm / avgSpeedKmh) * 60));
}

export function fareConfigFromMajorRates(
  config: Omit<
    FareConfiguration,
    | "baseFareMinor"
    | "perKmMinor"
    | "perMinuteMinor"
    | "minimumFareMinor"
    | "bookingFeeMinor"
  > & {
    baseFareMajor: number;
    perKmMajor: number;
    perMinuteMajor: number;
    minimumFareMajor: number;
    bookingFeeMajor: number;
  }
): FareConfiguration {
  const currency = config.currency as CurrencyCode;
  return {
    ...config,
    baseFareMinor: moneyFromMajor(config.baseFareMajor, currency).amountMinor,
    perKmMinor: moneyFromMajor(config.perKmMajor, currency).amountMinor,
    perMinuteMinor: moneyFromMajor(config.perMinuteMajor, currency).amountMinor,
    minimumFareMinor: moneyFromMajor(config.minimumFareMajor, currency).amountMinor,
    bookingFeeMinor: moneyFromMajor(config.bookingFeeMajor, currency).amountMinor,
  };
}
