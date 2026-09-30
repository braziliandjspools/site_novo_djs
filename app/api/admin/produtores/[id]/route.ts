import { NextResponse } from "next/server";
import { isAuthorizedAdminRequest } from "../../../../lib/admin-auth";
import { prisma } from "../../../../lib/prisma";
import { uniqueProducerSlug } from "../../../../lib/brs-productions";

function unauthorized() {
  return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
}

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!isAuthorizedAdminRequest(request)) return unauthorized();
  const { id } = await context.params;
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const name = body ? clean(body.name) : "";
  if (!name) return NextResponse.json({ error: "Informe o nome artístico." }, { status: 400 });
  const item = await prisma.brsProducer.update({
    where: { id },
    data: {
      name,
      slug: await uniqueProducerSlug(clean(body?.slug) || name, id),
      fullName: clean(body?.fullName) || null,
      bio: clean(body?.bio) || null,
      photoFileId: clean(body?.photoFileId) || null,
      city: clean(body?.city) || null,
      country: clean(body?.country) || null,
      instagram: clean(body?.instagram) || null,
      facebook: clean(body?.facebook) || null,
      youtube: clean(body?.youtube) || null,
      soundcloud: clean(body?.soundcloud) || null,
      spotify: clean(body?.spotify) || null,
      website: clean(body?.website) || null,
    },
  });
  await prisma.brsProduction.updateMany({ where: { producerId: id }, data: { producer: name } });
  return NextResponse.json({ item });
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!isAuthorizedAdminRequest(request)) return unauthorized();
  const { id } = await context.params;
  const count = await prisma.brsProduction.count({ where: { producerId: id } });
  if (count > 0) {
    return NextResponse.json(
      { error: "Este produtor tem produções. Troque o produtor delas antes de excluir." },
      { status: 409 },
    );
  }
  await prisma.brsProducer.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
