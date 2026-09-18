import assert from "node:assert/strict";
import test from "node:test";
import {
  evaluateAbuseCounters,
  PAID_PLAN_ABUSE_THRESHOLDS,
  TEST_PLAN_ABUSE_THRESHOLDS,
} from "./download-abuse-config";

test("plano teste: alerta em volume alto de únicas", () => {
  const v = evaluateAbuseCounters(
    { uniqueInWindow: 40, burstInHour: 0, maxFileRepeats: 0 },
    TEST_PLAN_ABUSE_THRESHOLDS,
    true,
  );
  assert.equal(v.action, "alert");
});

test("plano teste: ban ao estourar únicas", () => {
  const v = evaluateAbuseCounters(
    { uniqueInWindow: 80, burstInHour: 0, maxFileRepeats: 0 },
    TEST_PLAN_ABUSE_THRESHOLDS,
    true,
  );
  assert.equal(v.action, "ban");
  assert.match(v.reason, /Plano Teste/);
});

test("plano teste: ban por loop do mesmo arquivo", () => {
  const v = evaluateAbuseCounters(
    { uniqueInWindow: 1, burstInHour: 0, maxFileRepeats: 6 },
    TEST_PLAN_ABUSE_THRESHOLDS,
    true,
  );
  assert.equal(v.action, "ban");
  assert.match(v.reason, /loop/i);
});

test("VIP pago: uso moderado ok", () => {
  const v = evaluateAbuseCounters(
    { uniqueInWindow: 100, burstInHour: 50, maxFileRepeats: 2 },
    PAID_PLAN_ABUSE_THRESHOLDS,
    false,
  );
  assert.equal(v.action, "ok");
});

test("VIP pago: ban em varredura absurda", () => {
  const v = evaluateAbuseCounters(
    { uniqueInWindow: 2500, burstInHour: 0, maxFileRepeats: 0 },
    PAID_PLAN_ABUSE_THRESHOLDS,
    false,
  );
  assert.equal(v.action, "ban");
});
