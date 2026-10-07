import { NextResponse } from "next/server";
import { getAuthenticatedPortalUser } from "../../../../lib/portal";
import { prisma } from "../../../../lib/prisma";
import { uploadCatalogImage } from "../../../../lib/music-studio/storage";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const user = await getAuthenticatedPortalUser();
  if (!user) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  try {
    const form = await request.formData();
    const file = form.get("photo");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Selecione uma foto." }, { status: 400 });
    }

    const uploaded = await uploadCatalogImage(file, "perfis");
    await prisma.portalUser.update({
      where: { id: user.id },
      data: { profileImageKey: uploaded.key },
    });

    return NextResponse.json({ ok: true, imageUrl: uploaded.url, imageKey: uploaded.key });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível enviar a foto.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
