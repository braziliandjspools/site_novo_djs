"use client";

import { useCallback, useState } from "react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { CARD_COLORS, COLOR_CYCLE } from "../lib/theme";

export type Testimonial = {
  name: string;
  role: string;
  quote: string;
};

type TestimonialsCarouselProps = {
  testimonials: Testimonial[];
};

function TestimonialCard({ testimonial, index }: { testimonial: Testimonial; index: number }) {
  const c = CARD_COLORS[COLOR_CYCLE[index % COLOR_CYCLE.length]];

  return (
    <div className={`flex h-full flex-col rounded-2xl border ${c.border} bg-[#282828] p-6 transition-all hover:-translate-y-1 hover:bg-[#333333]`}>
      <div className={`mb-3 flex gap-1 ${c.text}`}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} size={14} fill="currentColor" />
        ))}
      </div>
      <p className="flex-1 text-sm leading-relaxed text-gray-300">&ldquo;{testimonial.quote}&rdquo;</p>
      <div className="mt-5 border-t border-white/10 pt-4">
        <p className="text-sm font-semibold text-white">{testimonial.name}</p>
        <p className="text-xs text-gray-500">{testimonial.role}</p>
      </div>
    </div>
  );
}

export function TestimonialsCarousel({ testimonials }: TestimonialsCarouselProps) {
  const [active, setActive] = useState(0);
  const total = testimonials.length;

  const goTo = useCallback(
    (index: number) => {
      setActive((index + total) % total);
    },
    [total],
  );

  return (
    <>
      {/* Mobile: slide */}
      <div className="md:hidden">
        <div className="relative">
          <TestimonialCard testimonial={testimonials[active]} index={active} />

          {total > 1 && (
            <>
              <button
                type="button"
                onClick={() => goTo(active - 1)}
                aria-label="Depoimento anterior"
                className="absolute -left-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-[#121212]/90 text-white transition-colors hover:border-[#009739]/50 hover:text-[#00B347]"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => goTo(active + 1)}
                aria-label="Próximo depoimento"
                className="absolute -right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-[#121212]/90 text-white transition-colors hover:border-[#009739]/50 hover:text-[#00B347]"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </>
          )}
        </div>

        <div className="mt-5 flex justify-center gap-2">
          {testimonials.map((t, i) => (
            <button
              key={t.name}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Ir para depoimento ${i + 1}`}
              className={`h-2 rounded-full transition-all ${
                i === active ? "w-6 bg-[#009739]" : "w-2 bg-white/20 hover:bg-white/40"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Desktop: grid 2x2 */}
      <div className="hidden gap-6 md:grid md:grid-cols-2">
        {testimonials.map((t, index) => (
          <TestimonialCard key={t.name} testimonial={t} index={index} />
        ))}
      </div>
    </>
  );
}
