"use client";

import { useEffect, useMemo, useState } from "react";
import { formatMoney, computeDriverEarnings, type CurrencyCode } from "@almosafar/shared";
import type { Ride, Driver } from "@almosafar/shared";
import { useAdminData } from "../../context/AdminDataContext";
import { useAdminLocale } from "../../context/AdminLocaleContext";

export default function DashboardPage() {
  const { admin } = useAdminData();
  const { t, moneyLocale } = useAdminLocale();
  const [rides, setRides] = useState<Ride[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);

  useEffect(() => {
    if (!admin) return;
    admin.listDrivers().then(setDrivers);
    return admin.subscribeRides(setRides);
  }, [admin]);

  const kpis = useMemo(() => {
    const active = rides.filter((r) =>
      ["requested", "accepted", "driver_arriving", "in_progress"].includes(r.status)
    );
    const completed = rides.filter((r) => r.status === "completed");
    let grossMinor = 0;
    let netMinor = 0;
    const currency: CurrencyCode = "IQD";
    for (const r of completed) {
      const g = r.fareFinal?.total ?? r.fareEstimate?.total;
      if (!g) continue;
      grossMinor += g.amountMinor;
      netMinor += computeDriverEarnings(g).driverNet.amountMinor;
    }
    const pending = drivers.filter((d) => d.verificationStatus === "pending").length;
    const online = drivers.filter((d) => d.isOnline).length;
    const byStatus = ["requested", "accepted", "in_progress", "completed", "cancelled"].map(
      (s) => rides.filter((r) => r.status === s).length
    );
    return { active: active.length, completed: completed.length, grossMinor, netMinor, currency, pending, online, byStatus };
  }, [rides, drivers]);

  return (
    <>
      <h1>{t("nav.dashboard")}</h1>
      <p className="muted">{t("demoDisclaimer")}</p>
      <div className="kpi-grid">
        <div className="kpi">
          <div className="kpi-label">{t("kpis.activeRides")}</div>
          <div className="kpi-value">{kpis.active}</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">{t("kpis.completedToday")}</div>
          <div className="kpi-value">{kpis.completed}</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">{t("kpis.onlineDrivers")}</div>
          <div className="kpi-value">{kpis.online}</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">{t("kpis.pendingVerification")}</div>
          <div className="kpi-value">{kpis.pending}</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">{t("kpis.grossVolume")}</div>
          <div className="kpi-value" style={{ fontSize: "1.2rem" }}>
            {formatMoney({ currency: kpis.currency, amountMinor: kpis.grossMinor }, moneyLocale)}
          </div>
        </div>
        <div className="kpi">
          <div className="kpi-label">{t("kpis.driverNet")}</div>
          <div className="kpi-value" style={{ fontSize: "1.2rem" }}>
            {formatMoney({ currency: kpis.currency, amountMinor: kpis.netMinor }, moneyLocale)}
          </div>
        </div>
      </div>
      <section className="card">
        <h2>Rides by status (demo chart)</h2>
        <div className="bar-chart">
          {kpis.byStatus.map((n, i) => (
            <div
              key={i}
              className="bar"
              style={{ height: `${Math.max(8, n * 24)}px` }}
              title={String(n)}
            />
          ))}
        </div>
      </section>
    </>
  );
}
