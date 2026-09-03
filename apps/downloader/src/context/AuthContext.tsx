import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { ApiError } from "../lib/api/client";
import { fetchSession, loginWithPassword, mapSessionUser } from "../lib/api/auth";
import { registerDevice } from "../lib/api/devices";
import { formatApiError } from "../lib/errors";
import type { AuthUser, PlanBillingInfo } from "../lib/plan-status";
import {
  clearSessionToken,
  formatPlatformLabel,
  getDeviceName,
  getOrCreateDeviceId,
  getPlatformName,
  loadSessionToken,
  saveSessionToken,
} from "../lib/native/secure-store";
import { downloadManager } from "../lib/download/download-manager";

export type DeviceInfo = {
  deviceId: string;
  deviceName: string;
  platform: string;
  platformLabel: string;
};

export type { AuthUser, PlanBillingInfo };

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

type AuthContextValue = {
  status: AuthStatus;
  user: AuthUser | null;
  device: DeviceInfo | null;
  sessionToken: string | null;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function buildDeviceInfo(): Promise<DeviceInfo> {
  const [deviceId, deviceName, platform] = await Promise.all([
    getOrCreateDeviceId(),
    getDeviceName(),
    getPlatformName(),
  ]);

  return {
    deviceId,
    deviceName,
    platform,
    platformLabel: formatPlatformLabel(platform),
  };
}

async function registerCurrentDevice(token: string, device: DeviceInfo) {
  await registerDevice(token, {
    deviceId: device.deviceId,
    deviceName: device.deviceName,
    platform: device.platform,
  });
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [device, setDevice] = useState<DeviceInfo | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  /** Impede que um refreshSession antigo limpe o login que acabou de completar. */
  const authOpId = useRef(0);

  const establishSession = useCallback(async (token: string, opId: number) => {
    const session = await fetchSession(token);
    if (opId !== authOpId.current) return false;

    if (!session.authenticated || !session.user) {
      throw new ApiError(
        "Sessão não reconhecida pelo servidor. Faça login novamente ou confira a URL em Configurar servidor.",
        401,
      );
    }
    if (session.planExpired || session.user.billing?.expired) {
      throw new ApiError(
        "Seu plano VIP está vencido. Acesse o Portal no site para renovar e depois tente entrar no Downloader.",
        403,
      );
    }
    if (!session.hasVip) {
      throw new ApiError("Plano VIP necessário para usar o Downloader.", 403);
    }

    const deviceInfo = await buildDeviceInfo();
    if (opId !== authOpId.current) return false;

    try {
      await registerCurrentDevice(token, deviceInfo);
    } catch (registerError) {
      throw new ApiError(
        `Login OK, mas não foi possível registrar este PC: ${formatApiError(registerError)}`,
        registerError instanceof ApiError ? registerError.status : 500,
      );
    }

    if (opId !== authOpId.current) return false;

    setUser(mapSessionUser(session.user));
    setDevice(deviceInfo);
    setSessionToken(token);
    setStatus("authenticated");
    setError(null);
    return true;
  }, []);

  const clearLocalSession = useCallback(() => {
    downloadManager.stop(true);
    setStatus("unauthenticated");
    setUser(null);
    setDevice(null);
    setSessionToken(null);
  }, []);

  const refreshSession = useCallback(async () => {
    const opId = ++authOpId.current;
    const token = await loadSessionToken();
    if (opId !== authOpId.current) return false;

    if (!token) {
      if (opId !== authOpId.current) return false;
      clearLocalSession();
      return false;
    }

    try {
      return await establishSession(token, opId);
    } catch (err) {
      if (opId !== authOpId.current) return false;
      await clearSessionToken().catch(() => undefined);
      clearLocalSession();
      if (err instanceof ApiError && err.status === 401) {
        setError("Sessão expirada. Faça login novamente.");
      } else if (err instanceof ApiError && err.status === 403) {
        setError(err.message);
      } else {
        setError(formatApiError(err));
      }
      return false;
    }
  }, [clearLocalSession, establishSession]);

  const login = useCallback(
    async (email: string, password: string) => {
      const opId = ++authOpId.current;
      setError(null);
      try {
        const token = await loginWithPassword(email.trim().toLowerCase(), password);
        if (opId !== authOpId.current) return;
        await saveSessionToken(token);
        if (opId !== authOpId.current) return;
        const ok = await establishSession(token, opId);
        if (!ok && opId === authOpId.current) {
          throw new ApiError("Não foi possível concluir o login. Tente novamente.", 500);
        }
      } catch (err) {
        if (opId !== authOpId.current) return;
        clearLocalSession();
        await clearSessionToken().catch(() => undefined);
        const message = formatApiError(err);
        setError(message);
        throw new Error(message);
      }
    },
    [clearLocalSession, establishSession],
  );

  const logout = useCallback(async () => {
    authOpId.current += 1;
    await clearSessionToken();
    clearLocalSession();
    setError(null);
  }, [clearLocalSession]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const { resolveApiBaseUrl } = await import("../lib/api/config");
      await resolveApiBaseUrl();
      if (cancelled) return;
      await refreshSession();
    })();
    return () => {
      cancelled = true;
      authOpId.current += 1;
    };
  }, [refreshSession]);

  const value = useMemo(
    () => ({
      status,
      user,
      device,
      sessionToken,
      error,
      login,
      logout,
      refreshSession,
    }),
    [status, user, device, sessionToken, error, login, logout, refreshSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
