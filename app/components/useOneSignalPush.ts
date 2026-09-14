"use client";

import { useCallback, useEffect, useState } from "react";
import OneSignal from "react-onesignal";
import { isOneSignalConfigured } from "./OneSignalInit";

type PushState = "unavailable" | "loading" | "denied" | "subscribed" | "unsubscribed";

function readPushState(): PushState {
  try {
    const permission = OneSignal.Notifications.permissionNative;
    if (permission === "denied") return "denied";
    if (OneSignal.User.PushSubscription.optedIn) return "subscribed";
    return "unsubscribed";
  } catch {
    return "loading";
  }
}

export function useOneSignalPush() {
  const configured = isOneSignalConfigured();
  const [state, setState] = useState<PushState>(configured ? "loading" : "unavailable");

  useEffect(() => {
    if (!configured) {
      setState("unavailable");
      return;
    }

    let cancelled = false;
    const sync = () => {
      if (!cancelled) setState(readPushState());
    };

    // Aguarda init do provider (pode ainda estar em andamento).
    const timer = window.setInterval(sync, 1_000);
    sync();

    try {
      OneSignal.User.PushSubscription.addEventListener("change", sync);
      OneSignal.Notifications.addEventListener("permissionChange", sync);
    } catch {
      /* SDK ainda não pronto */
    }

    return () => {
      cancelled = true;
      window.clearInterval(timer);
      try {
        OneSignal.User.PushSubscription.removeEventListener("change", sync);
        OneSignal.Notifications.removeEventListener("permissionChange", sync);
      } catch {
        /* ignore */
      }
    };
  }, [configured]);

  const subscribe = useCallback(async () => {
    if (!configured) return false;
    setState("loading");
    try {
      await OneSignal.Notifications.requestPermission();
      if (!OneSignal.User.PushSubscription.optedIn) {
        await OneSignal.User.PushSubscription.optIn();
      }
      const next = readPushState();
      setState(next);
      return next === "subscribed";
    } catch {
      setState("unsubscribed");
      return false;
    }
  }, [configured]);

  const unsubscribe = useCallback(async () => {
    if (!configured) return;
    setState("loading");
    try {
      await OneSignal.User.PushSubscription.optOut();
    } catch {
      /* ignore */
    }
    setState(readPushState());
  }, [configured]);

  return { configured, state, subscribe, unsubscribe };
}
