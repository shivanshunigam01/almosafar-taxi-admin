import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Static checks only — full rules evaluation requires Firebase Emulator Suite
 * (@firebase/rules-unit-testing). See QA_REPORT.md.
 */
describe("firestore.rules (static)", () => {
  it("denies client writes on rides and users collections", () => {
    const rulesPath = resolve(__dirname, "../../../../firebase/firestore.rules");
    const rules = readFileSync(rulesPath, "utf8");
    expect(rules).toMatch(/match \/rides\/{rideId}/);
    expect(rules).toMatch(/allow create, update, delete: if false/);
    expect(rules).toMatch(/match \/users\/{uid}/);
    expect(rules).not.toMatch(/allow write: if true/);
  });
});
