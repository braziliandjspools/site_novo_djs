/**
 * Destaque de pasta atualizada: permanece até virar 00:00 (hora local).
 */
export function isUpdatedUntilMidnight(iso?: string | null): boolean {
  if (!iso) return false;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return false;
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

/** Ms até o próximo 00:00 local (para reavaliar destaque). */
export function msUntilNextLocalMidnight(): number {
  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 50);
  return Math.max(1_000, next.getTime() - now.getTime());
}
