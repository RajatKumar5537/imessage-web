"use client";

import React, { useEffect } from "react";
import { SessionProvider } from "next-auth/react";

export default function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          // Service Worker registered successfully
        })
        .catch((err) => {
          console.warn("ServiceWorker registration notice:", err);
        });
    }
  }, []);

  return <SessionProvider>{children}</SessionProvider>;
}

