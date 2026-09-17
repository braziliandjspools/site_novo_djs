import type { PreviewTrack } from "../../lib/google-drive";
import { getSaoPauloDateParts } from "../../lib/due-queue";
import { formatUpdateDateLabel } from "../../lib/vip-music-slugs";

export type TrackDateSection = {
  id: string;
  /** Ex.: "17.09.2026", "Adicionadas recentemente", "8 set" */
  title: string;
  /** Ex.: "8 faixas" — vazio quando o título já é a data fixa da pasta */
  subtitle: string;
  /** Destaque visual da seção mais recente. */
  isNew: boolean;
  /** `folder` = data fixa da pasta Drive; `upload` = created/modified do arquivo. */
  kind: "folder" | "upload";
  tracks: PreviewTrack[];
};

function dayKeyFromIso(iso: string): string | null {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  const { year, month, day } = getSaoPauloDateParts(date);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function todayKey() {
  const { year, month, day } = getSaoPauloDateParts();
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function yesterdayKey() {
  const now = new Date();
  const shifted = new Date(now.getTime() - 86_400_000);
  const { year, month, day } = getSaoPauloDateParts(shifted);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function formatDayLabel(key: string): string {
  const today = todayKey();
  const yesterday = yesterdayKey();
  if (key === today) return "Hoje";
  if (key === yesterday) return "Ontem";

  const [y, m, d] = key.split("-").map(Number);
  if (!y || !m || !d) return key;
  const date = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  const thisYear = getSaoPauloDateParts().year;
  return date.toLocaleDateString("pt-BR", {
    timeZone: "UTC",
    day: "numeric",
    month: "short",
    ...(y !== thisYear ? { year: "numeric" as const } : {}),
  });
}

function sortByTitle(a: PreviewTrack, b: PreviewTrack) {
  return a.title.localeCompare(b.title, "pt-BR", { sensitivity: "base" });
}

function sortByNewestThenTitle(a: PreviewTrack, b: PreviewTrack) {
  const am = a.modifiedAt ?? "";
  const bm = b.modifiedAt ?? "";
  if (am !== bm) return bm.localeCompare(am);
  return sortByTitle(a, b);
}

function countLabel(n: number) {
  return `${n} ${n === 1 ? "faixa" : "faixas"}`;
}

/**
 * Agrupa por pastas de atualização no Drive (`17-09-2026` → título fixo `17.09.2026`).
 * Datas mais recentes primeiro.
 */
export function groupTracksByFolderDate(tracks: PreviewTrack[]): TrackDateSection[] {
  if (tracks.length === 0) return [];

  const byDay = new Map<string, PreviewTrack[]>();
  const undated: PreviewTrack[] = [];

  for (const track of tracks) {
    const key = track.updateDate?.trim() || "";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) {
      undated.push(track);
      continue;
    }
    const list = byDay.get(key);
    if (list) list.push(track);
    else byDay.set(key, [track]);
  }

  const dayKeys = [...byDay.keys()].sort((a, b) => b.localeCompare(a));
  const sections: TrackDateSection[] = dayKeys.map((key) => {
    const dayTracks = [...(byDay.get(key) ?? [])].sort(sortByTitle);
    return {
      id: `folder-${key}`,
      title: formatUpdateDateLabel(key),
      subtitle: "",
      isNew: false,
      kind: "folder",
      tracks: dayTracks,
    };
  });

  if (undated.length > 0) {
    sections.push({
      id: "undated",
      title: "Outras faixas",
      subtitle: countLabel(undated.length),
      isNew: false,
      kind: "upload",
      tracks: [...undated].sort(sortByTitle),
    });
  }

  return sections;
}

/**
 * Agrupa faixas por dia de upload no Drive (`createdTime`/`modifiedTime` → `modifiedAt`).
 * Dias mais recentes primeiro; o dia mais novo leva o título "Adicionadas recentemente"
 * quando há vários dias.
 *
 * Se alguma faixa tiver `updateDate` (pasta `DD-MM-YYYY` no Drive), usa o agrupamento
 * fixo por pasta e ignora o agrupamento por upload.
 */
export function groupTracksByUploadDate(tracks: PreviewTrack[]): TrackDateSection[] {
  if (tracks.length === 0) return [];

  if (tracks.some((track) => Boolean(track.updateDate?.trim()))) {
    return groupTracksByFolderDate(tracks);
  }

  const dated: PreviewTrack[] = [];
  const undated: PreviewTrack[] = [];
  for (const track of tracks) {
    if (track.modifiedAt && dayKeyFromIso(track.modifiedAt)) dated.push(track);
    else undated.push(track);
  }

  if (dated.length === 0) {
    return [
      {
        id: "all",
        title: "Faixas",
        subtitle: countLabel(tracks.length),
        isNew: false,
        kind: "upload",
        tracks: [...tracks].sort(sortByTitle),
      },
    ];
  }

  const byDay = new Map<string, PreviewTrack[]>();
  for (const track of dated) {
    const key = dayKeyFromIso(track.modifiedAt!)!;
    const list = byDay.get(key);
    if (list) list.push(track);
    else byDay.set(key, [track]);
  }

  const dayKeys = [...byDay.keys()].sort((a, b) => b.localeCompare(a));
  const multipleDays = dayKeys.length > 1 || undated.length > 0;

  const sections: TrackDateSection[] = dayKeys.map((key, index) => {
    const dayTracks = [...(byDay.get(key) ?? [])].sort(
      index === 0 ? sortByNewestThenTitle : sortByTitle,
    );
    const dayLabel = formatDayLabel(key);
    const isNew = multipleDays && index === 0;
    return {
      id: key,
      title: isNew ? "Adicionadas recentemente" : dayLabel,
      subtitle: isNew
        ? `${dayLabel} · ${countLabel(dayTracks.length)}`
        : countLabel(dayTracks.length),
      isNew,
      kind: "upload" as const,
      tracks: dayTracks,
    };
  });

  // Um único dia e nada sem data → uma seção com a data (sem “Adicionadas recentemente”).
  if (!multipleDays && sections[0]) {
    sections[0] = {
      ...sections[0],
      title: formatDayLabel(dayKeys[0]!),
      subtitle: countLabel(sections[0].tracks.length),
      isNew: false,
    };
  }

  if (undated.length > 0) {
    sections.push({
      id: "undated",
      title: "Sem data",
      subtitle: countLabel(undated.length),
      isNew: false,
      kind: "upload",
      tracks: [...undated].sort(sortByTitle),
    });
  }

  return sections;
}

/** Ordem de fila/player: Novas primeiro, depois dias mais antigos. */
export function flattenTrackSections(sections: TrackDateSection[]): PreviewTrack[] {
  return sections.flatMap((section) => section.tracks);
}
