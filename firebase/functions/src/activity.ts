import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { createDemoId } from "@almosafar/shared";

const ACTIVITY = "activityLogs";

export async function logActivity(message: string, meta?: Record<string, unknown>): Promise<void> {
  const db = getFirestore();
  const id = createDemoId(`log_${Date.now()}`);
  await db.collection(ACTIVITY).doc(id).set({
    id,
    message,
    meta: meta ?? {},
    occurredAt: new Date().toISOString(),
    isDemoData: true,
  });
}

export { FieldValue };
