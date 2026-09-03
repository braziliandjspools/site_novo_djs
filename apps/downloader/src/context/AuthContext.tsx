import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { ApiError } from "../lib/api/client";
import { fetchSession, loginWithPassword } from "../lib/api/auth";
import { registerDevice } from "../lib/api/devices";
import { formatApiError } from "../lib/errors";
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

export type AuthUser = {
  name: string;
  plan: string;
};

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

  const establishSession = useCallback(async (token: string) => {
    const session = await fetchSession(token);
    if (!session.authenticated || !session.user) {
      throw new ApiError(
        "Sessão não reconhecida pelo servidor. Faça login novamente ou confira a URL em Configurar servidor.",
        401,
      );
    }
    if (!session.hasVip) {
      throw new ApiError("Plano VIP necessário para usar o Downloader.", 403);
    }

    const deviceInfo = await buildDeviceInfo();
    try {
      await registerCurrentDevice(token, deviceInfo);
    } catch (registerError) {
      throw new ApiError(
        `Login OK, mas não foi possível registrar este PC: ${formatApiError(registerError)}`,
        registerError instanceof ApiError ? registerError.status : 500,
      );
    }

    setUser({ name: session.user.name, plan: session.user.plan });
    setDevice(deviceInfo);
    setSessionToken(token);
    setStatus("authenticated");
    setError(null);
    return true;
  }, []);

  const refreshSession = useCallback(async () => {
    const token = await loadSessionToken();
    if (!token) {
      downloadManager.stop(true);
      setStatus("unauthenticated");
      setUser(null);
      setDevice(null);
      setSessionToken(null);
      return false;
    }

    try {
      await establishSession(token);
      return true;
    } catch (err) {
      downloadManager.stop(true);
      await clearSessionToken();
      setStatus("unauthenticated");
      setUser(null);
      setDevice(null);
      setSessionToken(null);
      if (err instanceof ApiError && err.status === 401) {
        setError("Sessão expirada. Faça login novamente.");
      }
      return false;
    }
  }, [establishSession]);

  const login = useCallback(
    async (email: string, password: string) => {
      setError(null);
      try {
        const token = await loginWithPassword(email.trim().toLowerCase(), password);
        await saveSessionToken(token);
        await establishSession(token);
      } catch (err) {
        setStatus("unauthenticated");
        setUser(null);
        setDevice(null);
        setSessionToken(null);
        const message = formatApiError(err);
        setError(message);
        throw new Error(message);
      }
    },
    [establishSession],
  );

  const logout = useCallback(async () => {
    downloadManager.stop(true);
    await clearSessionToken();
    setStatus("unauthenticated");
    setUser(null);
    setDevice(null);
    setSessionToken(null);
    setError(null);
  }, []);

  useEffect(() => {
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

