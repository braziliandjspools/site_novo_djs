export function catalogMediaUrl(fileId: string | null | undefined) {
  const value = fileId?.trim();
  if (!value) return null;
  if (value.startsWith("http://") || value.startsWith("https://") || value.startsWith("/")) return value;
  if (value.includes("/")) {
    return `/api/r2/${value.split("/").map((part) => encodeURIComponent(part)).join("/")}`;
  }
  return `/api/musicas/cover/${value}`;
}
