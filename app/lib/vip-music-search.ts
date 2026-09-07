import { getVipMusicTracks, listVipMusicFolders } from "./vip-music-catalog";
import {
  childrenAreDateFolders,
  childrenAreWeekFolders,
  childrenAreYearFolders,
  displayFolderName,
  formatDateFolderLabel,
  isDateFolderName,
  isYearFolderName,
  slugifyFolderName,
} from "./vip-music-slugs";

export type VipMusicSearchHit = {
  type: "month" | "week" | "style" | "track" | "year" | "date" | "pool";
  id: string;
  label: string;
  path: string;
  monthSlug: string;
  weekSlug?: string;
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

async function searchPoolsUnderDate(options: {
  year: { id: string; name: string };
  date: { id: string; name: string };
  yearSlug: string;
  dateSlug: string;
  yearLabel: string;
  dateLabel: string;
  q: string;
  limit: number;
  results: VipMusicSearchHit[];
}) {
  const { yearSlug, dateSlug, yearLabel, dateLabel, q, limit, results } = options;
  const pools = await listVipMusicFolders(options.date.id);

  for (const pool of pools) {
    if (results.length >= limit) break;

    const poolSlug = slugifyFolderName(pool.name);
    const poolLabel = displayFolderName(pool.name);
    const path = `${yearLabel} · ${dateLabel} · ${poolLabel}`;

    if (matches(pool.name, q) || matches(poolLabel, q)) {
      results.push({
        type: "pool",
        id: pool.id,
        label: poolLabel,
        path: `${yearLabel} · ${dateLabel}`,
        monthSlug: yearSlug,
        weekSlug: dateSlug,
        styleSlug: poolSlug,
        styleFolderId: pool.id,
      });
    }

    const tracks = await getVipMusicTracks(pool.id, pool.name);
    for (const track of tracks) {
      if (results.length >= limit) break;
      const haystack = [track.title, track.artist, track.pack, pool.name, options.date.name, options.year.name].join(
        " ",
      );
      if (matches(haystack, q)) {
        results.push({
          type: "track",
          id: track.id,
          label: track.title,
          path,
          monthSlug: yearSlug,
          weekSlug: dateSlug,
          styleSlug: poolSlug,
          styleFolderId: pool.id,
        });
      }
    }
  }
}

export async function searchVipMusic(query: string, limit = 50): Promise<VipMusicSearchHit[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const results: VipMusicSearchHit[] = [];
  const roots = await listVipMusicFolders();
  const yearMode = childrenAreYearFolders(roots) || roots.some((f) => isYearFolderName(f.name));

  if (yearMode) {
    const years = roots.filter((f) => isYearFolderName(f.name));
    const yearList = years.length > 0 ? years : roots;

    for (const year of yearList) {
      if (results.length >= limit) break;

      const yearSlug = slugifyFolderName(year.name);
      const yearLabel = displayFolderName(year.name);

      if (matches(year.name, q) || matches(yearLabel, q)) {
        results.push({
          type: "year",
          id: year.id,
          label: yearLabel,
          path: "Acervo VIP",
          monthSlug: yearSlug,
        });
      }

      const dates = await listVipMusicFolders(year.id);
      for (const date of dates) {
        if (results.length >= limit) break;

        const dateSlug = slugifyFolderName(date.name);
        const dateLabel = isDateFolderName(date.name)
          ? formatDateFolderLabel(date.name)
          : displayFolderName(date.name);

        if (matches(date.name, q) || matches(dateLabel, q) || matches(formatDateFolderLabel(date.name), q)) {
          results.push({
            type: "date",
            id: date.id,
            label: dateLabel,
            path: yearLabel,
            monthSlug: yearSlug,
            weekSlug: dateSlug,
          });
        }

        if (childrenAreDateFolders(dates) || isDateFolderName(date.name)) {
          await searchPoolsUnderDate({
            year,
            date,
            yearSlug,
            dateSlug,
            yearLabel,
            dateLabel,
            q,
            limit,
            results,
          });
        }
      }
    }

    return results.slice(0, limit);
  }

  for (const month of roots) {
    if (results.length >= limit) break;

    const monthSlug = slugifyFolderName(month.name);
    const monthLabel = displayFolderName(month.name);

    if (matches(month.name, q) || matches(monthLabel, q)) {
      results.push({
        type: "month",
        id: month.id,
        label: monthLabel,
        path: "Acervo VIP",
        monthSlug,
      });
    }

    const monthChildren = await listVipMusicFolders(month.id);

    if (childrenAreWeekFolders(monthChildren)) {
      for (const week of monthChildren) {
        if (results.length >= limit) break;

        const weekSlug = slugifyFolderName(week.name);
        const weekLabel = displayFolderName(week.name);

        if (matches(week.name, q) || matches(weekLabel, q)) {
          results.push({
            type: "week",
            id: week.id,
            label: weekLabel,
            path: monthLabel,
            monthSlug,
            weekSlug,
          });
        }

        const styles = await listVipMusicFolders(week.id);
        for (const style of styles) {
          if (results.length >= limit) break;

          const styleSlug = slugifyFolderName(style.name);
          const styleLabel = displayFolderName(style.name);
          const path = `${monthLabel} · ${weekLabel} · ${styleLabel}`;

          if (matches(style.name, q) || matches(styleLabel, q)) {
            results.push({
              type: "style",
              id: style.id,
              label: styleLabel,
              path: `${monthLabel} · ${weekLabel}`,
              monthSlug,
              weekSlug,
              styleSlug,
              styleFolderId: style.id,
            });
          }

          const tracks = await getVipMusicTracks(style.id, style.name);
          for (const track of tracks) {
            if (results.length >= limit) break;
            const haystack = [track.title, track.artist, track.pack, style.name, week.name, month.name].join(
              " ",
            );
            if (matches(haystack, q)) {
              results.push({
                type: "track",
                id: track.id,
                label: track.title,
                path,
                monthSlug,
                weekSlug,
                styleSlug,
                styleFolderId: style.id,
              });
            }
          }
        }
      }
      continue;
    }

    for (const style of monthChildren) {
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
