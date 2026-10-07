import Image from "next/image";

type AtualizacoesFolderBannerProps = {
  title: string;
  trackCount: number;
  hasMore?: boolean;
  imageUrl?: string | null;
  belowImageUrl?: string | null;
};

/** Banner full-bleed antes de “Faixas da pasta” nas pastas de mês. */
export function AtualizacoesFolderBanner({
  title,
  trackCount,
  hasMore = false,
  imageUrl,
  belowImageUrl,
}: AtualizacoesFolderBannerProps) {
  const countLabel = `${trackCount.toLocaleString("pt-BR")}${hasMore ? "+" : ""} ${
    trackCount === 1 ? "faixa" : "faixas"
  }`;

  if (imageUrl?.trim()) {
    return (
      <div className="relative mb-1 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#141414]">
        <Image
          src={imageUrl.trim()}
          alt={title}
          width={1600}
          height={420}
          priority
          unoptimized
          className="h-auto w-full object-cover object-center"
        />
      </div>
    );
  }

  return (
    <div className="relative mb-1 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0a0c10]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_12%_20%,rgba(96,205,255,0.22),transparent_42%),radial-gradient(ellipse_at_88%_80%,rgba(0,39,118,0.35),transparent_48%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#60cdff]/50 to-transparent" />
      <div className="relative flex min-h-[140px] flex-col justify-end px-5 py-6 sm:min-h-[168px] sm:px-8 sm:py-8">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#60cdff]">Atualizações</p>
        <h2 className="mt-2 font-display text-3xl font-extrabold uppercase tracking-tight text-white sm:text-5xl">
          {title}
        </h2>
        <p className="mt-2 text-sm font-semibold tabular-nums text-white/65 sm:text-base">{countLabel}</p>
      </div>
      {belowImageUrl?.trim() ? (
        <div className="relative overflow-hidden border-t border-white/[0.08] bg-[#141414]">
          <Image
            src={belowImageUrl.trim()}
            alt="Banner Brazilian Remix Service"
            width={1600}
            height={500}
            sizes="100vw"
            unoptimized
            className="block h-auto w-full object-contain"
          />
        </div>
      ) : null}
    </div>
  );
}
