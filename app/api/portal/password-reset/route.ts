import { NextResponse } from "next/server";
import { requestPasswordReset, passwordResetRequestMessage } from "../../../lib/password-reset";
import { checkRateLimit } from "../../../lib/rate-limit";

function clientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

export async function POST(request: Request) {
  let email = "";
  try {
    const body = (await request.json()) as { email?: string };
    email = body.email?.trim().toLowerCase() ?? "";
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Informe um e-mail válido." }, { status: 400 });
  }

  const ipLimit = checkRateLimit({
    key: `password-reset:ip:${clientIp(request)}`,
    limit: 20,
    windowMs: 60 * 60 * 1000,
  });
  const emailLimit = checkRateLimit({
    key: `password-reset:email:${email}`,
    limit: 5,
    windowMs: 60 * 60 * 1000,
  });
  if (!ipLimit.ok || !emailLimit.ok) {
    const retryAfterSec = Math.max(ipLimit.retryAfterSec, emailLimit.retryAfterSec);
    return NextResponse.json(
      { error: "Muitas tentativas. Aguarde um pouco e tente de novo." },
      { status: 429, headers: { "Retry-After": String(retryAfterSec) } },
    );
  }

  try {
    const result = await requestPasswordReset(email);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({ ok: true, message: result.message ?? passwordResetRequestMessage() });
  } catch (err) {
    console.error("[password-reset] pedido falhou:", err);
    return NextResponse.json(
      { error: "Não foi possível iniciar a redefinição. Tente novamente." },
      { status: 503 },
    );
  }
}
