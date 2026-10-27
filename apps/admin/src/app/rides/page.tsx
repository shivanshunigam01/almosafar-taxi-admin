"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ACTIVE_RIDE_STATUSES,
  formatMoney,
  type Driver,
  type Passenger,
  type Ride,
  type RideStatus,
} from "@almosafar/shared";
import { useAdminData } from "../../context/AdminDataContext";
import { useAdminLocale } from "../../context/AdminLocaleContext";
import { Modal } from "../../components/ui/Modal";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { useToast } from "../../components/ui/Toast";

type StatusFilter = "all" | "active" | RideStatus;

const STATUS_FILTERS: { id: StatusFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "requested", label: "Requested" },
  { id: "driver_arriving", label: "Arriving" },
  { id: "in_progress", label: "In progress" },
  { id: "completed", label: "Completed" },
  { id: "cancelled", label: "Cancelled" },
];

function shortId(id: string) {
  if (id.length <= 14) return id;
  return `${id.slice(0, 10)}…${id.slice(-4)}`;
}

export default function RidesPage() {
  const { admin } = useAdminData();
  const { t, moneyLocale } = useAdminLocale();
  const { toast } = useToast();
  const [rides, setRides] = useState<Ride[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [modalRide, setModalRide] = useState<Ride | null>(null);
  const [detailRide, setDetailRide] = useState<Ride | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Ride | null>(null);
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

  const pName = (id: string) => passengers.find((p) => p.id === id)?.displayName ?? id;
  const dName = (id: string | undefined) =>
    id ? drivers.find((d) => d.id === id)?.displayName ?? id : "—";

  const stats = useMemo(() => {
    const active = rides.filter((r) => ACTIVE_RIDE_STATUSES.includes(r.status)).length;
    const requested = rides.filter((r) => r.status === "requested").length;
    const arriving = rides.filter((r) => r.status === "driver_arriving").length;
    return { total: rides.length, active, requested, arriving };
  }, [rides]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rides.filter((r) => {
      if (statusFilter === "active" && !ACTIVE_RIDE_STATUSES.includes(r.status)) return false;
      if (statusFilter !== "all" && statusFilter !== "active" && r.status !== statusFilter) {
        return false;
      }
      if (!q) return true;
      return (
        r.status.includes(q) ||
        r.id.toLowerCase().includes(q) ||
        r.pickup.label.toLowerCase().includes(q) ||
        r.dropoff.label.toLowerCase().includes(q) ||
        pName(r.passengerId).toLowerCase().includes(q) ||
        dName(r.driverId).toLowerCase().includes(q)
      );
    });
  }, [rides, query, statusFilter, passengers, drivers]);

  const assign = async () => {
    if (!admin || !modalRide || !driverId) return;
    setBusy(true);
    setError(null);
    try {
      await admin.assignDriverToRide(modalRide.id, driverId);
      setModalRide(null);
      toast({ variant: "success", title: t("assign"), description: "Driver assigned to ride." });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed";
      setError(msg);
      toast({ variant: "error", title: "Assignment failed", description: msg });
    } finally {
      setBusy(false);
    }
  };

  const confirmCancel = async () => {
    if (!admin || !cancelTarget) return;
    setBusy(true);
    try {
      await admin.cancelRideAsAdmin(cancelTarget.id, cancelReason);
      toast({ variant: "warning", title: "Ride cancelled", description: shortId(cancelTarget.id) });
      setCancelTarget(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed";
      setError(msg);
      toast({ variant: "error", title: "Cancel failed", description: msg });
    } finally {
      setBusy(false);
    }
  };

  const openAssign = (ride: Ride) => {
    setModalRide(ride);
    setDriverId(ride.driverId ?? drivers[0]?.id ?? "");
  };

  const canCancel = (ride: Ride) =>
    ride.status !== "completed" && ride.status !== "cancelled";

  const fareLabel = (ride: Ride) => {
    const fare = ride.fareFinal?.total ?? ride.fareEstimate?.total;
    if (!fare) return "—";
    return formatMoney(fare, moneyLocale);
  };

  return (
    <>
      <PageHeader
        title={t("nav.rides")}
        lead="Monitor trips in real time, reassign drivers, and cancel when needed."
      >
        <span className="live-pill" title="Live subscription">
          <span className="live-pill-dot" />
          {stats.active} active
        </span>
      </PageHeader>

      <div className="mini-stat-row">
        <div className="mini-stat">
          <span className="mini-stat-value">{stats.total}</span>
          <span className="mini-stat-label">Total rides</span>
        </div>
        <div className="mini-stat">
          <span className="mini-stat-value">{stats.requested}</span>
          <span className="mini-stat-label">Awaiting driver</span>
        </div>
        <div className="mini-stat">
          <span className="mini-stat-value">{stats.arriving}</span>
          <span className="mini-stat-label">Driver en route</span>
        </div>
        <div className="mini-stat mini-stat--accent">
          <span className="mini-stat-value">{filtered.length}</span>
          <span className="mini-stat-label">Shown</span>
        </div>
      </div>

      <section className="card card--flush">
        <div className="table-toolbar">
          <div className="search-wrap">
            <span className="search-icon" aria-hidden>⌕</span>
            <input
              className="input search-input"
              placeholder="Search ID, passenger, driver, or route…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="filter-chips" role="tablist" aria-label="Filter by status">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                role="tab"
                aria-selected={statusFilter === f.id}
                className={`chip ${statusFilter === f.id ? "chip--active" : ""}`}
                onClick={() => setStatusFilter(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {error ? <p className="error-text table-toolbar-error">{error}</p> : null}

        {filtered.length === 0 ? (
          <div className="empty-state">
            <p>No rides match your filters.</p>
            <button
              type="button"
              className="btn secondary"
              onClick={() => {
                setQuery("");
                setStatusFilter("all");
              }}
            >
              Clear filters
            </button>
          </div>
        ) : (
          <>
            <div className="ride-card-list">
              {filtered.map((ride) => (
                <article key={ride.id} className="ride-card">
                  <div className="ride-card-top">
                    <StatusBadge status={ride.status} />
                    <code className="id-mono" title={ride.id}>{shortId(ride.id)}</code>
                  </div>
                  <p className="ride-card-passenger">{pName(ride.passengerId)}</p>
                  <p className="ride-card-route">
                    <span>{ride.pickup.label}</span>
                    <span className="route-arrow">→</span>
                    <span>{ride.dropoff.label}</span>
                  </p>
                  <div className="ride-card-meta">
                    <span>{dName(ride.driverId)}</span>
                    <span>{fareLabel(ride)}</span>
                  </div>
                  <div className="btn-row ride-card-actions">
                    <button type="button" className="btn ghost sm" onClick={() => setDetailRide(ride)}>
                      Details
                    </button>
                    <button type="button" className="btn secondary sm" onClick={() => openAssign(ride)}>
                      {t("assign")}
                    </button>
                    <button
                      type="button"
                      className="btn danger sm"
                      disabled={busy || !canCancel(ride)}
                      onClick={() => setCancelTarget(ride)}
                    >
                      {t("cancel")}
                    </button>
                  </div>
                </article>
              ))}
            </div>

            <div className="table-scroll data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Ride</th>
                    <th>Status</th>
                    <th>Passenger</th>
                    <th>Driver</th>
                    <th>Route</th>
                    <th>Fare</th>
                    <th className="col-actions">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((ride) => (
                    <tr key={ride.id}>
                      <td>
                        <button
                          type="button"
                          className="link-id"
                          onClick={() => setDetailRide(ride)}
                          title={ride.id}
                        >
                          {shortId(ride.id)}
                        </button>
                        <div className="cell-sub">{ride.category}</div>
                      </td>
                      <td>
                        <StatusBadge status={ride.status} />
                      </td>
                      <td className="cell-nowrap">{pName(ride.passengerId)}</td>
                      <td className="cell-nowrap">{dName(ride.driverId)}</td>
                      <td className="cell-route">
                        <span className="route-line">{ride.pickup.label}</span>
                        <span className="route-line route-line--muted">{ride.dropoff.label}</span>
                      </td>
                      <td className="cell-nowrap">{fareLabel(ride)}</td>
                      <td className="col-actions">
                        <div className="btn-row">
                          <button
                            type="button"
                            className="btn secondary sm"
                            onClick={() => openAssign(ride)}
                          >
                            {t("assign")}
                          </button>
                          <button
                            type="button"
                            className="btn danger sm"
                            disabled={busy || !canCancel(ride)}
                            onClick={() => setCancelTarget(ride)}
                          >
                            {t("cancel")}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      <Modal open={!!modalRide} title={t("assign")} onClose={() => setModalRide(null)}>
        {modalRide ? (
          <p className="muted" style={{ marginTop: 0 }}>
            {shortId(modalRide.id)} · {pName(modalRide.passengerId)}
          </p>
        ) : null}
        <div className="form-row">
          <label>Driver</label>
          <select className="input" value={driverId} onChange={(e) => setDriverId(e.target.value)}>
            {drivers.map((d) => (
              <option key={d.id} value={d.id}>
                {d.displayName} {d.isOnline ? "· online" : ""}
              </option>
            ))}
          </select>
        </div>
        <div className="btn-row modal-actions">
          <button type="button" className="btn ghost" onClick={() => setModalRide(null)}>
            {t("cancel")}
          </button>
          <button type="button" className="btn primary" disabled={busy || !driverId} onClick={assign}>
            {t("assign")}
          </button>
        </div>
      </Modal>

      <Modal
        open={!!cancelTarget}
        title="Cancel ride"
        onClose={() => setCancelTarget(null)}
      >
        <div className="form-row">
          <label>Reason</label>
          <textarea
            className="input"
            rows={3}
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
          />
        </div>
        <div className="btn-row modal-actions">
          <button type="button" className="btn ghost" onClick={() => setCancelTarget(null)}>
            Keep ride
          </button>
          <button type="button" className="btn danger" disabled={busy} onClick={confirmCancel}>
            Confirm cancel
          </button>
        </div>
      </Modal>

      <Modal
        open={!!detailRide}
        title="Ride details"
        onClose={() => setDetailRide(null)}
      >
        {detailRide ? (
          <dl className="detail-list">
            <div>
              <dt>ID</dt>
              <dd><code className="id-mono">{detailRide.id}</code></dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd><StatusBadge status={detailRide.status} /></dd>
            </div>
            <div>
              <dt>Passenger</dt>
              <dd>{pName(detailRide.passengerId)}</dd>
            </div>
            <div>
              <dt>Driver</dt>
              <dd>{dName(detailRide.driverId)}</dd>
            </div>
            <div>
              <dt>Pickup</dt>
              <dd>{detailRide.pickup.label}</dd>
            </div>
            <div>
              <dt>Dropoff</dt>
              <dd>{detailRide.dropoff.label}</dd>
            </div>
            <div>
              <dt>Fare</dt>
              <dd>{fareLabel(detailRide)}</dd>
            </div>
            <div>
              <dt>Requested</dt>
              <dd>{new Date(detailRide.requestedAt).toLocaleString()}</dd>
            </div>
            {detailRide.demoPassengerPin ? (
              <div>
                <dt>Demo PIN</dt>
                <dd><code>{detailRide.demoPassengerPin}</code></dd>
              </div>
            ) : null}
          </dl>
        ) : null}
        <div className="btn-row modal-actions">
          <button type="button" className="btn secondary sm" onClick={() => detailRide && openAssign(detailRide)}>
            {t("assign")}
          </button>
          <button type="button" className="btn primary sm" onClick={() => setDetailRide(null)}>
            Close
          </button>
        </div>
      </Modal>
    </>
  );
}
