"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { DemoBanner } from "@almosafar/ui";
import { DEMO_DISCLAIMER, resolveDemoMode } from "@almosafar/shared";
import { useAdminData } from "../../context/AdminDataContext";
import { useAdminLocale } from "../../context/AdminLocaleContext";

const NAV: { href: string; key: `nav.${string}` }[] = [
  { href: "/dashboard", key: "nav.dashboard" },
  { href: "/rides", key: "nav.rides" },
  { href: "/passengers", key: "nav.passengers" },
  { href: "/drivers", key: "nav.drivers" },
  { href: "/vehicles", key: "nav.vehicles" },
  { href: "/fares", key: "nav.fares" },
  { href: "/zones", key: "nav.zones" },
  { href: "/pricing", key: "nav.pricing" },
  { href: "/bookings", key: "nav.bookings" },
  { href: "/payments", key: "nav.payments" },
  { href: "/reports", key: "nav.reports" },
  { href: "/settings", key: "nav.settings" },
  { href: "/activity", key: "nav.activity" },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { admin, loading } = useAdminData();
  const { t, locale, setLocale, isRtl } = useAdminLocale();
  const [authed, setAuthed] = useState(false);

  const demoMode = resolveDemoMode({
    NEXT_PUBLIC_ALMOSAFAR_DEMO_MODE: process.env.NEXT_PUBLIC_ALMOSAFAR_DEMO_MODE,
    NODE_ENV: process.env.NODE_ENV,
  });

  useEffect(() => {
    if (!admin) return;
    setAuthed(!!admin.getAdminSession());
    return admin.subscribeAdminSession((s) => setAuthed(!!s));
  }, [admin]);

  useEffect(() => {
    if (!loading && admin && !authed && pathname !== "/login") {
      router.replace("/login");
    }
  }, [loading, admin, authed, pathname, router]);

  if (loading || !admin) {
    return <div className="center-page">{t("loading")}</div>;
  }

  if (!authed && pathname !== "/login") {
    return <div className="center-page">{t("loading")}</div>;
  }

  if (pathname === "/login") {
    return <>{children}</>;
  }

  return (
    <div className={`app-shell ${isRtl ? "rtl" : ""}`}>
      {demoMode ? <DemoBanner disclaimer={DEMO_DISCLAIMER} /> : null}
      <aside className="sidebar">
        <div className="brand">{t("appName")}</div>
        <p className="sync-label">
          {admin.mode === "firestore" ? t("syncCloud") : t("syncLocal")}
        </p>
        <nav>
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={pathname === item.href ? "nav-link active" : "nav-link"}
            >
              {t(item.key as `nav.${keyof typeof import("../../i18n/en").en.nav}`)}
            </Link>
          ))}
        </nav>
        <div className="sidebar-footer">
          <label className="locale-picker">
            {t("language")}
            <select
              value={locale}
              onChange={(e) => setLocale(e.target.value as "en" | "ar")}
            >
              <option value="en">{t("en")}</option>
              <option value="ar">{t("ar")}</option>
            </select>
          </label>
          <button
            type="button"
            className="btn secondary"
            onClick={async () => {
              await admin.signOutAdmin();
              router.replace("/login");
            }}
          >
            {t("logout")}
          </button>
        </div>
      </aside>
      <main className="content">{children}</main>
    </div>
  );
}
