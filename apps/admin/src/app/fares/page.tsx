"use client";

import { useEffect, useState } from "react";
import { formatMoney, type FareConfiguration } from "@almosafar/shared";
import { useAdminData } from "../../context/AdminDataContext";
import { useAdminLocale } from "../../context/AdminLocaleContext";

export default function FaresPage() {
  const { admin } = useAdminData();
  const { t, moneyLocale } = useAdminLocale();
  const [rows, setRows] = useState<FareConfiguration[]>([]);
  const [editing, setEditing] = useState<FareConfiguration | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = () => admin?.listFareConfigurations().then(setRows);

  useEffect(() => {
    load();
  }, [admin]);

  const minorToMajor = (m: number) => m / 100;

  const save = async () => {
    if (!admin || !editing) return;
    setError(null);
    try {
      await admin.updateFareConfiguration(editing.id, {
        baseFareMajor: minorToMajor(editing.baseFareMinor),
        perKmMajor: minorToMajor(editing.perKmMinor),
        perMinuteMajor: minorToMajor(editing.perMinuteMinor),
        minimumFareMajor: minorToMajor(editing.minimumFareMinor),
        bookingFeeMajor: minorToMajor(editing.bookingFeeMinor),
        surgeMultiplier: editing.surgeMultiplier,
        discountPercent: editing.discountPercent,
        isActive: editing.isActive,
      });
      setEditing(null);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    }
  };

  return (
    <>
      <h1>{t("nav.fares")}</h1>
      <p className="muted">{t("demoDisclaimer")}</p>
      {error ? <p className="error-text">{error}</p> : null}
      <section className="card">
        <table>
          <thead>
            <tr>
              <th>Category</th>
              <th>Base</th>
              <th>/ km</th>
              <th>/ min</th>
              <th>Min</th>
              <th>Surge</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((f) => (
              <tr key={f.id}>
                <td>{f.category}</td>
                <td>{formatMoney({ currency: f.currency, amountMinor: f.baseFareMinor }, moneyLocale)}</td>
                <td>{formatMoney({ currency: f.currency, amountMinor: f.perKmMinor }, moneyLocale)}</td>
                <td>{formatMoney({ currency: f.currency, amountMinor: f.perMinuteMinor }, moneyLocale)}</td>
                <td>{formatMoney({ currency: f.currency, amountMinor: f.minimumFareMinor }, moneyLocale)}</td>
                <td>{f.surgeMultiplier}×</td>
                <td>
                  <button type="button" className="btn secondary" onClick={() => setEditing({ ...f })}>
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      {editing ? (
        <section className="card">
          <h2>Edit {editing.category}</h2>
          {(
            [
              ["baseFareMinor", "Base (minor)"],
              ["perKmMinor", "Per km (minor)"],
              ["perMinuteMinor", "Per minute (minor)"],
              ["minimumFareMinor", "Minimum (minor)"],
            ] as const
          ).map(([key, label]) => (
            <div className="form-row" key={key}>
              <label>{label}</label>
              <input
                className="input"
                type="number"
                value={editing[key]}
                onChange={(e) =>
                  setEditing({ ...editing, [key]: Number(e.target.value) })
                }
              />
            </div>
          ))}
          <div className="form-row">
            <label>Surge multiplier</label>
            <input
              className="input"
              type="number"
              step="0.05"
              value={editing.surgeMultiplier}
              onChange={(e) =>
                setEditing({ ...editing, surgeMultiplier: Number(e.target.value) })
              }
            />
          </div>
          <button type="button" className="btn primary" onClick={save}>
            {t("save")}
          </button>
        </section>
      ) : null}
    </>
  );
}
