import assert from "node:assert/strict";
import { test } from "node:test";

import type { DownloadJob } from "../api/jobs";
import {
  canFitBytes,
  canStartJobDownload,
  DISK_SAFETY_MARGIN_BYTES,
  estimateQueueBytes,
  formatDiskSize,
  hasSpaceForQueue,
  resolveDiskSpaceError,
} from "./disk-space-utils.ts";

function job(overrides: Partial<DownloadJob> & Pick<DownloadJob, "id">): DownloadJob {
  const { id, ...rest } = overrides;
  return {
    id,
    provider: "google_drive",
    fileId: `file-${id}`,
    fileName: "track.mp3",
    relativePath: null,
    targetDeviceId: null,
    fileSize: null,
    mimeType: null,
    status: "PENDING",
    progress: 0,
    downloadedBytes: "0",
    totalBytes: null,
    error: null,
    deviceId: null,
    deviceName: null,
    claimedAt: null,
    startedAt: null,
    completedAt: null,
    dismissedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...rest,
  };
}

test("formatDiskSize uses binary units", () => {
  assert.equal(formatDiskSize(428 * 1024 ** 3), "428 GB");
  assert.equal(formatDiskSize(73 * 1024 ** 3), "73 GB");
});

test("estimateQueueBytes sums known file sizes for this device", () => {
  const deviceId = "dev-1";
  const total = estimateQueueBytes(
    [
      job({ id: 1, fileSize: String(1024 ** 3), status: "PENDING" }),
      job({ id: 2, fileSize: String(2 * 1024 ** 3), status: "RECEIVED", deviceId }),
      job({ id: 3, fileSize: null, status: "PENDING" }),
      job({ id: 4, fileSize: String(1024 ** 3), status: "PENDING", targetDeviceId: "other" }),
      job({
        id: 5,
        fileSize: String(4 * 1024 ** 3),
        downloadedBytes: String(1024 ** 3),
        status: "DOWNLOADING",
        deviceId,
      }),
      job({
        id: 6,
        totalBytes: String(512 * 1024 ** 2),
        fileSize: null,
        status: "RECEIVED",
        deviceId,
      }),
    ],
    deviceId,
  );
  // 1GB + 2GB + 3GB remaining + 512MB
  assert.equal(total, 3 * 1024 ** 3 + 3 * 1024 ** 3 + 512 * 1024 ** 2);
});

test("hasSpaceForQueue respects safety margin", () => {
  const queueBytes = 1000;
  const available = queueBytes + DISK_SAFETY_MARGIN_BYTES;
  assert.equal(hasSpaceForQueue(available, queueBytes), true);
  assert.equal(hasSpaceForQueue(available - 1, queueBytes), false);
});

test("canStartJobDownload allows unknown sizes", () => {
  assert.equal(canStartJobDownload(100, 0), true);
  assert.equal(canStartJobDownload(null, 999999), true);
});

test("resolveDiskSpaceError returns message when insufficient", () => {
  assert.equal(resolveDiskSpaceError(1024, 0), null);
  assert.equal(
    resolveDiskSpaceError(DISK_SAFETY_MARGIN_BYTES, 1024 ** 3),
    "Não há espaço suficiente para concluir estes downloads.",
  );
});

test("canFitBytes blocks when drive would be completely filled", () => {
  assert.equal(canFitBytes(DISK_SAFETY_MARGIN_BYTES + 100, 100), true);
  assert.equal(canFitBytes(DISK_SAFETY_MARGIN_BYTES + 99, 100), false);
});
