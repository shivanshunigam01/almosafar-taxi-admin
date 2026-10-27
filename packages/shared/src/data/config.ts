export interface FirebaseClientConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
}

export function resolveFirebaseConfig(
  env: Record<string, string | undefined> = {}
): FirebaseClientConfig | null {
  const projectId = env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const apiKey = env.EXPO_PUBLIC_FIREBASE_API_KEY ?? env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!projectId || !apiKey) return null;

  return {
    apiKey,
    projectId,
    authDomain:
      env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ??
      env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ??
      `${projectId}.firebaseapp.com`,
    storageBucket:
      env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ??
      env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId:
      env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ??
      env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.EXPO_PUBLIC_FIREBASE_APP_ID ?? env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };
}

export const LOCAL_SYNC_LABEL =
  "Local demo store (this device only — not synced to driver or admin).";

export const FIRESTORE_SYNC_LABEL =
  "Firebase connected — sign in with seeded demo accounts for cross-device sync.";
