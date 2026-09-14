"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Bell } from "lucide-react";
import OneSignal from "react-onesignal";

const APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID?.trim() ?? "";
const VERIFY_KEY = "bp_onesignal_verify_shown";

/** Evita double-init (React Strict Mode). */
let initStarted = false;

function isLocalhostOrigin() {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  return host === "localhost" || host === "127.0.0.1";
}

async function initOneSignal() {
  if (!APP_ID || initStarted) return;
  initStarted = true;

  await OneSignal.init({
    appId: APP_ID,
    // PWA já registra /sw.js no root — OneSignal fica em scope próprio.
    serviceWorkerPath: "push/onesignal/OneSignalSDKWorker.js",
    serviceWorkerParam: { scope: "/push/onesignal/" },
    ...(isLocalhostOrigin() ? { allowLocalhostAsSecureOrigin: true } : {}),
    // Subscription Bell nativo fica desligado por padrão; usamos o sino do site.
  });
}

type OneSignalProviderProps = {
  children: ReactNode;
};

/**
 * Inicializa o Web SDK OneSignal (Custom Code) via react-onesignal.
 * @see https://documentation.onesignal.com/docs/en/web-sdk-setup
 */
export function OneSignalProvider({ children }: OneSignalProviderProps) {
  const [ready, setReady] = useState(false);
  const [showVerify, setShowVerify] = useState(false);
  const observerBound = useRef(false);

  useEffect(() => {
    if (!APP_ID) return;

    let cancelled = false;

    void (async () => {
      try {
        await initOneSignal();
        if (cancelled) return;
        setReady(true);

        // Observer retido no ciclo de vida do provider (não variável local).
        if (!observerBound.current) {
          observerBound.current = true;
          OneSignal.User.PushSubscription.addEventListener("change", (event) => {
            const id = event.current.id;
            if (id) {
              console.info("[OneSignal] push subscription registered:", id);
            }
          });
        }

        // Diálogo de verificação (uma vez) — permissão só no "Got it".
        const alreadyShown =
          typeof window !== "undefined" && window.localStorage.getItem(VERIFY_KEY) === "1";
        const alreadySubscribed = Boolean(OneSignal.User.PushSubscription.optedIn);
        if (!alreadyShown && !alreadySubscribed) {
          setShowVerify(true);
        }
      } catch (error) {
        console.error("[OneSignal] init failed:", error);
        initStarted = false;
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  function handleGotIt() {
    window.localStorage.setItem(VERIFY_KEY, "1");
    setShowVerify(false);
    void OneSignal.Notifications.requestPermission();
  }

  function handleDismissVerify() {
    window.localStorage.setItem(VERIFY_KEY, "1");
    setShowVerify(false);
  }

  return (
    <>
      {children}
      {ready && showVerify ? (
        <OneSignalVerifyDialog onGotIt={handleGotIt} onDismiss={handleDismissVerify} />
      ) : null}
    </>
  );
}

function OneSignalVerifyDialog({
  onGotIt,
  onDismiss,
}: {
  onGotIt: () => void;
  onDismiss: () => void;
}) {
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onDismiss();
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [onDismiss]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[10080] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      role="presentation"
      onClick={onDismiss}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="onesignal-verify-title"
        aria-describedby="onesignal-verify-desc"
        className="w-full max-w-md overflow-hidden rounded-2xl border border-white/[0.12] bg-[#12151a] shadow-[0_24px_64px_-16px_rgba(0,0,0,0.85)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="border-b border-white/[0.06] px-5 py-4">
          <div className="flex items-center gap-2 text-[#1ed760]">
            <Bell className="h-5 w-5" />
            <p
              id="onesignal-verify-title"
              className="text-sm font-bold uppercase tracking-[0.12em]"
            >
              Your OneSignal SDK integration is complete!
            </p>
          </div>
          <p id="onesignal-verify-desc" className="mt-3 text-sm leading-relaxed text-white/70">
            You can now send Push Notifications &amp; In-App Messages through OneSignal. Tap
            below to enable push notifications.
          </p>
        </div>
        <div className="flex flex-col gap-2 p-4 sm:flex-row-reverse">
          <button
            type="button"
            onClick={onGotIt}
            className="inline-flex flex-1 items-center justify-center rounded-full bg-[#1ed760] px-4 py-2.5 text-xs font-bold uppercase tracking-[0.08em] text-black transition-opacity hover:opacity-90"
          >
            Got it
          </button>
          <button
            type="button"
            onClick={onDismiss}
            className="inline-flex flex-1 items-center justify-center rounded-full border border-white/15 bg-white/[0.04] px-4 py-2.5 text-xs font-bold uppercase tracking-[0.08em] text-white/80 transition-colors hover:bg-white/[0.08]"
          >
            Agora não
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export function isOneSignalConfigured() {
  return Boolean(APP_ID);
}

/** @deprecated Use OneSignalProvider */
export function OneSignalInit() {
  return null;
}
