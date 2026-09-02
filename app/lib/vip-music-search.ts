import { getVipMusicTracks, listVipMusicFolders } from "./vip-music-catalog";
import { displayFolderName, slugifyFolderName } from "./vip-music-slugs";

export type VipMusicSearchHit = {
  type: "month" | "style" | "track";
  id: string;
  label: string;
  path: string;
  monthSlug: string;
  styleSlug?: string;
  styleFolderId?: string;
};

function normalize(text: string) {
  return text
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();
}

function matches(text: string, query: string) {
  return normalize(text).includes(normalize(query));
}

export async function searchVipMusic(query: string, limit = 50): Promise<VipMusicSearchHit[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const results: VipMusicSearchHit[] = [];
  const months = await listVipMusicFolders();

  for (const month of months) {
    if (results.length >= limit) break;

    const monthSlug = slugifyFolderName(month.name);
    const monthLabel = displayFolderName(month.name);

    if (matches(month.name, q) || matches(monthLabel, q)) {
      results.push({
        type: "month",
        id: month.id,
        label: monthLabel,
        path: "Packs 2026",
        monthSlug,
      });
    }

    const styles = await listVipMusicFolders(month.id);
    for (const style of styles) {
      if (results.length >= limit) break;

      const styleSlug = slugifyFolderName(style.name);
      const styleLabel = displayFolderName(style.name);
      const path = `${monthLabel} · ${styleLabel}`;

      if (matches(style.name, q) || matches(styleLabel, q)) {
        results.push({
          type: "style",
          id: style.id,
          label: styleLabel,
          path: monthLabel,
          monthSlug,
          styleSlug,
          styleFolderId: style.id,
        });
      }

      const tracks = await getVipMusicTracks(style.id, style.name);
      for (const track of tracks) {
        if (results.length >= limit) break;

        const haystack = [track.title, track.artist, track.pack, style.name, month.name].join(" ");
        if (matches(haystack, q)) {
          results.push({
            type: "track",
            id: track.id,
            label: track.title,
            path,
            monthSlug,
            styleSlug,
            styleFolderId: style.id,
          });
        }
      }
    }
  }

  return results.slice(0, limit);
}
