import type { LegalDocument } from "../privacy/legal-types";
import { LEGAL_CONTACT_EMAIL } from "../privacy/legal-types";
import { DOWNLOADER_NAME, SITE_NAME, SITE_PRODUCTION_URL, SITE_SHORT } from "../lib/branding";

const COPYRIGHT_EMAIL = "copyright@brazilianremixservice.com.br";
const PRIVACY_EMAIL = "privacidade@brazilianremixservice.com.br";

export const termsOfServiceDocument: LegalDocument = {
  title: `Termos de Serviço — ${SITE_NAME}`,
  updatedAt: "14 de setembro de 2026",
  contactEmail: LEGAL_CONTACT_EMAIL,
  contactSubject: `Termos de Serviço — ${SITE_NAME}`,
  ctaLabel: "Falar sobre os termos",
  intro: [
    {
      type: "p",
      text: `Estes Termos de Serviço regem o acesso e a utilização do site, da plataforma VIP, do Portal do Cliente, do ${DOWNLOADER_NAME} e dos demais produtos e serviços digitais disponibilizados pela ${SITE_NAME}, doravante denominada simplesmente “${SITE_SHORT}” ou “${SITE_NAME}”.`,
    },
    {
      type: "p",
      text: `Ao criar uma conta, contratar uma assinatura, adquirir um produto, acessar a plataforma, utilizar o ${DOWNLOADER_NAME} ou utilizar qualquer outro serviço disponibilizado pela ${SITE_NAME}, você declara ter lido, compreendido e concordado com estes Termos.`,
    },
    {
      type: "p",
      text: `Leia atentamente este documento, especialmente as disposições relacionadas a contas, compartilhamento de login, downloads, ${DOWNLOADER_NAME}, propriedade intelectual, direitos autorais, proteção de dados, pagamentos e utilização do acervo.`,
    },
    {
      type: "p",
      text: "O uso indevido dos serviços poderá resultar em limitação, suspensão ou encerramento da conta, conforme a gravidade da situação e observada a legislação aplicável.",
    },
  ],
  sections: [
    {
      id: "objeto",
      title: "1. Objeto do serviço",
      blocks: [
        {
          type: "p",
          text: `A ${SITE_NAME} disponibiliza uma plataforma digital voltada principalmente para DJs, produtores, profissionais de eventos e usuários interessados em organização e preparação de repertório musical.`,
        },
        { type: "p", text: "Os serviços podem incluir, entre outros:" },
        {
          type: "list",
          items: [
            "acesso a acervos organizados;",
            "DJ pools;",
            "remix services;",
            "packs;",
            "edits;",
            "versões extended;",
            "intro edits;",
            "clean edits;",
            "remixes;",
            "coleções;",
            "previews e streaming;",
            "atualizações periódicas;",
            "ferramentas para organização do repertório;",
            `${DOWNLOADER_NAME};`,
            "Portal do Cliente;",
            "ferramentas relacionadas a produção musical;",
            "recursos que utilizem inteligência artificial;",
            "outros produtos e funcionalidades disponibilizados futuramente.",
          ],
        },
        {
          type: "p",
          text: "O acesso a determinados conteúdos e funcionalidades depende da existência de assinatura ativa, plano contratado, produto adquirido e das permissões correspondentes à conta do usuário.",
        },
        {
          type: "p",
          text: "A contratação ou assinatura da plataforma não transfere ao usuário propriedade sobre obras, fonogramas, marcas, imagens, arquivos ou demais materiais disponibilizados por meio dos serviços.",
        },
      ],
    },
    {
      id: "cadastro",
      title: "2. Cadastro e conta do usuário",
      blocks: [
        {
          type: "p",
          text: "Para utilizar determinadas funcionalidades, o usuário deverá criar uma conta e fornecer informações verdadeiras, atualizadas e suficientes para identificação e prestação do serviço.",
        },
        { type: "p", text: "A conta é pessoal e intransferível." },
        { type: "p", text: "O usuário é responsável por:" },
        {
          type: "list",
          items: [
            "manter seu e-mail atualizado;",
            "proteger sua senha;",
            "utilizar senha forte e exclusiva;",
            "não compartilhar códigos de recuperação;",
            "não disponibilizar tokens ou cookies de sessão;",
            "manter seus dispositivos protegidos;",
            "comunicar eventual acesso não autorizado à conta.",
          ],
        },
        {
          type: "p",
          text: `A ${SITE_NAME} poderá solicitar confirmação de identidade, e-mail, dispositivo ou outras verificações razoáveis para proteção da conta e prevenção de fraude.`,
        },
      ],
    },
    {
      id: "compartilhamento-conta",
      title: "3. Compartilhamento de conta e credenciais",
      blocks: [
        { type: "p", text: "É expressamente proibido:" },
        {
          type: "list",
          items: [
            "compartilhar e-mail e senha com terceiros;",
            "permitir que amigos, colegas, clientes ou grupos utilizem a mesma conta;",
            "vender, alugar, emprestar ou ceder uma conta;",
            "publicar credenciais em WhatsApp, Telegram, Discord, fóruns ou redes sociais;",
            "fornecer tokens, cookies de sessão ou códigos de recuperação a terceiros;",
            "utilizar credenciais pertencentes a outra pessoa sem autorização;",
            "utilizar credenciais obtidas de maneira irregular;",
            "permitir utilização coletiva de um plano individual;",
            "tentar contornar restrições de dispositivos ou sessões.",
          ],
        },
        {
          type: "p",
          text: `A ${SITE_NAME} poderá utilizar mecanismos de segurança para identificar sinais de abuso.`,
        },
        {
          type: "p",
          text: "Esses mecanismos poderão considerar, entre outros elementos:",
        },
        {
          type: "list",
          items: [
            "logins simultâneos incompatíveis;",
            "quantidade incomum de dispositivos;",
            "padrões anormais de utilização;",
            "sessões simultâneas;",
            "padrões de download;",
            "tentativas repetidas de autenticação;",
            "identificadores técnicos de dispositivos;",
            "endereços IP;",
            "eventos relacionados à segurança da conta.",
          ],
        },
        {
          type: "p",
          text: "Quando houver indícios razoáveis de compartilhamento de credenciais ou utilização contrária a estes Termos, poderão ser adotadas medidas como:",
        },
        {
          type: "list",
          items: [
            "encerramento de sessões;",
            "solicitação de nova autenticação;",
            "desconexão de dispositivos;",
            "limitação temporária de determinadas funcionalidades;",
            "suspensão preventiva;",
            "bloqueio temporário;",
            "encerramento da conta em situações graves ou reincidentes.",
          ],
        },
        {
          type: "p",
          text: "Essas medidas serão adotadas de acordo com a natureza da ocorrência, sem prejuízo dos direitos que não possam ser afastados pela legislação aplicável.",
        },
      ],
    },
    {
      id: "brs-downloader",
      title: `4. ${DOWNLOADER_NAME}`,
      blocks: [
        {
          type: "p",
          text: `O ${DOWNLOADER_NAME} é o aplicativo oficial da ${SITE_NAME} destinado principalmente a usuários Windows.`,
        },
        {
          type: "p",
          text: "O aplicativo permite, conforme disponibilidade e plano contratado:",
        },
        {
          type: "list",
          items: [
            `autenticação com a conta da ${SITE_NAME};`,
            "recebimento de músicas e pastas enviadas pela plataforma;",
            "gerenciamento de fila;",
            "downloads;",
            "organização de diretórios;",
            "acompanhamento do progresso;",
            "integração com dispositivos de armazenamento escolhidos pelo usuário.",
          ],
        },
        {
          type: "p",
          text: `O ${DOWNLOADER_NAME} poderá utilizar a mesma conta vinculada à plataforma VIP.`,
        },
        {
          type: "p",
          text: "Cada conta poderá estar sujeita a um limite de computadores ou dispositivos autorizados.",
        },
        {
          type: "p",
          text: "Dispositivos adicionais poderão ser recusados, desconectados ou exigir nova autorização.",
        },
      ],
    },
    {
      id: "regras-downloader",
      title: `5. Regras de utilização do ${DOWNLOADER_NAME}`,
      blocks: [
        { type: "p", text: "É proibido:" },
        {
          type: "list",
          items: [
            "compartilhar uma sessão ativa com terceiros;",
            "distribuir versões modificadas do aplicativo;",
            `crackear o ${DOWNLOADER_NAME};`,
            "remover mecanismos de proteção;",
            "modificar os binários para contornar limitações;",
            "tentar extrair credenciais ou tokens;",
            "interceptar tráfego com a finalidade de burlar controles;",
            "utilizar bots não autorizados;",
            "falsificar identificadores de dispositivo;",
            "simular várias instalações como se fossem um único dispositivo;",
            "redistribuir instaladores modificados;",
            "criar versões não oficiais;",
            "comercializar versões modificadas do aplicativo.",
          ],
        },
        {
          type: "p",
          text: `O ${DOWNLOADER_NAME} comunica-se com servidores da ${SITE_NAME} para funcionalidades como autenticação, dispositivos, filas, histórico, atualizações e entrega de arquivos.`,
        },
        {
          type: "p",
          text: "Algumas versões do aplicativo poderão deixar de funcionar quando uma atualização for necessária para segurança, compatibilidade ou funcionamento adequado.",
        },
        {
          type: "p",
          text: `A ${SITE_NAME} recomenda utilizar apenas instaladores e atualizações provenientes de seus canais oficiais.`,
        },
      ],
    },
    {
      id: "downloads",
      title: "6. Downloads",
      blocks: [
        {
          type: "p",
          text: "Determinados conteúdos podem ser disponibilizados para download conforme:",
        },
        {
          type: "list",
          items: [
            "plano contratado;",
            "produto adquirido;",
            "permissões da conta;",
            "disponibilidade técnica;",
            "limitações do serviço.",
          ],
        },
        {
          type: "p",
          text: `Downloads de grandes volumes poderão ser direcionados ao ${DOWNLOADER_NAME} para melhorar estabilidade e organização.`,
        },
        {
          type: "p",
          text: "A plataforma poderá limitar temporariamente requisições excessivas que prejudiquem a segurança ou a disponibilidade do serviço.",
        },
        {
          type: "p",
          text: "Essas medidas não deverão ser utilizadas para impedir arbitrariamente o acesso legítimo contratado pelo usuário.",
        },
      ],
    },
    {
      id: "planos",
      title: "7. Planos e assinaturas",
      blocks: [
        {
          type: "p",
          text: "Os preços, benefícios, duração e condições dos planos serão apresentados antes da contratação.",
        },
        {
          type: "p",
          text: "Uma assinatura poderá oferecer acesso durante período específico, como:",
        },
        {
          type: "list",
          items: [
            "30 dias;",
            "ciclo mensal;",
            "período promocional;",
            "outro prazo apresentado no momento da compra.",
          ],
        },
        {
          type: "p",
          text: "A contratação de um plano não garante disponibilidade eterna de uma determinada faixa, fornecedor, integração ou serviço de terceiro.",
        },
        {
          type: "p",
          text: "O catálogo e as funcionalidades podem sofrer alterações decorrentes de:",
        },
        {
          type: "list",
          items: [
            "atualizações;",
            "manutenção;",
            "direitos autorais;",
            "indisponibilidade de terceiros;",
            "alterações técnicas;",
            "mudanças de fornecedores;",
            "requisitos legais.",
          ],
        },
      ],
    },
    {
      id: "pagamentos",
      title: "8. Pagamentos",
      blocks: [
        {
          type: "p",
          text: `Os pagamentos poderão ser processados por plataformas externas, como Mercado Pago, Hotmart ou outros prestadores utilizados pela ${SITE_NAME}.`,
        },
        {
          type: "p",
          text: `Informações financeiras completas, como número integral de cartão, poderão ser processadas diretamente pelo respectivo gateway e não necessariamente armazenadas pela ${SITE_NAME}.`,
        },
        {
          type: "p",
          text: "O usuário é responsável por fornecer informações corretas durante a contratação.",
        },
        {
          type: "p",
          text: "Tentativas de fraude, utilização de meios de pagamento sem autorização ou manipulação do processo de pagamento poderão resultar em análise e suspensão preventiva da conta.",
        },
      ],
    },
    {
      id: "renovacao",
      title: "9. Renovação e cancelamento",
      blocks: [
        {
          type: "p",
          text: "Quando o plano possuir renovação recorrente, essa condição deverá ser informada antes da contratação.",
        },
        {
          type: "p",
          text: "Salvo quando houver condição diferente informada na oferta, não haverá fidelidade mínima.",
        },
        {
          type: "p",
          text: "O usuário poderá cancelar futuras renovações pelos meios disponibilizados.",
        },
        {
          type: "p",
          text: "Em regra, quando uma renovação é cancelada, o acesso poderá permanecer disponível até o final do período já pago, salvo situação diferente prevista na oferta ou exigida pela legislação.",
        },
        {
          type: "p",
          text: "O cancelamento da renovação e o pedido de reembolso são procedimentos distintos.",
        },
      ],
    },
    {
      id: "consumidor",
      title: "10. Direito de arrependimento e direitos do consumidor",
      blocks: [
        {
          type: "p",
          text: "Quando a contratação configurar relação de consumo, serão respeitados os direitos previstos na legislação brasileira aplicável, especialmente:",
        },
        {
          type: "list",
          items: [
            "Lei nº 8.078/1990 — Código de Defesa do Consumidor;",
            "Decreto nº 7.962/2013 — comércio eletrônico;",
            "demais normas aplicáveis.",
          ],
        },
        {
          type: "p",
          text: "Quando aplicável, o consumidor poderá exercer o direito de arrependimento previsto na legislação brasileira para contratações realizadas fora do estabelecimento comercial.",
        },
        {
          type: "p",
          text: "Pedidos de cancelamento, reembolso ou arrependimento serão analisados de acordo com:",
        },
        {
          type: "list",
          items: [
            "legislação aplicável;",
            "data da contratação;",
            "natureza do produto;",
            "forma de entrega;",
            "utilização do serviço;",
            "demais circunstâncias do caso.",
          ],
        },
        {
          type: "p",
          text: "Nenhuma disposição destes Termos deverá ser interpretada como renúncia a direito do consumidor que legalmente não possa ser afastado por contrato.",
        },
      ],
    },
    {
      id: "chargebacks",
      title: "11. Chargebacks e contestações",
      blocks: [
        {
          type: "p",
          text: `A ${SITE_NAME} poderá analisar chargebacks, contestações e pedidos de estorno que apresentem indícios de:`,
        },
        {
          type: "list",
          items: [
            "fraude;",
            "utilização não autorizada;",
            "abuso;",
            "duplicidade;",
            "erro de cobrança;",
            "descumprimento do serviço contratado.",
          ],
        },
        {
          type: "p",
          text: "Quando houver contestação de pagamento, o acesso relacionado à transação poderá ser temporariamente suspenso enquanto a situação é analisada, quando tecnicamente ou juridicamente necessário.",
        },
        {
          type: "p",
          text: "A existência de chargeback não elimina os direitos previstos na legislação brasileira.",
        },
      ],
    },
    {
      id: "conteudo-redistribuicao",
      title: "12. Conteúdo, downloads e redistribuição",
      blocks: [
        {
          type: "p",
          text: "O conteúdo acessível por meio da plataforma destina-se ao uso do assinante de acordo com as funcionalidades oferecidas pelo serviço e com os direitos efetivamente aplicáveis a cada conteúdo.",
        },
        {
          type: "p",
          text: `É proibido utilizar o acesso à ${SITE_NAME} para:`,
        },
        {
          type: "list",
          items: [
            "revender arquivos do acervo;",
            "redistribuir arquivos;",
            "disponibilizar arquivos em grupos públicos ou privados;",
            "criar torrents;",
            "criar mirrors;",
            "criar drives públicos;",
            "disponibilizar packs VIP a terceiros;",
            "compartilhar links internos protegidos;",
            "comercializar cópias do catálogo;",
            "montar serviço concorrente utilizando material obtido pela plataforma;",
            "utilizar automações para copiar sistematicamente o catálogo com finalidade de redistribuição.",
          ],
        },
        {
          type: "p",
          text: "O usuário é responsável por observar direitos autorais, direitos conexos, licenças e demais autorizações eventualmente necessárias para formas específicas de utilização do material.",
        },
      ],
    },
    {
      id: "direitos-autorais",
      title: "13. Direitos autorais e propriedade intelectual",
      blocks: [
        {
          type: "p",
          text: `A ${SITE_NAME} respeita direitos autorais, direitos conexos, marcas e demais direitos de propriedade intelectual.`,
        },
        {
          type: "p",
          text: "A legislação brasileira aplicável inclui, entre outras, a Lei nº 9.610/1998 — Lei de Direitos Autorais.",
        },
        {
          type: "p",
          text: `A disponibilização técnica, indexação, organização, streaming ou download de um material pela plataforma não constitui, por si só, declaração de titularidade da ${SITE_NAME} sobre obras, fonogramas, marcas, capas, nomes comerciais ou conteúdos pertencentes a terceiros.`,
        },
        {
          type: "p",
          text: "O acesso concedido ao usuário não transfere automaticamente:",
        },
        {
          type: "list",
          items: [
            "direitos autorais;",
            "direitos conexos;",
            "direitos de reprodução;",
            "direitos de execução pública;",
            "direitos de sincronização;",
            "direitos de radiodifusão;",
            "direitos de distribuição comercial;",
            "direitos de sublicenciamento.",
          ],
        },
        {
          type: "p",
          text: "Quando determinado uso depender de autorização do respectivo titular, essa autorização deverá ser obtida pelo responsável pelo uso.",
        },
        {
          type: "p",
          text: "Os negócios jurídicos relacionados a direitos autorais serão interpretados conforme a legislação aplicável.",
        },
        {
          type: "p",
          text: `A ${SITE_NAME} poderá remover, bloquear ou restringir conteúdo em caso de:`,
        },
        {
          type: "list",
          items: [
            "reivindicação fundamentada de direitos autorais;",
            "determinação judicial;",
            "comunicação de titular de direitos;",
            "identificação de violação aparente;",
            "exigência de fornecedor de infraestrutura;",
            "necessidade de cumprimento legal.",
          ],
        },
      ],
    },
    {
      id: "execucao-publica",
      title: "14. Execução pública e utilização profissional",
      blocks: [
        {
          type: "p",
          text: `O simples acesso ao acervo da ${SITE_NAME} não deverá ser interpretado como substituição de licenças ou autorizações eventualmente exigidas para execução pública, transmissão, radiodifusão, sincronização ou utilização comercial de obras.`,
        },
        {
          type: "p",
          text: "DJs, empresas, estabelecimentos, rádios, produtoras, organizadores de eventos e demais usuários são responsáveis por verificar as obrigações aplicáveis à utilização realizada por eles.",
        },
      ],
    },
    {
      id: "denuncias-copyright",
      title: "15. Denúncias de violação de direitos autorais",
      blocks: [
        {
          type: "p",
          text: "Titulares de direitos autorais ou seus representantes devidamente autorizados poderão solicitar análise de conteúdo que entendam infringir seus direitos.",
        },
        {
          type: "p",
          text: "A notificação deverá conter, sempre que possível:",
        },
        {
          type: "list",
          items: [
            "nome do titular ou representante;",
            "identificação da obra protegida;",
            "identificação do material questionado;",
            "localização do conteúdo na plataforma;",
            "URL, nome da pasta ou outra referência suficiente;",
            "informações de contato;",
            "comprovação de representação, quando necessária;",
            "declaração de boa-fé;",
            "declaração de veracidade das informações;",
            "assinatura física ou eletrônica.",
          ],
        },
        {
          type: "p",
          text: `As notificações deverão ser enviadas para: ${COPYRIGHT_EMAIL}`,
        },
        {
          type: "p",
          text: "Caso esse endereço ainda não esteja disponível, poderá ser utilizado temporariamente o canal oficial de suporte divulgado no site.",
        },
        {
          type: "p",
          text: `A ${SITE_NAME} poderá solicitar documentos ou esclarecimentos adicionais antes de concluir a análise.`,
        },
        {
          type: "p",
          text: "Quando adequado, o acesso ao material poderá ser temporariamente restringido enquanto a reclamação é analisada.",
        },
      ],
    },
    {
      id: "contestacao-copyright",
      title: "16. Contestação de reclamação de direitos autorais",
      blocks: [
        {
          type: "p",
          text: "Quando juridicamente adequado, a pessoa ou entidade responsável pelo conteúdo poderá apresentar esclarecimentos ou contestação.",
        },
        {
          type: "p",
          text: `A ${SITE_NAME} poderá considerar:`,
        },
        {
          type: "list",
          items: [
            "documentação apresentada;",
            "titularidade alegada;",
            "autorização existente;",
            "legislação aplicável;",
            "natureza do conteúdo;",
            "boa-fé das partes;",
            "decisões judiciais ou administrativas.",
          ],
        },
        {
          type: "p",
          text: `A ${SITE_NAME} não está obrigada a decidir definitivamente disputas complexas de titularidade entre terceiros e poderá manter conteúdo indisponível até que a questão seja resolvida pelas partes ou autoridade competente.`,
        },
      ],
    },
    {
      id: "dmca",
      title: "17. DMCA — Digital Millennium Copyright Act",
      blocks: [
        {
          type: "p",
          text: `A ${SITE_NAME} opera principalmente para o mercado brasileiro e está sujeita prioritariamente à legislação brasileira.`,
        },
        {
          type: "p",
          text: "Entretanto, poderá receber e processar notificações apresentadas com fundamento no Digital Millennium Copyright Act — DMCA — dos Estados Unidos, especialmente quando houver envolvimento de titulares, usuários, fornecedores ou infraestrutura sujeitos à legislação norte-americana.",
        },
        {
          type: "p",
          text: "O procedimento previsto na Seção 512 do Título 17 do Código dos Estados Unidos estabelece mecanismos conhecidos como notice-and-takedown para determinadas situações.",
        },
        {
          type: "p",
          text: "Uma notificação DMCA poderá exigir informações como:",
        },
        {
          type: "list",
          items: [
            "identificação da obra;",
            "identificação do conteúdo reclamado;",
            "localização suficientemente precisa do material;",
            "dados de contato do notificante;",
            "declaração de boa-fé;",
            "declaração de exatidão e autoridade;",
            "assinatura física ou eletrônica.",
          ],
        },
        {
          type: "p",
          text: "Uma comunicação suficientemente fundamentada poderá resultar em remoção ou bloqueio preventivo do conteúdo.",
        },
        {
          type: "p",
          text: `A inclusão desta cláusula não significa que a ${SITE_NAME} automaticamente preencha todos os requisitos necessários para obtenção de qualquer proteção conhecida como DMCA Safe Harbor.`,
        },
        {
          type: "p",
          text: `Caso a ${SITE_NAME} venha a buscar formalmente os benefícios previstos na Seção 512, poderá realizar o registro de agente DMCA perante o U.S. Copyright Office e cumprir as demais condições legalmente exigidas.`,
        },
      ],
    },
    {
      id: "reincidentes",
      title: "18. Política para violações reincidentes",
      blocks: [
        {
          type: "p",
          text: "Contas relacionadas repetidamente a:",
        },
        {
          type: "list",
          items: [
            "redistribuição não autorizada;",
            "violações de propriedade intelectual;",
            "compartilhamento irregular;",
            "publicação de material protegido;",
            "uso abusivo dos serviços;",
          ],
        },
        {
          type: "p",
          text: "poderão sofrer medidas progressivas ou encerramento.",
        },
        {
          type: "p",
          text: "A análise poderá considerar:",
        },
        {
          type: "list",
          items: [
            "quantidade de ocorrências;",
            "gravidade;",
            "reincidência;",
            "boa-fé;",
            "reclamações recebidas;",
            "contestações;",
            "documentação apresentada;",
            "legislação aplicável.",
          ],
        },
      ],
    },
    {
      id: "marcas",
      title: "19. Marcas e identidade visual",
      blocks: [
        {
          type: "p",
          text: `O nome ${SITE_NAME}, ${SITE_SHORT}, logotipos, elementos visuais próprios, interfaces, textos originais, softwares e demais ativos criados especificamente para a plataforma poderão ser protegidos pela legislação aplicável.`,
        },
        {
          type: "p",
          text: `É proibida a utilização da marca, logotipo ou identidade da ${SITE_NAME} de forma que:`,
        },
        {
          type: "list",
          items: [
            "induza consumidores a erro;",
            "simule ser canal oficial;",
            "sugira parceria inexistente;",
            "seja utilizada em serviço concorrente de maneira enganosa;",
            "seja empregada para aplicação de golpes ou fraude.",
          ],
        },
      ],
    },
    {
      id: "infraestrutura",
      title: "20. Infraestrutura e serviços de terceiros",
      blocks: [
        {
          type: "p",
          text: `A ${SITE_NAME} utiliza fornecedores externos para operar seus serviços.`,
        },
        {
          type: "p",
          text: "Determinados dados, arquivos, requisições ou comunicações podem ser processados por terceiros necessários ao funcionamento da plataforma.",
        },
        {
          type: "p",
          text: "Esses fornecedores possuem seus próprios termos, políticas e condições.",
        },
      ],
    },
    {
      id: "cloudflare",
      title: "21. Cloudflare",
      blocks: [
        {
          type: "p",
          text: `A ${SITE_NAME} poderá utilizar serviços da Cloudflare para:`,
        },
        {
          type: "list",
          items: [
            "DNS;",
            "CDN;",
            "proxy reverso;",
            "segurança;",
            "proteção contra ataques;",
            "mitigação de DDoS;",
            "firewall;",
            "certificados;",
            "melhoria de desempenho.",
          ],
        },
        {
          type: "p",
          text: "Durante o funcionamento normal do serviço, informações técnicas como:",
        },
        {
          type: "list",
          items: [
            "endereço IP;",
            "cabeçalhos HTTP;",
            "navegador;",
            "dados de conexão;",
            "requisições;",
          ],
        },
        {
          type: "p",
          text: "podem ser processadas pela infraestrutura da Cloudflare.",
        },
        {
          type: "p",
          text: `Nosso domínio é gerenciado por meio da Cloudflare, incluindo roteamento DNS e configurações relacionadas à disponibilidade e à segurança do site.`,
        },
      ],
    },
    {
      id: "google-drive",
      title: "22. Google Drive e Google Workspace",
      blocks: [
        {
          type: "p",
          text: "O acervo e determinadas pastas utilizadas pela plataforma poderão ser armazenados e organizados utilizando Google Drive ou Google Workspace.",
        },
        {
          type: "p",
          text: "A disponibilidade de determinadas funções poderá depender:",
        },
        {
          type: "list",
          items: [
            "das APIs Google;",
            "da infraestrutura Google;",
            "de limites técnicos;",
            "de cotas;",
            "da disponibilidade de arquivos;",
            "das políticas desses serviços.",
          ],
        },
        {
          type: "p",
          text: `O uso dessas plataformas pela ${SITE_NAME} não concede ao assinante acesso administrativo à infraestrutura Google utilizada internamente pela ${SITE_SHORT}.`,
        },
      ],
    },
    {
      id: "onesignal",
      title: "23. OneSignal e notificações",
      blocks: [
        {
          type: "p",
          text: `A ${SITE_NAME} poderá utilizar OneSignal ou serviço semelhante para envio de notificações push.`,
        },
        {
          type: "p",
          text: "As notificações poderão incluir:",
        },
        {
          type: "list",
          items: [
            "novidades;",
            "novos packs;",
            "atualizações;",
            "manutenção;",
            "informações operacionais;",
            "comunicações relacionadas ao serviço.",
          ],
        },
        {
          type: "p",
          text: "A ativação depende das permissões fornecidas pelo usuário.",
        },
        {
          type: "p",
          text: "O usuário poderá revogar a permissão de notificações por meio do navegador, sistema operacional ou configurações disponibilizadas pela plataforma.",
        },
      ],
    },
    {
      id: "outros-prestadores",
      title: "24. Serviços de pagamento, e-mail e hospedagem",
      blocks: [
        {
          type: "p",
          text: "Outros prestadores poderão ser utilizados para:",
        },
        {
          type: "list",
          items: [
            "pagamentos;",
            "hospedagem;",
            "envio de e-mails;",
            "notificações;",
            "autenticação;",
            "armazenamento;",
            "análise de segurança;",
            "atendimento;",
            "processamento de dados.",
          ],
        },
        {
          type: "p",
          text: "Os fornecedores poderão ser alterados ao longo do tempo sem necessidade de alteração estrutural destes Termos, desde que respeitada a legislação aplicável.",
        },
      ],
    },
    {
      id: "conteudo-ia",
      title: "25. Conteúdo gerado ou assistido por inteligência artificial",
      blocks: [
        {
          type: "p",
          text: `Parte do conteúdo editorial, visual ou funcional da ${SITE_NAME} poderá ser gerada, revisada ou assistida por sistemas de inteligência artificial.`,
        },
        {
          type: "p",
          text: "Isso poderá incluir:",
        },
        {
          type: "list",
          items: [
            "textos;",
            "descrições;",
            "FAQs;",
            "sugestões;",
            "artes;",
            "imagens;",
            "materiais promocionais;",
            "recursos de ferramentas de criação musical;",
            "outros conteúdos indicados na plataforma.",
          ],
        },
        {
          type: "p",
          text: `A ${SITE_NAME} poderá utilizar provedores e modelos de terceiros, incluindo serviços acessados por meio de OpenRouter e modelos Google Gemini e de outros fornecedores.`,
        },
        {
          type: "p",
          text: "Saídas de inteligência artificial podem conter erros ou imprecisões.",
        },
        {
          type: "p",
          text: "Quando houver divergência entre conteúdo gerado por IA e informação comercial, jurídica ou contratual oficial, prevalecerão:",
        },
        {
          type: "list",
          items: [
            "legislação aplicável;",
            "contrato ou oferta vigente;",
            "estes Termos;",
            "informações oficiais do Portal do Cliente;",
            "comunicação oficial do suporte.",
          ],
        },
        {
          type: "p",
          text: "O usuário não deverá inserir, sem autorização adequada, dados pessoais sensíveis ou informações confidenciais pertencentes a terceiros em ferramentas de IA oferecidas pela plataforma.",
        },
      ],
    },
    {
      id: "music-studio-ia",
      title: "26. Music Producer, Music Studio e ferramentas de IA",
      blocks: [
        {
          type: "p",
          text: `Quando a ${SITE_NAME} oferecer ferramentas relacionadas à produção ou geração de música por inteligência artificial, poderão existir termos adicionais.`,
        },
        {
          type: "p",
          text: "O usuário é responsável pelo conteúdo fornecido em prompts, letras, referências e demais materiais enviados ao serviço.",
        },
        {
          type: "p",
          text: "É proibido utilizar essas ferramentas para violar direitos de terceiros.",
        },
        {
          type: "p",
          text: "Recursos de IA poderão utilizar provedores externos e estar sujeitos:",
        },
        {
          type: "list",
          items: [
            "à disponibilidade dos modelos;",
            "às políticas dos respectivos fornecedores;",
            "a limites;",
            "a custos;",
            "a restrições técnicas;",
            "a regras de conteúdo.",
          ],
        },
      ],
    },
    {
      id: "lgpd",
      title: "27. Proteção de dados pessoais",
      blocks: [
        {
          type: "p",
          text: `A ${SITE_NAME} realizará tratamento de dados pessoais conforme a legislação brasileira aplicável, incluindo a Lei nº 13.709/2018 — Lei Geral de Proteção de Dados Pessoais — LGPD.`,
        },
        {
          type: "p",
          text: "O tratamento poderá ocorrer para finalidades como:",
        },
        {
          type: "list",
          items: [
            "cadastro;",
            "autenticação;",
            "gerenciamento da conta;",
            "prestação do serviço;",
            "execução de contratos;",
            "processamento de pagamentos;",
            "suporte;",
            `funcionamento do ${DOWNLOADER_NAME};`,
            "registro de dispositivos;",
            "proteção contra fraudes;",
            "prevenção ao compartilhamento irregular;",
            "segurança da plataforma;",
            "cumprimento de obrigações legais;",
            "exercício regular de direitos;",
            "comunicação com o usuário.",
          ],
        },
      ],
    },
    {
      id: "dados-tratados",
      title: "28. Dados que poderão ser tratados",
      blocks: [
        {
          type: "p",
          text: "Dependendo da utilização dos serviços, poderão ser tratados:",
        },
        {
          type: "list",
          items: [
            "nome;",
            "endereço de e-mail;",
            "identificador de usuário;",
            "endereço IP;",
            "navegador;",
            "sistema operacional;",
            "identificadores técnicos de dispositivo;",
            "registros de autenticação;",
            "sessões;",
            "data e horário de acesso;",
            "eventos de segurança;",
            "informações relacionadas à assinatura;",
            "informações fornecidas durante atendimento;",
            `eventos relacionados ao ${DOWNLOADER_NAME};`,
            "informações necessárias à prevenção de fraude.",
          ],
        },
        {
          type: "p",
          text: "Dados de pagamento completos poderão ser tratados diretamente por gateways de pagamento externos.",
        },
      ],
    },
    {
      id: "principios-lgpd",
      title: "29. Princípios de proteção de dados",
      blocks: [
        {
          type: "p",
          text: "O tratamento de dados pessoais observará, quando aplicável, princípios previstos pela LGPD, como:",
        },
        {
          type: "list",
          items: [
            "finalidade;",
            "adequação;",
            "necessidade;",
            "transparência;",
            "segurança;",
            "prevenção;",
            "não discriminação;",
            "responsabilização.",
          ],
        },
      ],
    },
    {
      id: "bases-legais",
      title: "30. Bases legais",
      blocks: [
        {
          type: "p",
          text: "O tratamento de dados poderá utilizar bases legais previstas na LGPD, dependendo da finalidade.",
        },
        {
          type: "p",
          text: "Entre elas poderão estar:",
        },
        {
          type: "list",
          items: [
            "execução de contrato;",
            "cumprimento de obrigação legal;",
            "exercício regular de direitos;",
            "legítimo interesse, quando aplicável;",
            "prevenção à fraude;",
            "consentimento, quando exigido;",
            "outras hipóteses previstas em lei.",
          ],
        },
      ],
    },
    {
      id: "direitos-titular",
      title: "31. Direitos do titular de dados",
      blocks: [
        {
          type: "p",
          text: "Nos termos da LGPD, o titular poderá possuir direitos relacionados a seus dados pessoais, conforme aplicável.",
        },
        {
          type: "p",
          text: "Entre eles:",
        },
        {
          type: "list",
          items: [
            "confirmação da existência de tratamento;",
            "acesso;",
            "correção;",
            "informação sobre compartilhamentos;",
            "eliminação de dados tratados com consentimento quando aplicável;",
            "revogação de consentimento;",
            "oposição nas hipóteses previstas em lei;",
            "demais direitos previstos no art. 18 da LGPD.",
          ],
        },
        {
          type: "p",
          text: "Alguns dados poderão permanecer armazenados quando sua retenção for necessária ou permitida por lei.",
        },
        {
          type: "p",
          text: `Solicitações relacionadas a privacidade poderão ser encaminhadas para: ${PRIVACY_EMAIL}`,
        },
        {
          type: "p",
          text: "Caso esse e-mail ainda não esteja ativo, o usuário poderá utilizar o canal oficial de suporte.",
        },
      ],
    },
    {
      id: "politica-privacidade",
      title: "32. Política de Privacidade",
      blocks: [
        {
          type: "p",
          text: `A ${SITE_NAME} poderá manter uma Política de Privacidade específica em página própria.`,
        },
        {
          type: "p",
          text: "A Política de Privacidade complementa estes Termos e deverá apresentar informações adicionais sobre:",
        },
        {
          type: "list",
          items: [
            "tratamento de dados;",
            "finalidade;",
            "compartilhamento;",
            "retenção;",
            "segurança;",
            "cookies;",
            "fornecedores;",
            "direitos dos titulares;",
            "meios de contato.",
          ],
        },
      ],
    },
    {
      id: "marco-civil",
      title: "33. Marco Civil da Internet",
      blocks: [
        {
          type: "p",
          text: `Quando aplicável, a ${SITE_NAME} observará a Lei nº 12.965/2014 — Marco Civil da Internet.`,
        },
        {
          type: "p",
          text: "O tratamento e eventual manutenção de registros observarão as obrigações legais pertinentes.",
        },
        {
          type: "p",
          text: `A ${SITE_NAME} poderá preservar registros quando necessário para:`,
        },
        {
          type: "list",
          items: [
            "segurança;",
            "prevenção a fraude;",
            "cumprimento de ordem judicial;",
            "exercício regular de direitos;",
            "cumprimento de obrigações legais.",
          ],
        },
      ],
    },
    {
      id: "cookies",
      title: "34. Cookies e armazenamento local",
      blocks: [
        {
          type: "p",
          text: "A plataforma poderá utilizar cookies e tecnologias semelhantes para:",
        },
        {
          type: "list",
          items: [
            "manter sessões;",
            "autenticar usuários;",
            "guardar preferências;",
            "proteger contas;",
            "prevenir fraudes;",
            "medir funcionamento;",
            "melhorar desempenho.",
          ],
        },
        {
          type: "p",
          text: "Cookies não essenciais poderão depender de consentimento quando exigido pela legislação aplicável.",
        },
        {
          type: "p",
          text: "Informações adicionais poderão ser fornecidas em Política de Cookies ou Política de Privacidade.",
        },
      ],
    },
    {
      id: "seguranca",
      title: "35. Segurança",
      blocks: [
        {
          type: "p",
          text: `A ${SITE_NAME} adotará medidas técnicas e administrativas razoáveis para proteção das informações sob sua responsabilidade, nos termos da legislação aplicável.`,
        },
        {
          type: "p",
          text: "Nenhum sistema conectado à internet é absolutamente invulnerável.",
        },
        {
          type: "p",
          text: "O usuário também deverá colaborar para proteção da própria conta.",
        },
        {
          type: "p",
          text: "Recomendamos:",
        },
        {
          type: "list",
          items: [
            "senha forte;",
            "senha exclusiva;",
            "não compartilhar credenciais;",
            "manter o sistema atualizado;",
            "utilizar somente versões oficiais do Downloader;",
            "evitar computadores públicos;",
            "desconectar dispositivos desconhecidos.",
          ],
        },
      ],
    },
    {
      id: "disponibilidade",
      title: "36. Disponibilidade",
      blocks: [
        {
          type: "p",
          text: `A ${SITE_NAME} buscará manter seus serviços disponíveis, porém não garante funcionamento ininterrupto ou livre de falhas.`,
        },
        {
          type: "p",
          text: "O serviço poderá sofrer indisponibilidade em razão de:",
        },
        {
          type: "list",
          items: [
            "manutenção;",
            "falhas de infraestrutura;",
            "problemas no Google;",
            "Cloudflare;",
            "OneSignal;",
            "OpenRouter;",
            "gateways de pagamento;",
            "hospedagem;",
            "redes de terceiros;",
            "incidentes de segurança;",
            "caso fortuito;",
            "força maior;",
            "problemas de conexão do usuário.",
          ],
        },
        {
          type: "p",
          text: "Interrupções temporárias não significam automaticamente encerramento do serviço contratado.",
        },
      ],
    },
    {
      id: "catalogo",
      title: "37. Alterações no catálogo",
      blocks: [
        {
          type: "p",
          text: "O catálogo poderá mudar ao longo do tempo.",
        },
        {
          type: "p",
          text: "Conteúdos poderão ser:",
        },
        {
          type: "list",
          items: [
            "adicionados;",
            "substituídos;",
            "atualizados;",
            "reorganizados;",
            "temporariamente indisponibilizados;",
            "removidos.",
          ],
        },
        {
          type: "p",
          text: "A existência de um arquivo em determinado momento não garante permanência indefinida no acervo.",
        },
        {
          type: "p",
          text: "Isso poderá ocorrer por motivos técnicos, legais, operacionais ou relacionados a fornecedores.",
        },
      ],
    },
    {
      id: "responsabilidade-usuario",
      title: "38. Responsabilidade do usuário",
      blocks: [
        {
          type: "p",
          text: "O usuário é responsável por:",
        },
        {
          type: "list",
          items: [
            "utilização de sua conta;",
            "arquivos baixados;",
            "local selecionado para armazenamento;",
            "backups;",
            "configuração do computador;",
            "dispositivos externos;",
            "utilização posterior do material;",
            "observância de direitos de terceiros;",
            "cumprimento das leis aplicáveis à sua atividade.",
          ],
        },
        {
          type: "p",
          text: `A ${SITE_NAME} não se responsabiliza por exclusão acidental de arquivos locais causada por configuração inadequada do usuário ou falha de hardware sob sua responsabilidade.`,
        },
      ],
    },
    {
      id: "limitacoes",
      title: "39. Limitações de responsabilidade",
      blocks: [
        {
          type: "p",
          text: `Na extensão permitida pela legislação aplicável, a ${SITE_NAME} não será responsável por danos indiretos decorrentes exclusivamente de:`,
        },
        {
          type: "list",
          items: [
            "falha de internet do usuário;",
            "configuração incorreta;",
            "defeito em computador do usuário;",
            "perda de pendrive ou HD;",
            "falha de terceiros fora do controle razoável da plataforma;",
            "utilização do serviço em desacordo com estes Termos.",
          ],
        },
        {
          type: "p",
          text: "Esta cláusula não afasta responsabilidades que legalmente não possam ser excluídas.",
        },
      ],
    },
    {
      id: "fiscalizacao",
      title: "40. Fiscalização",
      blocks: [
        {
          type: "p",
          text: `A ${SITE_NAME} poderá utilizar registros técnicos para proteção da plataforma.`,
        },
        {
          type: "p",
          text: "Entre os eventos monitorados poderão estar:",
        },
        {
          type: "list",
          items: [
            "autenticação;",
            "sessões;",
            "dispositivos;",
            "volume de downloads;",
            "filas;",
            "falhas de login;",
            "atividades suspeitas;",
            "tentativas de abuso;",
            "eventos relacionados à segurança.",
          ],
        },
        {
          type: "p",
          text: "O tratamento desses registros deverá respeitar a legislação aplicável, incluindo a LGPD.",
        },
      ],
    },
    {
      id: "sancoes",
      title: "41. Sanções",
      blocks: [
        {
          type: "p",
          text: "O descumprimento destes Termos poderá resultar, conforme gravidade e circunstâncias, em:",
        },
        {
          type: "list",
          items: [
            "alerta;",
            "solicitação de regularização;",
            "encerramento de sessões;",
            "limitação temporária;",
            "desconexão de dispositivos;",
            "suspensão;",
            "bloqueio da conta;",
            "encerramento da assinatura;",
            "outras medidas necessárias para proteção do serviço.",
          ],
        },
        {
          type: "p",
          text: "A aplicação dessas medidas não elimina direitos do consumidor ou outras garantias legais que não possam ser afastadas contratualmente.",
        },
      ],
    },
    {
      id: "fraudes",
      title: "42. Fraudes e atividades ilícitas",
      blocks: [
        {
          type: "p",
          text: `A ${SITE_NAME} poderá suspender preventivamente contas quando houver indícios razoáveis de:`,
        },
        {
          type: "list",
          items: [
            "fraude;",
            "invasão;",
            "utilização de credenciais roubadas;",
            "pagamento não autorizado;",
            "exploração de vulnerabilidade;",
            "tentativa de acesso a dados de terceiros;",
            "ataques à infraestrutura;",
            "distribuição maliciosa de arquivos;",
            "outras atividades potencialmente ilícitas.",
          ],
        },
        {
          type: "p",
          text: "Quando necessário, informações poderão ser preservadas ou fornecidas às autoridades competentes nos termos da legislação aplicável.",
        },
      ],
    },
    {
      id: "engenharia-reversa",
      title: "43. Proibição de engenharia reversa e exploração técnica",
      blocks: [
        {
          type: "p",
          text: "É proibido, salvo quando expressamente permitido por lei:",
        },
        {
          type: "list",
          items: [
            "realizar engenharia reversa destinada a contornar controles;",
            "explorar vulnerabilidades para obter acesso indevido;",
            "realizar scraping abusivo;",
            "tentar acessar APIs privadas sem autorização;",
            "contornar autenticação;",
            "manipular requests para acessar conteúdo de outros usuários;",
            "comprometer a segurança da infraestrutura;",
            "executar ataques automatizados.",
          ],
        },
        {
          type: "p",
          text: `Pesquisadores de segurança que identificarem vulnerabilidades poderão entrar em contato com a ${SITE_NAME} de boa-fé pelo canal oficial.`,
        },
      ],
    },
    {
      id: "links-terceiros",
      title: "44. Links e serviços de terceiros",
      blocks: [
        {
          type: "p",
          text: "A plataforma poderá conter links ou integrações com serviços externos.",
        },
        {
          type: "p",
          text: `A ${SITE_NAME} não controla integralmente serviços pertencentes a terceiros e não é responsável por alterações realizadas diretamente por esses fornecedores.`,
        },
        {
          type: "p",
          text: "O usuário poderá estar sujeito aos termos próprios dessas plataformas ao utilizá-las.",
        },
      ],
    },
    {
      id: "alteracoes",
      title: "45. Alterações dos Termos",
      blocks: [
        {
          type: "p",
          text: "Estes Termos poderão ser atualizados para refletir:",
        },
        {
          type: "list",
          items: [
            "novas funcionalidades;",
            "alterações legais;",
            "mudanças de infraestrutura;",
            "novos produtos;",
            `novas versões do ${DOWNLOADER_NAME};`,
            "mudanças operacionais;",
            "requisitos de segurança;",
            "alterações de fornecedores.",
          ],
        },
        {
          type: "p",
          text: "A versão vigente ficará disponível no site, preferencialmente em /termos.",
        },
        {
          type: "p",
          text: "A data da última atualização deverá ser indicada no início deste documento.",
        },
        {
          type: "p",
          text: "Quando uma alteração for relevante para uma assinatura vigente, poderemos comunicar o usuário por meios razoáveis.",
        },
      ],
    },
    {
      id: "legislacao",
      title: "46. Legislação aplicável",
      blocks: [
        {
          type: "p",
          text: "Estes Termos serão interpretados de acordo com as leis da República Federativa do Brasil.",
        },
        {
          type: "p",
          text: "Entre as normas que poderão ser aplicáveis estão:",
        },
        {
          type: "list",
          items: [
            "Lei nº 8.078/1990 — Código de Defesa do Consumidor;",
            "Lei nº 9.610/1998 — Lei de Direitos Autorais;",
            "Lei nº 12.965/2014 — Marco Civil da Internet;",
            "Lei nº 13.709/2018 — Lei Geral de Proteção de Dados Pessoais;",
            "Decreto nº 7.962/2013 — regulamentação do comércio eletrônico;",
            "demais normas aplicáveis.",
          ],
        },
        {
          type: "p",
          text: "Referências ao DMCA dizem respeito especificamente à legislação norte-americana e aos procedimentos eventualmente aplicáveis a conteúdos ou partes envolvidas sujeitas a essa legislação.",
        },
      ],
    },
    {
      id: "conflitos",
      title: "47. Resolução de conflitos",
      blocks: [
        {
          type: "p",
          text: `Antes de adotar outras medidas, incentivamos o usuário a entrar em contato com o suporte da ${SITE_NAME} para tentativa de solução amigável.`,
        },
        {
          type: "p",
          text: "Quando caracterizada relação de consumo, permanecem preservados os direitos do consumidor quanto aos órgãos e ao foro competentes conforme a legislação aplicável.",
        },
        {
          type: "p",
          text: "Nenhuma disposição destes Termos tem como objetivo limitar o acesso do consumidor à Justiça ou a mecanismos legais de defesa.",
        },
      ],
    },
    {
      id: "independencia",
      title: "48. Independência das cláusulas",
      blocks: [
        {
          type: "p",
          text: "Caso alguma disposição destes Termos seja considerada inválida, ilegal ou inexequível, as demais disposições continuarão válidas na medida permitida pela legislação.",
        },
        {
          type: "p",
          text: "A invalidade de uma cláusula não implica automaticamente invalidade de todo o documento.",
        },
      ],
    },
    {
      id: "nao-renuncia",
      title: "49. Não renúncia",
      blocks: [
        {
          type: "p",
          text: `A eventual tolerância da ${SITE_NAME} quanto ao descumprimento de determinada regra não significa renúncia definitiva ao direito de exigir seu cumprimento posteriormente.`,
        },
      ],
    },
    {
      id: "identificacao",
      title: "50. Identificação do fornecedor",
      blocks: [
        { type: "p", text: SITE_NAME },
        { type: "p", text: "Nome empresarial / responsável: a preencher." },
        { type: "p", text: "CNPJ ou CPF, conforme aplicável: a preencher." },
        { type: "p", text: "Endereço: a preencher." },
        { type: "p", text: "Cidade / Estado: a preencher." },
        { type: "p", text: `E-mail de suporte: ${LEGAL_CONTACT_EMAIL}` },
        { type: "p", text: `E-mail geral: ${LEGAL_CONTACT_EMAIL}` },
        { type: "p", text: `E-mail para direitos autorais: ${COPYRIGHT_EMAIL}` },
        { type: "p", text: `E-mail para privacidade / LGPD: ${PRIVACY_EMAIL}` },
      ],
    },
    {
      id: "contato",
      title: "51. Contato",
      blocks: [
        {
          type: "p",
          text: `Para questões gerais relacionadas à ${SITE_NAME}:`,
        },
        { type: "p", text: `E-mail: ${LEGAL_CONTACT_EMAIL}` },
        { type: "p", text: `Site: ${SITE_PRODUCTION_URL}` },
        {
          type: "p",
          text: `Para denúncias relacionadas a direitos autorais: ${COPYRIGHT_EMAIL}`,
        },
        {
          type: "p",
          text: `Para solicitações relacionadas a dados pessoais e privacidade: ${PRIVACY_EMAIL}`,
        },
        {
          type: "p",
          text: `Para denunciar compartilhamento de contas ou uso indevido do ${DOWNLOADER_NAME}, descreva a situação sem enviar senhas, tokens, cookies ou outras credenciais sensíveis.`,
        },
      ],
    },
    {
      id: "aceitacao",
      title: "52. Aceitação",
      blocks: [
        {
          type: "p",
          text: `Ao criar uma conta, contratar um plano, adquirir um produto ou continuar utilizando os serviços da ${SITE_NAME}, o usuário declara que leu e compreendeu estes Termos de Serviço.`,
        },
        {
          type: "p",
          text: "Quando exigido pela legislação aplicável, alterações relevantes poderão exigir nova manifestação de concordância.",
        },
        {
          type: "p",
          text: "Estes Termos entram em vigor na data indicada no início do documento.",
        },
      ],
    },
  ],
};
