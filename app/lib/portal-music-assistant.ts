import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { prisma } from "./prisma";
import type { PortalUser } from "./portal-users";
import { userHasActiveVipAccess } from "./mercadopago/webhook-policy";

const OPENROUTER_BATCH_URL = "https://openrouter.ai/api/v1/batches";
const MUSIC_ASSISTANT_MODEL = "openai/gpt-6-luna-pro";
const MUSIC_ASSISTANT_BATCH_MODEL = `${MUSIC_ASSISTANT_MODEL}:batch`;
const MUSIC_ASSISTANT_REQUEST_ID = "portal-music-curation";
const ELIGIBLE_PLAN_IDS = new Set(["brs-drive-3m", "brs-drive-6m", "brs-drive-12m"]);
const MUSIC_CURATOR_PROMPT = [
  "Você é um curador musical experiente que ajuda DJs a montar repertórios para eventos.",
  "Responda em texto bem organizado e direto, usando Markdown simples (títulos, listas e negrito quando ajudar).",
  "Interprete com atenção o pedido do cliente: respeite gênero, idioma, época, artistas, energia e restrições informadas. Se não houver idioma definido, responda em português do Brasil.",
  "Monte uma proposta prática por momentos do evento (adapte a quantidade ao pedido), com sugestões de músicas e artistas quando fizer sentido, progressão de energia e dicas de transição.",
  "Não diga que pesquisou na internet, no YouTube ou no catálogo BRS; esta resposta é uma curadoria gerada por IA, sem consulta a fontes ao vivo. Evite inventar links, disponibilidade, versões específicas ou dados como BPM e tonalidade se não tiver certeza. Identifique as faixas como ideias para o DJ conferir antes de usar.",
  "Não repita o pedido como introdução. Entregue somente a curadoria em texto.",
].join("\n");

type MusicAssistantBatch = {
  id?: string;
  status?: string;
  error?: { message?: string } | null;
  results?: Array<{
    custom_id?: string;
    response?: { body?: { choices?: Array<{ message?: { content?: string | null } }> } } | null;
    error?: { message?: string } | null;
  }> | null;
};

export type MusicCurationJobStatus =
  | { status: "pending" }
  | { status: "completed"; text: string }
  | { status: "failed"; error: string };

export async function canUseMusicAssistant(user: Pick<PortalUser, "id" | "active" | "services" | "serviceBilling" | "nextDueAt">) {
  if (!user.active || !userHasActiveVipAccess({
    servicePoolsVip: user.services.poolsVip,
    nextDueAt: user.nextDueAt,
    servicePoolsVipDueAt: user.serviceBilling.poolsVip.dueAt,
  })) {
    return false;
  }

  try {
    const latestApprovedPlan = await prisma.mercadoPagoOrder.findFirst({
      where: { portalUserId: user.id, status: "APPROVED", planId: { startsWith: "brs-drive" } },
      orderBy: [{ approvedAt: "desc" }, { createdAt: "desc" }],
      select: { planId: true },
    });
    return Boolean(latestApprovedPlan && ELIGIBLE_PLAN_IDS.has(latestApprovedPlan.planId));
  } catch (error) {
    console.error("[portal/music-assistant] could not validate plan access", error instanceof Error ? error.name : "unknown error");
    return false;
  }
}

function apiKeyOrThrow() {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  if (!apiKey) throw new Error("O organizador musical está temporariamente indisponível.");
  return apiKey;
}

function makeJobToken(batchId: string, userId: number, apiKey: string) {
  const encodedBatchId = Buffer.from(batchId, "utf8").toString("base64url");
  const signature = createHmac("sha256", process.env.PORTAL_SESSION_SECRET?.trim() || apiKey)
    .update(`${userId}:${encodedBatchId}`)
    .digest("base64url");
  return `${encodedBatchId}.${signature}`;
}

