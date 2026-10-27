"use client";

import { AdminDataProvider } from "../../context/AdminDataContext";
import { AdminLocaleProvider } from "../../context/AdminLocaleContext";
import { ToastProvider } from "../ui/Toast";

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <AdminLocaleProvider>
      <ToastProvider>
        <AdminDataProvider>{children}</AdminDataProvider>
      </ToastProvider>
    </AdminLocaleProvider>
  );
}
