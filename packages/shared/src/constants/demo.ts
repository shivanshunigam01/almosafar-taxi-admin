export const DEMO_DISCLAIMER =
  "DEMO MODE: All passengers, drivers, payments, and trips shown are fictional sample data for demonstration only. Not real customers or financial transactions.";

export const DEMO_BANNER_LABEL = "Almosafar Taxi · Demo";

/** Parse demo mode from environment (Node/Expo/Next). Defaults to true in development when unset. */
export function resolveDemoMode(env: Record<string, string | undefined> = {}): boolean {
  const raw =
    env.ALMOSAFAR_DEMO_MODE ??
    env.EXPO_PUBLIC_ALMOSAFAR_DEMO_MODE ??
    env.NEXT_PUBLIC_ALMOSAFAR_DEMO_MODE;
  if (raw === undefined || raw === "") {
    return env.NODE_ENV !== "production";
  }
  return raw === "true" || raw === "1" || raw.toLowerCase() === "yes";
}
