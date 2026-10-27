import { resolveFirebaseConfig } from "../data/config";
import { createAlmosafarDataServiceAsync } from "../data/factory";
import { LocalAdminDataService } from "./local-admin-service";
import { FirestoreAdminDataService } from "./firestore-admin-service";
import type { AdminDataService } from "./types";
import { CloudConnectionError } from "../repository/ride-repository";

let adminSingleton: AdminDataService | null = null;

export async function createAdminDataServiceAsync(
  env: Record<string, string | undefined> = {},
  options?: { forceLocal?: boolean }
): Promise<AdminDataService> {
  if (adminSingleton && !options?.forceLocal) return adminSingleton;

  const firebase = resolveFirebaseConfig(env);
  if (firebase && !options?.forceLocal) {
    try {
      const core = await createAlmosafarDataServiceAsync(env, options);
      const adminSvc = new FirestoreAdminDataService(core);
      adminSingleton = adminSvc;
      return adminSvc;
    } catch (e) {
      if (e instanceof CloudConnectionError) throw e;
      throw new CloudConnectionError(
        e instanceof Error ? e.message : "Failed to initialize admin Firestore service"
      );
    }
  }

  adminSingleton = new LocalAdminDataService();
  return adminSingleton;
}

export function resetAdminDataServiceForTests(): void {
  adminSingleton = null;
}
