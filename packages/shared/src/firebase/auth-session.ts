import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import type { Auth } from "firebase/auth";

export type AlmosafarRole = "passenger" | "driver" | "admin";

export interface CloudAuthSession {
  uid: string;
  role: AlmosafarRole;
  entityId: string;
  email?: string;
}

/** Read custom claims from ID token result (required after sign-in). */
export async function sessionFromIdToken(user: User): Promise<CloudAuthSession | null> {
  const result = await user.getIdTokenResult(true);
  const role = result.claims.role as AlmosafarRole | undefined;
  const entityId = result.claims.entityId as string | undefined;
  if (!role || !entityId) return null;
  if (role !== "passenger" && role !== "driver" && role !== "admin") return null;
  return {
    uid: user.uid,
    role,
    entityId,
    email: user.email ?? undefined,
  };
}

export async function signInWithDemoCredentials(
  auth: Auth,
  email: string,
  password: string
): Promise<CloudAuthSession> {
  const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
  const session = await sessionFromIdToken(cred.user);
  if (!session) {
    await firebaseSignOut(auth);
    throw new Error(
      "Signed in but role claims are missing. Deploy functions and run authorized Firebase seed."
    );
  }
  return session;
}

export async function signOutCloud(auth: Auth): Promise<void> {
  await firebaseSignOut(auth);
}

export function subscribeCloudAuth(
  auth: Auth,
  listener: (session: CloudAuthSession | null) => void
): () => void {
  return onAuthStateChanged(auth, async (user) => {
    if (!user) {
      listener(null);
      return;
    }
    try {
      listener(await sessionFromIdToken(user));
    } catch {
      listener(null);
    }
  });
}
