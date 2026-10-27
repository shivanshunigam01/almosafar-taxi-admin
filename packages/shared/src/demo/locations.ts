import type { Address } from "../schemas/common";

/** Baghdad demo locations — used when Google Places is unavailable. */
export const DEMO_LOCATIONS: Address[] = [
  {
    label: "Demo — Baghdad International Airport (BGW)",
    geo: { latitude: 33.2625, longitude: 44.2346 },
  },
  {
    label: "Demo — Al-Mutanabbi Street, Baghdad",
    geo: { latitude: 33.3406, longitude: 44.3925 },
  },
  {
    label: "Demo — Tahrir Square, Baghdad",
    geo: { latitude: 33.3152, longitude: 44.3661 },
  },
  {
    label: "Demo — Al-Karrada, Baghdad",
    geo: { latitude: 33.2958, longitude: 44.3859 },
  },
  {
    label: "Demo — Baghdad Mall",
    geo: { latitude: 33.3157, longitude: 44.4561 },
  },
];

export const DEMO_LOCATIONS_AR: Record<string, string> = {
  "Demo — Baghdad International Airport (BGW)":
    "تجريبي — مطار بغداد الدولي",
  "Demo — Al-Mutanabbi Street, Baghdad": "تجريبي — شارع المتنبي، بغداد",
  "Demo — Tahrir Square, Baghdad": "تجريبي — ساحة التحرير، بغداد",
  "Demo — Al-Karrada, Baghdad": "تجريبي — الكرادة، بغداد",
  "Demo — Baghdad Mall": "تجريبي — بغداد مول",
};
