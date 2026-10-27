"use client";

import { useEffect, useState } from "react";
import type { Driver, Passenger, Ride } from "@almosafar/shared";
import { useAdminData } from "../../context/AdminDataContext";
import { useAdminLocale } from "../../context/AdminLocaleContext";
import { Modal } from "../../components/ui/Modal";

export default function RidesPage() {
  const { admin } = useAdminData();
  const { t } = useAdminLocale();
  const [rides, setRides] = useState<Ride[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [filter, setFilter] = useState("");
  const [modalRide, setModalRide] = useState<Ride | null>(null);
  const [driverId, setDriverId] = useState("");
  const [cancelReason, setCancelReason] = useState("Admin cancelled (demo)");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!admin) return;
    admin.listDrivers().then(setDrivers);
    admin.listPassengers().then(setPassengers);
    return admin.subscribeRides(setRides);
  }, [admin]);

  const filtered = rides.filter(
    (r) =>
      !filter ||
      r.status.includes(filter) ||
      r.id.includes(filter) ||
      r.pickup.label.toLowerCase().includes(filter.toLowerCase())
  );

  const pName = (id: string) => passengers.find((p) => p.id === id)?.displayName ?? id;

  const assign = async () => {
    if (!admin || !modalRide || !driverId) return;
    setBusy(true);
    setError(null);
    try {
      await admin.assignDriverToRide(modalRide.id, driverId);
      setModalRide(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  };

  const cancel = async (ride: Ride) => {
    if (!admin) return;
    setBusy(true);
    try {
      await admin.cancelRideAsAdmin(ride.id, cancelReason);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <h1>{t("nav.rides")}</h1>
      <div className="toolbar">
        <input
          className="input"
          placeholder="Filter status or route…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{ maxWidth: 280 }}
        />
      </div>
      {error ? <p className="error-text">{error}</p> : null}
      <section className="card">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Status</th>
              <th>Passenger</th>
              <th>Route</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((ride) => (
              <tr key={ride.id}>
                <td>{ride.id.slice(0, 18)}…</td>
                <td>{ride.status}</td>
                <td>{pName(ride.passengerId)}</td>
                <td>
                  {ride.pickup.label} → {ride.dropoff.label}
                </td>
                <td>
                  <button
                    type="button"
                    className="btn secondary"
                    onClick={() => {
                      setModalRide(ride);
                      setDriverId(drivers[0]?.id ?? "");
                    }}
                  >
                    {t("assign")}
                  </button>{" "}
                  <button
                    type="button"
                    className="btn danger"
                    disabled={busy || ride.status === "completed" || ride.status === "cancelled"}
                    onClick={() => cancel(ride)}
                  >
                    {t("cancel")}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <Modal open={!!modalRide} title={t("assign")} onClose={() => setModalRide(null)}>
        <select className="input" value={driverId} onChange={(e) => setDriverId(e.target.value)}>
          {drivers.map((d) => (
            <option key={d.id} value={d.id}>
              {d.displayName}
            </option>
          ))}
        </select>
        <div className="toolbar" style={{ marginTop: 16 }}>
          <button type="button" className="btn primary" disabled={busy} onClick={assign}>
            {t("assign")}
          </button>
        </div>
      </Modal>
    </>
  );
}
