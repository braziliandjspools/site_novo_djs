import assert from "node:assert/strict";
import { test } from "node:test";

/**
 * Espelha a resolução de destinatário do music-producer-email
 * (sem importar server-only).
 */
function resolveBriefingNotifyTo(env: Record<string, string | undefined>) {
  return (
    env.MUSIC_PRODUCER_BRIEFING_TO?.trim() ||
    env.MUSIC_PRODUCER_NOTIFY_EMAIL?.trim() ||
    "brazilianremixservice@gmail.com"
  );
}

test("destinatário do briefing usa MUSIC_PRODUCER_BRIEFING_TO", () => {
  assert.equal(
    resolveBriefingNotifyTo({
      MUSIC_PRODUCER_BRIEFING_TO: " brazilianremixservice@gmail.com ",
    }),
    "brazilianremixservice@gmail.com",
  );
});

test("destinatário do briefing faz fallback para Gmail legal", () => {
  assert.equal(resolveBriefingNotifyTo({}), "brazilianremixservice@gmail.com");
});
