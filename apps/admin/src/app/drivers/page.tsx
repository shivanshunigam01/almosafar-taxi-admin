"use client";

import { useEffect, useState } from "react";
import type { Driver } from "@almosafar/shared";
import { useAdminData } from "../../context/AdminDataContext";
import { useAdminLocale } from "../../context/AdminLocaleContext";

export default function DriversPage() {
  const { admin } = useAdminData();
  const { t } = useAdminLocale();
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
  };

  return (
    <>
      <h1>{t("nav.drivers")}</h1>
      <section className="card">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Online</th>
              <th>Verification</th>
              <th>License</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((d) => (
              <tr key={d.id}>
                <td>{d.displayName}</td>
                <td>{d.isOnline ? "Yes" : "No"}</td>
                <td>{d.verificationStatus ?? "—"}</td>
                <td>{d.licenseNumber ?? "—"}</td>
                <td>
                  <button
                    type="button"
                    className="btn secondary"
                    disabled={busy === d.id}
                    onClick={() => verify(d.id, "verified")}
                  >
                    {t("verify")}
                  </button>{" "}
                  <button
                    type="button"
                    className="btn danger"
                    disabled={busy === d.id}
                    onClick={() => verify(d.id, "rejected")}
                  >
                    {t("reject")}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
