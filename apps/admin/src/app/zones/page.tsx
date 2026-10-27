"use client";

import { useEffect, useState } from "react";
import type { ServiceZone } from "@almosafar/shared";
import { useAdminData } from "../../context/AdminDataContext";
import { useAdminLocale } from "../../context/AdminLocaleContext";

export default function ZonesPage() {
  const { admin } = useAdminData();
  const { t } = useAdminLocale();
  const [zones, setZones] = useState<ServiceZone[]>([]);

  useEffect(() => {
    admin?.listZones().then(setZones);
  }, [admin]);

  return (
    <>
      <h1>{t("nav.zones")}</h1>
      {zones.map((z) => (
        <section className="card" key={z.id}>
          <h2>{z.name}</h2>
          <p className="muted">Currency: {z.currency} · Active: {z.isActive ? "Yes" : "No"}</p>
          <p>
            Bounds (demo): NE {z.bounds.northEast.latitude.toFixed(3)},{" "}
            {z.bounds.northEast.longitude.toFixed(3)} — SW {z.bounds.southWest.latitude.toFixed(3)},{" "}
            {z.bounds.southWest.longitude.toFixed(3)}
          </p>
        </section>
      ))}
    </>
  );
}
