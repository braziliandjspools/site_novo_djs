import assert from "node:assert/strict";
import { test } from "node:test";

import {
  formatPackWeekRangeLabel,
  getPackWeekDayRange,
  isCurrentPackWeek,
} from "./week-calendar.ts";

test("SEMANA 01 cobre dias 1–7 do mês", () => {
  const days = getPackWeekDayRange(2026, 9, 1, new Date(2026, 8, 3));
  assert.equal(days.length, 7);
  assert.equal(days[0].day, 1);
  assert.equal(days[6].day, 7);
  assert.equal(formatPackWeekRangeLabel(days), "1–7 set");
  assert.equal(isCurrentPackWeek(2026, 9, 1, new Date(2026, 8, 3)), true);
  assert.equal(days.find((day) => day.day === 3)?.isToday, true);
});

test("SEMANA 05 corta no fim do mês", () => {
  const days = getPackWeekDayRange(2026, 9, 5, new Date(2026, 8, 30));
  assert.deepEqual(
    days.map((day) => day.day),
    [29, 30],
  );
  assert.equal(isCurrentPackWeek(2026, 9, 5, new Date(2026, 8, 30)), true);
});
