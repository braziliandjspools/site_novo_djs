/**
 * Nome de estilo só para a tela do BRS.
 * "140 - Deep Dubstep - Grime" vira "140/Deep Dubstep/Grime".
 * O valor original continua no Drive, nos filtros e nas tags.
 */
export function formatStyleNameForDisplay(styleName: string | null | undefined): string {
  const value = styleName?.trim() ?? "";
  if (!value || value.includes("/")) return value;
  if (!value.includes(" - ")) return value;
  return value
    .split(" - ")
    .map((part) => part.trim())
    .filter(Boolean)
    .join("/");
}
