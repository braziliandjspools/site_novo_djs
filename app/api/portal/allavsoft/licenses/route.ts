import { NextResponse } from "next/server";
import { getAuthenticatedPortalUser } from "../../../../lib/portal";
import {
  AllavsoftLicenseError,
  generateLicense,
  listLicensesForPortal,
} from "../../../../lib/allavsoft-licenses";
import { userHasAllavsoft } from "../../../../lib/portal-users";

export const dynamic = "force-dynamic";

function errorStatus(code: AllavsoftLicenseError["code"]) {
  switch (code) {
    case "FORBIDDEN":
      return 403;
    case "QUOTA":
    case "ALREADY_COPIED":
    case "REGEN_LIMIT":
    case "ALREADY_NOTIFIED":
    case "NO_LICENSES":
      return 409;
    case "POOL_EMPTY":
      return 503;
    case "NOT_FOUND":
      return 404;
    default:
      return 500;
  }
}

export async function GET() {
  const user = await getAuthenticatedPortalUser();
  if (!user) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }
  if (!userHasAllavsoft(user)) {
    return NextResponse.json({ error: "Seu plano não inclui Allavsoft." }, { status: 403 });
  }

  try {
    const payload = await listLicensesForPortal(user.id);
    return NextResponse.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao listar licenças.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST() {
  const user = await getAuthenticatedPortalUser();
  if (!user) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const license = await generateLicense(user.id);
    const quota = await listLicensesForPortal(user.id);
    return NextResponse.json({ license, ...quota }, { status: 201 });
  } catch (error) {
    if (error instanceof AllavsoftLicenseError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: errorStatus(error.code) });
    }
    const message = error instanceof Error ? error.message : "Erro ao gerar licença.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
