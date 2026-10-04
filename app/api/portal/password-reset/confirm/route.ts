import { NextResponse } from "next/server";
import { confirmPasswordReset } from "../../../../lib/password-reset";
import { checkRateLimit } from "../../../../lib/rate-limit";

function clientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

export async function POST(request: Request) {
  let token = "";
  let password = "";
  try {
    const body = (await request.json()) as { token?: string; password?: string };
    token = body.token?.trim() ?? "";
    password = body.password ?? "";
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }

  const rate = checkRateLimit({
    key: `password-reset-confirm:ip:${clientIp(request)}`,
    limit: 20,
    windowMs: 60 * 60 * 1000,
  });
  if (!rate.ok) {
    return NextResponse.json(
      { error: "Muitas tentativas. Aguarde um pouco e tente de novo." },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSec) } },
    );
  }

  try {
    const result = await confirmPasswordReset(token, password);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[password-reset] confirmação falhou:", err);
    return NextResponse.json(
      { error: "Não foi possível salvar a nova senha. Tente novamente." },
      { status: 503 },
    );
  }
}
