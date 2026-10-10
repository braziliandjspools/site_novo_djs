import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  CircleAlert,
  Copy,
  FolderTree,
  Music2,
  ShieldCheck,
  Sparkles,
  Terminal,
} from "lucide-react";
import { buildPageMetadata } from "../lib/seo";

export const metadata: Metadata = buildPageMetadata("tutoriais");

const geminiPrompt = `Tenho uma pasta de arquivos MP3 de coletâneas dos anos 2000, como Summer Eletro Hits. Alguns arquivos têm só o título, por exemplo "Bad Romance (Remix).mp3", sem o artista.

Crie um script PowerShell para Windows que:
1. Leia somente arquivos MP3 de uma pasta que eu indicar.
2. Use regras explícitas de título, artista e estilo que eu possa revisar e editar. Não invente artistas quando não tiver certeza; deixe esses arquivos sem alteração e mostre um aviso.
3. Adicione "Artista - " no começo do nome sem repetir o artista se ele já estiver no arquivo.
4. Crie uma subpasta para o estilo musical e mova a faixa para ela.
5. Use -LiteralPath nas operações com caminhos para tratar nomes com colchetes, como "[Clean]".
6. Não sobrescreva arquivos existentes e comece em modo de simulação, sem alterar nenhum arquivo.

Explique como testar o resultado e como ativar as alterações reais só depois que eu conferir a simulação. Inclua comentários no código e deixe as pastas de origem e destino fáceis de editar.`;

const powershellExample = String.raw`# Ajuste as pastas antes de executar.
$origem = Join-Path $env:USERPROFILE "Music\Summer Eletro Hits"
$destino = Join-Path $env:USERPROFILE "Music\Organizadas"
$modoTeste = $true # Confira a simulação; só depois altere para $false.

$arquivos = Get-ChildItem -LiteralPath $origem -Filter "*.mp3" -File

foreach ($arquivo in $arquivos) {
    $nome = $arquivo.BaseName
    $artista = $null
    $estilo = $null

    # Acrescente regras revisadas por você. Não reconhecidos serão ignorados.
    if ($nome -match "Bad Romance") {
        $artista = "Lady Gaga"
        $estilo = "Pop"
    }
    elseif ($nome -match "Poker Face") {
        $artista = "Lady Gaga"
        $estilo = "Pop"
    }

    if (-not $artista -or -not $estilo) {
        Write-Warning "Sem regra confirmada; mantido sem alteração: $($arquivo.Name)"
        continue
    }

    $prefixoArtista = "^\s*" + [regex]::Escape($artista) + "\s+-"
    if ($nome -match $prefixoArtista) {
        $nomeFinal = $arquivo.Name
    }
    else {
        $nomeFinal = "$artista - $nome$($arquivo.Extension)"
    }

    $pastaEstilo = Join-Path $destino $estilo
    $caminhoFinal = Join-Path $pastaEstilo $nomeFinal

    if (Test-Path -LiteralPath $caminhoFinal) {
        Write-Warning "Destino já existe; nada foi sobrescrito: $caminhoFinal"
        continue
    }

    $caminhoRenomeado = Join-Path $arquivo.DirectoryName $nomeFinal
    if ($modoTeste) {
        Write-Host "[SIMULAÇÃO] $($arquivo.Name) -> $estilo\$nomeFinal"
        continue
    }

    # Cria a pasta sem interpretar caracteres do caminho como curingas.
    [System.IO.Directory]::CreateDirectory($pastaEstilo) | Out-Null

    if ($arquivo.Name -ne $nomeFinal) {
        Rename-Item -LiteralPath $arquivo.FullName -NewName $nomeFinal
    }

    # -LiteralPath trata [Clean] como parte do nome, e não como padrão curinga.
    Move-Item -LiteralPath $caminhoRenomeado -Destination $pastaEstilo
    Write-Host "Organizado: $estilo\$nomeFinal"
}`;

const promptLines = geminiPrompt.split("\n");
const scriptLines = powershellExample.split("\n");

