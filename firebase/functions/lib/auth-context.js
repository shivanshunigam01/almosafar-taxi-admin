"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpsError = void 0;
exports.requireAuthContext = requireAuthContext;
exports.requireRole = requireRole;
const https_1 = require("firebase-functions/v2/https");
Object.defineProperty(exports, "HttpsError", { enumerable: true, get: function () { return https_1.HttpsError; } });
function requireAuthContext(request) {
    if (!request.auth?.uid) {
        throw new https_1.HttpsError("unauthenticated", "Sign in required.");
    }
    const role = request.auth.token.role;
    const entityId = request.auth.token.entityId;
    if (!role || !entityId) {
        throw new https_1.HttpsError("permission-denied", "Account is missing authorized role claims. Run Firebase demo seed.");
    }
    if (role !== "passenger" && role !== "driver" && role !== "admin") {
        throw new https_1.HttpsError("permission-denied", "Invalid role.");
    }
    return {
        uid: request.auth.uid,
        role,
        entityId,
        email: request.auth.token.email,
    };
}
function requireRole(ctx, allowed) {
    if (!allowed.includes(ctx.role)) {
        throw new https_1.HttpsError("permission-denied", "Not allowed for this role.");
    }
}
//# sourceMappingURL=auth-context.js.map