"use client";

import { useAdminData } from "../../context/AdminDataContext";
import { useAdminLocale } from "../../context/AdminLocaleContext";

export default function ReportsPage() {
  const { admin } = useAdminData();
  const { t } = useAdminLocale();

  const download = async () => {
    if (!admin) return;
    const csv = await admin.exportRidesCsv();
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `almosafar-rides-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <h1>{t("nav.reports")}</h1>
      <section className="card">
        <p className="muted">Export current ride list from the active data backend.</p>
        <button type="button" className="btn primary" onClick={download}>
          {t("exportCsv")}
        </button>
      </section>
    </>
  );
}
