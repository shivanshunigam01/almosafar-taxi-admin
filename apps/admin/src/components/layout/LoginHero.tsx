"use client";

import Image from "next/image";
import { useAdminLocale } from "../../context/AdminLocaleContext";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=1600&q=80";

export function LoginHero() {
  const { t } = useAdminLocale();

  return (
    <div className="login-hero">
      <Image
        src={HERO_IMAGE}
        alt=""
        fill
        priority
        sizes="(max-width: 900px) 100vw, 55vw"
        className="login-hero-image"
      />
      <div className="login-hero-overlay" />
      <div className="login-hero-content">
        <span className="login-hero-badge">{t("loginBadge")}</span>
        <h2 className="login-hero-title">{t("loginTagline")}</h2>
        <p className="login-hero-sub">{t("loginHeroSub")}</p>
        <ul className="login-hero-stats">
          <li>
            <strong>24/7</strong>
            <span>{t("loginStatOps")}</span>
          </li>
          <li>
            <strong>Live</strong>
            <span>{t("loginStatRides")}</span>
          </li>
          <li>
            <strong>IQD</strong>
            <span>{t("loginStatFares")}</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
