"use client";

import { useEffect, useState } from "react";
import type { Vehicle } from "@almosafar/shared";
import { useAdminData } from "../../context/AdminDataContext";
import { useAdminLocale } from "../../context/AdminLocaleContext";

export default function VehiclesPage() {
  const { admin } = useAdminData();
  const { t } = useAdminLocale();
  const [rows, setRows] = useState<Vehicle[]>([]);

  useEffect(() => {
    admin?.listVehicles().then(setRows);
  }, [admin]);

  return (
    <>
      <h1>{t("nav.vehicles")}</h1>
      <section className="card">
        <table>
          <thead>
            <tr>
              <th>Category</th>
              <th>Vehicle</th>
              <th>Plate</th>
              <th>Driver ID</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((v) => (
              <tr key={v.id}>
                <td>{v.category}</td>
                <td>
                  {v.make} {v.model} ({v.color})
                </td>
                <td>{v.plateNumber}</td>
                <td>{v.driverId}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
