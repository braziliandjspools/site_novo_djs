import type { VipMusicFolder } from "./vip-music-catalog";

export type MonthStatus = "completo" | "em-atualizacao" | "em-breve" | "none";

export function slugifyFolderName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[[\]]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function folderHref(slugSegments: string[]): string {
  if (slugSegments.length === 0) return "/musicas/atualizacoes";
  return `/musicas/atualizacoes/${slugSegments.join("/")}`;
}

export function findFolderBySlug(folders: VipMusicFolder[], slug: string): VipMusicFolder | null {
  const normalized = slug.toLowerCase();
  return folders.find((folder) => slugifyFolderName(folder.name) === normalized) ?? null;
}

export function parseMonthStatus(name: string): { label: string; status: MonthStatus } {
  const completo = /\[COMPLETO\]/i.test(name);
  const emAtualizacao = /\[EM ATUALIZAÇÃO\]/i.test(name) || /\[EM ATUALIZACAO\]/i.test(name);
  const emBreve = /\[EM BREVE\]/i.test(name);

  if (completo) return { label: "Completo", status: "completo" };
  if (emAtualizacao) return { label: "Em atualização", status: "em-atualizacao" };
  if (emBreve) return { label: "Em breve", status: "em-breve" };
  return { label: "", status: "none" };
}

export function displayFolderName(name: string): string {
  return name.replace(/\s*\[[^\]]+\]\s*/gi, " ").trim();
}
