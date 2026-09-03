import {
  getVipMusicTracks,
  listVipMusicFolders,
  type VipMusicFolder,
} from "./vip-music-catalog";
import { type PreviewTrack } from "./google-drive";
import {
  displayFolderName,
  folderHref,
  parseMonthStatus,
  slugifyFolderName,
} from "./vip-music-slugs";

export type HomeTrackItem = PreviewTrack & {
  styleFolderId: string;
  styleName: string;
  monthSlug: string;
  monthName: string;
  href: string;
  relativePath: string;
};

export type HomeGenreItem = {
  name: string;
  slug: string;
  monthSlug: string;
  styleFolderId: string;
  trackCount: number;
  href: string;
};

export type VipMusicHomeSnapshot = {
  configured: boolean;
  syncedAt: string;
  stats: {
    trackCount: number;
    packCount: number;
    genreCount: number;
    monthCount: number;
  };
  priorityMonth: { slug: string; name: string; status: string } | null;
  newsBanner: { title: string; subtitle: string; href: string; newTracksEstimate: number };
  latestTracks: HomeTrackItem[];
  topWeek: HomeTrackItem[];
  genres: HomeGenreItem[];
  periodLinks: { id: string; label: string; href: string; count: number }[];
  allTracksSample: HomeTrackItem[];
};

const MONTH_NAMES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

function weekSeed() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  return Math.floor((now.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000));
}

function seededShuffle<T>(items: T[], seed: number): T[] {
  const copy = [...items];
  let s = seed || 1;
  for (let i = copy.length - 1; i > 0; i -= 1) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function pickPriorityMonth(months: VipMusicFolder[]) {
  return (
    months.find((m) => parseMonthStatus(m.name).status === "em-atualizacao") ??
    [...months].reverse().find((m) => parseMonthStatus(m.name).status === "completo") ??
    months[months.length - 1] ??
    null
  );
}

function stylePageHref(monthSlug: string, styleSlug: string, trackId?: string) {
  const params = new URLSearchParams({ estilo: styleSlug });
  if (trackId) params.set("faixa", trackId);
  return `/musicas/atualizacoes/${monthSlug}?${params.toString()}`;
}

function toHomeTrack(
  track: PreviewTrack,
  month: VipMusicFolder,
  style: VipMusicFolder,
): HomeTrackItem {
  const monthSlug = slugifyFolderName(month.name);
  const styleSlug = slugifyFolderName(style.name);
  const monthLabel = displayFolderName(month.name);
  const styleLabel = displayFolderName(style.name);
  return {
    ...track,
    styleFolderId: style.id,
    styleName: styleLabel,
    monthSlug,
    monthName: monthLabel,
    href: stylePageHref(monthSlug, styleSlug, track.id),
    relativePath: `${monthLabel}/${styleLabel}/${track.fileName ?? track.title}`,
  };
}

async function countTracksInStyle(style: VipMusicFolder, month: VipMusicFolder, bucket: HomeTrackItem[]) {
  const tracks = await getVipMusicTracks(style.id, style.name);
  for (const track of tracks.slice(-2)) {
    bucket.push(toHomeTrack(track, month, style));
  }
  return tracks.length;
}

export async function buildVipMusicHomeSnapshot(): Promise<VipMusicHomeSnapshot> {
  const syncedAt = new Date().toISOString();
  const months = await listVipMusicFolders();

  if (months.length === 0) {
    return {
      configured: false,
      syncedAt,
      stats: { trackCount: 0, packCount: 0, genreCount: 0, monthCount: 0 },
      priorityMonth: null,
      newsBanner: {
        title: "Acervo VIP",
        subtitle: "Em breve novas faixas",
        href: "/musicas/atualizacoes",
        newTracksEstimate: 0,
      },
      latestTracks: [],
      topWeek: [],
      genres: [],
      periodLinks: [],
      allTracksSample: [],
    };
  }

  const genreMap = new Map<string, HomeGenreItem>();
  let packCount = 0;
  let sampledTracks = 0;
  let sampledPacks = 0;
  const latestBucket: HomeTrackItem[] = [];
  const allSample: HomeTrackItem[] = [];

  const priorityMonth = pickPriorityMonth(months);
  const prioritySlug = priorityMonth ? slugifyFolderName(priorityMonth.name) : null;

  for (const month of months) {
    const styles = await listVipMusicFolders(month.id);
    packCount += styles.length;

    for (const style of styles) {
      const styleLabel = displayFolderName(style.name);
      const monthSlug = slugifyFolderName(month.name);
      const styleSlug = slugifyFolderName(style.name);
      const key = styleLabel.toLowerCase();

      if (!genreMap.has(key)) {
        genreMap.set(key, {
          name: styleLabel,
          slug: styleSlug,
          monthSlug,
          styleFolderId: style.id,
          trackCount: 0,
          href: stylePageHref(monthSlug, styleSlug),
        });
      }

      const shouldSample =
        priorityMonth &&
        month.id === priorityMonth.id &&
        latestBucket.length < 40;

      if (shouldSample || (sampledPacks < 24 && allSample.length < 120)) {
        const count = await countTracksInStyle(style, month, shouldSample ? latestBucket : allSample);
        sampledTracks += count;
        sampledPacks += 1;
        const genre = genreMap.get(key);
        if (genre) genre.trackCount += count;
      }
    }
  }

  const avgTracksPerPack = sampledPacks > 0 ? sampledTracks / sampledPacks : 0;
  const trackCount = Math.round(avgTracksPerPack * packCount);
  const genres = [...genreMap.values()]
    .sort((a, b) => b.trackCount - a.trackCount || a.name.localeCompare(b.name, "pt-BR"))
    .slice(0, 12);

  const latestTracks = latestBucket.slice(-10).reverse();
  const topWeek = seededShuffle(latestBucket.length ? latestBucket : allSample, weekSeed()).slice(0, 8);
  const allTracksSample = [...latestBucket, ...allSample].slice(0, 200);

  const now = new Date();
  const monthLabel = MONTH_NAMES[now.getMonth()] ?? "Este mês";
  const newTracksEstimate = priorityMonth
    ? Math.max(latestTracks.length * 12, Math.round(trackCount * 0.02))
    : 0;

  const periodLinks = months
    .slice(-3)
    .reverse()
    .map((month) => ({
      id: slugifyFolderName(month.name),
      label: displayFolderName(month.name),
      href: folderHref([slugifyFolderName(month.name)]),
      count: 0,
    }));

  return {
    configured: true,
    syncedAt,
    stats: {
      trackCount,
      packCount,
      genreCount: genreMap.size,
      monthCount: months.length,
    },
    priorityMonth: priorityMonth
      ? {
          slug: prioritySlug ?? "",
          name: displayFolderName(priorityMonth.name),
          status: parseMonthStatus(priorityMonth.name).status,
        }
      : null,
    newsBanner: {
      title: `🔥 ${monthLabel} chegou — ${newTracksEstimate.toLocaleString("pt-BR")} novas faixas adicionadas`,
      subtitle: priorityMonth
        ? `Pack ${displayFolderName(priorityMonth.name)} em destaque`
        : "Explore o acervo completo",
      href: prioritySlug ? folderHref([prioritySlug]) : "/musicas/atualizacoes",
      newTracksEstimate,
    },
    latestTracks,
    topWeek,
    genres,
    periodLinks,
    allTracksSample,
  };
}
