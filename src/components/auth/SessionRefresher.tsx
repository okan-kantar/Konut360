"use client";

import { useEffect } from "react";

const REFRESH_INTERVAL_MS = 10 * 60 * 1000; // erişim token'ı 15 dk, 10 dk'da bir tazelenir

export default function SessionRefresher() {
  useEffect(() => {
    const interval = setInterval(() => {
      fetch("/api/auth/refresh", { method: "POST" }).catch(() => {});
    }, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  return null;
}
