"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAdminData } from "../../context/AdminDataContext";
import { useAdminLocale } from "../../context/AdminLocaleContext";

export default function LoginPage() {
  const { admin, error, loading, forceLocal, setForceLocal, retry } = useAdminData();
  const { t } = useAdminLocale();
  const router = useRouter();
  const [email, setEmail] = useState("demo.admin@almosafar.example.com");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!admin) return;
    setBusy(true);
    setFormError(null);
    try {
      await admin.signInAdmin(email, password);
      router.replace("/dashboard");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Sign-in failed");
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <div className="center-page">{t("loading")}</div>;

  return (
    <div className="login-page">
      <div className="card login-card">
        <h1>{t("appName")}</h1>
        <p className="muted">{t("demoDisclaimer")}</p>
        {error ? (
          <>
            <p className="error-text">{error}</p>
            <div className="toolbar">
              <button type="button" className="btn secondary" onClick={retry}>
                Retry
              </button>
              <button
                type="button"
                className="btn primary"
                onClick={() => setForceLocal(true)}
              >
                Use local demo
              </button>
            </div>
          </>
        ) : null}
        {!error || forceLocal ? (
          <form onSubmit={onSubmit}>
            <p className="muted">
              {admin?.mode === "firestore" ? t("firebaseHint") : t("localDemoHint")}
            </p>
            <div className="form-row">
              <label>{t("email")}</label>
              <input
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
              />
            </div>
            <div className="form-row">
              <label>{t("password")}</label>
              <input
                className="input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>
            {formError ? <p className="error-text">{formError}</p> : null}
            <button type="submit" className="btn primary" disabled={busy || !admin}>
              {t("login")}
            </button>
          </form>
        ) : null}
      </div>
    </div>
  );
}
