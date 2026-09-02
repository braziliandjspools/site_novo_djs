export function MusicasPageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-8">
      <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl md:text-5xl">{title}</h1>
      {subtitle && <p className="mt-2 max-w-2xl text-sm text-zinc-400 sm:text-base">{subtitle}</p>}
    </div>
  );
}
