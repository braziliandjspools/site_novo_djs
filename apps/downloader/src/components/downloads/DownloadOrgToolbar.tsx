import type {
  OrgFacetKey,
  OrgFacets,
  OrgGroupBy,
  OrgMetaFilters,
} from "../../lib/download/job-organization";
import {
  EMPTY_ORG_FILTERS,
  ORG_FACET_LABELS,
  ORG_GROUP_LABELS,
  hasAnyOrgFacet,
} from "../../lib/download/job-organization";

type DownloadOrgToolbarProps = {
  facets: OrgFacets;
  filters: OrgMetaFilters;
  groupBy: OrgGroupBy;
  onFiltersChange: (filters: OrgMetaFilters) => void;
  onGroupByChange: (groupBy: OrgGroupBy) => void;
};

const FACET_ORDER: OrgFacetKey[] = ["genre", "pool", "month", "category", "folder", "editType"];

export function DownloadOrgToolbar({
  facets,
  filters,
  groupBy,
  onFiltersChange,
  onGroupByChange,
}: DownloadOrgToolbarProps) {
  if (!hasAnyOrgFacet(facets)) return null;

  const visibleFacets = FACET_ORDER.filter((key) => {
    if (facets[key].length === 0) return false;
    // Evita duplicar Gênero e Categoria quando os valores são idênticos.
    if (key === "category") {
      const sameAsGenre =
        facets.category.length === facets.genre.length &&
        facets.category.every((value, index) => value === facets.genre[index]);
      if (sameAsGenre) return false;
    }
    return true;
  });

  const hasActiveFilter = Object.values(filters).some(Boolean);

  return (
    <div className="space-y-3 rounded-xl border border-white/[0.06] bg-[#1a1a1a] px-3 py-3 sm:px-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
          Organizar por metadados
        </p>
        {hasActiveFilter && (
          <button
            type="button"
            className="text-[11px] font-semibold text-zinc-500 hover:text-zinc-300"
            onClick={() => onFiltersChange({ ...EMPTY_ORG_FILTERS })}
          >
            Limpar filtros
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {visibleFacets.map((key) => (
          <label key={key} className="flex min-w-[140px] flex-1 flex-col gap-1">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
              {ORG_FACET_LABELS[key]}
            </span>
            <select
              value={filters[key] ?? ""}
              onChange={(event) =>
                onFiltersChange({
                  ...filters,
                  [key]: event.target.value || null,
                })
              }
              className="rounded-lg border border-white/[0.08] bg-[#121212] px-2.5 py-2 text-xs text-white outline-none focus:border-[#1db954]/50"
            >
              <option value="">Todos</option>
              {facets[key].map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-white/[0.04] pt-3">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
          Agrupar
        </span>
        {(["none", "folder", "category", "date"] as const).map((key) => {
          const active = groupBy === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onGroupByChange(key)}
              className={`rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition-colors ${
                active
                  ? "bg-[#1db954]/15 text-[#1db954] ring-1 ring-[#1db954]/35"
                  : "bg-white/[0.04] text-zinc-400 hover:bg-white/[0.07] hover:text-zinc-200"
              }`}
              aria-pressed={active}
            >
              {ORG_GROUP_LABELS[key]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
