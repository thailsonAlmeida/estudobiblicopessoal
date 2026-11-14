"use client";

import { useEffect } from "react";
import { requestPersistentStorage } from "@/lib/storage/persistence";

export function SwRegistrar() {
  useEffect(() => {
    void requestPersistentStorage();

    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    // Em ambiente de desenvolvimento, remove Service Workers antigos e limpa CacheStorage
    // para garantir que alterações de código (HMR / chunks do Next.js) apareçam imediatamente.
    if (process.env.NODE_ENV !== "production") {
      navigator.serviceWorker
        .getRegistrations()
        .then((registrations) => {
          for (const reg of registrations) {
            void reg.unregister();
          }
        })
        .catch(() => {
          // Ignora em ambientes restritos
        });

      if ("caches" in window) {
        caches
          .keys()
          .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
          .catch(() => {
            // Ignora erro de limpeza de cache
          });
      }
      return;
    }

    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((reg) => {
        void reg.update();
      })
      .catch(() => {
        // Falha silenciosa em ambientes sem suporte a Service Worker
      });
  }, []);

  return null;
}
