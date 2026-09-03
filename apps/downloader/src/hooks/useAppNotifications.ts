import { useEffect, useRef, useState } from "react";
import type { PlanBillingInfo } from "../lib/plan-status";
import { planNotificationMessages } from "../lib/plan-status";
import { inAppNotificationFeed } from "../lib/notifications/in-app-feed";
import { checkForAppUpdates, type UpdateCheckResult } from "../lib/updater";
import { getAppPreferences, isDesktopRuntime } from "../lib/native/app-preferences";

const UPDATE_POLL_MS = 6 * 60 * 60 * 1000;

/** Sincroniza avisos de plano + checagem de update no feed do sininho. */
export function useAppNotifications(billing?: PlanBillingInfo | null) {
  const [update, setUpdate] = useState<UpdateCheckResult | null>(null);
  const planKeysRef = useRef<string>("");

  useEffect(() => {
    const messages = planNotificationMessages(billing);
    const key = messages.join("|");
    if (key === planKeysRef.current) return;
    planKeysRef.current = key;

    for (const message of messages) {
      inAppNotificationFeed.push({
        kind: "plan",
        severity: billing?.expired ? "error" : "warning",
        title: billing?.expired ? "Plano vencido" : "Aviso do plano",
        body: message,
        dedupeKey: `plan:${message}`,
        action: { type: "portal", label: "Abrir Portal" },
      });
    }
  }, [billing]);

  useEffect(() => {
    if (!isDesktopRuntime()) return;
    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | null = null;

    async function runCheck() {
      const prefs = await getAppPreferences();
      if (!prefs.checkAppUpdates) return;
      const result = await checkForAppUpdates({ silent: true, notifyFeed: true });
      if (!cancelled) setUpdate(result);
    }

    void runCheck();
    timer = setInterval(() => {
      void runCheck();
    }, UPDATE_POLL_MS);

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
    };
  }, []);

  return {
    update,
    updateDownloadUrl: update?.latest?.downloadUrl ?? null,
    refreshUpdateCheck: async () => {
      const result = await checkForAppUpdates({ silent: false, notifyFeed: true });
      setUpdate(result);
      return result;
    },
  };
}
