export type SiteFaq = {
  q: string;
  a: string;
};

export const SITE_FAQS: SiteFaq[] = [
  {
    q: "O que é o Brazilian Remix Service?",
    a: "É o acervo VIP para DJs com curadoria brasileira: packs, edits, extended, clean/dirty e materiais organizados por mês, semana e estilo. Inclui plataforma online (/musicas) e o BRS Downloader para Windows.",
  },
  {
    q: "Quanto custa a assinatura VIP?",
    a: "O plano mensal BRS Drive VIP custa R$ 38,00. Há também teste de 3 dias por R$ 1,00, plano de 3 meses e plano anual. Todos via Mercado Pago, com renovação manual.",
  },
  {
    q: "O que está incluso no plano VIP?",
    a: "Acesso ao acervo completo enquanto a assinatura estiver ativa, plataforma VIP no site (ouvir e baixar), BRS Downloader para Windows, organização por pastas e suporte via WhatsApp/Portal.",
  },
  {
    q: "Como acesso o acervo depois de assinar?",
    a: "Entre em /musicas/entrar com o e-mail e senha da conta VIP. Em Atualizações e Coleções você ouve as faixas e envia packs ao Downloader. O Drive também pode ser liberado conforme a assinatura.",
  },
  {
    q: "Como funciona o BRS Downloader?",
    a: "É o app Windows x64 oficial. Faça login com a mesma conta VIP e envie pastas ou faixas da plataforma para a fila de download no PC.",
  },
  {
    q: "Posso ouvir antes de assinar?",
    a: "Você pode navegar pastas e listas sem assinar. Ouvir o áudio completo, baixar e usar a fila do Downloader liberam com o plano VIP ativo.",
  },
  {
    q: "Com que frequência o acervo é atualizado?",
    a: "Novos packs entram regularmente, organizados por mês e semana. Em Atualizações você vê as pastas recentes e o que chegou desde a sua última visita.",
  },
  {
    q: "Como funciona o pagamento?",
    a: "O checkout é processado pelo Mercado Pago (Pix, cartão e demais meios disponíveis). A BRS libera o acesso após a confirmação oficial do pagamento via webhook — não pelo redirect da página.",
  },
  {
    q: "Como falo com o suporte?",
    a: "Use o WhatsApp do site ou o Portal do cliente. Informe e-mail da conta, pasta/mês e nome do arquivo se for problema de faixa ou download.",
  },
];
