import { NextResponse } from "next/server";
import { isAuthorizedAdminRequest } from "../../../lib/admin-auth";
import { prisma } from "../../../lib/prisma";
import { BRS_PRODUCTION_CATEGORIES, uniqueProductionSlug } from "../../../lib/brs-productions";

function unauthorized() {
  return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
}

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

async function parseBody(body: Record<string, unknown>, ignoreId?: string) {
  const title = clean(body.title);
  const artist = clean(body.artist);
  const audioFileId = clean(body.audioFileId);
  const fileName = clean(body.fileName);
  const publishedAt = new Date(clean(body.publishedAt) || Date.now());
  if (!title || !artist || !audioFileId || !fileName || Number.isNaN(publishedAt.getTime())) return null;
  const producerId = clean(body.producerId);
  const producer = producerId
    ? await prisma.brsProducer.findUnique({ where: { id: producerId }, select: { name: true } })
    : null;
  if (producerId && !producer) return null;
  const category = BRS_PRODUCTION_CATEGORIES.some((item) => item.id === body.category)
    ? String(body.category)
    : "BRS_ORIGINAL";
  return {
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
    audioFileId,
    downloadFileId: clean(body.downloadFileId) || null,
    fileName,
    description: clean(body.description) || null,
    beatportUrl: clean(body.beatportUrl) || null,
    publishedAt,
    isPublished: Boolean(body.isPublished),
    isFeatured: Boolean(body.isFeatured),
    isNew: Boolean(body.isNew),
    slug: await uniqueProductionSlug(clean(body.slug) || title, ignoreId),
  };
}

function failure(error: unknown) {
  const code = typeof error === "object" && error && "code" in error ? String((error as { code: unknown }).code) : "";
  console.error("[admin-producoes]", error);
  if (code === "P2021" || code === "P2022") {
    return NextResponse.json(
      { error: "A tabela de produções ainda não existe. Reinicie o servidor para criá-la." },
      { status: 503 },
    );
  }
  return NextResponse.json({ error: "Não foi possível salvar a produção." }, { status: 500 });
}

export async function GET(request: Request) {
  if (!isAuthorizedAdminRequest(request)) return unauthorized();
  try {
    const items = await prisma.brsProduction.findMany({
      include: { producerRef: { select: { id: true, name: true, slug: true } } },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    });
    return NextResponse.json({ items });
  } catch (error) {
    return failure(error);
  }
}

export async function POST(request: Request) {
  if (!isAuthorizedAdminRequest(request)) return unauthorized();
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  try {
    const data = body ? await parseBody(body) : null;
    if (!data) return NextResponse.json({ error: "Preencha título, artista, produtor e o link da música." }, { status: 400 });
    const item = await prisma.brsProduction.create({ data });
    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    return failure(error);
  }
}
