import { NextResponse } from "next/server";
import { PORTAL_COOKIE, portalCookieOptions } from "../../../lib/portal";

export async function POST() {
  const response = NextResponse.json(
    { ok: true },
    { headers: { "Cache-Control": "no-store, max-age=0" } },
  );
  response.cookies.set(PORTAL_COOKIE, "", {
    ...portalCookieOptions(),
    maxAge: 0,
    expires: new Date(0),
  });
  return response;
}
