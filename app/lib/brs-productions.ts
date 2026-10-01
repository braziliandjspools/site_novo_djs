import type { PreviewTrack } from "./google-drive";
import { prisma } from "./prisma";
import { PLACEHOLDER } from "./theme";
import { catalogMediaUrl } from "./catalog-media";
import { slugifyFolderName } from "./vip-music-slugs";

export const BRS_PRODUCTION_CATEGORIES = [
  { id: "BRS_ORIGINAL", label: "BRS ORIGINAL" },
  { id: "EQUIPE_BRS", label: "EQUIPE BRS" },
  { id: "DJ_PARCEIRO", label: "DJ PARCEIRO" },
] as const;

export const BRS_PRODUCTION_VERSIONS = [
  "Original Mix",
  "Remix",
  "Edit",
  "Extended",
  "Mashup",
  "Bootleg",
] as const;

export type PublicBrsProduction = {
  id: string;
  slug: string;
  title: string;
  artist: string;
  producer: string;
  producerSlug: string | null;
  producerBio: string | null;
  producerPhotoUrl: string | null;
  versionType: string;
  versionLabel: string | null;
  category: string;
  categoryLabel: string;
  genre: string | null;
  duration: string | null;
  bpm: string | null;
  format: string | null;
  bitrate: string | null;
  coverUrl: string;
  audioFileId: string;
  downloadFileId: string | null;
  fileName: string;
  description: string | null;
  publishedAt: string;
  isFeatured: boolean;
  isNew: boolean;
};

type ProductionRow = {
  id: string;
  slug: string;
  title: string;
  artist: string;
  producer: string;
  versionType: string;
  versionLabel: string | null;
  category: string;
  genre: string | null;
  duration: string | null;
  bpm: string | null;
  format: string | null;
  bitrate: string | null;
  coverUrl: string | null;
  coverFileId: string | null;
  audioFileId: string;
  downloadFileId: string | null;
  fileName: string;
  description: string | null;
  publishedAt: Date;
  isFeatured: boolean;
  isNew: boolean;
  producerRef?: {
    name: string;
    slug: string;
    bio: string | null;
    photoFileId: string | null;
  } | null;
};

export function categoryLabel(category: string) {
  return BRS_PRODUCTION_CATEGORIES.find((item) => item.id === category)?.label ?? "BRS ORIGINAL";
}

export function productionCover(coverUrl: string | null | undefined, coverFileId?: string | null) {
  return catalogMediaUrl(coverFileId) || coverUrl?.trim() || PLACEHOLDER.trackCover;
}

export function toPublicProduction(row: ProductionRow): PublicBrsProduction {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    artist: row.artist,
    producer: row.producerRef?.name || row.producer,
    producerSlug: row.producerRef?.slug ?? null,
    producerBio: row.producerRef?.bio ?? null,
    producerPhotoUrl: catalogMediaUrl(row.producerRef?.photoFileId),
    versionType: row.versionType,
    versionLabel: row.versionLabel,
    category: row.category,
    categoryLabel: categoryLabel(row.category),
    genre: row.genre,
    duration: row.duration,
    bpm: row.bpm,
    format: row.format,
    bitrate: row.bitrate,
    coverUrl: productionCover(row.coverUrl, row.coverFileId),
    audioFileId: row.audioFileId,
    downloadFileId: row.downloadFileId,
    fileName: row.fileName,
    description: row.description,
    publishedAt: row.publishedAt.toISOString(),
    isFeatured: row.isFeatured,
    isNew: row.isNew,
  };
}

export function productionToPreviewTrack(production: PublicBrsProduction): PreviewTrack {
  return {
    id: production.audioFileId,
    title: production.title,
    artist: production.artist,
    pack: "Produções BRS",
    fileName: production.fileName,
    styleName: production.versionType,
    modifiedAt: production.publishedAt,
    musicalKey: null,
    bpm: null,
    bpmFrom: null,
    bpmTo: null,
    version: production.versionType,
    editType: null,
  };
}

export function productionDownloadTrack(production: PublicBrsProduction) {
  return {
    id: production.downloadFileId?.trim() || production.audioFileId,
    title: production.title,
    fileName: production.fileName,
  };
}

const publishedInclude = { producerRef: true } as const;

export async function listPublishedProductions(limit = 12) {
  const rows = await prisma.brsProduction.findMany({
    where: { isPublished: true },
    include: publishedInclude,
    orderBy: [{ isFeatured: "desc" }, { publishedAt: "desc" }, { createdAt: "desc" }],
    take: limit,
  });
  return rows.map(toPublicProduction);
}

export async function getPublishedProductionBySlug(slug: string) {
  const row = await prisma.brsProduction.findFirst({
    where: { slug, isPublished: true },
    include: publishedInclude,
  });
  return row ? toPublicProduction(row) : null;
}

export async function listProducerProductions(producerId: string, skip: number, take: number) {
  const [rows, total] = await Promise.all([
    prisma.brsProduction.findMany({
      where: { producerId, isPublished: true },
      include: publishedInclude,
      orderBy: { publishedAt: "desc" },
      skip,
      take,
    }),
    prisma.brsProduction.count({ where: { producerId, isPublished: true } }),
  ]);
  return { items: rows.map(toPublicProduction), total };
}

export async function getProducerPage(slug: string, page: number, pageSize = 12) {
  const producer = await prisma.brsProducer.findUnique({ where: { slug } });
  if (!producer) return null;
  const skip = Math.max(0, page - 1) * pageSize;
  const result = await listProducerProductions(producer.id, skip, pageSize);
  return { producer, ...result, page, pageSize };
}

export async function uniqueProductionSlug(title: string, ignoreId?: string) {
  const base = slugifyFolderName(title) || "producao";
  let slug = base;
  let n = 2;
  while (
    await prisma.brsProduction.findFirst({
      where: { slug, ...(ignoreId ? { id: { not: ignoreId } } : {}) },
      select: { id: true },
    })
  ) {
    slug = `${base}-${n++}`;
  }
  return slug;
}

export function normalizeProducerWhatsapp(value: unknown) {
  const raw = typeof value === "string" ? value.trim().replace(/[\s()-]/g, "") : "";
  if (!raw) return { phone: null as string | null };
  const phone = `+${raw.replace(/\D/g, "")}`;
  if (!/^\+\d{10,15}$/.test(phone)) {
    return { phone: null as string | null, error: "WhatsApp no formato +5551935052274." };
  }
  return { phone };
}

export function producerWhatsappLink(phone: string | null | undefined) {
  const digits = phone?.replace(/\D/g, "") ?? "";
  return digits ? `https://wa.me/${digits}` : null;
}

export async function uniqueProducerSlug(name: string, ignoreId?: string) {
  const base = slugifyFolderName(name) || "produtor";
  let slug = base;
  let n = 2;
  while (
    await prisma.brsProducer.findFirst({
      where: { slug, ...(ignoreId ? { id: { not: ignoreId } } : {}) },
      select: { id: true },
    })
  ) {
    slug = `${base}-${n++}`;
  }
  return slug;
}
