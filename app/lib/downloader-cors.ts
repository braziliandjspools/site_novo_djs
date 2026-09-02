import { NextResponse } from "next/server";

const DOWNLOADER_CORS_ORIGINS = new Set([
  "http://localhost:1420",
  "http://127.0.0.1:1420",
  "tauri://localhost",
  "https://tauri.localhost",
]);

const DOWNLOADER_CORS_HEADERS = "Authorization, Content-Type, X-BP-Client";

function resolveCorsOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return null;
  if (DOWNLOADER_CORS_ORIGINS.has(origin)) return origin;
  if (process.env.NODE_ENV !== "production" && origin.startsWith("http://localhost:")) {
    return origin;
  }
  return process.env.DOWNLOADER_CORS_ORIGIN ?? null;
}

export function withDownloaderCors(request: Request, response: NextResponse) {
  const origin = resolveCorsOrigin(request);
  if (!origin) return response;

  response.headers.set("Access-Control-Allow-Origin", origin);
  response.headers.set("Access-Control-Allow-Headers", DOWNLOADER_CORS_HEADERS);
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, PATCH, OPTIONS");
  response.headers.set("Vary", "Origin");
  return response;
}

export function withDownloaderCorsJson(request: Request, body: unknown, init?: ResponseInit) {
  return withDownloaderCors(request, NextResponse.json(body, init));
}

export function handleDownloaderCorsPreflight(request: Request) {
  if (request.method !== "OPTIONS") return null;
  const response = new NextResponse(null, { status: 204 });
  return withDownloaderCors(request, response);
}
