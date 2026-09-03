import type { LegalDocument } from "../legal-types";
import { LEGAL_CONTACT_EMAIL } from "../legal-types";

export const cookiesPolicyDocument: LegalDocument = {
  title: "Política de Cookies — Brazilian Remix Service",
  updatedAt: "3 de setembro de 2026",
  contactEmail: LEGAL_CONTACT_EMAIL,
  contactSubject: "Cookies — Brazilian Remix Service",
  ctaLabel: "Falar sobre cookies",
  intro: [
    {
      type: "p",
      text: "Esta Política de Cookies explica como a Brazilian Remix Service, incluindo a plataforma Brazilian Packs, utiliza cookies e tecnologias semelhantes em seus sites e serviços.",
    },
    {
      type: "p",
      text: "Ela deve ser lida em conjunto com nossa Política de Privacidade.",
    },
  ],
  sections: [
    {
      id: "o-que-sao-cookies",
      title: "1. O que são cookies?",
      blocks: [
        {
          type: "p",
          text: "Cookies são pequenos arquivos armazenados no dispositivo do usuário durante a navegação em um site.",
        },
        {
          type: "p",
          text: "Eles podem ser utilizados para diferentes finalidades, como:",
        },
        {
          type: "list",
          items: [
            "manter o usuário conectado;",
            "lembrar preferências;",
            "garantir segurança;",
            "manter sessões;",
            "medir funcionamento e desempenho;",
            "entender como determinadas partes do site são utilizadas;",
            "oferecer funcionalidades necessárias ao serviço.",
          ],
        },
        {
          type: "p",
          text: "A ANPD define cookies como arquivos instalados no dispositivo do usuário capazes de permitir a coleta de determinadas informações, inclusive dados pessoais em algumas situações.",
        },
      ],
    },
    {
      id: "como-utilizamos",
      title: "2. Como utilizamos cookies",
      blocks: [
        {
          type: "p",
          text: "Podemos utilizar cookies e tecnologias equivalentes para permitir o funcionamento correto da plataforma Brazilian Remix Service e Brazilian Packs.",
        },
        {
          type: "p",
          text: "Dependendo dos recursos efetivamente utilizados no site, os cookies poderão ser classificados nas categorias abaixo.",
        },
      ],
    },
    {
      id: "estritamente-necessarios",
      title: "3. Cookies estritamente necessários",
      blocks: [
        {
          type: "p",
          text: "São cookies essenciais para o funcionamento da plataforma.",
        },
        { type: "p", text: "Podem ser utilizados para:" },
        {
          type: "list",
          items: [
            "autenticação;",
            "manter o usuário conectado;",
            "segurança da sessão;",
            "prevenção de fraude;",
            "controle de acesso;",
            "manutenção de carrinho, fila ou estado da aplicação;",
            "proteção contra requisições maliciosas;",
            "funcionamento de recursos básicos.",
          ],
        },
        {
          type: "p",
          text: "Sem esses cookies, determinadas funcionalidades podem não funcionar corretamente.",
        },
        {
          type: "p",
          text: "Por serem necessários à prestação do serviço solicitado, esses cookies não são desativados pelo painel comum de preferências quando forem tecnicamente indispensáveis.",
        },
      ],
    },
    {
      id: "preferencias",
      title: "4. Cookies de preferências",
      blocks: [
        {
          type: "p",
          text: "Quando utilizados, permitem lembrar determinadas escolhas do usuário, como:",
        },
        {
          type: "list",
          items: [
            "preferências de interface;",
            "opções da plataforma;",
            "configurações visuais;",
            "determinadas preferências de navegação;",
            "informações que evitem a necessidade de repetir certas configurações.",
          ],
        },
        {
          type: "p",
          text: "Esses cookies tornam a experiência mais conveniente.",
        },
      ],
    },
    {
      id: "desempenho",
      title: "5. Cookies de desempenho e analytics",
      blocks: [
        {
          type: "p",
          text: "Caso sejam utilizados serviços de análise de audiência, poderemos empregar cookies para compreender, de forma agregada, como a plataforma é utilizada.",
        },
        { type: "p", text: "Esses dados podem incluir:" },
        {
          type: "list",
          items: [
            "páginas acessadas;",
            "duração aproximada da visita;",
            "tipo de dispositivo;",
            "navegador;",
            "origem aproximada da visita;",
            "eventos de navegação;",
            "erros de funcionamento;",
            "desempenho das páginas.",
          ],
        },
        {
          type: "p",
          text: "Essas informações podem ser utilizadas para melhorar desempenho, usabilidade e estabilidade.",
        },
        {
          type: "p",
          text: "Importante: esta categoria somente deve permanecer nesta Política se o site realmente utilizar ferramentas de analytics.",
        },
        {
          type: "p",
          text: "A ANPD classifica cookies analíticos ou de desempenho como aqueles capazes de fornecer informações sobre o uso do site, páginas visitadas e ocorrência de erros ou problemas de desempenho.",
        },
      ],
    },
    {
      id: "publicidade",
      title: "6. Cookies de publicidade e marketing",
      blocks: [
        {
          type: "p",
          text: "Caso futuramente sejam utilizadas ferramentas de publicidade, determinados cookies poderão ser utilizados para:",
        },
        {
          type: "list",
          items: [
            "medir campanhas;",
            "limitar repetição de anúncios;",
            "atribuir conversões;",
            "personalizar publicidade, quando aplicável.",
          ],
        },
        {
          type: "p",
          text: "Esses cookies não devem ser ativados antes da escolha do usuário quando dependerem de consentimento.",
        },
        {
          type: "p",
          text: "Se o Brazilian Remix Service não utiliza publicidade comportamental ou pixels de marketing, esta categoria deve permanecer desativada ou ser removida da Política.",
        },
      ],
    },
    {
      id: "proprios-terceiros",
      title: "7. Cookies próprios e de terceiros",
      blocks: [
        { type: "p", text: "Podemos utilizar:" },
        {
          type: "list",
          items: [
            "Cookies próprios: definidos diretamente pelo domínio Brazilian Remix Service/Brazilian Packs.",
            "Cookies de terceiros: definidos por fornecedores utilizados pela plataforma, quando aplicável.",
          ],
        },
        {
          type: "p",
          text: "Exemplos possíveis de fornecedores incluem serviços relacionados a:",
        },
        {
          type: "list",
          items: [
            "autenticação;",
            "hospedagem;",
            "pagamentos;",
            "análise de desempenho;",
            "segurança;",
            "atendimento;",
            "conteúdo externo.",
          ],
        },
        {
          type: "p",
          text: "Somente devem ser listados na versão definitiva desta Política os fornecedores realmente utilizados pelo site.",
        },
      ],
    },
    {
      id: "downloader",
      title: "8. Brazilian Packs Downloader",
      blocks: [
        {
          type: "p",
          text: "O aplicativo Brazilian Packs Downloader para Windows não depende necessariamente de cookies tradicionais de navegador para executar os downloads.",
        },
        {
          type: "p",
          text: "O aplicativo pode utilizar tecnologias locais, como:",
        },
        {
          type: "list",
          items: [
            "armazenamento de preferências;",
            "tokens ou informações de sessão armazenados com mecanismos adequados;",
            "identificação do dispositivo;",
            "configuração da pasta de downloads;",
            "fila local;",
            "histórico local;",
            "configurações de rede;",
            "arquivos temporários.",
          ],
        },
        {
          type: "p",
          text: "Essas tecnologias podem desempenhar função semelhante à persistência de informações, mas não são necessariamente cookies HTTP.",
        },
        {
          type: "p",
          text: "O tratamento de dados realizado pelo aplicativo é detalhado na Política de Privacidade do Brazilian Packs Downloader.",
        },
      ],
    },
    {
      id: "local-storage",
      title: "9. Local Storage e tecnologias semelhantes",
      blocks: [
        {
          type: "p",
          text: "Além de cookies, nosso site poderá utilizar tecnologias como:",
        },
        {
          type: "list",
          items: [
            "localStorage;",
            "sessionStorage;",
            "armazenamento interno da aplicação;",
            "IndexedDB, quando necessário;",
            "identificadores de sessão.",
          ],
        },
        {
          type: "p",
          text: "Essas tecnologias podem ser utilizadas para manter preferências ou melhorar a experiência do usuário.",
        },
        {
          type: "p",
          text: "Quando utilizadas para finalidades que envolvam dados pessoais, serão tratadas de acordo com a legislação aplicável e nossa Política de Privacidade.",
        },
      ],
    },
    {
      id: "duracao",
      title: "10. Duração dos cookies",
      blocks: [
        { type: "p", text: "Os cookies podem ser:" },
        {
          type: "list",
          items: [
            "Cookies de sessão: normalmente permanecem ativos apenas durante a sessão de navegação.",
            "Cookies persistentes: permanecem armazenados por determinado período ou até serem removidos.",
          ],
        },
        {
          type: "p",
          text: "A duração específica depende da finalidade e da tecnologia utilizada.",
        },
        {
          type: "p",
          text: "Sempre que possível, utilizamos períodos compatíveis com a finalidade para a qual o cookie foi configurado, observando os princípios de necessidade e adequação previstos na LGPD. A orientação da ANPD destaca que a coleta por cookies deve ser limitada ao mínimo necessário para finalidades legítimas, explícitas e específicas.",
        },
      ],
    },
    {
      id: "gerenciamento",
      title: "11. Gerenciamento das preferências",
      blocks: [
        {
          type: "p",
          text: "Quando existirem cookies não essenciais, o site deverá permitir que o usuário gerencie suas escolhas.",
        },
        {
          type: "p",
          text: "O banner poderá apresentar opções como:",
        },
        {
          type: "list",
          items: ["Aceitar todos", "Rejeitar não essenciais", "Gerenciar cookies"],
        },
        {
          type: "p",
          text: "No painel de preferências, o usuário poderá ativar ou desativar categorias opcionais.",
        },
        {
          type: "p",
          text: "Os cookies estritamente necessários continuarão ativos quando forem indispensáveis ao funcionamento do serviço.",
        },
      ],
    },
    {
      id: "alteracao-consentimento",
      title: "12. Alteração do consentimento",
      blocks: [
        {
          type: "p",
          text: "Quando cookies opcionais dependerem de consentimento, o usuário poderá alterar sua escolha posteriormente.",
        },
        {
          type: "p",
          text: "Disponibilizaremos uma opção como:",
        },
        { type: "p", text: "Preferências de Cookies" },
        {
          type: "p",
          text: "no rodapé do site ou em outro local de fácil acesso.",
        },
      ],
    },
    {
      id: "navegador",
      title: "13. Configurações do navegador",
      blocks: [
        {
          type: "p",
          text: "O próprio navegador também permite controlar ou remover cookies.",
        },
        {
          type: "p",
          text: "Entretanto, bloquear todos os cookies pode impedir o funcionamento correto de áreas autenticadas ou de outras funcionalidades essenciais da plataforma.",
        },
      ],
    },
    {
      id: "compartilhamento",
      title: "14. Compartilhamento com terceiros",
      blocks: [
        {
          type: "p",
          text: "Quando cookies de terceiros forem utilizados, determinados dados poderão ser tratados pelos fornecedores responsáveis pelas respectivas tecnologias.",
        },
        {
          type: "p",
          text: "Não vendemos dados pessoais obtidos por meio de cookies.",
        },
        {
          type: "p",
          text: "Os fornecedores devem ser utilizados somente quando necessários às finalidades informadas e estarão sujeitos às próprias políticas de privacidade e proteção de dados.",
        },
      ],
    },
    {
      id: "seguranca",
      title: "15. Segurança",
      blocks: [
        {
          type: "p",
          text: "Adotamos medidas destinadas a reduzir riscos de acesso não autorizado, uso indevido ou exposição das informações tratadas.",
        },
        {
          type: "p",
          text: "Cookies de autenticação e sessão devem utilizar configurações de segurança adequadas sempre que tecnicamente aplicável, incluindo medidas como:",
        },
        {
          type: "list",
          items: ["Secure;", "HttpOnly;", "SameSite;", "expiração adequada."],
        },
      ],
    },
    {
      id: "alteracoes",
      title: "16. Alterações nesta Política",
      blocks: [
        {
          type: "p",
          text: "Esta Política poderá ser atualizada quando houver:",
        },
        {
          type: "list",
          items: [
            "mudanças na plataforma;",
            "implantação ou remoção de ferramentas;",
            "novos fornecedores;",
            "alterações nos tipos de cookies utilizados;",
            "alterações legais ou regulatórias.",
          ],
        },
        {
          type: "p",
          text: "A data da versão mais recente será indicada no início desta página.",
        },
      ],
    },
    {
      id: "contato",
      title: "17. Contato",
      blocks: [
        {
          type: "p",
          text: "Para dúvidas sobre cookies, privacidade ou tratamento de dados:",
        },
        { type: "p", text: "Brazilian Remix Service" },
        { type: "p", text: `E-mail: ${LEGAL_CONTACT_EMAIL}` },
      ],
    },
  ],
};
