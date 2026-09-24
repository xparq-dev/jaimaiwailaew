"use client";

import { useEffect } from "react";

import { warmOfflineShell } from "@/pwa/service-worker-client";

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (
      process.env.NODE_ENV !== "production" ||
      !("serviceWorker" in navigator)
    ) {
      return;
    }

    let disposed = false;

    async function waitForController() {
      if (navigator.serviceWorker.controller) return;
      await new Promise<void>((resolve) => {
        navigator.serviceWorker.addEventListener(
          "controllerchange",
          () => resolve(),
          { once: true },
        );
      });
    }

    async function registerAndWarm() {
      const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
        updateViaCache: "none",
      });
      await navigator.serviceWorker.ready;
      await waitForController();
      if (!disposed && navigator.onLine) {
        // PDF is generated locally. Preloading its public runtime while online
        // lets the service worker cache the build chunks without caching a PDF.
        await import("@/pdf/download-local-pdf");
        await warmOfflineShell();
      }
      return registration;
    }

    let registration: ServiceWorkerRegistration | null = null;
    void registerAndWarm()
      .then((result) => {
        registration = result;
      })
      .catch(() => {
        // The application stays local-first even when PWA preparation fails.
      });

    const refreshOfflineShell = () => {
      if (!navigator.onLine) return;
      void registration
        ?.update()
        .then(() => warmOfflineShell())
        .catch(() => undefined);
    };
    window.addEventListener("online", refreshOfflineShell);

    return () => {
      disposed = true;
      window.removeEventListener("online", refreshOfflineShell);
    };
  }, []);

  return null;
}
