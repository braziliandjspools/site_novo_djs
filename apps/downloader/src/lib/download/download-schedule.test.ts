import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isWithinDownloadWindow,
  parseTimeToMinutes,
  normalizeTimeInput,
} from "./download-schedule";

function at(hours: number, minutes: number) {
  return new Date(2026, 8, 3, hours, minutes, 0, 0);
}

describe("download-schedule", () => {
  it("parseia HH:MM", () => {
    assert.equal(parseTimeToMinutes("00:00"), 0);
    assert.equal(parseTimeToMinutes("7:30"), 7 * 60 + 30);
    assert.equal(parseTimeToMinutes("23:00"), 23 * 60);
    assert.equal(parseTimeToMinutes("24:00"), null);
  });

  it("normaliza entrada", () => {
    assert.equal(normalizeTimeInput("7:05", "00:00"), "07:05");
    assert.equal(normalizeTimeInput("xx", "00:00"), "00:00");
  });

  it("janela simples 00:00 → 07:00", () => {
    assert.equal(isWithinDownloadWindow(at(0, 0), "00:00", "07:00"), true);
    assert.equal(isWithinDownloadWindow(at(3, 15), "00:00", "07:00"), true);
    assert.equal(isWithinDownloadWindow(at(6, 59), "00:00", "07:00"), true);
    assert.equal(isWithinDownloadWindow(at(7, 0), "00:00", "07:00"), false);
    assert.equal(isWithinDownloadWindow(at(12, 0), "00:00", "07:00"), false);
  });

  it("janela que atravessa meia-noite 23:00 → 06:00", () => {
    assert.equal(isWithinDownloadWindow(at(23, 0), "23:00", "06:00"), true);
    assert.equal(isWithinDownloadWindow(at(23, 30), "23:00", "06:00"), true);
    assert.equal(isWithinDownloadWindow(at(0, 0), "23:00", "06:00"), true);
    assert.equal(isWithinDownloadWindow(at(5, 59), "23:00", "06:00"), true);
    assert.equal(isWithinDownloadWindow(at(6, 0), "23:00", "06:00"), false);
    assert.equal(isWithinDownloadWindow(at(12, 0), "23:00", "06:00"), false);
    assert.equal(isWithinDownloadWindow(at(22, 59), "23:00", "06:00"), false);
  });
});
