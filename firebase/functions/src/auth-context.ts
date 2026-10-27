import type { CallableRequest } from "firebase-functions/v2/https";

export type AlmosafarRole = "passenger" | "driver" | "admin";

export interface AuthContext {
  uid: string;
  role: AlmosafarRole;
  entityId: string;
  email?: string;
}

import { HttpsError } from "firebase-functions/v2/https";

export function requireAuthContext(request: CallableRequest): AuthContext {
  if (!request.auth?.uid) {
    throw new HttpsError("unauthenticated", "Sign in required.");
  }
  const role = request.auth.token.role as AlmosafarRole | undefined;
  const entityId = request.auth.token.entityId as string | undefined;
  if (!role || !entityId) {
    throw new HttpsError(
      "permission-denied",
      "Account is missing authorized role claims. Run Firebase demo seed."
    );
  }
  if (role !== "passenger" && role !== "driver" && role !== "admin") {
    throw new HttpsError("permission-denied", "Invalid role.");
  }
  return {
    uid: request.auth.uid,
    role,
    entityId,
    email: request.auth.token.email,
  };
}

export function requireRole(ctx: AuthContext, allowed: AlmosafarRole[]): void {
  if (!allowed.includes(ctx.role)) {
    throw new HttpsError("permission-denied", "Not allowed for this role.");
  }
}

export { HttpsError };