function CodePanel({
  language,
  title,
  lines,
}: {
  language: string;
  title: string;
  lines: string[];
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#080b10] shadow-[0_18px_50px_rgba(0,0,0,0.3)]">
      <div className="flex items-center justify-between gap-3 border-b border-white/[0.07] bg-white/[0.025] px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex gap-1.5" aria-hidden="true">
            <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
          </span>
          <span className="truncate text-xs font-semibold text-white/75">{title}</span>
        </div>
        <span className="shrink-0 rounded-md border border-white/10 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-[#8ad4ff]">
          {language}
        </span>
      </div>
      <pre className="max-h-[34rem] overflow-x-auto p-4 text-[12px] leading-6 text-slate-200 sm:p-5 sm:text-[13px]">
        <code className="font-mono">{lines.join("\n")}</code>
      </pre>
    </div>
  );
}

function StepHeader({
  number,
  title,
  icon: Icon,
}: {
  number: string;
  title: string;
  icon: typeof Sparkles;
}) {
  return (
    <div className="mb-5 flex items-start gap-4">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#60cdff]/25 bg-[#60cdff]/10 font-mono text-sm font-bold text-[#8ad4ff]">
        {number}
      </span>
      <div className="min-w-0">
        <div className="mb-1 flex items-center gap-2 text-[#8ad4ff]">
          <Icon className="h-4 w-4" aria-hidden="true" />
          <span className="text-[10px] font-bold uppercase tracking-[0.18em]">Etapa {number}</span>
        </div>
        <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">{title}</h2>
      </div>
    </div>
  );
}

