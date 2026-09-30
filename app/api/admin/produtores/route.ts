import { NextResponse } from "next/server";
import { isAuthorizedAdminRequest } from "../../../lib/admin-auth";
import { prisma } from "../../../lib/prisma";
import { uniqueProducerSlug } from "../../../lib/brs-productions";

function unauthorized() {
  return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
}

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function producerData(body: Record<string, unknown>, slug: string) {
  const name = clean(body.name);
  return {
    name,
    slug,
    fullName: clean(body.fullName) || null,
    bio: clean(body.bio) || null,
    photoFileId: clean(body.photoFileId) || null,
    city: clean(body.city) || null,
    country: clean(body.country) || null,
    instagram: clean(body.instagram) || null,
    facebook: clean(body.facebook) || null,
    youtube: clean(body.youtube) || null,
    soundcloud: clean(body.soundcloud) || null,
    spotify: clean(body.spotify) || null,
    website: clean(body.website) || null,
  };
}

function failure(error: unknown) {
  const code = typeof error === "object" && error && "code" in error ? String((error as { code: unknown }).code) : "";
  console.error("[admin-produtores]", error);
  if (code === "P2021" || code === "P2022") {
    return NextResponse.json(
      { error: "A tabela de produtores ainda não existe. Reinicie o servidor para criá-la." },
      { status: 503 },
    );
  }
  return NextResponse.json({ error: "Não foi possível salvar o produtor." }, { status: 500 });
}

export async function GET(request: Request) {
  if (!isAuthorizedAdminRequest(request)) return unauthorized();
  try {
    const items = await prisma.brsProducer.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { productions: true } } },
    });
    return NextResponse.json({ items });
  } catch (error) {
    return failure(error);
  }
}

export async function POST(request: Request) {
  if (!isAuthorizedAdminRequest(request)) return unauthorized();
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const name = body ? clean(body.name) : "";
  if (!name) return NextResponse.json({ error: "Informe o nome artístico." }, { status: 400 });
  try {
    const item = await prisma.brsProducer.create({
      data: producerData(body!, await uniqueProducerSlug(name)),
    });
    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    return failure(error);
  }
}
