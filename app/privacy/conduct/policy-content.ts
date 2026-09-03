import type { LegalDocument } from "../legal-types";
import { LEGAL_CONTACT_EMAIL } from "../legal-types";

export const codeOfConductDocument: LegalDocument = {
  title: "Código de Conduta — Brazilian Remix Service",
  updatedAt: "3 de setembro de 2026",
  contactEmail: LEGAL_CONTACT_EMAIL,
  contactSubject: "Código de Conduta — Brazilian Remix Service",
  ctaLabel: "Falar sobre conduta",
  intro: [
    {
      type: "p",
      text: "Este Código de Conduta estabelece regras básicas para utilização dos serviços, plataformas, aplicativos, comunidades e canais administrados pela Brazilian Remix Service, incluindo o Brazilian Packs e o Brazilian Packs Downloader.",
    },
    {
      type: "p",
      text: "Ao utilizar nossos serviços, o usuário concorda em respeitar estas regras e utilizar a plataforma de forma responsável.",
    },
  ],
  sections: [
    {
      id: "uso-adequado",
      title: "1. Uso adequado da plataforma",
      blocks: [
        {
          type: "p",
          text: "O usuário deve utilizar os serviços somente para finalidades legítimas e de acordo com os recursos disponibilizados pela plataforma.",
        },
        {
          type: "p",
          text: "Não é permitido utilizar o Brazilian Packs ou seus aplicativos para:",
        },
        {
          type: "list",
          items: [
            "tentar comprometer a segurança da plataforma;",
            "explorar vulnerabilidades;",
            "acessar contas de terceiros;",
            "burlar controles de autenticação;",
            "interferir no funcionamento dos servidores;",
            "realizar ataques automatizados;",
            "utilizar bots não autorizados;",
            "sobrecarregar deliberadamente nossos sistemas;",
            "modificar ou manipular indevidamente os aplicativos.",
          ],
        },
      ],
    },
    {
      id: "conta",
      title: "2. Conta do usuário",
      blocks: [
        {
          type: "p",
          text: "Cada usuário é responsável pelas atividades realizadas em sua conta.",
        },
        { type: "p", text: "Não é permitido:" },
        {
          type: "list",
          items: [
            "compartilhar credenciais com pessoas não autorizadas;",
            "vender ou alugar contas;",
            "fornecer senha ou token de acesso a terceiros;",
            "utilizar contas obtidas de maneira irregular;",
            "tentar acessar conteúdos destinados a outro usuário.",
          ],
        },
        {
          type: "p",
          text: "Caso identifique acesso não autorizado, o usuário deve alterar suas credenciais e entrar em contato conosco.",
        },
      ],
    },
    {
      id: "downloader",
      title: "3. Brazilian Packs Downloader",
      blocks: [
        {
          type: "p",
          text: "O Brazilian Packs Downloader é disponibilizado exclusivamente para facilitar o acesso aos conteúdos oferecidos pela plataforma.",
        },
        { type: "p", text: "Não é permitido:" },
        {
          type: "list",
          items: [
            "modificar o aplicativo para contornar limitações;",
            "extrair credenciais ou tokens;",
            "tentar acessar downloads pertencentes a outro usuário;",
            "alterar identificadores de dispositivos para burlar controles;",
            "automatizar requisições de forma abusiva;",
            "redistribuir versões modificadas do aplicativo;",
            "utilizar o Downloader para acessar conteúdos que não estejam disponíveis para sua conta.",
          ],
        },
      ],
    },
    {
      id: "conteudo",
      title: "4. Conteúdo e downloads",
      blocks: [
        {
          type: "p",
          text: "O acesso ao conteúdo disponibilizado pela plataforma deve respeitar as permissões associadas à conta do usuário.",
        },
        {
          type: "p",
          text: "A existência de um botão de download não concede automaticamente autorização para redistribuir, revender ou disponibilizar publicamente determinado conteúdo.",
        },
        {
          type: "p",
          text: "O usuário é responsável por observar direitos autorais, licenças e demais regras aplicáveis ao uso dos arquivos acessados.",
        },
      ],
    },
    {
      id: "compartilhamento",
      title: "5. Compartilhamento e redistribuição",
      blocks: [
        {
          type: "p",
          text: "Não é permitido utilizar a plataforma para criar serviços paralelos de distribuição do nosso acervo.",
        },
        {
          type: "p",
          text: "Isso inclui, quando não autorizado:",
        },
        {
          type: "list",
          items: [
            "compartilhar em massa links internos;",
            "disponibilizar arquivos em outros sites;",
            "criar mirrors do catálogo;",
            "revender acessos;",
            "redistribuir credenciais;",
            "copiar sistematicamente o catálogo para outra plataforma.",
          ],
        },
      ],
    },
    {
      id: "seguranca",
      title: "6. Segurança",
      blocks: [
        { type: "p", text: "É proibido tentar:" },
        {
          type: "list",
          items: [
            "descobrir vulnerabilidades da plataforma sem autorização;",
            "realizar engenharia reversa com finalidade de burlar segurança;",
            "interceptar comunicações;",
            "adulterar requisições;",
            "acessar banco de dados ou infraestrutura interna;",
            "obter chaves privadas;",
            "acessar APIs administrativas;",
            "executar código malicioso contra nossos sistemas.",
          ],
        },
        {
          type: "p",
          text: "Caso encontre uma possível vulnerabilidade, recomendamos que ela seja informada de forma responsável para:",
        },
        { type: "p", text: LEGAL_CONTACT_EMAIL },
      ],
    },
    {
      id: "automacao",
      title: "7. Automação e uso excessivo",
      blocks: [
        {
          type: "p",
          text: "Ferramentas de automação externas não autorizadas podem ser bloqueadas quando:",
        },
        {
          type: "list",
          items: [
            "causarem sobrecarga;",
            "criarem milhares de requisições injustificadas;",
            "tentarem copiar sistematicamente o catálogo;",
            "contornarem limites estabelecidos;",
            "prejudicarem outros usuários.",
          ],
        },
        {
          type: "p",
          text: "O uso normal do Brazilian Packs Downloader oficial não é considerado comportamento abusivo.",
        },
      ],
    },
    {
      id: "comunidade",
      title: "8. Comunidade e suporte",
      blocks: [
        {
          type: "p",
          text: "Nos canais de comunicação relacionados à Brazilian Remix Service, esperamos tratamento respeitoso entre usuários, equipe e colaboradores.",
        },
        { type: "p", text: "Não serão tolerados:" },
        {
          type: "list",
          items: [
            "ameaças;",
            "assédio;",
            "perseguição;",
            "spam;",
            "golpes;",
            "tentativa de obtenção de credenciais;",
            "disseminação deliberada de malware;",
            "divulgação de informações privadas de terceiros.",
          ],
        },
      ],
    },
    {
      id: "fraudes",
      title: "9. Fraudes",
      blocks: [
        {
          type: "p",
          text: "Contas poderão ser investigadas ou restringidas quando houver indícios de:",
        },
        {
          type: "list",
          items: [
            "fraude de pagamento;",
            "utilização de credenciais roubadas;",
            "falsificação de identidade;",
            "tentativa de contornar cobranças;",
            "abuso deliberado de benefícios;",
            "manipulação dos sistemas da plataforma.",
          ],
        },
      ],
    },
    {
      id: "medidas",
      title: "10. Medidas aplicáveis",
      blocks: [
        {
          type: "p",
          text: "Dependendo da gravidade da violação, poderemos:",
        },
        {
          type: "list",
          items: [
            "emitir advertência;",
            "limitar determinada funcionalidade;",
            "desconectar dispositivos;",
            "bloquear temporariamente uma conta;",
            "cancelar sessões;",
            "suspender ou encerrar acesso;",
            "preservar registros necessários para investigação;",
            "adotar medidas legais quando cabíveis.",
          ],
        },
        {
          type: "p",
          text: "As medidas devem ser proporcionais à situação e observar os direitos aplicáveis.",
        },
      ],
    },
    {
      id: "denuncias",
      title: "11. Denúncias",
      blocks: [
        {
          type: "p",
          text: "Usuários podem comunicar possíveis violações deste Código pelo e-mail:",
        },
        { type: "p", text: LEGAL_CONTACT_EMAIL },
        {
          type: "p",
          text: "Ao realizar uma denúncia, evite enviar senhas, tokens ou outras credenciais.",
        },
      ],
    },
    {
      id: "alteracoes",
      title: "12. Alterações deste Código",
      blocks: [
        {
          type: "p",
          text: "Este Código poderá ser atualizado conforme:",
        },
        {
          type: "list",
          items: [
            "novos recursos forem adicionados;",
            "novos aplicativos forem lançados;",
            "riscos de segurança forem identificados;",
            "alterações legais ou operacionais ocorrerem.",
          ],
        },
        {
          type: "p",
          text: "A versão mais recente será disponibilizada no site.",
        },
      ],
    },
    {
      id: "contato",
      title: "13. Contato",
      blocks: [
        { type: "p", text: "Brazilian Remix Service" },
        { type: "p", text: `E-mail: ${LEGAL_CONTACT_EMAIL}` },
      ],
    },
  ],
};
