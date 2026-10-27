export const PASSENGER_CANCELLATION_REASONS = [
  { id: "wait_too_long", en: "Wait time too long", ar: "وقت الانتظار طويل" },
  { id: "wrong_pickup", en: "Wrong pickup location", ar: "موقع الانطلاق غير صحيح" },
  { id: "plans_changed", en: "Plans changed", ar: "تغيّرت خططي" },
  { id: "found_alternative", en: "Found another ride", ar: "وجدت وسيلة أخرى" },
  { id: "other", en: "Other (demo)", ar: "سبب آخر (تجريبي)" },
] as const;

export type CancellationReasonId = (typeof PASSENGER_CANCELLATION_REASONS)[number]["id"];
