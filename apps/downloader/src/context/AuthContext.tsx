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

function isPlanExpiredSession(session: {
  planExpired?: boolean;
  user: { billing?: { expired?: boolean } | null } | null;
}) {
  return Boolean(session.planExpired || session.user?.billing?.expired);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [device, setDevice] = useState<DeviceInfo | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const bootstrapped = useRef(false);
  const loginInFlight = useRef(false);
  const statusRef = useRef(status);
  statusRef.current = status;

  const applyAuthenticated = useCallback(
    (token: string, nextUser: AuthUser, nextDevice: DeviceInfo) => {
      setUser(nextUser);
      setDevice(nextDevice);
      setSessionToken(token);
      setStatus("authenticated");
      setError(null);
    },
    [],
  );

  const clearLocalSession = useCallback(() => {
    downloadManager.stop(true);
    setStatus("unauthenticated");
    setUser(null);
    setDevice(null);
    setSessionToken(null);
  }, []);

  const establishSession = useCallback(
    async (token: string, options?: { requireDeviceRegistration?: boolean }) => {
      const requireDeviceRegistration = options?.requireDeviceRegistration ?? true;
      const session = await fetchSession(token);

      if (!session.authenticated || !session.user) {
        throw new ApiError(
          "Sessão não reconhecida pelo servidor. Faça login novamente ou confira a URL em Configurar servidor.",
          401,
        );
      }

      if (isPlanExpiredSession(session)) {
        throw new ApiError(
          "Seu plano VIP está vencido. Acesse o Portal no site para renovar e depois tente entrar no Downloader.",
          403,
        );
      }

      if (!session.hasVip) {
        throw new ApiError("Plano VIP necessário para usar o Downloader.", 403);
      }

      const deviceInfo = await buildDeviceInfo();
      const mappedUser = mapSessionUser(session.user);

      // Autentica antes do registro do device — falha de device não pode deslogar.
      applyAuthenticated(token, mappedUser, deviceInfo);

      try {
        await registerCurrentDevice(token, deviceInfo);
      } catch (registerError) {
        if (requireDeviceRegistration) {
          // Mantém logado, mas avisa. Downloads podem falhar até o registro funcionar.
          setError(
            `Conta conectada, mas o registro deste PC falhou: ${formatApiError(registerError)}`,
          );
        }
      }

      return true;
    },
    [applyAuthenticated],
  );

  const refreshSession = useCallback(async () => {
    const token = await loadSessionToken();
    if (!token) {
      if (loginInFlight.current || statusRef.current === "authenticated") {
        return statusRef.current === "authenticated";
      }
      clearLocalSession();
      return false;
    }

    try {
      return await establishSession(token, { requireDeviceRegistration: false });
    } catch (err) {
      if (loginInFlight.current) return false;

      // Se já está autenticado, não derruba a sessão por falha transitória de rede.
      if (
        statusRef.current === "authenticated" &&
        !(err instanceof ApiError && (err.status === 401 || err.status === 403))
      ) {
        setError(formatApiError(err));
        return false;
      }

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
      loginInFlight.current = true;
      setError(null);
      try {
        const token = await loginWithPassword(email.trim().toLowerCase(), password);
        await saveSessionToken(token);
        await establishSession(token, { requireDeviceRegistration: true });
      } catch (err) {
        clearLocalSession();
        await clearSessionToken().catch(() => undefined);
        const message = formatApiError(err);
        setError(message);
        throw new Error(message);
      } finally {
        loginInFlight.current = false;
      }
    },
    [clearLocalSession, establishSession],
  );

  const logout = useCallback(async () => {
    await clearSessionToken();
    clearLocalSession();
    setError(null);
  }, [clearLocalSession]);

  useEffect(() => {
    if (bootstrapped.current) return;
    bootstrapped.current = true;
    void (async () => {
      const { resolveApiBaseUrl } = await import("../lib/api/config");
      await resolveApiBaseUrl();
      await refreshSession();
    })();
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
