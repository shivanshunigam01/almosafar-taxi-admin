import type { AdminTranslationKey } from "./en";

const nav = {
  dashboard: "لوحة التحكم",
  rides: "الرحلات المباشرة",
  passengers: "الركاب",
  drivers: "السائقون",
  vehicles: "المركبات",
  fares: "الأجرة",
  zones: "مناطق الخدمة",
  pricing: "قواعد التسعير",
  bookings: "سجل الحجوزات",
  payments: "المدفوعات والتسويات",
  reports: "التقارير",
  settings: "الإعدادات",
  activity: "سجل النشاط",
} as const;

const kpis = {
  activeRides: "رحلات نشطة",
  completedToday: "مكتملة (عينة)",
  onlineDrivers: "سائقون متصلون",
  pendingVerification: "بانتظار التحقق",
  grossVolume: "إجمالي الحجم (تجريبي)",
  driverNet: "صافي السائق (تجريبي)",
} as const;

export const ar: Record<string, string> = {
  appName: "إدارة المسافر",
  login: "دخول",
  logout: "خروج",
  email: "البريد",
  password: "كلمة المرور",
  localDemoHint: "تجريبي محلي: بريد يحتوي “admin”، أي كلمة مرور.",
  firebaseHint: "استخدم حساب المدير من دليل Firebase.",
  nav: nav as unknown as string,
  syncLocal: "بيانات تجريبية محلية",
  syncCloud: "Firebase متصل",
  loading: "جاري التحميل…",
  save: "حفظ",
  cancel: "إلغاء",
  assign: "تعيين سائق",
  verify: "تحقق",
  reject: "رفض",
  exportCsv: "تصدير CSV",
  demoDisclaimer: "بيانات تجريبية — ليست تعرفة رسمية.",
  kpis: kpis as unknown as string,
  language: "اللغة",
  ar: "العربية",
  en: "English",
  region: "المنطقة الافتراضية",
  currency: "العملة الافتراضية",
  commission: "عمولة السائق",
  cancellationCharge: "رسوم الإلغاء",
};

export function tAr(key: AdminTranslationKey): string {
  if (key.startsWith("nav.")) {
    const k = key.slice(4) as keyof typeof nav;
    return nav[k] ?? key;
  }
  if (key.startsWith("kpis.")) {
    const k = key.slice(5) as keyof typeof kpis;
    return kpis[k] ?? key;
  }
  return (ar as Record<string, string>)[key] ?? key;
}
