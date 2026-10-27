import type { VehicleCategory } from "../schemas/entities";

/** Passenger-facing vehicle tiers for Almosafar Taxi demo. */
export const PASSENGER_VEHICLE_CATEGORIES: VehicleCategory[] = [
  "economy",
  "comfort",
  "xl",
  "premium",
];

export const VEHICLE_CATEGORY_LABELS: Record<
  VehicleCategory,
  { en: string; ar: string }
> = {
  economy: { en: "Economy", ar: "اقتصادي" },
  comfort: { en: "Comfort", ar: "Comfort" },
  xl: { en: "XL", ar: "XL" },
  premium: { en: "Premium", ar: "Premium" },
  accessible: { en: "Accessible", ar: "Accessible" },
};
