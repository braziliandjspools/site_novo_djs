import { NextResponse } from "next/server";

const APP_CORS_ORIGINS = new Set([
  "http://localhost:1420",
  "http://127.0.0.1:1420",
  "http://tauri.localhost",
  "https://tauri.localhost",
  "tauri://localhost",
  "https://localhost",
  "http://localhost",
  "capacitor://localhost",
  "ionic://localhost",
]);

const APP_CORS_HEADERS = "Authorization, Content-Type, X-BP-Client";

function resolveCorsOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const client = request.headers.get("X-BP-Client");
  const knownClient = client === "downloader" || client === "flow";

  if (origin) {
    if (APP_CORS_ORIGINS.has(origin)) return origin;
    if (origin.includes("tauri.localhost") || origin.startsWith("tauri://")) return origin;
    if (origin.startsWith("capacitor://") || origin.startsWith("ionic://")) return origin;
    if (process.env.NODE_ENV !== "production" && origin.startsWith("http://localhost:")) {
      return origin;
    }
    if (process.env.DOWNLOADER_CORS_ORIGIN) return process.env.DOWNLOADER_CORS_ORIGIN;
    if (process.env.FLOW_CORS_ORIGIN) return process.env.FLOW_CORS_ORIGIN;
  }

  if (knownClient) {
    if (client === "flow") return "https://localhost";
    return "https://tauri.localhost";
  }

  return null;
}

export function withAppCors(request: Request, response: NextResponse) {
  const origin = resolveCorsOrigin(request);
  if (!origin) return response;

  response.headers.set("Access-Control-Allow-Origin", origin);
  response.headers.set("Access-Control-Allow-Headers", APP_CORS_HEADERS);
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
  response.headers.set("Vary", "Origin");
  return response;
}

export function withAppCorsJson(request: Request, body: unknown, init?: ResponseInit) {
  return withAppCors(request, NextResponse.json(body, init));
}

export function handleAppCorsPreflight(request: Request) {
  if (request.method !== "OPTIONS") return null;
  const response = new NextResponse(null, { status: 204 });
  return withAppCors(request, response);
}

/** @deprecated use withAppCors — mantido para o Downloader. */
export function withDownloaderCors(request: Request, response: NextResponse) {
  return withAppCors(request, response);
}

export function withDownloaderCorsJson(request: Request, body: unknown, init?: ResponseInit) {
  return withAppCorsJson(request, body, init);
}

export function handleDownloaderCorsPreflight(request: Request) {
  return handleAppCorsPreflight(request);
}
