export function MusicasPageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="relative mb-8 overflow-hidden rounded-2xl">
      <div className="absolute inset-0 bg-gradient-to-b from-[#1ed760]/25 via-[#152a1c] to-transparent" aria-hidden />
      <div className="relative px-1 py-6 sm:px-2 sm:py-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#1ed760]/90">BRS Music</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl md:text-5xl">{title}</h1>
        {subtitle && <p className="mt-2 max-w-2xl text-sm text-zinc-400 sm:text-base">{subtitle}</p>}
      </div>
    </div>
  );
}
