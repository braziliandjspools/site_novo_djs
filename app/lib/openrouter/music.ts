import "server-only";
import { SITE_PRODUCTION_URL } from "../branding";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

export type OpenRouterMusicResult = {
  audioBase64: string;
  mimeType: string;
  lyrics: string | null;
  model: string;
  generationId: string | null;
};

export function getOpenRouterMusicModel() {
  return process.env.OPENROUTER_MUSIC_MODEL?.trim() || "google/lyria-3-pro-preview";
}

function requireApiKey() {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY não configurada.");
  }
  return apiKey;
}

function openRouterHeaders(apiKey: string) {
  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL ?? SITE_PRODUCTION_URL,
    "X-Title": "BRS Flow Studio",
  };
}

function parseOpenRouterError(status: number, body: string) {
  try {
    const json = JSON.parse(body) as { error?: { message?: string } | string };
    const msg =
      typeof json.error === "string" ? json.error : json.error?.message ?? body.slice(0, 300);
    return `OpenRouter ${status}: ${msg}`;
  } catch {
    return `OpenRouter ${status}: ${body.slice(0, 300) || "erro desconhecido"}`;
  }
}

function collectBase64Audio(payload: unknown): { base64: string; mime: string } | null {
  const root = payload as {
    id?: string;
    choices?: Array<{
      message?: {
        content?: unknown;
        audio?: { data?: string };
      };
    }>;
  };

  const message = root.choices?.[0]?.message;
  if (message?.audio?.data) {
    return { base64: message.audio.data, mime: "audio/mpeg" };
  }

  const content = message?.content;
  if (Array.isArray(content)) {
    for (const part of content) {
      const p = part as {
        type?: string;
        data?: string;
        inline_data?: { mime_type?: string; data?: string };
        inlineData?: { mimeType?: string; data?: string };
        input_audio?: { data?: string; format?: string };
        audio?: { data?: string };
      };
      if (p?.inline_data?.data) {
        return { base64: p.inline_data.data, mime: p.inline_data.mime_type || "audio/mpeg" };
      }
      if (p?.inlineData?.data) {
        return { base64: p.inlineData.data, mime: p.inlineData.mimeType || "audio/mpeg" };
      }
      if (p?.input_audio?.data) {
        return { base64: p.input_audio.data, mime: `audio/${p.input_audio.format || "mpeg"}` };
      }
      if (p?.audio?.data) return { base64: p.audio.data, mime: "audio/mpeg" };
      if (p?.type === "output_audio" && p.data) return { base64: p.data, mime: "audio/mpeg" };
    }
  }

  return null;
}

function extractText(payload: unknown): string | null {
  const root = payload as {
    choices?: Array<{ message?: { content?: unknown; audio?: { transcript?: string } } }>;
  };
  const message = root.choices?.[0]?.message;
  if (message?.audio?.transcript) return message.audio.transcript;

  const content = message?.content;
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    const texts = content
      .map((part) => {
        if (typeof part === "string") return part;
        const p = part as { type?: string; text?: string };
        return p.text || "";
      })
      .filter(Boolean);
    return texts.join("\n").trim() || null;
  }
  return null;
}

async function generateStreaming(
  apiKey: string,
  model: string,
  modelPrompt: string,
): Promise<OpenRouterMusicResult> {
  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: openRouterHeaders(apiKey),
    body: JSON.stringify({
      model,
      stream: true,
      modalities: ["text", "audio"],
      audio: { format: "mp3" },
      messages: [{ role: "user", content: modelPrompt }],
    }),
  });

  if (!response.ok) {
    throw new Error(parseOpenRouterError(response.status, await response.text()));
  }
  if (!response.body) throw new Error("Resposta vazia do OpenRouter.");

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  const audioChunks: string[] = [];
  let transcript = "";
  let lastJson: unknown = null;
  let generationId: string | null = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const data = trimmed.slice(5).trim();
      if (!data || data === "[DONE]") continue;
      try {
        const json = JSON.parse(data) as {
          id?: string;
          choices?: Array<{
            delta?: { audio?: { data?: string; transcript?: string }; content?: string };
          }>;
        };
        lastJson = json;
        if (json.id) generationId = json.id;
        const delta = json.choices?.[0]?.delta;
        if (delta?.audio?.data) audioChunks.push(delta.audio.data);
        if (delta?.audio?.transcript) transcript += delta.audio.transcript;
        if (typeof delta?.content === "string") transcript += delta.content;
      } catch {
        /* ignore partial chunk */
      }
    }
  }

  if (audioChunks.length > 0) {
    return {
      audioBase64: audioChunks.join(""),
      mimeType: "audio/mpeg",
      lyrics: transcript.trim() || null,
      model,
      generationId,
    };
  }

  if (lastJson) {
    const audio = collectBase64Audio(lastJson);
    if (audio) {
      return {
        audioBase64: audio.base64,
        mimeType: audio.mime,
        lyrics: transcript.trim() || extractText(lastJson),
        model,
        generationId,
      };
    }
  }

  throw new Error("A API não devolveu áudio. Tente de novo.");
}

async function generateNonStreaming(
  apiKey: string,
  model: string,
  modelPrompt: string,
): Promise<OpenRouterMusicResult> {
  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: openRouterHeaders(apiKey),
    body: JSON.stringify({
      model,
      stream: false,
      modalities: ["text", "audio"],
      audio: { format: "mp3" },
      messages: [{ role: "user", content: modelPrompt }],
    }),
  });

  const raw = await response.text();
  if (!response.ok) throw new Error(parseOpenRouterError(response.status, raw));

  const json = JSON.parse(raw) as { id?: string };
  const audio = collectBase64Audio(json);
  if (!audio) {
    const text = extractText(json);
    throw new Error(
      text ? `Sem áudio na resposta: ${text.slice(0, 240)}` : "Sem áudio na resposta do modelo.",
    );
  }

  return {
    audioBase64: audio.base64,
    mimeType: audio.mime,
    lyrics: extractText(json),
    model,
    generationId: json.id ?? null,
  };
}

/** Gera áudio via OpenRouter no servidor. A API key nunca sai deste módulo. */
export async function generateMusicWithOpenRouter(modelPrompt: string): Promise<OpenRouterMusicResult> {
  const apiKey = requireApiKey();
  const model = getOpenRouterMusicModel();

  try {
    return await generateStreaming(apiKey, model, modelPrompt);
  } catch (streamError) {
    try {
      return await generateNonStreaming(apiKey, model, modelPrompt);
    } catch (fallbackError) {
      const b = fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
      const a = streamError instanceof Error ? streamError.message : String(streamError);
      throw new Error(b || a);
    }
  }
}
