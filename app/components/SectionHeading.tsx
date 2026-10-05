type SectionHeadingProps = {
  badge?: string;
  title: string;
  subtitle?: string;
  centered?: boolean;
};

export function SectionHeading({ badge, title, subtitle, centered = true }: SectionHeadingProps) {
  const align = centered ? "text-center" : "text-center md:text-left";
  const stripeAlign = centered ? "justify-center" : "justify-center md:justify-start";

  return (
    <div className={`mx-auto max-w-3xl ${align}`}>
      {badge && (
        <span className="mb-2 inline-flex max-w-full items-center gap-2 rounded-full border border-[#009739]/40 bg-[#009739]/10 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-[#00B347] sm:px-4 sm:text-xs sm:tracking-widest">
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
      <h2 className="break-words font-display text-2xl font-semibold text-white sm:text-3xl md:text-4xl">{title}</h2>
      {subtitle && <p className="mt-3 text-base leading-relaxed text-gray-400">{subtitle}</p>}
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
