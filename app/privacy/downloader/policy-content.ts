/**
 * Seções da Política de Privacidade do Brazilian Packs Downloader.
 * O texto legal integral deve ser o fornecido pelo responsável do produto —
 * não altere sem autorização.
 *
 * IMPORTANTE: o conteúdo abaixo é um esqueleto estrutural aguardando o texto
 * oficial colado pelo usuário. Não inclui CNPJ, endereço ou razão social inventados.
 */

export type PrivacySection = {
  id: string;
  title: string;
  paragraphs: string[];
};

export const DOWNLOADER_PRIVACY_UPDATED_AT = "3 de setembro de 2026";

export const DOWNLOADER_PRIVACY_EMAIL = "brazilianremixservice@gmail.com";

export const DOWNLOADER_PRIVACY_SECTIONS: PrivacySection[] = [
  {
    id: "introducao",
    title: "1. Introdução",
    paragraphs: [
      "Esta Política de Privacidade descreve como o Brazilian Packs Downloader (\"Aplicativo\"), oferecido pela Brazilian Remix Service, trata informações relacionadas ao uso do aplicativo desktop e à fila de downloads sincronizada com a plataforma VIP.",
      "Ao utilizar o Aplicativo, você declara ter lido e compreendido esta Política. Em caso de dúvidas, utilize o canal de contato indicado ao final desta página.",
    ],
  },
  {
    id: "controlador",
    title: "2. Responsável e contato",
    paragraphs: [
      "O tratamento das informações descritas nesta Política é realizado no contexto da Brazilian Remix Service / Brazilian Packs, em conexão com a conta VIP do usuário na plataforma web.",
      `Para assuntos de privacidade relacionados ao Downloader, entre em contato pelo e-mail: ${DOWNLOADER_PRIVACY_EMAIL}.`,
    ],
  },
  {
    id: "dados-coletados",
    title: "3. Dados que podemos tratar",
    paragraphs: [
      "Conta e autenticação: identificadores da sessão VIP (como e-mail e token de acesso) necessários para login e autorização do Aplicativo.",
      "Dispositivo: nome do dispositivo, plataforma (por exemplo, Windows), versão do aplicativo e horário do último contato (heartbeat), para gerenciar a fila e mostrar o status de conexão.",
      "Fila de downloads: identificadores de arquivos, nomes de arquivos, caminhos relativos opcionais, status, progresso e mensagens de erro associadas aos jobs de download.",
      "Preferências locais: pasta de destino, opções de concorrência, comportamento com arquivos existentes e demais configurações salvas no seu computador.",
    ],
  },
  {
    id: "finalidades",
    title: "4. Finalidades do tratamento",
    paragraphs: [
      "Autenticar o usuário VIP e autorizar o uso do Downloader.",
      "Sincronizar e executar a fila de downloads entre a plataforma web e o computador.",
      "Exibir progresso, histórico e status dos downloads.",
      "Manter preferências locais do aplicativo e melhorar a estabilidade do serviço.",
      "Prevenir abuso, diagnosticar falhas e prestar suporte técnico.",
    ],
  },
  {
    id: "armazenamento-local",
    title: "5. Armazenamento no seu dispositivo",
    paragraphs: [
      "Os arquivos de áudio baixados são salvos na pasta escolhida por você no computador. Esses arquivos permanecem sob o seu controle local.",
      "Preferências do aplicativo (pasta de download, opções de inicialização, etc.) podem ser armazenadas localmente no dispositivo.",
      "O Aplicativo não envia o conteúdo dos arquivos baixados para terceiros como parte do fluxo normal de download.",
    ],
  },
  {
    id: "compartilhamento",
    title: "6. Compartilhamento e prestadores",
    paragraphs: [
      "As informações da conta e da fila são processadas pelos sistemas da plataforma Brazilian Remix Service necessários à operação do serviço.",
      "Os downloads podem utilizar infraestrutura de armazenamento e entrega de arquivos (por exemplo, Google Drive) conforme a origem do conteúdo liberado na plataforma VIP.",
      "Não vendemos listas de contatos ou dados pessoais de usuários para marketing de terceiros.",
    ],
  },
  {
    id: "bases-legais",
    title: "7. Bases e direitos (LGPD)",
    paragraphs: [
      "O tratamento ocorre para execução do serviço contratado (acesso VIP e downloads), cumprimento de obrigações relacionadas à operação da conta e, quando aplicável, legítimo interesse em segurança e prevenção a fraudes, sempre dentro dos limites da legislação brasileira aplicável, incluindo a Lei Geral de Proteção de Dados (LGPD).",
      "Você pode solicitar informações, correção ou exclusão de dados de contato e suporte relacionados ao Downloader pelo e-mail indicado nesta Política, observadas retenções legais ou técnicas necessárias à operação da conta.",
    ],
  },
  {
    id: "seguranca",
    title: "8. Segurança",
    paragraphs: [
      "Adotamos medidas razoáveis de segurança para proteger credenciais de sessão, comunicação com a API e dados da fila.",
      "Nenhuma transmissão pela internet ou armazenamento eletrônico é absolutamente seguro. Mantenha sua senha em sigilo e não compartilhe o acesso à conta VIP.",
    ],
  },
  {
    id: "retencao",
    title: "9. Retenção",
    paragraphs: [
      "Registros de dispositivos e jobs de download podem ser mantidos enquanto necessários para a operação da fila, histórico e suporte, ou até solicitação cabível de exclusão, observada a necessidade técnica e legal.",
      "Arquivos salvos localmente no seu computador permanecem até que você os exclua.",
    ],
  },
  {
    id: "menores",
    title: "10. Menores de idade",
    paragraphs: [
      "O serviço é destinado a usuários com capacidade para contratar o acesso VIP. Não coletamos intencionalmente dados de crianças fora desse contexto.",
    ],
  },
  {
    id: "alteracoes",
    title: "11. Alterações desta Política",
    paragraphs: [
      "Podemos atualizar esta Política periodicamente. A data da última atualização será indicada no topo desta página. O uso contínuo do Aplicativo após a publicação de alterações constitui ciência da versão vigente, quando permitido pela legislação aplicável.",
    ],
  },
  {
    id: "contato",
    title: "12. Fale sobre privacidade",
    paragraphs: [
      `Para dúvidas, solicitações ou reclamações relacionadas a esta Política e ao Brazilian Packs Downloader, escreva para ${DOWNLOADER_PRIVACY_EMAIL}.`,
    ],
  },
];
