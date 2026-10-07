/**
 * Banners promocionais por pasta de mês em /musicas/atualizacoes/...
 * Chaves: path relativo (`2025/janeiro-2025`) e/ou slug do mês (`janeiro-2025`).
 */
const ATUALIZACOES_MONTH_BANNERS: Record<string, string> = {
  "2026/outubro-2026":
    "https://pub-169b30d0b1454cd1abcbcc7f2a4d3a5f.r2.dev/banners/ad9b2b18-0544-44ae-993e-a14228615d7b.png",
  "2025/janeiro-2025":
    "https://pub-169b30d0b1454cd1abcbcc7f2a4d3a5f.r2.dev/banners/b550ccd7-f203-4f50-b0c8-20d19a28bba1.png",
  "janeiro-2025":
    "https://pub-169b30d0b1454cd1abcbcc7f2a4d3a5f.r2.dev/banners/b550ccd7-f203-4f50-b0c8-20d19a28bba1.png",
};

export function resolveAtualizacoesMonthBanner(slugSegments: string[]): string | null {
  const clean = slugSegments.map((part) => decodeURIComponent(part).trim()).filter(Boolean);
  if (clean.length === 0) return null;

  const pathKey = clean.join("/").toLowerCase();
  if (ATUALIZACOES_MONTH_BANNERS[pathKey]) return ATUALIZACOES_MONTH_BANNERS[pathKey];

  const monthSlug = clean[clean.length - 1]?.toLowerCase() ?? "";
  if (monthSlug && ATUALIZACOES_MONTH_BANNERS[monthSlug]) {
    return ATUALIZACOES_MONTH_BANNERS[monthSlug];
  }

  // Path ano/mês: tenta só o mês quando o ano muda de formato.
  if (clean.length >= 2) {
    const yearMonth = `${clean[clean.length - 2]}/${clean[clean.length - 1]}`.toLowerCase();
    if (ATUALIZACOES_MONTH_BANNERS[yearMonth]) return ATUALIZACOES_MONTH_BANNERS[yearMonth];
  }

  return null;
}
