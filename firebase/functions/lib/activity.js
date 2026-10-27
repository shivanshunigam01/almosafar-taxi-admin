"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FieldValue = void 0;
exports.logActivity = logActivity;
const firestore_1 = require("firebase-admin/firestore");
Object.defineProperty(exports, "FieldValue", { enumerable: true, get: function () { return firestore_1.FieldValue; } });
const shared_1 = require("@almosafar/shared");
const ACTIVITY = "activityLogs";
async function logActivity(message, meta) {
    const db = (0, firestore_1.getFirestore)();
    const id = (0, shared_1.createDemoId)(`log_${Date.now()}`);
    await db.collection(ACTIVITY).doc(id).set({
        id,
        message,
        meta: meta ?? {},
        occurredAt: new Date().toISOString(),
        isDemoData: true,
    });
}
//# sourceMappingURL=activity.js.map