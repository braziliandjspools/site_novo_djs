import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { handleDownloaderCorsPreflight, withDownloaderCors } from "./app/lib/downloader-cors";

function isDownloaderApiPath(pathname: string) {
  return pathname.startsWith("/api/downloader") || pathname.startsWith("/api/musicas/download");
}

export function middleware(request: NextRequest) {
  if (!isDownloaderApiPath(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  if (request.method === "OPTIONS") {
    return handleDownloaderCorsPreflight(request) ?? new NextResponse(null, { status: 405 });
  }

  return withDownloaderCors(request, NextResponse.next());
}

export const config = {
  matcher: ["/api/downloader/:path*", "/api/musicas/download/:path*"],
};
