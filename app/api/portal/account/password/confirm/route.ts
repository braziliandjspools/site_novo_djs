import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { prisma } from "../../../../../lib/prisma";
import { SITE_PRODUCTION_URL } from "../../../../../lib/branding";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token")?.trim();
  const base = (process.env.SITE_URL || SITE_PRODUCTION_URL).replace(/\/$/, "");
  const accountUrl = `${base}/portal/conta?senha=confirmada`;

  if (!token) return NextResponse.redirect(`${base}/portal/conta?senha=token-invalido`);

  const tokenHash = createHash("sha256").update(token).digest("hex");
  const record = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });

  if (!record || record.usedAt || record.expiresAt.getTime() < Date.now() || !record.newPasswordHash) {
    return NextResponse.redirect(`${base}/portal/conta?senha=token-invalido`);
  }

  await prisma.$transaction([
    prisma.portalUser.update({
      where: { id: record.portalUserId },
      data: { passwordHash: record.newPasswordHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
  ]);

  return NextResponse.redirect(accountUrl);
}
