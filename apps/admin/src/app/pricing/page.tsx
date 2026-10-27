"use client";

import { useEffect, useState } from "react";
import type { OperationalSettings } from "@almosafar/shared";
import { formatMoney } from "@almosafar/shared";
import { useAdminData } from "../../context/AdminDataContext";
import { useAdminLocale } from "../../context/AdminLocaleContext";
import { useToast } from "../../components/ui/Toast";

export default function PricingRulesPage() {
  const { admin } = useAdminData();
  const { t, moneyLocale } = useAdminLocale();
  const { toast } = useToast();
  const [ops, setOps] = useState<OperationalSettings | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    admin?.getOperationalSettings().then(setOps);
  }, [admin]);

  const save = async () => {
    if (!admin || !ops) return;
    setError(null);
    try {
      const next = await admin.updateOperationalSettings({
        defaultRegionLabel: ops.defaultRegionLabel,
        defaultCurrency: ops.defaultCurrency,
        driverCommissionRate: ops.driverCommissionRate,
        cancellationChargeMinor: ops.cancellationChargeMinor,
        peakHourRules: ops.peakHourRules,
        surgeRules: ops.surgeRules,
      });
      setOps(next);
      toast({ variant: "success", title: t("save"), description: "Pricing rules updated." });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Save failed";
      setError(msg);
      toast({ variant: "error", title: "Save failed", description: msg });
    }
  };

  if (!ops) return <p>{t("loading")}</p>;

  return (
    <>
      <h1>{t("nav.pricing")}</h1>
      <p className="muted">{t("demoDisclaimer")}</p>
      {error ? <p className="error-text">{error}</p> : null}
      <section className="card">
        <div className="form-row">
          <label>{t("region")}</label>
          <input
            className="input"
            value={ops.defaultRegionLabel}
            onChange={(e) => setOps({ ...ops, defaultRegionLabel: e.target.value })}
          />
        </div>
        <div className="form-row">
          <label>{t("currency")}</label>
          <select
            className="input"
            value={ops.defaultCurrency}
            onChange={(e) =>
              setOps({ ...ops, defaultCurrency: e.target.value as OperationalSettings["defaultCurrency"] })
            }
          >
            {(["IQD", "SAR", "USD", "AED"] as const).map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="form-row">
          <label>{t("commission")}</label>
          <input
            className="input"
            type="number"
            step="0.01"
            value={ops.driverCommissionRate}
            onChange={(e) =>
              setOps({ ...ops, driverCommissionRate: Number(e.target.value) })
            }
          />
        </div>
        <div className="form-row">
          <label>{t("cancellationCharge")}</label>
          <input
            className="input"
            type="number"
            value={ops.cancellationChargeMinor}
            onChange={(e) =>
              setOps({ ...ops, cancellationChargeMinor: Number(e.target.value) })
            }
          />
          <span className="muted">
            Display:{" "}
            {formatMoney(
              { currency: ops.defaultCurrency, amountMinor: ops.cancellationChargeMinor },
              moneyLocale
            )}
          </span>
        </div>
        <button type="button" className="btn primary" onClick={save}>
          {t("save")}
        </button>
      </section>
      <section className="card">
        <h2>Peak hours (demo)</h2>
        <ul>
          {ops.peakHourRules.map((r) => (
            <li key={r.id}>
              {r.label}: {r.startHour}:00–{r.endHour}:00 · {r.multiplier}× ·{" "}
              {r.isActive ? "Active" : "Off"}
            </li>
          ))}
        </ul>
      </section>
      <section className="card">
        <h2>Surge rules (demo)</h2>
        <ul>
          {ops.surgeRules.map((r) => (
            <li key={r.id}>
              {r.label}: {r.multiplier}× · {r.isActive ? "Active" : "Off"}
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
