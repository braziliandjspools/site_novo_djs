import { NextResponse } from "next/server";
import { ADMIN_COOKIE, adminCookieOptions, isAdminAuthenticated } from "../../../lib/admin-auth";

export async function GET() {
  return NextResponse.json({ authenticated: await isAdminAuthenticated() });
}
