"use client";

import { AdminDataProvider } from "../../context/AdminDataContext";
import { AdminLocaleProvider } from "../../context/AdminLocaleContext";

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <AdminLocaleProvider>
      <AdminDataProvider>{children}</AdminDataProvider>
    </AdminLocaleProvider>
  );
}
