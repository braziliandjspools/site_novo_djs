import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import { SiteImage } from "./SiteImage";
type ToolPromoSectionProps = {
  id?: string;
  badge: string;
  title: string;
  description: ReactNode;
  image: string;
  imageAlt: string;
  href: string;
  buttonLabel: string;
  accent?: "green" | "yellow" | "blue";
  imageMaxWidth?: string;
  descriptionClassName?: string;
};
const accentStyles = {
  green: {
    badge: "border-[#009739]/40 bg-[#009739]/15 text-[#00B347]",
    button: "bg-[#009739] hover:bg-[#00B347] shadow-[#009739]/30",
    ring: "border-[#009739]/30",
  },
  yellow: {
    badge: "border-[#FFDF00]/40 bg-[#FFDF00]/10 text-[#FFDF00]",
    button: "bg-[#FFDF00] hover:bg-[#FFE566] text-[#002776] shadow-[#FFDF00]/20",
    ring: "border-[#FFDF00]/30",
  },
  blue: {
    badge: "border-[#6B9FFF]/40 bg-[#002776]/30 text-[#6B9FFF]",
    button: "bg-[#002776] hover:bg-[#1A3D8F] border border-[#6B9FFF]/40 shadow-[#002776]/40",
    ring: "border-[#6B9FFF]/30",
  },
};

export function ToolPromoSection({
  id,
  badge,
  title,
  description,
  image,
  imageAlt,
  href,
  buttonLabel,
  accent = "green",
  imageMaxWidth = "max-w-3xl",
  descriptionClassName = "",
}: ToolPromoSectionProps) {  const styles = accentStyles[accent];

  return (
    <section
      id={id}
      className="relative flex min-h-0 flex-col overflow-hidden border-y border-[#002776]/40 bg-[#121212] md:min-h-[100svh]"
    >
      <div className="br-stripe" />

      <div className="relative flex flex-1 items-start justify-center overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(255,255,255,0.04)_0%,_transparent_70%)]" />

        <div className="relative z-10 mx-auto w-full max-w-4xl px-4 pb-12 pt-6 text-center sm:px-6 md:pb-20 md:pt-10">
          <span
            className={`mb-2 inline-flex rounded-full border px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest ${styles.badge}`}
          >
            {badge}
          </span>

          <div className="mb-4 flex justify-center gap-1">
            <span className="h-1 w-8 rounded-full bg-[#009739]" />
            <span className="h-1 w-8 rounded-full bg-[#FFDF00]" />
            <span className="h-1 w-8 rounded-full bg-[#002776]" />
          </div>

          <h2 className="font-display text-3xl leading-tight tracking-wide text-white sm:text-4xl md:text-5xl lg:text-6xl">
            {title}
          </h2>

          <div
            className={`mx-auto mt-4 max-w-2xl space-y-4 text-base leading-relaxed text-gray-400 md:text-lg ${descriptionClassName}`}
          >
            {description}
          </div>

          <div
            className={`relative mx-auto mt-8 overflow-hidden rounded-2xl border ${styles.ring} bg-[#1a1a1a] p-2 shadow-2xl shadow-black/50 ${imageMaxWidth}`}
          >
            <SiteImage
              src={image}
              alt={imageAlt}
              width={1200}
              height={675}
              className="h-auto w-full rounded-xl object-contain"
              sizes="(max-width: 768px) 100vw, (max-width: 1280px) 80vw, 896px"
              quality={82}
            />
          </div>
          <Link
            href={href}
            className={`mt-8 inline-flex items-center gap-2 rounded-full px-8 py-3.5 text-sm font-bold uppercase tracking-wide text-white shadow-lg transition-all hover:scale-105 ${styles.button}`}
          >
            {buttonLabel}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="br-stripe" />
    </section>
  );
}
