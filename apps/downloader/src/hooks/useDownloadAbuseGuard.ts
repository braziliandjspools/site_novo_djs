import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { downloadManager } from "../lib/download/download-manager";
import {
  abuseMessageFromPayload,
  fetchDownloadAbuseStatus,
  isAbuseBanPayload,
  type DownloadAbuseStatus,
} from "../lib/api/abuse";
import { ApiError } from "../lib/api/client";
import { useToast } from "../components/ui/Toast";

const POLL_MS = 45_000;

export function useDownloadAbuseGuard() {
  const { sessionToken, status } = useAuth();
  const { showToast } = useToast();
  const [abuse, setAbuse] = useState<DownloadAbuseStatus | null>(null);
  const lastMessageRef = useRef<string | null>(null);

  useEffect(() => {
    if (status !== "authenticated" || !sessionToken) {
      setAbuse(null);
      return;
    }

    let cancelled = false;

    async function poll() {
      try {
        const res = await fetchDownloadAbuseStatus(sessionToken!);
        if (cancelled) return;
        setAbuse(res.abuse);

        if (res.abuse.banned) {
          downloadManager.pauseAllDownloads();
          const msg = res.abuse.message ?? "Downloads bloqueados por abuso.";
          if (lastMessageRef.current !== msg) {
            lastMessageRef.current = msg;
            showToast(msg, "error");
          }
        } else if (res.abuse.alerted && res.abuse.message) {
          if (lastMessageRef.current !== res.abuse.message) {
            lastMessageRef.current = res.abuse.message;
            showToast(res.abuse.message, "warning");
          }
        } else {
          lastMessageRef.current = null;
        }
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError && isAbuseBanPayload(err.payload)) {
          downloadManager.pauseAllDownloads();
          const msg = abuseMessageFromPayload(err.payload, err.message);
          setAbuse({
            banned: true,
            banReason: msg,
            bannedAt: new Date().toISOString(),
            alerted: true,
            alertReason: msg,
            alertedAt: new Date().toISOString(),
            onTestPlan: false,
            code: "DOWNLOAD_ABUSE_BANNED",
            message: msg,
          });
          if (lastMessageRef.current !== msg) {
            lastMessageRef.current = msg;
            showToast(msg, "error");
          }
        }
      }
    }

    void poll();
    const id = window.setInterval(() => void poll(), POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [sessionToken, status, showToast]);

  return abuse;
}
