"use client";

import type { RideStatus } from "@almosafar/shared";

const LABELS: Record<RideStatus, string> = {
  requested: "Requested",
  accepted: "Accepted",
  driver_arriving: "Driver arriving",
  in_progress: "In progress",
  completed: "Completed",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

export function StatusBadge({ status }: { status: RideStatus }) {
  return (
    <span className={`badge badge--status badge--${status.replace(/_/g, "-")}`}>
      <span className="badge-dot" aria-hidden />
      {LABELS[status]}
    </span>
  );
}
