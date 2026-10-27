"use client";

import { useEffect, useState } from "react";
import type { AdminConfiguration } from "@almosafar/shared";
import { useAdminData } from "../../context/AdminDataContext";
import { useAdminLocale } from "../../context/AdminLocaleContext";

export default function SettingsPage() {
  const { admin, forceLocal, setForceLocal } = useAdminData();
  const { t } = useAdminLocale();
  const [cfg, setCfg] = useState<AdminConfiguration | null>(null);

  useEffect(() => {
    admin?.getAdminConfiguration().then(setCfg);
  }, [admin]);

  return (
    <>
      <h1>{t("nav.settings")}</h1>
      {cfg ? (
        <section className="card">
          <h2>{cfg.appName}</h2>
          <p>Support: {cfg.supportEmail}</p>
          <p>Maintenance: {cfg.maintenanceMode ? "On" : "Off"}</p>
          <p>Demo enforced: {cfg.demoModeEnforced ? "Yes" : "No"}</p>
        </section>
      ) : null}
      <section className="card">
        <h2>Connection</h2>
        <p className="muted">{admin?.syncLabel}</p>
        {admin?.mode === "firestore" ? (
          <button type="button" className="btn secondary" onClick={() => setForceLocal(true)}>
            Switch to local demo data
          </button>
        ) : forceLocal ? (
          <p className="muted">Using in-memory seeded demo (reload to retry Firebase).</p>
        ) : null}
      </section>
    </>
  );
}
