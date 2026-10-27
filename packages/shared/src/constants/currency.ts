/** Default demo currency — Saudi Riyal (ISO 4217). */
/** Baghdad demo default — Iraqi Dinar (ISO 4217). */
export const DEFAULT_CURRENCY = "IQD" as const;

export type CurrencyCode = typeof DEFAULT_CURRENCY | "SAR" | "USD" | "AED";

/** Minor units per major unit (fils for IQD treated as 1000 fils = 1 IQD for demo). */
export const CURRENCY_MINOR_UNITS: Record<CurrencyCode, number> = {
  IQD: 100,
  SAR: 100,
  USD: 100,
  AED: 100,
};

export const DEMO_CURRENCY = DEFAULT_CURRENCY;
