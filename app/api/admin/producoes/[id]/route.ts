import { NextResponse } from "next/server";
import { isAuthorizedAdminRequest } from "../../../../lib/admin-auth";
import { prisma } from "../../../../lib/prisma";
import { BRS_PRODUCTION_CATEGORIES, uniqueProductionSlug } from "../../../../lib/brs-productions";

function unauthorized() {
  return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
}

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!isAuthorizedAdminRequest(request)) return unauthorized();
  const { id } = await context.params;
  const item = await prisma.brsProduction.findUnique({
    where: { id },
    include: { producerRef: true },
  });
  if (!item) return NextResponse.json({ error: "Produção não encontrada." }, { status: 404 });
  return NextResponse.json({ item });
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!isAuthorizedAdminRequest(request)) return unauthorized();
  const { id } = await context.params;
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  const title = clean(body.title);
  const artist = clean(body.artist);
  const publishedAt = new Date(clean(body.publishedAt));
  if (!title || !artist || Number.isNaN(publishedAt.getTime()) || !clean(body.audioFileId) || !clean(body.fileName)) {
    return NextResponse.json({ error: "Preencha os campos obrigatórios." }, { status: 400 });
  }
  const producerId = clean(body.producerId);
  const producer = producerId
    ? await prisma.brsProducer.findUnique({ where: { id: producerId }, select: { name: true } })
    : null;
  if (producerId && !producer) return NextResponse.json({ error: "Produtor inválido." }, { status: 400 });
  const category = BRS_PRODUCTION_CATEGORIES.some((item) => item.id === body.category)
    ? String(body.category)
    : "BRS_ORIGINAL";
  try {
    const item = await prisma.brsProduction.update({
    where: { id },
    data: {
      title,
      artist,
      producer: producer?.name || clean(body.producer) || artist,
      producerId: producerId || null,
      versionType: clean(body.versionType) || "Original Mix",
      versionLabel: clean(body.versionLabel) || null,
      category,
      genre: clean(body.genre) || null,
      duration: clean(body.duration) || null,
      bpm: clean(body.bpm) || null,
      format: clean(body.format) || null,
      bitrate: clean(body.bitrate) || null,
      coverUrl: clean(body.coverUrl) || null,
      coverFileId: clean(body.coverFileId) || null,
      audioFileId: clean(body.audioFileId),
      downloadFileId: clean(body.downloadFileId) || null,
      fileName: clean(body.fileName),
      description: clean(body.description) || null,
      publishedAt,
      isPublished: Boolean(body.isPublished),
      isFeatured: Boolean(body.isFeatured),
      isNew: Boolean(body.isNew),
      slug: await uniqueProductionSlug(clean(body.slug) || title, id),
    },
  });
    return NextResponse.json({ item });
  } catch (error) {
    const code = typeof error === "object" && error && "code" in error ? String((error as { code: unknown }).code) : "";
    console.error("[admin-producoes]", error);
    if (code === "P2021" || code === "P2022") {
      return NextResponse.json({ error: "A tabela de produções ainda não existe. Reinicie o servidor para criá-la." }, { status: 503 });
    }
    return NextResponse.json({ error: "Não foi possível salvar a produção." }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!isAuthorizedAdminRequest(request)) return unauthorized();
  const { id } = await context.params;
  await prisma.brsProduction.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
