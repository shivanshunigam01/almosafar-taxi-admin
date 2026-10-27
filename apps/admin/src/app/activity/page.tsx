"use client";

import { useEffect, useState } from "react";
import type { DemoActivity } from "@almosafar/shared";
import { useAdminData } from "../../context/AdminDataContext";
import { useAdminLocale } from "../../context/AdminLocaleContext";

export default function ActivityPage() {
  const { admin } = useAdminData();
  const { t } = useAdminLocale();
  const [rows, setRows] = useState<DemoActivity[]>([]);

  useEffect(() => {
    admin?.listActivityLogs().then(setRows);
  }, [admin]);

  return (
    <>
      <h1>{t("nav.activity")}</h1>
      <section className="card">
        <ul>
          {rows.map((a) => (
            <li key={a.id}>
              [{a.occurredAt}] {a.message}
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
