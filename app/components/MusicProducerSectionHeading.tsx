type MusicProducerSectionHeadingProps = {
  badge?: string;
  title: string;
  subtitle?: string;
  centered?: boolean;
};

export function MusicProducerSectionHeading({
  badge,
  title,
  subtitle,
  centered = true,
}: MusicProducerSectionHeadingProps) {
  const align = centered ? "text-center" : "text-center md:text-left";
  const stripeAlign = centered ? "justify-center" : "justify-center md:justify-start";

  return (
    <div className={`mx-auto max-w-3xl ${align}`}>
      {badge && (
        <span className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#1DB954]/40 bg-[#1DB954]/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-[#1DB954]">
          {badge}
        </span>
      )}
      {badge && (
        <div className={`mb-4 flex gap-1 ${stripeAlign}`}>
          <span className="h-1 w-8 rounded-full bg-[#009739]" />
          <span className="h-1 w-8 rounded-full bg-[#FFDF00]" />
          <span className="h-1 w-8 rounded-full bg-[#002776]" />
        </div>
      )}
      <h2 className="font-display text-2xl tracking-wide text-white sm:text-3xl md:text-4xl">{title}</h2>
      {subtitle && <p className="mt-3 text-sm leading-relaxed text-[#b3b3b3] sm:text-base">{subtitle}</p>}
      {!badge && (
        <div className={`mt-5 flex gap-1 ${stripeAlign}`}>
          <span className="h-1 w-8 rounded-full bg-[#009739]" />
          <span className="h-1 w-8 rounded-full bg-[#FFDF00]" />
          <span className="h-1 w-8 rounded-full bg-[#002776]" />
        </div>
      )}
    </div>
  );
}
