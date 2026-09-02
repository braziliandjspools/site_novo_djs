import { NextResponse } from "next/server";
import { getAuthenticatedPortalUser, getPortalDataForUser } from "../../../lib/portal";

export async function GET() {
  const user = await getAuthenticatedPortalUser();

  if (!user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  return NextResponse.json(getPortalDataForUser(user));
}
