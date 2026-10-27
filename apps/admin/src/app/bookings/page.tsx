"use client";

import { useEffect, useState } from "react";
import { formatMoney, type TripHistoryEntry } from "@almosafar/shared";
import { useAdminData } from "../../context/AdminDataContext";
import { useAdminLocale } from "../../context/AdminLocaleContext";

export default function BookingsPage() {
  const { admin } = useAdminData();
  const { t, moneyLocale } = useAdminLocale();
  const [rows, setRows] = useState<TripHistoryEntry[]>([]);

  useEffect(() => {
    admin?.listTripHistory().then(setRows);
  }, [admin]);

  return (
    <>
      <h1>{t("nav.bookings")}</h1>
      <section className="card">
        <table>
          <thead>
            <tr>
              <th>Completed</th>
              <th>Category</th>
              <th>Route</th>
              <th>Fare</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((h) => (
              <tr key={h.id}>
                <td>{h.completedAt ?? "—"}</td>
                <td>{h.vehicleCategory}</td>
                <td>
                  {h.pickup.label} → {h.dropoff.label}
                </td>
                <td>{formatMoney(h.fareTotal, moneyLocale)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
