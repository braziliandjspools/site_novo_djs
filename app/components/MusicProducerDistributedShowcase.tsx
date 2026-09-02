import { SiteImage } from "./SiteImage";

const SPOTIFY_ARTIST = {
  id: "5NdJcuUWBt4pNGJC2sI6iZ",
  name: "DJ Jéssika Luana",
  role: "Artista lançada pela nossa equipe",
  spotifyUrl: "https://open.spotify.com/intl-pt/artist/5NdJcuUWBt4pNGJC2sI6iZ",
  embedUrl: "https://open.spotify.com/embed/artist/5NdJcuUWBt4pNGJC2sI6iZ?utm_source=generator&theme=0",
  imageUrl: "https://image-cdn-ak.spotifycdn.com/image/ab67616100005174ecae817f54222cbd8f601e83",
};

function SpotifyMark({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.584 17.24c-.228.373-.714.49-1.087.262-2.982-1.821-6.737-2.234-11.153-1.22-.426.097-.852-.168-.949-.594-.097-.426.168-.852.594-.949 4.846-1.102 8.978-.642 12.273 1.375.373.228.49.714.262 1.087zm1.474-3.274c-.286.465-.892.611-1.357.325-3.406-2.093-8.601-2.7-12.634-1.478-.524.16-1.078-.136-1.238-.66-.16-.524.136-1.078.66-1.238 4.585-1.393 10.319-.715 14.206 1.621.465.286.611.892.325 1.357zm.126-3.405C14.692 8.95 8.47 8.306 4.911 9.739c-.628.24-1.334-.072-1.574-.7-.24-.628.072-1.334.7-1.574 4.073-1.553 10.886-.82 14.996 1.621.566.345.746 1.086.401 1.652-.345.566-1.086.746-1.652.401z" />
    </svg>
  );
}

export function MusicProducerDistributedShowcase() {
  return (
    <div className="mx-auto mt-10 max-w-5xl sm:mt-12">
      <div className="mb-5 flex flex-col items-center gap-2 text-center sm:flex-row sm:justify-center sm:gap-3">
        <span className="inline-flex items-center gap-2 rounded-full border border-[#1DB954]/40 bg-[#1DB954]/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-[#1DB954]">
          <SpotifyMark className="h-4 w-4" />
          No Spotify
        </span>
        <p className="text-sm font-semibold text-white">Produções já distribuídas pela nossa equipe</p>
      </div>

      <div className="overflow-hidden rounded-3xl border border-[#1DB954]/25 bg-[#121212] shadow-2xl shadow-[#1DB954]/10">
        <div className="grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
          <div className="relative min-h-[280px] overflow-hidden border-b border-white/5 lg:min-h-[420px] lg:border-b-0 lg:border-r">
            <SiteImage
              src={SPOTIFY_ARTIST.imageUrl}
              alt={SPOTIFY_ARTIST.name}
              fill
              className="object-cover object-top"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-[#121212]/55 to-[#121212]/10" />
            <div className="absolute inset-0 bg-gradient-to-br from-[#1DB954]/20 via-transparent to-[#002776]/20" />

            <div className="relative flex h-full flex-col justify-end p-6 sm:p-8">
              <div className="inline-flex w-fit items-center gap-2 rounded-full bg-black/45 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-[#1DB954] backdrop-blur-md">
                <SpotifyMark className="h-3.5 w-3.5" />
                Artista no Spotify
              </div>
              <h3 className="mt-4 font-display text-3xl tracking-wide text-white sm:text-4xl">{SPOTIFY_ARTIST.name}</h3>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-[#d4d4d4] sm:text-base">
                {SPOTIFY_ARTIST.role}. Ouça abaixo o catálogo publicado com nossa produção e distribuição digital.
              </p>
              <a
                href={SPOTIFY_ARTIST.spotifyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex w-fit items-center gap-2 rounded-full bg-[#1DB954] px-5 py-3 text-sm font-bold text-black transition-all hover:scale-[1.02] hover:bg-[#1ed760]"
              >
                <SpotifyMark className="h-4 w-4" />
                Ouvir no Spotify
              </a>
            </div>
          </div>

          <div className="flex flex-col justify-center bg-[#181818] p-4 sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#727272]">Preview oficial</p>
                <p className="mt-1 text-sm font-semibold text-white">Discografia no Spotify</p>
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1DB954]">
                <span className="h-2 w-2 animate-pulse rounded-full bg-[#1DB954]" />
                Ao vivo
              </span>
            </div>

            <div className="overflow-hidden rounded-2xl border border-white/5 bg-[#282828] shadow-inner">
              <iframe
                title={`Spotify — ${SPOTIFY_ARTIST.name}`}
                src={SPOTIFY_ARTIST.embedUrl}
                width="100%"
                height="352"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
                className="block w-full border-0"
              />
            </div>

            <p className="mt-4 text-center text-xs leading-relaxed text-[#727272] lg:text-left">
              Sua produção também pode seguir esse caminho — da criação à publicação nas principais plataformas digitais.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
