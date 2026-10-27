import { resolveFirebaseConfig } from "./config";
import { FirestoreDataService } from "./firestore-data-service";
import { LocalDemoDataService } from "./local-data-service";
import type { AlmosafarDataService } from "./types";
import { FirestoreRideRepository } from "../repository/firestore-ride-repository";
import { CloudConnectionError } from "../repository/ride-repository";
let singleton: AlmosafarDataService | null = null;

export function createAlmosafarDataService(
  env: Record<string, string | undefined> = {},
  options?: { forceLocal?: boolean }
): AlmosafarDataService {
  if (singleton && !options?.forceLocal) return singleton;

  const firebase = resolveFirebaseConfig(env);
  if (firebase && !options?.forceLocal) {
    const rideRepo = new FirestoreRideRepository(firebase);
    singleton = new FirestoreDataService(rideRepo);
    return singleton;
  }

  singleton = new LocalDemoDataService();
  return singleton;
}

/** Prefer this in apps — verifies Firestore when cloud env is configured. */
export async function createAlmosafarDataServiceAsync(
  env: Record<string, string | undefined> = {},
  options?: { forceLocal?: boolean }
): Promise<AlmosafarDataService> {
  if (singleton && !options?.forceLocal) return singleton;

  const firebase = resolveFirebaseConfig(env);
  if (firebase && !options?.forceLocal) {
    const rideRepo = new FirestoreRideRepository(firebase);
    const service = new FirestoreDataService(rideRepo);
    try {
      await service.verifyCloudConnection();
    } catch (err) {
      singleton = null;
      if (err instanceof CloudConnectionError) throw err;
      throw new CloudConnectionError(
        err instanceof Error ? err.message : "Cloud connection failed"
      );
    }
    singleton = service;
    return service;
  }

  singleton = new LocalDemoDataService();
  return singleton;
}

export function resetAlmosafarDataServiceForTests(): void {
  singleton = null;
}
