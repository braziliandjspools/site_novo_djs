import { BrsLogo } from "./BrsLogo";
import { whatsappUrl } from "../lib/site";
import { SITE_NAME } from "../lib/branding";
import { DEEMIX_ENABLED } from "../lib/feature-flags";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-white/10 bg-[#181818] px-4 py-10 text-sm text-gray-400 sm:px-6 sm:py-12">
      <div className="br-stripe-thin mx-auto mb-8 max-w-6xl sm:mb-10" />
      <div className="mx-auto grid max-w-6xl gap-8 text-center sm:grid-cols-3 sm:gap-10 sm:text-left">
        <div className="flex flex-col items-center sm:items-start">
          <BrsLogo href="/" className="h-10 w-auto max-w-[220px] object-contain" />
          <p className="mt-3 max-w-xs text-xs leading-relaxed text-gray-500 sm:max-w-none">
            Pools, curadoria e remix services para DJs. Feito com orgulho no Brasil.
          </p>
        </div>
        <div>
          <h4 className="font-display text-sm tracking-wide text-[#FFDF00]">Plataforma</h4>
          <ul className="mt-3 space-y-2 text-xs">
            <li><a href="/plans" className="transition-colors hover:text-[#1DB954]">Planos</a></li>
            {DEEMIX_ENABLED && (
              <li><a href="/deemix" className="transition-colors hover:text-[#1DB954]">Deemix</a></li>
            )}
            <li><a href="/allavsoft" className="transition-colors hover:text-[#1DB954]">Allavsoft</a></li>
            <li><a href="/musicproducer" className="transition-colors hover:text-[#1DB954]">Music Producer</a></li>
            <li><a href="#acervo" className="transition-colors hover:text-[#1DB954]">Catálogo de Pools</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-display text-sm tracking-wide text-[#FFDF00]">Suporte</h4>
          <ul className="mt-3 space-y-2 text-xs">
            <li>
              <a href={whatsappUrl()} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-[#1DB954]">
                WhatsApp
              </a>
            </li>
            <li><a href="#faq" className="transition-colors hover:text-[#1DB954]">Central de ajuda</a></li>
            <li><a href="/termos" className="transition-colors hover:text-[#1DB954]">Termos de Serviço</a></li>
            <li><a href="/privacidade" className="transition-colors hover:text-[#1DB954]">Política de Privacidade</a></li>
            <li>
              <a href="/privacy/downloader" className="transition-colors hover:text-[#1DB954]">
                Privacidade — Downloader
              </a>
            </li>
            <li>
              <a href="/privacy/cookies" className="transition-colors hover:text-[#1DB954]">
                Política de Cookies
              </a>
            </li>
            <li>
              <a href="/privacy/conduct" className="transition-colors hover:text-[#1DB954]">
                Código de Conduta
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="mx-auto mt-8 flex max-w-6xl flex-col items-center gap-3 border-t border-white/5 pt-6 text-center text-xs text-gray-500 sm:mt-10 sm:flex-row sm:justify-between">
        <p>&copy; {new Date().getFullYear()} {SITE_NAME}. Todos os direitos reservados.</p>
        <p className="flex items-center gap-2 uppercase tracking-wider">
          <span className="inline-block h-2 w-2 rounded-full bg-[#009739]" />
          <span className="inline-block h-2 w-2 rounded-full bg-[#FFDF00]" />
          <span className="inline-block h-2 w-2 rounded-full bg-[#002776]" />
          Brasil
        </p>
      </div>
    </footer>
  );
}
