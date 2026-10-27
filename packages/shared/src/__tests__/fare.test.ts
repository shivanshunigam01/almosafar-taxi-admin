import { describe, expect, it } from "vitest";
import { calculateFare } from "../fare/calculator";
import { getDemoSeedBundle } from "../demo/seed";

describe("calculateFare", () => {
  it("computes IQD demo comfort fare with minimum applied when subtotal is low", () => {
    const fareConfig = getDemoSeedBundle().fareConfigurations.find(
      (f) => f.category === "comfort"
    )!;
    const breakdown = calculateFare({
      fareConfig,
      distanceKm: 0.5,
      durationMinutes: 2,
    });
    expect(breakdown.total.currency).toBe("IQD");
    expect(breakdown.total.amountMinor).toBeGreaterThanOrEqual(fareConfig.minimumFareMinor);
  });

  it("applies surge multiplier to subtotal", () => {
    const fareConfig = getDemoSeedBundle().fareConfigurations.find(
      (f) => f.category === "economy"
    )!;
    const base = calculateFare({
      fareConfig,
      distanceKm: 8,
      durationMinutes: 18,
      surgeMultiplier: 1,
    });
    const surged = calculateFare({
      fareConfig,
      distanceKm: 8,
      durationMinutes: 18,
      surgeMultiplier: 1.5,
    });
    expect(surged.total.amountMinor).toBeGreaterThan(base.total.amountMinor);
  });
});
