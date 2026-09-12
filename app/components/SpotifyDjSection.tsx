import Link from "next/link";
import { ExternalLink } from "lucide-react";

const SPOTIFY_ARTIST = {
  id: "5NdJcuUWBt4pNGJC2sI6iZ",
  name: "DJ Jéssika Luana",
  role: "Artista BRS · produção e distribuição digital",
  spotifyUrl:
    "https://open.spotify.com/intl-pt/artist/5NdJcuUWBt4pNGJC2sI6iZ?si=ui3o38SXS2ay6EaEPIFzxQ",
  embedArtist:
    "https://open.spotify.com/embed/artist/5NdJcuUWBt4pNGJC2sI6iZ?utm_source=generator&theme=0",
};

function SpotifyMark({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.584 17.24c-.228.373-.714.49-1.087.262-2.982-1.821-6.737-2.234-11.153-1.22-.426.097-.852-.168-.949-.594-.097-.426.168-.852.594-.949 4.846-1.102 8.978-.642 12.273 1.375.373.228.49.714.262 1.087zm1.474-3.274c-.286.465-.892.611-1.357.325-3.406-2.093-8.601-2.7-12.634-1.478-.524.16-1.078-.136-1.238-.66-.16-.524.136-1.078.66-1.238 4.585-1.393 10.319-.715 14.206 1.621.465.286.611.892.325 1.357zm.126-3.405C14.692 8.95 8.47 8.306 4.911 9.739c-.628.24-1.334-.072-1.574-.7-.24-.628.072-1.334.7-1.574 4.073-1.553 10.886-.82 14.996 1.621.566.345.746 1.086.401 1.652-.345.566-1.086.746-1.652.401z" />
    </svg>
  );
}

/** Seção Spotify da DJ BRS — sem banner, player mais compacto. */
export function SpotifyDjSection() {
  return (
    <section id="spotify" className="border-y border-white/5 bg-[#0a0a0a] py-12 sm:py-16 md:py-20">
      <div className="mx-auto w-full max-w-3xl px-4 sm:px-6">
        <div className="mb-2 flex justify-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#1DB954]/45 bg-[#1DB954]/12 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-[#1DB954]">
            <SpotifyMark className="h-3.5 w-3.5" />
            Spotify
          </span>
        </div>
        <div className="mb-4 flex justify-center gap-1">
          <span className="h-1 w-8 rounded-full bg-[#1DB954]" />
          <span className="h-1 w-8 rounded-full bg-[#FF4FD8]" />
          <span className="h-1 w-8 rounded-full bg-white/30" />
        </div>
        <h2 className="font-display text-center text-2xl font-semibold text-white sm:text-3xl md:text-4xl">
          Ouça a DJ Jéssika Luana
        </h2>
        <p className="mx-auto mt-2 max-w-lg text-center text-sm leading-relaxed text-zinc-400">
          Produções lançadas pela BRS — ouça as músicas e acompanhe a artista no Spotify.
        </p>

        <div className="mt-5 flex flex-col items-center gap-2 sm:mt-6 sm:flex-row sm:justify-center sm:gap-4">
          <a
            href={SPOTIFY_ARTIST.spotifyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full max-w-xs items-center justify-center gap-2 rounded-full bg-[#1DB954] px-5 py-2.5 text-sm font-bold text-black transition hover:scale-[1.02] hover:bg-[#1ed760] sm:w-auto"
          >
            <SpotifyMark className="h-4 w-4" />
            Abrir no Spotify
            <ExternalLink className="h-3.5 w-3.5 opacity-70" />
          </a>
          <p className="text-center text-[11px] text-zinc-500 sm:text-left">{SPOTIFY_ARTIST.role}</p>
        </div>

        <div className="mx-auto mt-5 overflow-hidden rounded-2xl border border-white/10 bg-[#121212] sm:mt-6">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 px-3 py-2 sm:px-4">
            <p className="text-xs font-semibold text-white">Músicas no Spotify</p>
            <span className="inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-[#1DB954]">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#1DB954]" />
              Ao vivo
            </span>
          </div>

          <iframe
            title={`Spotify — ${SPOTIFY_ARTIST.name}`}
            src={SPOTIFY_ARTIST.embedArtist}
            width="100%"
            height="352"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            className="block h-[300px] w-full border-0 sm:h-[332px] md:h-[352px]"
          />

          <div className="flex flex-col gap-2.5 border-t border-white/5 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:px-4">
            <p className="text-[11px] text-zinc-500">Toque as faixas no player. No celular abre o app se instalado.</p>
            <Link
              href="/musicproducer"
              className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/[0.04] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-200 transition hover:border-[#1DB954]/40 hover:text-white"
            >
              Quero minha música no Spotify
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
