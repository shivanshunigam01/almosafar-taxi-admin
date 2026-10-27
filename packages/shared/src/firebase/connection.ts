import { doc, getDoc } from "firebase/firestore";
import type { Firestore } from "firebase/firestore";
import { COLLECTIONS } from "./collections";
import { CloudConnectionError } from "../repository/ride-repository";

export type ConnectionState = "unknown" | "connected" | "disconnected" | "error";

export async function probeFirestoreHealth(db: Firestore): Promise<void> {
  try {
    await getDoc(doc(db, COLLECTIONS.meta, COLLECTIONS.health));
  } catch (err) {
    throw new CloudConnectionError(
      err instanceof Error
        ? `Firestore unreachable: ${err.message}`
        : "Firestore unreachable. Check network and Firebase setup."
    );
  }
}

export function mapFirebaseError(err: unknown): Error {
  if (err instanceof CloudConnectionError) return err;
  const message =
    err instanceof Error ? err.message : "Unexpected Firebase error";
  if (/permission-denied/i.test(message)) {
    return new CloudConnectionError(
      "Permission denied. Sign in with a seeded demo account or check security rules."
    );
  }
  if (/unavailable/i.test(message)) {
    return new CloudConnectionError("Firebase temporarily unavailable. Retry shortly.");
  }
  return err instanceof Error ? err : new Error(message);
}
