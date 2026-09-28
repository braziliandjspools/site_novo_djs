import type { PreviewTrack } from "../../lib/google-drive";

export function playerTrackCoverUrl(
  track: Pick<PreviewTrack, "id" | "modifiedAt">,
  missingCover: "placeholder" | "404" = "placeholder",
) {
  const params = new URLSearchParams();
  if (track.modifiedAt) params.set("m", track.modifiedAt);
  if (missingCover === "404") params.set("fallback", "404");
  const query = params.toString();
  return `/api/musicas/player-cover/${encodeURIComponent(track.id)}${query ? `?${query}` : ""}`;
}
