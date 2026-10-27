"use client";

import { useEffect, useState } from "react";
import { computeDriverEarnings, formatMoney, type MockPaymentRecord } from "@almosafar/shared";
import { useAdminData } from "../../context/AdminDataContext";
import { useAdminLocale } from "../../context/AdminLocaleContext";

export default function PaymentsPage() {
  const { admin } = useAdminData();
  const { t, moneyLocale } = useAdminLocale();
  const [payments, setPayments] = useState<MockPaymentRecord[]>([]);
  const [commissionRate, setCommissionRate] = useState(0.15);

  useEffect(() => {
    admin?.getOperationalSettings().then((o) => setCommissionRate(o.driverCommissionRate));
    admin?.listMockPayments().then(setPayments);
  }, [admin]);

  return (
    <>
      <h1>{t("nav.payments")}</h1>
      <p className="muted">Mock payments only — commission rate {commissionRate * 100}% (demo).</p>
      <section className="card">
        <table>
          <thead>
            <tr>
              <th>Status</th>
              <th>Amount</th>
              <th>Platform (demo)</th>
              <th>Driver net (demo)</th>
              <th>Reference</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => {
              const split = computeDriverEarnings(p.amount);
              return (
                <tr key={p.id}>
                  <td>{p.status}</td>
                  <td>{formatMoney(p.amount, moneyLocale)}</td>
                  <td>{formatMoney(split.platformCommission, moneyLocale)}</td>
                  <td>{formatMoney(split.driverNet, moneyLocale)}</td>
                  <td>{p.mockProcessorReference ?? "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </>
  );
}
