"use client";

import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { en, type AdminTranslationKey } from "../i18n/en";
import { tAr } from "../i18n/ar";

export type AdminLocale = "en" | "ar";

interface Ctx {
  locale: AdminLocale;
  isRtl: boolean;
  t: (key: AdminTranslationKey) => string;
  setLocale: (l: AdminLocale) => void;
  moneyLocale: string;
}

const AdminLocaleContext = createContext<Ctx | null>(null);

export function AdminLocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<AdminLocale>("en");

  const setLocale = useCallback((l: AdminLocale) => {
    setLocaleState(l);
    if (typeof document !== "undefined") {
      document.documentElement.lang = l;
      document.documentElement.dir = l === "ar" ? "rtl" : "ltr";
    }
  }, []);

  const t = useCallback(
    (key: AdminTranslationKey) => {
      if (locale === "ar") return tAr(key);
      if (key.startsWith("nav.")) {
        const k = key.slice(4) as keyof typeof en.nav;
        return en.nav[k];
      }
      if (key.startsWith("kpis.")) {
        const k = key.slice(5) as keyof typeof en.kpis;
        return en.kpis[k];
      }
      return en[key as keyof typeof en] as string;
    },
    [locale]
  );

  const value = useMemo(
    () => ({
      locale,
      isRtl: locale === "ar",
      t,
      setLocale,
      moneyLocale: locale === "ar" ? "ar-IQ" : "en-IQ",
    }),
    [locale, t, setLocale]
  );

  return <AdminLocaleContext.Provider value={value}>{children}</AdminLocaleContext.Provider>;
}

export function useAdminLocale() {
  const ctx = useContext(AdminLocaleContext);
  if (!ctx) throw new Error("AdminLocaleProvider required");
  return ctx;
}
