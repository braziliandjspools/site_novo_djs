export function toDirectMediaUrl(url: string) {
  const trimmed = url.trim();
  const driveMatch = trimmed.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (driveMatch) {
    return `https://drive.usercontent.google.com/download?id=${driveMatch[1]}&export=download&confirm=t`;
  }
  return trimmed;
}

export function deliveryMediaFilename(title: string) {
  const safe = title
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);

  return `${safe || "faixa"}.mp3`;
}

export async function fetchDeliveryMediaUpstream(downloadUrl: string) {
  const upstream = await fetch(toDirectMediaUrl(downloadUrl), {
    redirect: "follow",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
  });

  if (!upstream.ok || !upstream.body) {
    return { error: "Áudio indisponível.", status: upstream.status } as const;
  }

  const contentType = upstream.headers.get("Content-Type") ?? "";
  if (contentType.includes("text/html")) {
    return {
      error: "Link de áudio inválido. Use um link direto ou do Google Drive.",
      status: 502,
    } as const;
  }

  return {
    body: upstream.body,
    contentType: contentType.startsWith("audio/") ? contentType : "audio/mpeg",
    contentLength: upstream.headers.get("Content-Length"),
  } as const;
}
