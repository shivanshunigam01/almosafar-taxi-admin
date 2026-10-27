import { describe, expect, it } from "vitest";
import { LocalDemoRideRepository } from "../repository/local-demo-ride-repository";
import { buildLocalDemoDispatchRide } from "../demo/driver-scenarios";
import { getDemoSeedBundle } from "../demo/seed";
import { RideClaimError } from "../rides/driver-authorization";

describe("driver atomic claim (local repository)", () => {
  it("second driver cannot accept an already claimed ride", async () => {
    const repo = new LocalDemoRideRepository();
    const seed = getDemoSeedBundle();
    const driverA = seed.drivers[0]!;
    const driverB = seed.drivers[1]!;
    await repo.setDriverOnline(driverA.id, true);
    await repo.setDriverOnline(driverB.id, true);

    const ride = buildLocalDemoDispatchRide(driverA.id);
    await repo.createRideRequest(ride);

    await repo.acceptRideAsDriver({
      rideId: ride.id,
      driverId: driverA.id,
      vehicleId: driverA.vehicleId!,
    });

    await expect(
      repo.acceptRideAsDriver({
        rideId: ride.id,
        driverId: driverB.id,
        vehicleId: driverB.vehicleId!,
      })
    ).rejects.toBeInstanceOf(RideClaimError);
  });
});
