import { resolveFirebaseConfig } from "../data/config";
import type { RideRepository } from "./ride-repository";
import { CloudConnectionError } from "./ride-repository";
import { FirestoreRideRepository } from "./firestore-ride-repository";
import { LocalDemoRideRepository, type LocalDemoRideRepositoryOptions } from "./local-demo-ride-repository";

export interface CreateRideRepositoryResult {
  repository: RideRepository;
  /** True when Firebase env vars are set (cloud intended). */
  cloudConfigured: boolean;
}

export function createRideRepository(
  env: Record<string, string | undefined> = {},
  options?: LocalDemoRideRepositoryOptions & { forceLocal?: boolean }
): CreateRideRepositoryResult {
  const firebase = resolveFirebaseConfig(env);
  const cloudConfigured = !!firebase && !options?.forceLocal;

  if (cloudConfigured && firebase) {
    return {
      repository: new FirestoreRideRepository(firebase),
      cloudConfigured: true,
    };
  }

  return {
    repository: new LocalDemoRideRepository(options),
    cloudConfigured: false,
  };
}

export async function initializeRideRepository(
  env: Record<string, string | undefined> = {},
  options?: LocalDemoRideRepositoryOptions & { forceLocal?: boolean }
): Promise<RideRepository> {
  const { repository, cloudConfigured } = createRideRepository(env, options);

  if (cloudConfigured && repository.verifyConnection) {
    await repository.verifyConnection();
  } else if (cloudConfigured) {
    throw new CloudConnectionError("Firestore repository missing verifyConnection");
  }

  return repository;
}
