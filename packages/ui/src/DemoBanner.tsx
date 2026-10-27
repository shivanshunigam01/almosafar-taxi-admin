import type { CSSProperties } from "react";

export interface DemoBannerProps {
  label?: string;
  disclaimer: string;
}

const bannerStyle: CSSProperties = {
  backgroundColor: "#1e3a5f",
  color: "#f8fafc",
  padding: "10px 16px",
  fontSize: "14px",
  lineHeight: 1.45,
  borderBottom: "3px solid #f59e0b",
};

const labelStyle: CSSProperties = {
  fontWeight: 700,
  marginBottom: 4,
};

export function DemoBanner({
  label = "Almosafar Taxi · Demo",
  disclaimer,
}: DemoBannerProps) {
  return (
    <div role="status" aria-live="polite" style={bannerStyle}>
      <div style={labelStyle}>{label}</div>
      <div>{disclaimer}</div>
    </div>
  );
}
