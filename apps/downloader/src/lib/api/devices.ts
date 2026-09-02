import { apiFetch } from "./client";
import { APP_VERSION } from "./config";

export type DeviceRegistrationInput = {
  deviceId: string;
  deviceName: string;
  platform: string;
};

type RegisterDeviceResponse = {
  ok: boolean;
  device: {
    id: number;
    deviceId: string;
    deviceName: string;
    platform: string;
    appVersion: string;
  };
};

export async function registerDevice(token: string, input: DeviceRegistrationInput) {
  return apiFetch<RegisterDeviceResponse>("/api/downloader/devices", {
    method: "POST",
    token,
    body: JSON.stringify({
      deviceId: input.deviceId,
      deviceName: input.deviceName,
      platform: input.platform,
      appVersion: APP_VERSION,
    }),
  });
}