export default function TutoriaisPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#090b0f] text-white">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(96,205,255,0.12),transparent_36%),radial-gradient(ellipse_at_85%_25%,rgba(0,39,118,0.16),transparent_34%)]"
        aria-hidden="true"
      />

      <div className="relative mx-auto w-full max-w-5xl px-4 pb-20 pt-8 sm:px-6 sm:pt-12 lg:px-8">
        <Link
          href="/"
          className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/10 bg-white/[0.035] px-4 text-xs font-semibold text-white/65 transition hover:border-[#60cdff]/35 hover:bg-[#60cdff]/[0.07] hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Voltar ao início
        </Link>

        <header className="mt-8 overflow-hidden rounded-[28px] border border-white/[0.09] bg-[#11161c]/90 p-6 shadow-[0_28px_80px_rgba(0,0,0,0.34)] sm:mt-10 sm:p-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#60cdff]/25 bg-[#60cdff]/[0.08] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#8ad4ff]">
            <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
            Ferramentas para DJs
          </div>
          <h1 className="mt-5 max-w-3xl font-display text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Área de Tutoriais
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/65 sm:text-lg">
            Aprenda a simplificar tarefas repetitivas e deixar sua biblioteca pronta para encontrar,
            organizar e tocar cada faixa com mais agilidade.
          </p>
          <div className="mt-7 flex flex-wrap gap-2 text-xs font-medium text-white/65">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-2">
              <Sparkles className="h-3.5 w-3.5 text-[#8ad4ff]" aria-hidden="true" />
              Inteligência artificial
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-2">
              <Terminal className="h-3.5 w-3.5 text-[#8ad4ff]" aria-hidden="true" />
              PowerShell no Windows
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-2">
              <FolderTree className="h-3.5 w-3.5 text-[#8ad4ff]" aria-hidden="true" />
              Organização de MP3
            </span>
          </div>
        </header>

        <article className="mx-auto mt-8 max-w-4xl space-y-5 sm:mt-10 sm:space-y-6">
          <section className="rounded-2xl border border-white/[0.08] bg-[#111418] p-5 sm:p-7">
            <div className="mb-4 flex items-center gap-2 text-[#8ad4ff]">
              <Music2 className="h-4 w-4" aria-hidden="true" />
              <span className="text-[10px] font-bold uppercase tracking-[0.18em]">Tutorial principal</span>
            </div>
            <h2 className="max-w-3xl text-2xl font-bold leading-tight tracking-tight text-white sm:text-3xl">
              Organização Automática de Músicas com Inteligência Artificial (Gemini + PowerShell)
            </h2>
            <p className="mt-4 text-sm leading-7 text-white/65 sm:text-base">
              Quem baixa coletâneas dos anos 2000, como <em className="text-white/85">Summer Eletro Hits</em>,
              conhece a situação: várias faixas ficam misturadas na mesma pasta e algumas vêm sem o artista no
              nome. Em vez de <code className="rounded bg-white/[0.07] px-1.5 py-0.5 font-mono text-[0.9em] text-[#b8eaff]">Lady Gaga - Bad Romance (Remix).mp3</code>,
              aparece apenas <code className="rounded bg-white/[0.07] px-1.5 py-0.5 font-mono text-[0.9em] text-[#b8eaff]">Bad Romance (Remix).mp3</code>.
            </p>
            <p className="mt-3 text-sm leading-7 text-white/65 sm:text-base">
              Com uma lista de regras revisada no Gemini e um script PowerShell, você pode completar nomes
              conhecidos e separar as faixas em pastas de estilo. O script não adivinha: músicas sem uma regra
              confirmada são sinalizadas e ficam como estão.
            </p>
          </section>

          <section id="pedir-ajuda-ao-gemini" className="scroll-mt-24 rounded-2xl border border-white/[0.08] bg-[#111418] p-5 sm:p-7">
            <StepHeader number="01" title="Peça ajuda ao Google Gemini" icon={Sparkles} />
            <div className="space-y-3 text-sm leading-7 text-white/65 sm:text-base">
              <p>
                Abra o Gemini e descreva o problema, os nomes de arquivo que você encontra e como quer organizar
                o resultado. Peça regras explícitas, uma etapa de simulação e proteção contra arquivos repetidos.
                Se possível, cole uma amostra dos nomes da sua pasta para a IA sugerir correspondências que você
                possa conferir.
              </p>
              <p>
                Use este prompt como ponto de partida. Troque as pastas e acrescente apenas músicas e estilos
                que você reconheceu:
              </p>
            </div>
            <div className="mt-5">
              <CodePanel language="Prompt" title="Pedido para o Gemini" lines={promptLines} />
            </div>
            <div className="mt-4 flex gap-3 rounded-xl border border-[#60cdff]/15 bg-[#60cdff]/[0.045] p-4 text-xs leading-6 text-white/65 sm:text-sm">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#8ad4ff]" aria-hidden="true" />
              <p>
                Revise cada associação artista/título. Uma regra errada pode renomear uma faixa corretamente
                identificada com o artista errado; por isso, a simulação vem antes de qualquer alteração.
              </p>
            </div>
          </section>

          <section id="magica-do-codigo" className="scroll-mt-24 rounded-2xl border border-white/[0.08] bg-[#111418] p-5 sm:p-7">
            <StepHeader number="02" title="A mágica do código" icon={Terminal} />
            <div className="space-y-3 text-sm leading-7 text-white/65 sm:text-base">
              <p>
                A lógica é uma lista de condições: se o nome do arquivo contiver “Bad Romance”, o script associa
                a faixa à Lady Gaga e ao estilo Pop. Depois, monta o nome com o artista no começo e move a música
                para a pasta desse estilo.
              </p>
              <p>
                O exemplo abaixo começa em modo de simulação. Ele imprime o que faria, pula faixas sem regra e
                não sobrescreve um arquivo que já exista no destino.
              </p>
            </div>
            <div className="mt-5">
              <CodePanel language="PowerShell" title="organizar-musicas.ps1" lines={scriptLines} />
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-white/[0.08] bg-black/20 p-4">
                <div className="flex items-center gap-2 text-sm font-bold text-white">
                  <Copy className="h-4 w-4 text-[#8ad4ff]" aria-hidden="true" />
                  Por que usar <code className="font-mono text-[#b8eaff]">-LiteralPath</code>?
                </div>
                <p className="mt-2 text-xs leading-6 text-white/60 sm:text-sm">
                  Sem esse parâmetro, colchetes como os de <code className="font-mono text-white/80">[Clean]</code> podem
                  ser interpretados pelo PowerShell como curingas. <code className="font-mono text-[#b8eaff]">-LiteralPath</code>
                  manda tratar o caminho exatamente como foi escrito.
                </p>
              </div>
              <div className="rounded-xl border border-emerald-400/15 bg-emerald-400/[0.04] p-4">
                <div className="flex items-center gap-2 text-sm font-bold text-white">
                  <ShieldCheck className="h-4 w-4 text-emerald-300" aria-hidden="true" />
                  Simule antes de organizar
                </div>
                <p className="mt-2 text-xs leading-6 text-white/60 sm:text-sm">
                  Confira as linhas <code className="font-mono text-white/80">[SIMULAÇÃO]</code>. Só mude
                  <code className="mx-1 font-mono text-white/80">$modoTeste</code> para
                  <code className="mx-1 font-mono text-white/80">$false</code> depois de revisar a amostra e fazer uma cópia de segurança.
                </p>
              </div>
            </div>
            <div className="mt-4 rounded-xl border border-amber-300/15 bg-amber-300/[0.04] p-4">
              <div className="flex items-start gap-3">
                <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-200" aria-hidden="true" />
                <p className="text-xs leading-6 text-white/65 sm:text-sm">
                  O exemplo usa duas regras para demonstrar a estrutura. Amplie o bloco de condições com a sua
                  lista real e teste primeiro em uma cópia de algumas faixas. Não coloque toda a biblioteca em
                  uma regra genérica.
                </p>
              </div>
            </div>
          </section>

          <section id="executar-no-windows" className="scroll-mt-24 rounded-2xl border border-white/[0.08] bg-[#111418] p-5 sm:p-7">
            <StepHeader number="03" title="Execute no Windows" icon={FolderTree} />
            <ol className="space-y-3">
              {[
                "Faça uma cópia da pasta do pacote e use essa cópia no primeiro teste.",
                "No código, ajuste $origem e $destino para os caminhos corretos. Confira as regras de artista, título e estilo e mantenha $modoTeste = $true.",
                "Copie todo o bloco PowerShell acima e abra o PowerShell ou o Windows Terminal.",
                "Clique com o botão direito dentro da janela para colar o código e pressione Enter. A primeira execução só mostra as linhas [SIMULAÇÃO]; não renomeia nem move arquivos.",
                "Confira os nomes sugeridos e os avisos. Se estiver tudo certo, faça backup, troque $modoTeste = $true por $modoTeste = $false no código, copie e cole o bloco novamente e pressione Enter.",
                "Confira as pastas de estilo criadas no destino. Mantenha a pasta original até confirmar que as faixas foram organizadas corretamente.",
              ].map((step, index) => (
                <li key={step} className="flex gap-3 rounded-xl border border-white/[0.06] bg-black/15 p-3.5 text-sm leading-6 text-white/65 sm:p-4">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#60cdff]/10 font-mono text-xs font-bold text-[#8ad4ff]">
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
            <div className="mt-5 flex gap-3 rounded-xl border border-white/[0.08] bg-white/[0.025] p-4">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" aria-hidden="true" />
              <p className="text-xs leading-6 text-white/60 sm:text-sm">
                Para pastas com centenas de faixas, organize por etapas e mantenha uma cópia original até conferir
                os nomes e as subpastas. Assim você consegue corrigir uma regra sem perder a referência.
              </p>
            </div>
          </section>

          <footer className="flex flex-col gap-4 rounded-2xl border border-[#60cdff]/20 bg-gradient-to-r from-[#60cdff]/[0.08] to-transparent p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div>
              <p className="text-sm font-bold text-white">Biblioteca organizada, set mais rápido.</p>
              <p className="mt-1 text-xs leading-5 text-white/55">
                Explore as atualizações e encontre novas faixas para preparar suas apresentações.
              </p>
            </div>
            <Link
              href="/musicas/atualizacoes"
              className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-[#60cdff] px-5 text-xs font-bold text-[#071018] transition hover:bg-[#a3e4ff]"
            >
              Explorar atualizações
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </footer>
        </article>
      </div>
    </main>
  );
}
