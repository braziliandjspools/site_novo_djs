/** Agrupamento de arquivos de um pack/pasta para compactação ZIP pós-download. */

export type ZipPackFile = {
  jobId: number;
  absolutePath: string;
  archivePath: string;
};

export type ZipPackPlan = {
  packKey: string;
  zipName: string;
  files: ZipPackFile[];
};

const INVALID_WIN_CHARS = /[<>:"/\\|?*\u0000]/g;

export function sanitizeZipBaseName(name: string): string {
  const trimmed = name.trim().replace(/[.\s]+$/g, "");
  const clean = trimmed.replace(INVALID_WIN_CHARS, "").trim().replace(/[.\s]+$/g, "");
  if (!clean) return "Downloads";
  if (clean.length > 120) return [...clean].slice(0, 120).join("");
  return clean;
}

export function splitRelativePath(relativePath: string | null | undefined): string[] {
  if (!relativePath?.trim()) return [];
  return relativePath
    .split(/[/\\]+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

/**
 * Chave do pack = 1º segmento do relativePath (ex.: "Julho 2026/...").
 * Sem pasta: usa o nome do arquivo (sem extensão) para ZIP individual.
 */
export function resolvePackKey(relativePath: string | null | undefined, fileName: string): string {
  const segments = splitRelativePath(relativePath);
  if (segments.length >= 2) return segments[0]!;
  if (segments.length === 1) {
    const only = segments[0]!;
    if (/\.[a-z0-9]{2,5}$/i.test(only)) {
      return stripExtension(only);
    }
    return only;
  }
  return stripExtension(fileName) || "Downloads";
}

export function stripExtension(name: string): string {
  const idx = name.lastIndexOf(".");
  if (idx <= 0) return name.trim();
  return name.slice(0, idx).trim() || name.trim();
}

/**
 * Caminho dentro do ZIP relativo à pasta do pack (sem o 1º segmento).
 * Usa o basename real do arquivo baixado (respeita renomeações).
 */
export function resolveArchivePath(
  relativePath: string | null | undefined,
  absolutePath: string,
  fileName: string,
): string {
  const basename = basenameFromPath(absolutePath) || fileName;
  const segments = splitRelativePath(relativePath);
  if (segments.length >= 2) {
    const middle = segments.slice(1, -1);
    return [...middle, basename].join("/");
  }
  return basename;
}

export function basenameFromPath(path: string): string {
  const normalized = path.replace(/\\/g, "/");
  const parts = normalized.split("/").filter(Boolean);
  return parts[parts.length - 1] ?? "";
}

export function isTemporaryZipNoise(fileName: string): boolean {
  const lower = fileName.toLowerCase();
  return (
    lower.endsWith(".part") ||
    lower.endsWith(".brs-zip.tmp") ||
    lower === ".brs-download-index.json"
  );
}

/** Jobs ainda em andamento para o mesmo pack — a compactação deve esperar. */
export function packStillHasActiveJobs(
  packKey: string,
  jobs: Iterable<{ relativePath: string | null; fileName: string; status: string }>,
): boolean {
  const active = new Set(["PENDING", "RECEIVED", "DOWNLOADING", "PAUSED", "FAILED"]);
  for (const job of jobs) {
    if (!active.has(job.status)) continue;
    if (resolvePackKey(job.relativePath, job.fileName) === packKey) return true;
  }
  return false;
}

export function buildZipPlan(
  packKey: string,
  files: ZipPackFile[],
): ZipPackPlan | null {
  const unique = new Map<string, ZipPackFile>();
  for (const file of files) {
    if (isTemporaryZipNoise(basenameFromPath(file.absolutePath))) continue;
    if (file.archivePath.toLowerCase().endsWith(".part")) continue;
    if (file.archivePath.toLowerCase().endsWith(".zip")) continue;
    unique.set(file.absolutePath.replace(/\\/g, "/").toLowerCase(), file);
  }
  const list = Array.from(unique.values());
  if (list.length === 0) return null;
  return {
    packKey,
    zipName: sanitizeZipBaseName(packKey),
    files: list,
  };
}
