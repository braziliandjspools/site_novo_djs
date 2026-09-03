import type { LegalDocument } from "../legal-types";
import { LEGAL_CONTACT_EMAIL } from "../legal-types";

export const downloaderPrivacyDocument: LegalDocument = {
  title: "Política de Privacidade — Brazilian Packs Downloader",
  updatedAt: "3 de setembro de 2026",
  contactEmail: LEGAL_CONTACT_EMAIL,
  contactSubject: "Privacidade — Brazilian Packs Downloader",
  ctaLabel: "Falar sobre privacidade",
  intro: [
    {
      type: "p",
      text: "A Brazilian Remix Service respeita a sua privacidade e está comprometida com a proteção dos seus dados pessoais.",
    },
    {
      type: "p",
      text: "Esta Política de Privacidade explica como as informações são tratadas durante o uso do Brazilian Packs Downloader, aplicativo destinado a permitir que usuários autorizados enviem músicas e outros arquivos disponibilizados pela plataforma Brazilian Packs para seus dispositivos.",
    },
    {
      type: "p",
      text: "Ao utilizar o Brazilian Packs Downloader, você declara estar ciente das práticas descritas nesta Política.",
    },
  ],
  sections: [
    {
      id: "quem-somos",
      title: "1. Quem somos",
      blocks: [
        {
          type: "p",
          text: "O Brazilian Packs Downloader é um aplicativo disponibilizado pela Brazilian Remix Service para usuários da plataforma Brazilian Packs.",
        },
        {
          type: "p",
          text: "Para dúvidas relacionadas à privacidade e proteção de dados, entre em contato:",
        },
        { type: "p", text: `E-mail: ${LEGAL_CONTACT_EMAIL}` },
      ],
    },
    {
      id: "quais-dados",
      title: "2. Quais dados podemos tratar",
      blocks: [
        {
          type: "p",
          text: "Para que o aplicativo funcione corretamente, podemos tratar algumas informações relacionadas à sua conta, ao dispositivo e às operações realizadas.",
        },
        { type: "p", text: "Dados da conta" },
        {
          type: "p",
          text: "Podemos utilizar informações já associadas à sua conta na plataforma Brazilian Packs, como:",
        },
        {
          type: "list",
          items: [
            "nome;",
            "e-mail;",
            "identificador interno do usuário;",
            "status da conta ou assinatura;",
            "informações necessárias para autenticação.",
          ],
        },
        {
          type: "p",
          text: "Sua senha não deve ser armazenada em texto puro pelo Brazilian Packs Downloader.",
        },
      ],
    },
    {
      id: "dispositivo",
      title: "3. Informações sobre o dispositivo",
      blocks: [
        {
          type: "p",
          text: "Quando o aplicativo é conectado à sua conta, podemos registrar informações necessárias para identificar e gerenciar o dispositivo, como:",
        },
        {
          type: "list",
          items: [
            "identificador único do dispositivo;",
            "nome do computador;",
            "sistema operacional;",
            "versão do Brazilian Packs Downloader;",
            "status de conexão;",
            "data da última conexão;",
            "data de registro do dispositivo.",
          ],
        },
        {
          type: "p",
          text: "Esses dados são utilizados, por exemplo, para que você consiga enviar um download especificamente para:",
        },
        {
          type: "list",
          items: ["PC Studio", "Notebook", "ou outro dispositivo autorizado."],
        },
      ],
    },
    {
      id: "downloads",
      title: "4. Informações sobre downloads",
      blocks: [
        {
          type: "p",
          text: "Para sincronizar a fila entre o site e o aplicativo, podemos tratar informações como:",
        },
        {
          type: "list",
          items: [
            "identificador do arquivo;",
            "nome do arquivo;",
            "pasta ou categoria;",
            "origem do arquivo;",
            "dispositivo selecionado;",
            "status do download;",
            "percentual de progresso;",
            "tamanho do arquivo;",
            "data em que o download foi solicitado;",
            "início e conclusão do download;",
            "eventuais mensagens técnicas de erro.",
          ],
        },
        {
          type: "p",
          text: "Essas informações permitem que o site e o aplicativo exibam estados como:",
        },
        { type: "p", text: "Na fila → Baixando → Concluído" },
      ],
    },
    {
      id: "arquivos-musica",
      title: "5. Arquivos de música",
      blocks: [
        {
          type: "p",
          text: "Os arquivos de música não são armazenados dentro do banco de dados do Brazilian Packs Downloader.",
        },
        {
          type: "p",
          text: "Quando tecnicamente aplicável, o download ocorre diretamente entre a origem autorizada do arquivo e o dispositivo do usuário.",
        },
        { type: "p", text: "Exemplo:" },
        {
          type: "pre",
          text: "Brazilian Packs\n       ↓\nSolicitação do download\n       ↓\nBrazilian Packs Downloader\n       ↓\nGoogle Drive\n       ↓\nPasta escolhida no seu computador",
        },
        {
          type: "p",
          text: "O banco de dados é utilizado principalmente para sincronizar informações da fila, dispositivos e status dos downloads.",
        },
      ],
    },
    {
      id: "google-drive",
      title: "6. Google Drive",
      blocks: [
        {
          type: "p",
          text: "Parte do conteúdo disponibilizado pelo Brazilian Packs pode estar armazenada no Google Drive.",
        },
        {
          type: "p",
          text: "Quando o usuário solicita um arquivo, o aplicativo pode utilizar o identificador ou endereço necessário para obter esse conteúdo a partir da infraestrutura do Google.",
        },
        {
          type: "p",
          text: "O Brazilian Packs Downloader não necessita, por esse motivo, de acesso à sua conta pessoal do Google, salvo se alguma funcionalidade futura exigir isso e houver informação e autorização adequadas.",
        },
        {
          type: "p",
          text: "O tratamento realizado pelo Google também está sujeito às próprias políticas e termos do Google.",
        },
      ],
    },
    {
      id: "banco-de-dados",
      title: "7. Banco de dados",
      blocks: [
        {
          type: "p",
          text: "Podemos utilizar infraestrutura de banco de dados fornecida pela Neon para armazenar informações necessárias ao funcionamento da plataforma, como:",
        },
        {
          type: "list",
          items: [
            "identificação da conta;",
            "dispositivos registrados;",
            "fila de downloads;",
            "status dos downloads;",
            "histórico e informações operacionais necessárias.",
          ],
        },
        { type: "p", text: "Os arquivos de música não são armazenados no Neon." },
      ],
    },
    {
      id: "dados-locais",
      title: "8. Dados mantidos apenas no seu computador",
      blocks: [
        {
          type: "p",
          text: "Diversas configurações do aplicativo podem permanecer exclusivamente no dispositivo do usuário.",
        },
        {
          type: "p",
          text: "Dependendo das funcionalidades habilitadas, isso pode incluir:",
        },
        {
          type: "list",
          items: [
            "pasta escolhida para downloads;",
            "limite de velocidade;",
            "preferência de downloads simultâneos;",
            "ordem local da fila;",
            "preferências de notificações;",
            "horário programado para downloads;",
            "arquivos temporários .part;",
            "determinadas estatísticas locais;",
            "preferências de organização.",
          ],
        },
        {
          type: "p",
          text: "Essas informações não precisam ser enviadas ao nosso servidor quando não forem necessárias ao funcionamento da conta ou da sincronização.",
        },
      ],
    },
    {
      id: "diagnostico",
      title: "9. Diagnóstico e registros técnicos",
      blocks: [
        {
          type: "p",
          text: "O aplicativo poderá gerar informações técnicas para permitir funcionamento, diagnóstico e correção de problemas.",
        },
        { type: "p", text: "Isso pode incluir:" },
        {
          type: "list",
          items: [
            "versão do aplicativo;",
            "erros de conexão;",
            "falhas de download;",
            "status do Download Manager;",
            "eventos de inicialização e encerramento;",
            "informações técnicas relacionadas à comunicação com nossos servidores.",
          ],
        },
        {
          type: "p",
          text: "Projetamos o aplicativo para evitar registrar em logs informações como:",
        },
        {
          type: "list",
          items: [
            "senhas;",
            "tokens completos de autenticação;",
            "chaves privadas;",
            "credenciais de banco de dados;",
            "credenciais privadas do Google.",
          ],
        },
      ],
    },
    {
      id: "finalidades",
      title: "10. Para que utilizamos os dados",
      blocks: [
        { type: "p", text: "Os dados tratados podem ser utilizados para:" },
        {
          type: "list",
          items: [
            "autenticar sua conta;",
            "permitir o funcionamento do aplicativo;",
            "registrar seus dispositivos;",
            "enviar downloads para o dispositivo correto;",
            "sincronizar sua fila;",
            "acompanhar o estado dos downloads;",
            "impedir acesso não autorizado a jobs de outros usuários;",
            "manter a segurança da plataforma;",
            "diagnosticar erros;",
            "prestar suporte;",
            "prevenir fraudes e abusos;",
            "manter e melhorar o serviço;",
            "cumprir obrigações legais aplicáveis.",
          ],
        },
      ],
    },
    {
      id: "bases-legais",
      title: "11. Bases legais",
      blocks: [
        {
          type: "p",
          text: "Dependendo do tratamento realizado, podemos utilizar bases legais previstas na Lei Geral de Proteção de Dados Pessoais — LGPD, incluindo, conforme aplicável:",
        },
        {
          type: "list",
          items: [
            "execução de contrato ou procedimentos relacionados ao serviço solicitado;",
            "cumprimento de obrigação legal ou regulatória;",
            "legítimo interesse, respeitados os direitos e liberdades do titular;",
            "exercício regular de direitos;",
            "consentimento, quando ele for efetivamente necessário.",
          ],
        },
        {
          type: "p",
          text: "O uso de consentimento não será presumido para tratamentos que estejam fundamentados adequadamente em outra base legal.",
        },
      ],
    },
    {
      id: "compartilhamento",
      title: "12. Compartilhamento de informações",
      blocks: [
        { type: "p", text: "Não vendemos seus dados pessoais." },
        {
          type: "p",
          text: "Podemos compartilhar informações estritamente necessárias com fornecedores envolvidos na operação da plataforma, incluindo:",
        },
        {
          type: "list",
          items: [
            "infraestrutura de banco de dados;",
            "hospedagem e servidores;",
            "serviços de autenticação, quando aplicável;",
            "Google Drive e infraestrutura Google para disponibilização de arquivos;",
            "serviços necessários para segurança e operação da plataforma.",
          ],
        },
        {
          type: "p",
          text: "Esses fornecedores devem receber somente as informações necessárias para a finalidade correspondente.",
        },
      ],
    },
    {
      id: "transferencia-internacional",
      title: "13. Transferência internacional de dados",
      blocks: [
        {
          type: "p",
          text: "Alguns fornecedores de tecnologia podem utilizar servidores ou infraestrutura localizada fora do Brasil.",
        },
        {
          type: "p",
          text: "Por isso, determinados dados podem estar sujeitos a transferência ou processamento internacional, observando os requisitos aplicáveis da LGPD e demais normas de proteção de dados.",
        },
      ],
    },
    {
      id: "seguranca",
      title: "14. Segurança",
      blocks: [
        {
          type: "p",
          text: "Adotamos medidas técnicas e administrativas destinadas a reduzir riscos de:",
        },
        {
          type: "list",
          items: [
            "acesso não autorizado;",
            "alteração indevida;",
            "perda;",
            "divulgação indevida;",
            "uso inadequado das informações.",
          ],
        },
        {
          type: "p",
          text: "Entre as medidas previstas na arquitetura do aplicativo estão:",
        },
        {
          type: "list",
          items: [
            "autenticação;",
            "separação de dados por usuário;",
            "identificação dos dispositivos;",
            "validação de autorização no servidor;",
            "comunicação segura;",
            "não inclusão de segredos do servidor no executável;",
            "armazenamento seguro de credenciais quando aplicável.",
          ],
        },
        {
          type: "p",
          text: "Nenhum sistema, entretanto, pode garantir segurança absoluta.",
        },
      ],
    },
    {
      id: "credenciais",
      title: "15. Credenciais e senhas",
      blocks: [
        {
          type: "p",
          text: "O Brazilian Packs Downloader não deve armazenar sua senha em texto puro.",
        },
        {
          type: "p",
          text: "Informações secretas da infraestrutura, como:",
        },
        {
          type: "list",
          items: [
            "DATABASE_URL",
            "Google API Secret",
            "JWT Secret",
            "Service Role Key",
            "Signing Private Key",
          ],
        },
        {
          type: "p",
          text: "não devem ser distribuídas dentro do aplicativo.",
        },
        {
          type: "p",
          text: "Operações privilegiadas são realizadas pelo backend da plataforma.",
        },
      ],
    },
    {
      id: "retencao",
      title: "16. Por quanto tempo mantemos os dados",
      blocks: [
        {
          type: "p",
          text: "Mantemos informações pessoais pelo período necessário para:",
        },
        {
          type: "list",
          items: [
            "prestar o serviço;",
            "manter sua conta;",
            "sincronizar dispositivos e downloads;",
            "cumprir obrigações legais;",
            "prevenir fraude ou abuso;",
            "exercer ou defender direitos.",
          ],
        },
        {
          type: "p",
          text: "Informações que deixarem de ser necessárias poderão ser excluídas ou anonimizadas, observadas as hipóteses legais de conservação.",
        },
        {
          type: "p",
          text: "O histórico de downloads poderá ser removido ou reduzido conforme políticas internas e configurações da plataforma.",
        },
      ],
    },
    {
      id: "exclusao-arquivos",
      title: "17. Exclusão de arquivos do computador",
      blocks: [
        {
          type: "p",
          text: "Remover um download do histórico do Brazilian Packs Downloader não significa necessariamente excluir o respectivo arquivo do computador.",
        },
        {
          type: "p",
          text: "A exclusão de arquivos físicos armazenados pelo usuário deve ser uma operação específica e claramente identificada.",
        },
        {
          type: "p",
          text: "O aplicativo não deve eliminar músicas do computador silenciosamente apenas porque um registro foi removido do histórico.",
        },
      ],
    },
    {
      id: "seus-direitos",
      title: "18. Seus direitos",
      blocks: [
        {
          type: "p",
          text: "Nos termos da LGPD e conforme aplicável ao caso concreto, você poderá solicitar direitos relacionados aos seus dados pessoais, incluindo:",
        },
        {
          type: "list",
          items: [
            "confirmação da existência de tratamento;",
            "acesso aos seus dados;",
            "correção de informações incompletas, inexatas ou desatualizadas;",
            "informações sobre compartilhamento;",
            "anonimização, bloqueio ou eliminação em determinadas situações;",
            "eliminação de dados tratados com consentimento, quando aplicável;",
            "portabilidade nos termos da regulamentação;",
            "revogação do consentimento, quando aplicável;",
            "oposição ao tratamento nas hipóteses previstas em lei.",
          ],
        },
        {
          type: "p",
          text: "A própria ANPD lista esses entre os principais direitos garantidos aos titulares pela LGPD.",
        },
        { type: "p", text: "Solicitações podem ser enviadas para:" },
        { type: "p", text: LEGAL_CONTACT_EMAIL },
        {
          type: "p",
          text: "Poderemos solicitar informações razoavelmente necessárias para confirmar a identidade do solicitante antes de atender determinados pedidos.",
        },
      ],
    },
    {
      id: "exclusao-conta",
      title: "19. Exclusão da conta",
      blocks: [
        {
          type: "p",
          text: "Quando disponível, o usuário poderá solicitar a exclusão de sua conta e dos dados associados.",
        },
        {
          type: "p",
          text: "Algumas informações poderão precisar ser conservadas pelo período necessário para cumprimento de obrigação legal, prevenção de fraude, exercício regular de direitos ou outras hipóteses previstas na legislação.",
        },
        {
          type: "p",
          text: "A ANPD esclarece que o direito à exclusão não é absoluto quando existe fundamento legal para conservação das informações.",
        },
      ],
    },
    {
      id: "criancas",
      title: "20. Crianças e adolescentes",
      blocks: [
        {
          type: "p",
          text: "O Brazilian Packs Downloader não é direcionado intencionalmente à coleta de dados pessoais de crianças.",
        },
        {
          type: "p",
          text: "Caso sejam implementados recursos ou serviços destinados especificamente a crianças ou adolescentes, serão adotadas as medidas adicionais exigidas pela legislação aplicável.",
        },
      ],
    },
    {
      id: "atualizacoes",
      title: "21. Atualizações desta Política",
      blocks: [
        {
          type: "p",
          text: "Esta Política poderá ser atualizada para refletir:",
        },
        {
          type: "list",
          items: [
            "novas funcionalidades;",
            "alterações técnicas;",
            "novos fornecedores;",
            "alterações legais ou regulatórias;",
            "mudanças no funcionamento do Brazilian Packs Downloader.",
          ],
        },
        {
          type: "p",
          text: "A data da última atualização será sempre indicada no início desta página.",
        },
        {
          type: "p",
          text: "Quando uma alteração for relevante, poderemos informar os usuários por meio do site, aplicativo ou outros canais apropriados.",
        },
      ],
    },
    {
      id: "contato",
      title: "22. Contato",
      blocks: [
        {
          type: "p",
          text: "Para dúvidas, solicitações relacionadas à privacidade ou exercício dos seus direitos:",
        },
        { type: "p", text: "Brazilian Remix Service" },
        { type: "p", text: `E-mail: ${LEGAL_CONTACT_EMAIL}` },
      ],
    },
  ],
};
