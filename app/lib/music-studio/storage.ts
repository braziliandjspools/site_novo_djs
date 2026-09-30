import "server-only";
import { createHash, createHmac, randomBytes } from "crypto";

export type StoredAudio = {
  audioUrl: string | null;
  audioStorageKey: string | null;
  audioBase64: string | null;
  audioMimeType: string;
};

function r2Configured() {
  return Boolean(
    process.env.R2_ACCOUNT_ID &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_BUCKET_NAME,
  );
}

/** Assinatura AWS SigV4 mínima para PUT no R2 (S3-compatible). */
async function putObjectR2(key: string, body: Buffer, contentType: string) {
  const accountId = process.env.R2_ACCOUNT_ID!;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID!;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY!;
  const bucket = process.env.R2_BUCKET_NAME!;
  const region = process.env.R2_REGION || "auto";
  const host = `${accountId}.r2.cloudflarestorage.com`;
  const endpoint = `https://${host}/${bucket}/${key}`;

  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);
  const payloadHash = createHash("sha256").update(body).digest("hex");
  const canonicalHeaders =
    `content-type:${contentType}\n` + `host:${host}\n` + `x-amz-content-sha256:${payloadHash}\n` + `x-amz-date:${amzDate}\n`;
  const signedHeaders = "content-type;host;x-amz-content-sha256;x-amz-date";
  const canonicalRequest = [
    "PUT",
    `/${bucket}/${key}`,
    "",
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n");

  const credentialScope = `${dateStamp}/${region}/s3/aws4_request`;
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    createHash("sha256").update(canonicalRequest).digest("hex"),
  ].join("\n");

  const kDate = createHmac("sha256", `AWS4${secretAccessKey}`).update(dateStamp).digest();
  const kRegion = createHmac("sha256", kDate).update(region).digest();
  const kService = createHmac("sha256", kRegion).update("s3").digest();
  const kSigning = createHmac("sha256", kService).update("aws4_request").digest();
  const signature = createHmac("sha256", kSigning).update(stringToSign).digest("hex");

  const authorization =
    `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, ` +
    `SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const res = await fetch(endpoint, {
    method: "PUT",
    headers: {
      Authorization: authorization,
      "Content-Type": contentType,
      "x-amz-content-sha256": payloadHash,
      "x-amz-date": amzDate,
    },
    body: new Uint8Array(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Falha ao gravar áudio no R2 (${res.status}): ${text.slice(0, 200)}`);
  }
}

export async function uploadCatalogImage(file: File, folder: "capas" | "perfis") {
  if (!r2Configured()) {
    throw new Error("R2 não está configurado. Defina R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY e R2_BUCKET_NAME.");
  }
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  const allowed = new Set(["jpg", "jpeg", "png", "webp"]);
  if (!file.type.startsWith("image/") && !allowed.has(ext)) {
    throw new Error("Envie JPG, PNG ou WEBP.");
  }
  if (file.size > 8 * 1024 * 1024) {
    throw new Error("A imagem passa de 8 MB.");
  }
  const safeExt = ext === "jpeg" || ext === "jpg" ? "jpg" : ext === "png" || ext === "webp" ? ext : "jpg";
  const key = `${folder}/${randomBytes(12).toString("hex")}.${safeExt}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  await putObjectR2(key, bytes, file.type || "image/jpeg");
  return { key, url: `/api/r2/${key.split("/").map((part) => encodeURIComponent(part)).join("/")}` };
}

const EMPTY_PAYLOAD_HASH = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";

export async function readCatalogImage(key: string) {
  if (!r2Configured()) throw new Error("R2 não configurado.");
  if (!/^(capas|perfis)\/[a-zA-Z0-9._-]+$/.test(key)) throw new Error("Arquivo inválido.");
  const accountId = process.env.R2_ACCOUNT_ID!;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID!;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY!;
  const bucket = process.env.R2_BUCKET_NAME!;
  const region = process.env.R2_REGION || "auto";
  const host = `${accountId}.r2.cloudflarestorage.com`;
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);
  const canonicalHeaders = `host:${host}\nx-amz-content-sha256:${EMPTY_PAYLOAD_HASH}\nx-amz-date:${amzDate}\n`;
  const signedHeaders = "host;x-amz-content-sha256;x-amz-date";
  const canonicalRequest = ["GET", `/${bucket}/${key}`, "", canonicalHeaders, signedHeaders, EMPTY_PAYLOAD_HASH].join("\n");
  const credentialScope = `${dateStamp}/${region}/s3/aws4_request`;
  const stringToSign = ["AWS4-HMAC-SHA256", amzDate, credentialScope, createHash("sha256").update(canonicalRequest).digest("hex")].join("\n");
  const kDate = createHmac("sha256", `AWS4${secretAccessKey}`).update(dateStamp).digest();
  const kRegion = createHmac("sha256", kDate).update(region).digest();
  const kService = createHmac("sha256", kRegion).update("s3").digest();
  const kSigning = createHmac("sha256", kService).update("aws4_request").digest();
  const signature = createHmac("sha256", kSigning).update(stringToSign).digest("hex");
  const res = await fetch(`https://${host}/${bucket}/${key}`, {
    headers: {
      Authorization: `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
      "x-amz-content-sha256": EMPTY_PAYLOAD_HASH,
      "x-amz-date": amzDate,
    },
    cache: "no-store",
  });
  if (!res.ok || !res.body) throw new Error("Imagem não encontrada.");
  const bytes = await res.arrayBuffer();
  return {
    body: bytes,
    contentType: res.headers.get("content-type") || "image/jpeg",
  };
}

/**
 * Persiste áudio gerado.
 * Preferência: Cloudflare R2 quando configurado; senão base64 no banco (MVP).
 */
export async function storeGeneratedAudio(input: {
  portalUserId: number;
  songId: string;
  audioBase64: string;
  mimeType: string;
}): Promise<StoredAudio> {
  const mime = input.mimeType || "audio/mpeg";
  const buffer = Buffer.from(input.audioBase64, "base64");
  if (buffer.length < 256) {
    throw new Error("Áudio gerado inválido ou vazio.");
  }
  // ~12MB limite de segurança no MVP
  if (buffer.length > 12 * 1024 * 1024) {
    throw new Error("Áudio gerado excede o limite permitido.");
  }

  if (r2Configured()) {
    const ext = mime.includes("wav") ? "wav" : mime.includes("ogg") ? "ogg" : "mp3";
    const key = `music-studio/${input.portalUserId}/${input.songId}-${randomBytes(4).toString("hex")}.${ext}`;
    await putObjectR2(key, buffer, mime);
    const publicBase = process.env.R2_PUBLIC_BASE_URL?.replace(/\/$/, "");
    return {
      audioUrl: publicBase ? `${publicBase}/${key}` : null,
      audioStorageKey: key,
      audioBase64: null,
      audioMimeType: mime,
    };
  }

  return {
    audioUrl: null,
    audioStorageKey: null,
    audioBase64: input.audioBase64,
    audioMimeType: mime,
  };
}
