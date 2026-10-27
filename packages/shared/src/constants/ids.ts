/** Prefix for all demo entity identifiers — never treat as production IDs. */
export const DEMO_ID_PREFIX = "demo_" as const;

export function isDemoId(id: string): boolean {
  return id.startsWith(DEMO_ID_PREFIX);
}

export function createDemoId(suffix: string): string {
  const safe = suffix.replace(/[^a-zA-Z0-9_-]/g, "_").toLowerCase();
  return `${DEMO_ID_PREFIX}${safe}`;
}
