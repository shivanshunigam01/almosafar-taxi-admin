"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  CloudConnectionError,
  createAdminDataServiceAsync,
  type AdminDataService,
} from "@almosafar/shared";
import { firebaseEnv } from "../lib/firebase-env";

const AdminDataContext = createContext<{
  admin: AdminDataService | null;
  error: string | null;
  loading: boolean;
  forceLocal: boolean;
  setForceLocal: (v: boolean) => void;
  retry: () => void;
} | null>(null);

export function AdminDataProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<AdminDataService | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forceLocal, setForceLocal] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    createAdminDataServiceAsync(firebaseEnv, { forceLocal })
      .then((svc) => {
        if (!cancelled) setAdmin(svc);
      })
      .catch((e) => {
        if (!cancelled) {
          setAdmin(null);
          setError(
            e instanceof CloudConnectionError
              ? e.message
              : e instanceof Error
                ? e.message
                : "Init failed"
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [forceLocal, tick]);

  const value = useMemo(
    () => ({
      admin,
      error,
      loading,
      forceLocal,
      setForceLocal,
      retry: () => setTick((x) => x + 1),
    }),
    [admin, error, loading, forceLocal]
  );

  return <AdminDataContext.Provider value={value}>{children}</AdminDataContext.Provider>;
}

export function useAdminData() {
  const ctx = useContext(AdminDataContext);
  if (!ctx) throw new Error("AdminDataProvider required");
  return ctx;
}
