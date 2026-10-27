import { describe, expect, it } from "vitest";
import {
  assertRideTransition,
  canTransitionRideStatus,
  InvalidRideTransitionError,
} from "../rides/transitions";

describe("ride lifecycle transitions", () => {
  it("allows happy path", () => {
    expect(canTransitionRideStatus("requested", "accepted")).toBe(true);
    expect(canTransitionRideStatus("accepted", "driver_arriving")).toBe(true);
    expect(canTransitionRideStatus("driver_arriving", "in_progress")).toBe(true);
    expect(canTransitionRideStatus("in_progress", "completed")).toBe(true);
  });

  it("rejects invalid transitions", () => {
    expect(canTransitionRideStatus("requested", "completed")).toBe(false);
    expect(() => assertRideTransition("completed", "in_progress")).toThrow(
      InvalidRideTransitionError
    );
  });

  it("allows cancellation from active states", () => {
    expect(canTransitionRideStatus("accepted", "cancelled")).toBe(true);
    expect(canTransitionRideStatus("in_progress", "cancelled")).toBe(true);
  });
});
