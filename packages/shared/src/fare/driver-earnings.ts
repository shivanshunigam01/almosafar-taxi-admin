import type { Money } from "../schemas/common";

/** Demo platform commission — not a real payment split. */
export const DEMO_PLATFORM_COMMISSION_RATE = 0.15;

export interface DriverEarningsBreakdown {
  gross: Money;
  platformCommission: Money;
  driverNet: Money;
  commissionRate: number;
  isDemoCalculation: true;
}

export function computeDriverEarnings(gross: Money): DriverEarningsBreakdown {
  const commissionMinor = Math.round(gross.amountMinor * DEMO_PLATFORM_COMMISSION_RATE);
  const netMinor = gross.amountMinor - commissionMinor;
  return {
    gross,
    platformCommission: { currency: gross.currency, amountMinor: commissionMinor },
    driverNet: { currency: gross.currency, amountMinor: netMinor },
    commissionRate: DEMO_PLATFORM_COMMISSION_RATE,
    isDemoCalculation: true,
  };
}
