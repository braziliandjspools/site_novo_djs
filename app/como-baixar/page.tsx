import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { buildPageMetadata } from "../lib/seo";
import { getDownloaderReleaseManifest } from "../lib/downloader-updates";

export const metadata: Metadata = buildPageMetadata("como-baixar");

const STEPS = [
  {
    n: "01",
    title: "Entre com o plano VIP",
    body: "Navegar no acervo é livre. Ouvir, baixar no navegador e usar o BRS Downloader pedem conta com plano VIP ativo. No topo de Atualizações, use Entrar ou Assinar VIP.",
    image: "/images/tutorial/entrar-vip.png",
    alt: "Topo de Atualizações com os botões Entrar e Assinar VIP",
    caption: "Entrar e Assinar VIP ficam no topo da plataforma.",
  },
  {
    n: "02",
    title: "Abra o mês na tabela",
    body: "Vá em Atualizações, abra o pack e depois o mês, por exemplo Setembro 2026. A tabela junta as faixas do mês, com as colunas Pool e Estilo. O botão Sincronizar atualiza a pasta com o Drive.",
    image: "/images/tutorial/tabela-musicas.png",
    alt: "Tabela de Setembro 2026 com a sidebar e as faixas",
    caption: "Mês aberto: breadcrumb, sidebar e tabela de faixas.",
  },
  {
    n: "03",
    title: "Escolha o dia, a pool e o estilo",
    body: "Na barra lateral, Dias lista os blocos do Drive, como 30.09.2026. Ao clicar, o endereço ganha o slug daquele dia. Em seguida, Pools e Estilos filtram a tabela e também entram no link, para você copiar só o que quer.",
    image: "/images/tutorial/sidebar-dias.png",
    alt: "Sidebar com a seção Dias de 30.09.2026 a 01.09.2026",
    caption: "Dias na sidebar. Pools e Estilos ficam logo abaixo.",
  },
] as const;

export default function ComoBaixarPage() {
  const release = getDownloaderReleaseManifest();
  const version = release?.version ?? "1.0.20";
  const downloadUrl =
    release?.downloadUrl ??
    "https://www.brazilianremixservice.com.br/downloads/BRS-Downloader_1.0.20_x64-setup.exe";

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
      <nav className="mb-6 text-xs text-zinc-500" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-white">
          Início
        </Link>
        <span className="mx-2">/</span>
        <span className="text-white">Como baixar</span>
      </nav>

      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#1ed760]">Tutorial</p>
      <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
        Como baixar no site
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-relaxed text-zinc-300 sm:text-lg">
        O acervo VIP se baixa de dois jeitos: faixa a faixa no navegador, ou em lote no BRS Downloader
        para Windows. Os dois usam o mesmo login.
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/musicas/atualizacoes"
          className="inline-flex h-11 items-center rounded-full bg-[#1ed760] px-5 text-sm font-bold text-black"
        >
          Abrir Atualizações
        </Link>
        <a
          href={downloadUrl}
          className="inline-flex h-11 items-center rounded-full border border-white/15 px-5 text-sm font-semibold text-white"
        >
          Baixar o app {version}
        </a>
      </div>

      <ol className="mt-14 space-y-14">
        {STEPS.map((step) => (
          <li key={step.n} className="grid gap-5">
            <div>
              <p className="font-mono text-sm font-bold text-[#1ed760]">{step.n}</p>
              <h2 className="mt-1 text-2xl font-bold text-white">{step.title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-zinc-300 sm:text-base">{step.body}</p>
            </div>
            <figure className="overflow-hidden rounded-2xl border border-white/10 bg-[#101412]">
              <Image
                src={step.image}
                alt={step.alt}
                width={1440}
                height={900}
                className="h-auto w-full"
              />
              <figcaption className="px-4 py-3 text-xs uppercase tracking-[0.12em] text-zinc-500">
                {step.caption}
              </figcaption>
            </figure>
          </li>
        ))}
      </ol>

      <section className="mt-16 rounded-2xl border border-white/10 bg-[#121614] p-6 sm:p-8">
        <h2 className="text-2xl font-bold text-white">Baixar no navegador</h2>
        <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm leading-relaxed text-zinc-300">
          <li>Entre com a conta VIP. Sem o plano, a coluna de download da faixa fica bloqueada.</li>
          <li>Abra o dia na sidebar e, se quiser, marque a pool e o estilo. O link da página já fica filtrado.</li>
          <li>Na linha da música, use a ação de download da coluna Download / ações.</li>
          <li>
            Para várias faixas, clique em Selecionar faixas. O site pergunta qual pool e qual estilo, e marca
            as músicas dessa escolha conforme a tabela carrega.
          </li>
          <li>Use Baixar selecionadas. Acima de muitas faixas, o site sugere o Downloader.</li>
        </ol>
        <p className="mt-4 text-sm leading-relaxed text-zinc-400">
          Marque só o que for usar. Backup do acervo pelo site não é permitido. Um backup completo é pedido
          pelo WhatsApp +55 51 93505-2274.
        </p>
      </section>

      <section className="mt-8 rounded-2xl border border-[#ff2ea6]/30 bg-black p-6 sm:p-8">
        <h2 className="text-2xl font-bold text-white">Baixar no BRS Downloader</h2>
        <p className="mt-3 text-sm leading-relaxed text-zinc-300">
          No Windows, instale a versão {version}. Faça login com a mesma conta do site. Na capa, cole o link
          da pasta, do mês ou do dia. O app abre a escolha em magenta e preto: o dia fica na lateral e, ao
          selecionar, mostra o total de tracks e pools daquele dia. Marque a pool inteira ou só os estilos.
          A fila segue em blocos de 200, com pausa de 8 minutos a cada 600 faixas.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <figure className="overflow-hidden rounded-xl border border-white/10">
            <Image
              src="/images/downloader/brs-downloader-inicio.png"
              alt="Tela inicial do BRS Downloader, com importação por link"
              width={1440}
              height={900}
              className="h-auto w-full"
            />
            <figcaption className="bg-[#0b0b0b] px-3 py-2 text-xs uppercase tracking-[0.12em] text-zinc-500">
              Início · cole o link da pasta
            </figcaption>
          </figure>
          <figure className="overflow-hidden rounded-xl border border-white/10">
            <Image
              src="/images/downloader/brs-downloader-downloads.png"
              alt="Tela de downloads do BRS Downloader"
              width={1440}
              height={900}
              className="h-auto w-full"
            />
            <figcaption className="bg-[#0b0b0b] px-3 py-2 text-xs uppercase tracking-[0.12em] text-zinc-500">
              Downloads · fila e pastas
            </figcaption>
          </figure>
        </div>
        <a
          href={downloadUrl}
          className="mt-6 inline-flex h-11 items-center rounded-full bg-[#ff2ea6] px-5 text-sm font-bold text-black"
        >
          Instalar BRS Downloader {version}
        </a>
      </section>
    </main>
  );
}
