"use client";

import { useEffect } from "react";

/** Registra o service worker do PWA (necessário para instalar no PC). */
export function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    const register = async () => {
      try {
        const regs = await navigator.serviceWorker.getRegistrations();
        // Limpa SWs antigos que interceptavam fetch e quebravam /api/stream + navegação.
        await Promise.all(
          regs.map(async (reg) => {
            const script = reg.active?.scriptURL || reg.waiting?.scriptURL || reg.installing?.scriptURL || "";
            if (script.endsWith("/sw.js") || script.includes("/sw.js")) {
              /* re-register abaixo atualiza; força update */
              await reg.update().catch(() => undefined);
            }
          }),
        );
        const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
        await reg.update().catch(() => undefined);
      } catch {
        /* SW opcional em dev / ambientes sem HTTPS */
      }
    };

    if (document.readyState === "complete") void register();
    else window.addEventListener("load", () => void register(), { once: true });
  }, []);

  return null;
}