function readJobBatchId(token: string, userId: number, apiKey: string) {
  const [encodedBatchId, signature, extra] = token.split(".");
  if (!encodedBatchId || !signature || extra) return null;
  const expected = createHmac("sha256", process.env.PORTAL_SESSION_SECRET?.trim() || apiKey)
    .update(`${userId}:${encodedBatchId}`)
    .digest();
  let actual: Buffer;
  try {
    actual = Buffer.from(signature, "base64url");
  } catch {
    return null;
  }
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
  try {
    const batchId = Buffer.from(encodedBatchId, "base64url").toString("utf8");
    return /^[a-zA-Z0-9_-]{4,160}$/.test(batchId) ? batchId : null;
  } catch {
    return null;
  }
}

export async function submitMusicCuration(prompt: string, userId: number) {
  const apiKey = apiKeyOrThrow();
  let response: Response;
  try {
    response = await fetch(OPENROUTER_BATCH_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.brazilianremixservice.com.br",
        "X-Title": "Brazilian Remix Service — Organizador Musical",
      },
      body: JSON.stringify({
        endpoint: "/v1/chat/completions",
        model: MUSIC_ASSISTANT_MODEL,
        requests: [{
          custom_id: MUSIC_ASSISTANT_REQUEST_ID,
          body: {
            temperature: 0.55,
            max_tokens: 1400,
            messages: [
              { role: "system", content: MUSIC_CURATOR_PROMPT },
              { role: "user", content: `Pedido do DJ:\n${prompt}` },
            ],
          },
        }],
      }),
      signal: AbortSignal.timeout(25_000),
    });
  } catch (error) {
    console.error("[portal/music-assistant] OpenRouter batch submission failed", error instanceof Error ? error.name : "unknown error");
    throw new Error("Não foi possível enviar a curadoria para a IA. Tente novamente em instantes.");
  }

  const data = await response.json().catch(() => null) as MusicAssistantBatch | null;
  if (!response.ok || !data?.id) {
    console.error("[portal/music-assistant] OpenRouter batch submission returned", response.status, data?.error?.message ?? "invalid response");
    throw new Error("Não foi possível iniciar a curadoria agora. Verifique os créditos da IA e tente novamente.");
  }

  return { jobToken: makeJobToken(data.id, userId, apiKey), status: data.status ?? "validating", model: MUSIC_ASSISTANT_BATCH_MODEL };
}

export async function getMusicCurationJob(token: string, userId: number): Promise<MusicCurationJobStatus | null> {
  const apiKey = apiKeyOrThrow();
  const batchId = readJobBatchId(token, userId, apiKey);
  if (!batchId) return null;

  const response = await fetch(`${OPENROUTER_BATCH_URL}/${encodeURIComponent(batchId)}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
    cache: "no-store",
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) {
    console.error("[portal/music-assistant] OpenRouter batch poll returned", response.status);
    throw new Error("Não foi possível consultar o andamento da curadoria.");
  }

  const batch = await response.json() as MusicAssistantBatch;
  const status = batch.status ?? "validating";
  if (status === "completed") {
    const result = batch.results?.find((item) => item.custom_id === MUSIC_ASSISTANT_REQUEST_ID);
    const text = result?.response?.body?.choices?.[0]?.message?.content
      ?.replace(/<think>[\s\S]*?(?:<\/think>|$)/gi, "")
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
      .trim()
      .slice(0, 8_000);
    if (text) return { status: "completed", text };
    console.error("[portal/music-assistant] batch completed without a text result", result?.error?.message ?? batch.error?.message ?? "empty result");
    return { status: "failed", error: "A IA não retornou uma curadoria. Tente novamente com outro pedido." };
  }
  if (["failed", "expired", "cancelled"].includes(status)) {
    console.error("[portal/music-assistant] batch ended", status, batch.error?.message ?? "no provider detail");
    return { status: "failed", error: "A curadoria não pôde ser concluída. Tente novamente mais tarde." };
  }
  return { status: "pending" };
}
