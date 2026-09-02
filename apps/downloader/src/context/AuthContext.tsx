import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { ApiError } from "../lib/api/client";
import { fetchSession, loginWithPassword } from "../lib/api/auth";
import { registerDevice } from "../lib/api/devices";
import {
  clearSessionToken,
  formatPlatformLabel,
  getDeviceName,
  getOrCreateDeviceId,
  getPlatformName,
  loadSessionToken,
  saveSessionToken,
} from "../lib/native/secure-store";

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
  const [error, setError] = useState<string | null>(null);

  const establishSession = useCallback(async (token: string) => {
    const session = await fetchSession(token);
    if (!session.authenticated || !session.user) {
      throw new ApiError("Sessão inválida.", 401);
    }
    if (!session.hasVip) {
      throw new ApiError("Plano VIP necessário para usar o Downloader.", 403);
    }

    const deviceInfo = await buildDeviceInfo();
    await registerCurrentDevice(token, deviceInfo);

    setUser({ name: session.user.name, plan: session.user.plan });
    setDevice(deviceInfo);
    setStatus("authenticated");
    setError(null);
    return true;
  }, []);

  const refreshSession = useCallback(async () => {
    const token = await loadSessionToken();
    if (!token) {
      setStatus("unauthenticated");
      setUser(null);
      setDevice(null);
      return false;
    }

    try {
      await establishSession(token);
      return true;
    } catch (err) {
      await clearSessionToken();
      setStatus("unauthenticated");
      setUser(null);
      setDevice(null);
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
        const token = await loginWithPassword(email, password);
        await saveSessionToken(token);
        await establishSession(token);
      } catch (err) {
        setStatus("unauthenticated");
        setUser(null);
        setDevice(null);
        if (err instanceof ApiError) {
          setError(err.message);
        } else if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Não foi possível entrar. Tente novamente.");
        }
        throw err;
      }
    },
    [establishSession],
  );

  const logout = useCallback(async () => {
    await clearSessionToken();
    setStatus("unauthenticated");
    setUser(null);
    setDevice(null);
    setError(null);
  }, []);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  const value = useMemo(
    () => ({
      status,
      user,
      device,
      error,
      login,
      logout,
      refreshSession,
    }),
    [status, user, device, error, login, logout, refreshSession],
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
