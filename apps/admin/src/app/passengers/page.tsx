"use client";

import { useEffect, useState } from "react";
import type { Passenger } from "@almosafar/shared";
import { useAdminData } from "../../context/AdminDataContext";
import { useAdminLocale } from "../../context/AdminLocaleContext";

export default function PassengersPage() {
  const { admin } = useAdminData();
  const { t } = useAdminLocale();
  const [rows, setRows] = useState<Passenger[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    admin?.listPassengers().then(setRows);
  }, [admin]);

  const filtered = rows.filter(
    (p) =>
      !q ||
      p.displayName.toLowerCase().includes(q.toLowerCase()) ||
      p.email?.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <>
      <h1>{t("nav.passengers")}</h1>
      <input className="input" style={{ maxWidth: 320 }} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" />
      <section className="card">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Rating</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id}>
                <td>{p.displayName}</td>
                <td>{p.email ?? "—"}</td>
                <td>{p.phoneE164 ?? "—"}</td>
                <td>{p.ratingAverage?.toFixed(1) ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
