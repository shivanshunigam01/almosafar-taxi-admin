"use client";

import { useEffect, useState } from "react";
import type { Driver } from "@almosafar/shared";
import { useAdminData } from "../../context/AdminDataContext";
import { useAdminLocale } from "../../context/AdminLocaleContext";
import { useToast } from "../../components/ui/Toast";

export default function DriversPage() {
  const { admin } = useAdminData();
  const { t } = useAdminLocale();
  const { toast } = useToast();
  const [rows, setRows] = useState<Driver[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  const load = () => admin?.listDrivers().then(setRows);

  useEffect(() => {
    load();
  }, [admin]);

  const verify = async (id: string, status: "verified" | "rejected") => {
    if (!admin) return;
    setBusy(id);
    await admin.setDriverVerification(id, status);
    await load();
    setBusy(null);
    toast({
      variant: status === "verified" ? "success" : "warning",
      title: status === "verified" ? t("verify") : t("reject"),
      description: "Driver verification updated.",
    });
  };

  return (
    <>
      <h1>{t("nav.drivers")}</h1>
      <section className="card">
        <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Online</th>
              <th>Verification</th>
              <th>License</th>
              <th className="col-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((d) => (
              <tr key={d.id}>
                <td>{d.displayName}</td>
                <td>{d.isOnline ? "Yes" : "No"}</td>
                <td>{d.verificationStatus ?? "—"}</td>
                <td>{d.licenseNumber ?? "—"}</td>
                <td className="col-actions">
                  <div className="btn-row">
                    <button
                      type="button"
                      className="btn secondary sm"
                      disabled={busy === d.id}
                      onClick={() => verify(d.id, "verified")}
                    >
                      {t("verify")}
                    </button>
                    <button
                      type="button"
                      className="btn danger sm"
                      disabled={busy === d.id}
                      onClick={() => verify(d.id, "rejected")}
                    >
                      {t("reject")}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </section>
    </>
  );
}
