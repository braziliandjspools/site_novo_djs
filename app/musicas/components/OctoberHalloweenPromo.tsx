import Link from "next/link";
import { ArrowRight, Ghost, Mic2, MonitorDown, RefreshCw } from "lucide-react";

export function OctoberHalloweenPromo({ updatesHref = "/musicas/atualizacoes" }: { updatesHref?: string }) {
  const actions = [
    {
      href: updatesHref,
      title: "Atualizações",
      description: "Explore as faixas do acervo BRS.",
      Icon: RefreshCw,
    },
    {
      href: "/musicas/artistas",
      title: "Artistas",
      description: "Encontre faixas pelo catálogo.",
      Icon: Mic2,
    },
    {
      href: "/como-baixar",
      title: "Downloads organizados",
      description: "Veja como usar o BRS Downloader.",
      Icon: MonitorDown,
    },
  ];

  return (
    <section
      aria-labelledby="october-halloween-title"
      className="relative isolate overflow-hidden rounded-2xl border border-orange-300/20 bg-gradient-to-br from-[#21130f] via-[#151217] to-[#101318] p-4 shadow-[0_18px_50px_rgba(0,0,0,0.3)] sm:p-6"
    >
      <div className="pointer-events-none absolute -right-16 -top-24 -z-10 h-64 w-64 rounded-full bg-orange-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 left-1/3 -z-10 h-52 w-52 rounded-full bg-violet-500/[0.08] blur-3xl" />
      <div className="relative flex flex-col gap-5">
        <div className="flex items-start gap-3 sm:items-center sm:gap-4">
          <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border border-orange-300/25 bg-orange-400/10 text-orange-200 shadow-[0_0_28px_rgba(249,115,22,0.12)] sm:h-14 sm:w-14">
            <Ghost className="h-6 w-6 sm:h-7 sm:w-7" aria-hidden />
          </span>
          <div className="min-w-0">
            <span className="inline-flex rounded-full border border-orange-300/25 bg-orange-400/10 px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[0.17em] text-orange-100 sm:text-[10px]">
              Outubro · Especial de Halloween
            </span>
            <h2 id="october-halloween-title" className="mt-2 text-xl font-extrabold leading-tight tracking-tight text-white sm:text-2xl">
              Outubro chegou. Prepare um set de arrepiar.
            </h2>
            <p className="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-white/65 sm:text-sm">
              Entre no clima de Halloween: explore o acervo, encontre seus artistas e organize as faixas para a próxima noite.
            </p>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-3">
          {actions.map(({ href, title, description, Icon }) => (
            <Link
              key={href}
              href={href}
              prefetch={false}
              className="group flex min-h-[76px] items-center gap-3 rounded-xl border border-white/[0.09] bg-black/25 p-3 transition hover:border-orange-300/30 hover:bg-orange-400/[0.06]"
            >
              <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-[#60cdff]/20 bg-[#60cdff]/[0.08] text-[#8ad4ff]">
                <Icon className="h-4 w-4" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-bold text-white">{title}</span>
                <span className="mt-0.5 block text-[11px] leading-snug text-white/50">{description}</span>
              </span>
              <ArrowRight className="h-4 w-4 flex-shrink-0 text-white/35 transition group-hover:translate-x-0.5 group-hover:text-orange-200" aria-hidden />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
