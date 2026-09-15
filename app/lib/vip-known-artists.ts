import { slugifyFolderName } from "./vip-music-slugs";

export type VipKnownArtist = {
  /** Nome canônico de exibição */
  name: string;
  /** Slug estável (gerado do name se omitido) */
  slug?: string;
  /** Nomes alternativos que batem no mesmo perfil */
  aliases?: string[];
  /** Frase curta para cards / listagens */
  shortBio?: string | null;
  /** Bio completa (parágrafos) */
  bio?: string | null;
  /** Gêneros / estilos associados */
  genres?: string[];
  /** Cidade/estado ou região de origem */
  origin?: string | null;
  /** Ex.: 1975–atual */
  yearsActive?: string | null;
  /** Hits / obras de referência */
  notableWorks?: string[];
  /** Foto do perfil (local ou URL remota permitida no next.config) */
  imageUrl?: string | null;
  spotifyUrl?: string | null;
  /** Destacar na grade /musicas/artistas */
  featured?: boolean;
};

/**
 * Catálogo curado de artistas conhecidos no acervo VIP.
 * Bios geradas/editadas com apoio de OpenRouter (editorial BRS).
 * Sem entrada aqui o perfil ainda existe (via slug), mas sem foto/bio oficiais.
 */
export const VIP_KNOWN_ARTISTS: VipKnownArtist[] = [
  {
    name: "Zé Ramalho",
    aliases: [
      "Ze Ramalho",
      "O Poeta do Brejo da Paraíba",
    ],
    shortBio: "Voz cavernosa e poesia mística que funde o folk nordestino ao rock e ganha frequentes releituras nas pistas.",
    bio: "Nascido em Brejo do Cruz, Zé Ramalho é uma das figuras mais singulares da música popular brasileira. Sua obra une a literatura de cordel, a psicodelia dos anos 1970, o folk e o rock progressivo sob uma interpretação vocal inconfundível e telúrica.\n\nCom hinos atemporais que atravessam gerações, suas composições épicas tornaram-se matérias-primas cobiçadas para remixes de downtempo, afro house e psytrance no cenário eletrônico nacional e internacional.",
    genres: [
      "MPB",
      "Folk Rock",
      "Psicodelia Nordestina",
      "Rock Brasileiro",
    ],
    origin: "Brejo do Cruz, Paraíba",
    yearsActive: "1975–atual",
    notableWorks: [
      "Chão de Giz",
      "Avôhai",
      "Admirável Gado Novo",
      "Sinônimos",
      "Frevo Mulher",
    ],
    imageUrl: null,
    spotifyUrl: null,
    featured: true,
  },
  {
    name: "Alok",
    aliases: [
      "DJ Alok",
      "Alok Petrillo",
    ],
    shortBio: "Pioneiro do Brazilian Bass e maior embaixador da música eletrônica brasileira nos palcos mundiais.",
    bio: "Nascido em Goiânia e criado no seio da cultura psytrance brasileira, Alok transformou o panorama da dance music ao forjar a identidade sonora do Brazilian Bass nos anos 2010. Sua fórmula de graves encorpados e melodias vocais pop projetou o país globalmente.\n\nAlém de liderar rankings mundiais e comandar palcos nos maiores festivais do planeta, mantém constante diálogo com a cena pop e o patrimônio sonoro de raízes indígenas brasileiras.",
    genres: [
      "Brazilian Bass",
      "Slap House",
      "Dance Pop",
      "Tech House",
    ],
    origin: "Goiânia, Goiás",
    yearsActive: "2004–atual",
    notableWorks: [
      "Hear Me Now",
      "Fuego",
      "Deep Down",
      "Never Let Me Go",
      "Don't Say Goodbye",
    ],
    imageUrl: "/images/music-producer.png",
    spotifyUrl: null,
    featured: true,
  },
  {
    name: "Anitta",
    aliases: [
      "Larissa de Macedo Machado",
      "Poderosa",
    ],
    shortBio: "A estrela global que levou o funk carioca das favelas do Rio para as paradas internacionais.",
    bio: "Vinda de Honório Gurgel, no Rio de Janeiro, Anitta começou no circuito de bailes da Furacão 2000 até se estabelecer como a maior estrategista pop e artista brasileira do século XXI no exterior.\n\nSua discografia é base indispensável para DJs e remixers de club music, transitando com fluidez por funk carioca, reggaeton, afrobeat e pop latino em produções de alto calibre dançante.",
    genres: [
      "Funk Carioca",
      "Latin Pop",
      "Reggaeton",
      "Dance Pop",
    ],
    origin: "Rio de Janeiro, Rio de Janeiro",
    yearsActive: "2010–atual",
    notableWorks: [
      "Envolver",
      "Show das Poderosas",
      "Vai Malandra",
      "Bang",
      "Downtown",
    ],
    imageUrl: "/images/musicas-portal.png",
    spotifyUrl: null,
    featured: true,
  },
  {
    name: "Vintage Culture",
    aliases: [
      "Lukas Ruiz",
      "Vintage",
    ],
    shortBio: "Ícone do house e tech house contemporâneo, mestre em unir nostalgia oitentista a graves de pista.",
    bio: "Diretamente de Mundo Novo, Mato Grosso do Sul, Lukas Ruiz começou retrabalhando clássicos do pop rock dos anos 1980 e 1990 em versões clubbers hipnóticas, definindo a assinatura do som eletrônico brasileiro do meio da década de 2010.\n\nHoje é atração principal nos principais clubs e festivais de Ibiza, Las Vegas e Europa, sendo uma das referências máximas para produtores de bootlegs e remixes no Brasil.",
    genres: [
      "House",
      "Tech House",
      "Deep House",
      "Melodic House",
    ],
    origin: "Mundo Novo, Mato Grosso do Sul",
    yearsActive: "2013–atual",
    notableWorks: [
      "Slow Down",
      "In The Dark",
      "Cali Dreams",
      "Save Me",
      "Amanhã",
    ],
    imageUrl: "/images/curadoria-brs-v3.jpg",
    spotifyUrl: null,
    featured: true,
  },
  {
    name: "Pedro Sampaio",
    aliases: [
      "DJ Pedro Sampaio",
      "Pe Sampaio",
    ],
    shortBio: "DJ, produtor e performer que sintetizou o funk pop e brega funk em sucessos virais de pista.",
    bio: "Carioca que despontou na internet por mashups e edits velozes, Pedro Sampaio revolucionou o papel do DJ no Brasil ao assumir o centro do palco como cantor, produtor e showman.\n\nCom produções ultraenergéticas que mesclam tambores de funk, pisadinha, EDM e pop chiclete, seus lançamentos e acapellas são presenças certas nas cases de DJs de open format.",
    genres: [
      "Funk Pop",
      "Brega Funk",
      "Eletro Funk",
      "Dance Pop",
    ],
    origin: "Rio de Janeiro, Rio de Janeiro",
    yearsActive: "2017–atual",
    notableWorks: [
      "Dançarina",
      "Sentadão",
      "Atenção",
      "Galopa",
      "PocPoc",
    ],
    imageUrl: "/images/folder.jpg",
    spotifyUrl: null,
    featured: true,
  },
  {
    name: "Luísa Sonza",
    aliases: [
      "Luisa Sonza",
    ],
    shortBio: "Potência do pop brasileiro contemporâneo que transita com intensidade entre o funk, R&B e MPB.",
    bio: "Nascida no interior do Rio Grande do Sul, Luísa Sonza construiu uma trajetória sólida no pop brasileiro, caracterizada por performances arrojadas, letras autobiográficas e constante experimentação estética.\n\nSeus singles contam com timbragens modernas e vocais marcantes que frequentemente ganham versões club, edits de funk rave e remixes estendidos para as pistas de todo o país.",
    genres: [
      "Pop",
      "Funk Pop",
      "R&B",
      "Trap Pop",
    ],
    origin: "Tuparendi, Rio Grande do Sul",
    yearsActive: "2017–atual",
    notableWorks: [
      "Chico",
      "Sentadona (Remix)",
      "Penhasco",
      "Modo Turbo",
      "Cachorrinhas",
    ],
    imageUrl: "/images/curadoria-brs.jpg",
    spotifyUrl: null,
    featured: true,
  },
  {
    name: "Dennis DJ",
    aliases: [
      "Dennis",
      "Dennison de Azevedo",
    ],
    shortBio: "O grande arquiteto do funk contemporâneo e pioneiro das superproduções de arena com batidões.",
    bio: "Natural de Duque de Caxias, Dennis foi peça fundamental na era de ouro da Furacão 2000, produzindo alguns dos maiores clássicos da história do funk carioca antes de alçar o gênero aos palcos monumentais com o 'Baile do Dennis'.\n\nCom décadas de relevância contínua, domina a arte do remix e da fusão entre a batida de favela, o sertanejo e a eletrônica, sendo uma das mentes mais influentes da DJ culture brasileira.",
    genres: [
      "Funk Carioca",
      "Eletrofunk",
      "Funk Melody",
      "Pop Funk",
    ],
    origin: "Duque de Caxias, Rio de Janeiro",
    yearsActive: "1997–atual",
    notableWorks: [
      "Tá OK",
      "Malandramente",
      "Deixa de Onda",
      "Só Você",
      "Cerol na Mão",
    ],
    imageUrl: "/images/brs-default-cover.png",
    spotifyUrl: null,
    featured: true,
  },
  {
    name: "Kevin o Chris",
    aliases: [
      "Kevin o Chris 150 BPM",
      "O Menino de Caxias",
    ],
    shortBio: "Um dos principais nomes da revolução do funk 150 BPM e exportador da batida acelerada carioca.",
    bio: "Diretamente da Baixada Fluminense, Kevin o Chris tornou-se o principal porta-voz do movimento 150 BPM no final da década de 2010, acelerando o pulso dos bailes e recolocando o funk do Rio no topo do streaming global.\n\nSuas linhas de baixo marcantes, ganchos melódicos e levada ritmada formam a espinha dorsal de sets de DJs que buscam alta voltagem nas pistas de open format e bailes de rua.",
    genres: [
      "Funk 150 BPM",
      "Funk Carioca",
      "TrapFunk",
      "Eletrofunk",
    ],
    origin: "Duque de Caxias, Rio de Janeiro",
    yearsActive: "2016–atual",
    notableWorks: [
      "Ela É do Tipo",
      "Evoluiu",
      "Tá OK",
      "Tipo Gin",
      "Vamos Pra Gaiola",
    ],
    imageUrl: "/images/brs-logo.jpg",
    spotifyUrl: null,
    featured: true,
  },
  {
    name: "DJ Jéssika Luana",
    aliases: [
      "Jessika Luana",
      "DJ Jessika",
    ],
    shortBio: "Expoente do eletrofunk e do som automotivo, com sets enérgicos e forte presença no Centro-Oeste.",
    bio: "Ganhando destaque a partir do circuito do Centro-Oeste e dos palcos de eventos automotivos, DJ Jéssika Luana construiu notoriedade por meio de mixagens ágeis, repertório dançante e conexão direta com a cultura de rua.\n\nSua atuação destaca a força feminina no segmento do eletrofunk e mega funk, sendo figura constante em edições e playlists especializadas em graves potentes.",
    genres: [
      "Eletrofunk",
      "Mega Funk",
      "Funk Automotivo",
      "Dance",
    ],
    origin: "Goiânia, Goiás",
    yearsActive: "2018–atual",
    notableWorks: [
      "Set Eletrofunk Vol. 1",
      "Mega Automotivo",
      "Revoada do Grave",
    ],
    imageUrl: "/images/spotify-dj-banner.jpg",
    spotifyUrl: "https://open.spotify.com/intl-pt/artist/5NdJcuUWBt4pNGJC2sI6iZ",
    featured: false,
  },
  {
    name: "Ludmilla",
    aliases: [
      "MC Beyoncé",
      "Lud",
    ],
    shortBio: "Poderosa camaleoa musical que transita com primor do funk de raiz ao pagode e aos palcos internacionais.",
    bio: "Revelada no início dos anos 2010 como MC Beyoncé em Duque de Caxias, Ludmilla consolidou-se como uma das maiores vocalistas e performers da música brasileira, conquistando prêmios internacionais e o respeito de públicos diversos.\n\nSeja através de suas pedradas de funk, do fenômeno de público do projeto 'Numanice' ou de faixas R&B/afrobeats, sua voz encorpada é uma das fontes mais ricas para edits, remixes house e transições de baile.",
    genres: [
      "Funk Carioca",
      "Pagode",
      "R&B",
      "Pop",
    ],
    origin: "Duque de Caxias, Rio de Janeiro",
    yearsActive: "2012–atual",
    notableWorks: [
      "Maldivas",
      "Verdinha",
      "Cheguei",
      "24 Horas Por Dia",
      "Sintoma de Prazer",
    ],
    imageUrl: null,
    spotifyUrl: null,
    featured: true,
  },
  {
    name: "Pabllo Vittar",
    aliases: [
      "Phabullo Rodrigues da Silva",
    ],
    shortBio: "Ícone pop global que redefiniu a pista brasileira com fusões enérgicas de pop, tecnobrega, forró e club music.",
    bio: "Nascida no Maranhão, Pabllo Vittar consolidou-se como a drag queen mais ouvida do planeta e um dos maiores fenômenos da música pop contemporânea. Sua trajetória começou a ganhar projeção em meados dos anos 2010, culminando em uma explosão de sucessos que misturam a urgência do pop internacional com matrizes rítmicas do Nordeste e do Norte do país.\n\nCom uma identidade vocal marcante e parcerias com grandes nomes globais, sua discografia transita com naturalidade entre o forró eletrônico, o tecnobrega e o funk carioca. Essa versatilidade tornou seu catálogo uma fonte inesgotável para DJs e produtores, que frequentemente utilizam suas faixas em remixes voltados para as pistas mais efervescentes do Brasil e do mundo.",
    genres: [
      "Pop",
      "Tecnobrega",
      "Dance-pop",
      "Funk brasileiro",
    ],
    origin: "Santa Inês, Maranhão",
    yearsActive: "2015–atual",
    notableWorks: [
      "K.O.",
      "Corpo Sensual",
      "Sua Cara",
      "Amor de Que",
      "Problema Seu",
      "Disk Me",
    ],
    imageUrl: null,
    spotifyUrl: null,
    featured: true,
  },
  {
    name: "Ivete Sangalo",
    aliases: [
      "Veveta",
      "Ivete Maria Dias de Sangalo",
    ],
    shortBio: "Força máxima do axé e do pop festivo, dona de hinos eufóricos indispensáveis para pistas e celebrações de grande escala.",
    bio: "Natural de Juazeiro e revelada nacionalmente à frente da Banda Eva nos anos 1990, Ivete Sangalo é sinônimo de energia e domínio cênico no cenário musical brasileiro. Ao longo de sua vitoriosa carreira solo, consolidou-se como a artista mais celebrada do Carnaval de Salvador e uma das vozes mais populares de todas as gerações.\n\nSua música cruza o samba-reggae, o pop, a timbalada e ritmos caribenhos, resultando em refrãos expansivos que funcionam perfeitamente em edits de alta voltagem. Na cultura de DJs de open format e música brasileira, as faixas de Ivete são peças-chave para elevar a energia de qualquer set comemorativo.",
    genres: [
      "Axé",
      "Pop",
      "Samba-reggae",
      "Música Baiana",
    ],
    origin: "Juazeiro, Bahia",
    yearsActive: "1993–atual",
    notableWorks: [
      "Festa",
      "Sorte Grande",
      "Abalou",
      "Tempo de Alegria",
      "Carro Velho",
      "Quando a Chuva Passar",
    ],
    imageUrl: null,
    spotifyUrl: null,
    featured: true,
  },
  {
    name: "Caetano Veloso",
    aliases: [
      "Caetano Emanuel Viana Telles Veloso",
    ],
    shortBio: "Mestre da Tropicália e pilar da MPB, autor de obras poéticas atemporais constantemente revisitadas pela dance music.",
    bio: "Um dos principais arquitetos da Tropicália ao lado de Gilberto Gil, Caetano Veloso revolucionou a cultura brasileira na virada dos anos 1960, conectando a vanguarda internacional à essência popular do Brasil. Ao longo de mais de cinco décadas, sua discografia desafiou convenções estéticas através de poesia lírica, experimentação e sofisticação melódica.\n\nSeus arranjos e vocais carregam uma versatilidade única, servindo de matéria-prima para alguns dos remixes e re-edits mais celebrados na cena de downtempo, organic house e MPB remixada. A elegância de suas harmonias mantém sua obra no centro da pesquisa de seletores em todo o mundo.",
    genres: [
      "MPB",
      "Tropicália",
      "Samba",
      "Vanguarda Pop",
    ],
    origin: "Santo Amaro, Bahia",
    yearsActive: "1965–atual",
    notableWorks: [
      "Alegria, Alegria",
      "Tropicália",
      "Sozinho",
      "Leãozinho",
      "Você É Linda",
      "Podres Poderes",
    ],
    imageUrl: null,
    spotifyUrl: null,
    featured: true,
  },
  {
    name: "Gilberto Gil",
    aliases: [
      "Gilberto Passos Gil Moreira",
      "Gil",
    ],
    shortBio: "Arquiteto da música global brasileira, pioneiro em unir ritmos afro-baianos, funk, reggae e texturas eletrônicas.",
    bio: "Com uma carreira extraordinária iniciada na década de 1960, Gilberto Gil é um dos pensadores musicais mais influentes do país. Cofundador do movimento tropicalista, Gil foi pioneiro ao introduzir elementos do reggae, do funk norte-americano e da música afro-caribenha no caldeirão sonoro brasileiro, sempre com um olhar atento à tecnologia e ao futuro.\n\nSeu álbum 'Realce' e clássicos como 'Palco' e 'Toda Menina Baiana' tornaram-se marcos seminais para a cultura de discotecagem brasileira. Até hoje, os grooves contagiantes e as linhas de baixo de suas faixas são extensamente sampleados e reeditados por DJs de house, disco e afrobeats.",
    genres: [
      "MPB",
      "Tropicália",
      "Samba-reggae",
      "Afropop",
      "Funk",
    ],
    origin: "Salvador, Bahia",
    yearsActive: "1962–atual",
    notableWorks: [
      "Aquele Abraço",
      "Palco",
      "Toda Menina Baiana",
      "Andar com Fé",
      "Esperando na Janela",
      "Expresso 2222",
    ],
    imageUrl: null,
    spotifyUrl: null,
    featured: true,
  },
  {
    name: "Marisa Monte",
    aliases: [
      "Marisa de Azevedo Monte",
    ],
    shortBio: "Voz refinada e autoral da MPB, mescla melodias impecáveis e grooves acústicos ideais para releituras de pista.",
    bio: "Surgida no final dos anos 1980, Marisa Monte estabeleceu um novo padrão de elegância e precisão vocal na música popular brasileira. Aliando o respeito às velhas guardas do samba carioca a uma estética pop sofisticada, ela produziu álbuns aclamados pela crítica e pelo público, além de ter liderado o projeto Tribalistas com Arnaldo Antunes e Carlinhos Brown.\n\nCom timbres cristalinos e arranjos percussivos meticulosos, suas canções ganharam forte presença em sets de lounge, nu-disco e house melódico. Suas composições são procuradas por produtores que buscam harmonias ricas para criar versões dançantes sem perder a delicadeza poética original.",
    genres: [
      "MPB",
      "Pop",
      "Samba",
      "Art Pop",
    ],
    origin: "Rio de Janeiro, Rio de Janeiro",
    yearsActive: "1989–atual",
    notableWorks: [
      "Amor I Love You",
      "Ainda Bem",
      "Já Sei Namorar",
      "Beija Eu",
      "Vilarejo",
      "Não Vá Embora",
    ],
    imageUrl: null,
    spotifyUrl: null,
    featured: true,
  },
  {
    name: "Seu Jorge",
    aliases: [
      "Jorge Mário da Silva",
    ],
    shortBio: "A voz marcante do samba-rock e da crônica urbana carioca, consagrado em pistas de dança cosmopolitas globais.",
    bio: "Nascido em Belford Roxo, Seu Jorge transformou vivências da periferia carioca e a herança do samba-rock em um dos sons mais potentes da música contemporânea. Projetou-se inicialmente com o grupo Farofa Carioca e no cinema, para logo em seguida atingir consagração solo com álbuns que definiram o balanço brasileiro dos anos 2000.\n\nSua voz rouca e barítona, aliada a violões percussivos e batidas sincopadas, tornou faixas como 'Burguesinha' e 'Mina do Condomínio' presenças obrigatórias em qualquer repertório festivo. No exterior, suas gravações e versões em bossa nova ganharam status cult entre DJs europeus e norte-americanos de funk, soul e house.",
    genres: [
      "Samba-rock",
      "MPB",
      "Soul",
      "Funk",
    ],
    origin: "Belford Roxo, Rio de Janeiro",
    yearsActive: "1997–atual",
    notableWorks: [
      "Burguesinha",
      "Amiga da Minha Mulher",
      "Mina do Condomínio",
      "Carolina",
      "É Isso Aí",
      "Tive Razão",
    ],
    imageUrl: null,
    spotifyUrl: null,
    featured: true,
  },
  {
    name: "Jorge Ben Jor",
    aliases: [
      "Jorge Ben",
      "Jorge Duílio Lima Meneses",
    ],
    shortBio: "Criador do samba-rock e arquiteto supremo do groove nacional, base canônica para samples, edits e remixes de pista.",
    bio: "Jorge Ben Jor é o pai fundador do samba-rock e um dos maiores arquitetos do ritmo em todo o planeta. Lançando mão de uma batida de violão inimitável e refrãos sincopados desde sua estreia em 1963 com 'Samba Esquema Novo', Jorge inventou um território sonoro próprio onde a tradição do samba se funde à cadência da música negra norte-americana.\n\nSua produção ao longo das décadas de 1970 e 1980 produziu alguns dos grooves mais sampleados da história da dance music internacional. De sets de disco house a re-edits de funk/boogie, sua obra é matéria-prima fundamental para DJs que procuram calor orgânico e euforia imediata.",
    genres: [
      "Samba-rock",
      "Funk",
      "Soul",
      "MPB",
      "Samba",
    ],
    origin: "Rio de Janeiro, Rio de Janeiro",
    yearsActive: "1963–atual",
    notableWorks: [
      "Mas Que Nada",
      "Taj Mahal",
      "País Tropical",
      "Chove Chuva",
      "Fio Maravilha",
      "W/Brasil",
    ],
    imageUrl: null,
    spotifyUrl: null,
    featured: true,
  },
  {
    name: "Tim Maia",
    aliases: [
      "Sebastião Rodrigues Maia",
      "O Síndico",
    ],
    shortBio: "O pioneiro incontestável do soul e funk no Brasil, dono de vocais arrebatadores e clássicos absolutos dos bailes.",
    bio: "Tim Maia introduziu com força descomunal o soul, o funk e a disco music na música brasileira. Nascido na Tijuca, levou para os estúdios nacionais a experiência acumulada nos Estados Unidos, forjando uma sonoridade de metais cortantes, baixos pulsantes e uma das maiores interpretações vocais da história da música ocidental.\n\nSuas baladas e hinos dançantes são a espinha dorsal dos bailes de black music e festas brasileiras há mais de quatro décadas. O catálogo de Tim Maia é constantemente homenageado, reeditado e remasterizado por produtores de dance music, permanecendo como sinônimo definitivo de groove autêntico.",
    genres: [
      "Soul",
      "Funk",
      "Disco",
      "MPB",
      "R&B",
    ],
    origin: "Rio de Janeiro, Rio de Janeiro",
    yearsActive: "1957–1998",
    notableWorks: [
      "Não Quero Dinheiro (Só Quero Amar)",
      "Descobridor dos Sete Mares",
      "Gostava Tanto de Você",
      "Do Leme ao Pontal",
      "Azul da Cor do Mar",
      "Primavera",
    ],
    imageUrl: null,
    spotifyUrl: null,
    featured: true,
  },
  {
    name: "Roberto Carlos",
    aliases: [
      "O Rei",
      "Roberto Carlos Braga",
    ],
    shortBio: "O maior ícone da canção popular romântica e da Jovem Guarda, com clássicos históricos adorados por seletores e produtores.",
    bio: "Conhecido como 'O Rei', Roberto Carlos liderou o movimento da Jovem Guarda nos anos 1960 e transformou-se no artista de maior vendagem de discos da história da música brasileira. Nas décadas seguintes, firmou-se como o grande cronista do romance popular, assinando canções monumentais ao lado do parceiro Erasmo Carlos.\n\nPara além do repertório romântico, suas incursões pelo soul, funk e psicodelia no final dos anos 1960 e início dos 1970 deixaram gravações memoráveis repletas de grooves refinados. Seus maiores sucessos continuam servindo de base para edits de pista nostálgicos e releituras modernas de grande apelo emotivo.",
    genres: [
      "Pop",
      "MPB",
      "Rock",
      "Soul/Balada",
    ],
    origin: "Cachoeiro de Itapemirim, Espírito Santo",
    yearsActive: "1959–atual",
    notableWorks: [
      "Detalhes",
      "Como É Grande o Meu Amor por Você",
      "Jesus Cristo",
      "O Portão",
      "Esse Cara Sou Eu",
      "É Preciso Saber Viver",
    ],
    imageUrl: null,
    spotifyUrl: null,
    featured: true,
  },
  {
    name: "Emicida",
    aliases: [
      "Leandro Roque de Oliveira",
    ],
    shortBio: "Líder criativo do rap nacional contemporâneo, expandindo a lírica urbana e o hip hop em diálogo direto com a música global.",
    bio: "Oriundo das batalhas de rima da Zona Norte de São Paulo, Emicida ascendeu como um dos mais importantes pensadores e compositores do rap brasileiro. Com projetos inovadores e uma visão artística ampla, ele transcendeu as fronteiras do hip hop tradicional para abraçar o samba, os afrobeats, a MPB e os ritmos eletrônicos modernos.\n\nÁlbuns conceituais como 'AmarElo' consolidaram seu impacto cultural e sonoro, aproximando a lírica de resistência da celebração comunitária. As produções de suas faixas contam com beats refinados e ganchos melódicos poderosos, encontrando ampla acolhida em sets de club music, trap, hip hop e remixes eletrônicos.",
    genres: [
      "Hip Hop",
      "Rap",
      "MPB",
      "Afrobeats",
    ],
    origin: "São Paulo, São Paulo",
    yearsActive: "2006–atual",
    notableWorks: [
      "AmarElo",
      "Principia",
      "Passarinhos",
      "Hoje Cedo",
      "Triunfo",
      "Bang",
    ],
    imageUrl: null,
    spotifyUrl: null,
    featured: true,
  },
  {
    name: "Gloria Groove",
    aliases: [
      "Daniel Garcia",
      "Lady Leste",
    ],
    shortBio: "Versatilidade ímpar entre pop, funk e hip hop, sendo uma das vozes mais potentes e requisitadas da música pop nacional.",
    bio: "Daniel Garcia, conhecido artisticamente como Gloria Groove, é cantor, compositor, dublador e drag queen paulistano. Desde meados dos anos 2010, consolidou-se como um dos fenômenos mais versáteis da cultura pop brasileira, transitando com maestria entre o rap, R&B contemporâneo, funk carioca e pop radiofônico.\n\nCom o marco do álbum 'Lady Leste' e apresentações arrebatadoras em grandes festivais, suas faixas ganharam enorme tração em pistas e sets de DJs, gerando versões de pista que vão do house ao funk 150 BPM.",
    genres: [
      "Pop",
      "Funk",
      "Hip Hop",
      "R&B",
    ],
    origin: "São Paulo, SP",
    yearsActive: "2016–atual",
    notableWorks: [
      "Vermelho",
      "A Queda",
      "Bumbum de Ouro",
      "Coisa Boa",
      "Leilão",
    ],
    imageUrl: null,
    spotifyUrl: null,
    featured: true,
  },
  {
    name: "Iza",
    aliases: [
      "IZA",
      "Isabela Cristina",
    ],
    shortBio: "Dona de timbre marcante e presença magnética, combina pop, R&B e afrobeat em produções refinadas e energéticas.",
    bio: "Nascida no Rio de Janeiro, Isabela Cristina ascendeu rapidamente ao topo do cenário musical nacional com vocais vigorosos e uma estética visual impecável. Seu trabalho bebe de fontes do soul clássico, afropop, dancehall e funk carioca.\n\nSeus singles e colaborações de grande porte são itens indispensáveis no repertório de DJs de open format e música pop, sempre oferecendo acapellas e grooves ideais para versões estendidas e remixes de pista.",
    genres: [
      "Pop",
      "R&B",
      "Afropop",
      "Dancehall",
    ],
    origin: "Rio de Janeiro, RJ",
    yearsActive: "2016–atual",
    notableWorks: [
      "Pesadão",
      "Dona de Mim",
      "Ginga",
      "Fé",
      "Gueto",
    ],
    imageUrl: null,
    spotifyUrl: null,
    featured: true,
  },
  {
    name: "Jão",
    aliases: [
      "João Vitor",
    ],
    shortBio: "Grande expoente do pop nacional contemporâneo, traduz melodias emotivas e hinos radiofônicos para palcos e pistas.",
    bio: "Vindo do interior paulista, Jão construiu uma trajetória sólida no pop brasileiro, destacando-se por composições confessionais, melodias cativantes e uma base de fãs extremamente engajada. Seus shows em estádios atestam a dimensão do seu alcance.\n\nSuas faixas de andamento vibrante e refrões grandiosos tornaram-se matérias-primas frequentes para reinterpretações eletrônicas e remixes pensados para momentos de euforia coletiva.",
    genres: [
      "Pop",
      "Pop Rock",
      "MPB",
    ],
    origin: "Américo Brasiliense, SP",
    yearsActive: "2016–atual",
    notableWorks: [
      "Idiota",
      "Vou Morrer Sozinho",
      "Meninos e Meninas",
      "Pilantra",
      "Me Lambe",
    ],
    imageUrl: null,
    spotifyUrl: null,
    featured: true,
  },
  {
    name: "Luan Santana",
    aliases: [
      "Luan Rafael",
    ],
    shortBio: "Fenômeno do sertanejo pop moderno, transformou o mercado fonográfico com hits contagiantes adaptados a múltiplos formatos.",
    bio: "Luan Santana iniciou sua carreira no Mato Grosso do Sul e tornou-se a vanguarda do que ficou conhecido como sertanejo universitário. Ao longo de mais de uma década e meia, refinou sua sonoridade incorporando arranjos eletrônicos, pop internacional e reggaeton.\n\nSuas músicas têm presença garantida tanto no rádio quanto em edits e bootlegs para DJs, unindo a força do cancioneiro sertanejo à energia das pistas noturnas.",
    genres: [
      "Sertanejo Universitário",
      "Pop",
      "Sertanejo Pop",
    ],
    origin: "Campo Grande, MS",
    yearsActive: "2008–atual",
    notableWorks: [
      "Meteoro",
      "Acordando o Prédio",
      "Morena",
      "Cê Topa",
      "Abalo Emocional",
    ],
    imageUrl: null,
    spotifyUrl: null,
    featured: true,
  },
  {
    name: "Gusttavo Lima",
    aliases: [
      "O Embaixador",
      "Nivaldo Batista Lima",
    ],
    shortBio: "Uma das maiores forças do sertanejo e da bachata no Brasil, dominando paradas de sucesso e pistas por todo o país.",
    bio: "Cantor, multi-instrumentista e produtor mineiro, Gusttavo Lima revolucionou o sertanejo com produções grandiosas e a introdução da batida de bachata no mercado de massa brasileiro. Suas apresentações maratonistas são referência em volume de público.\n\nPor conta de refrões explosivos e linhas de baixo marcantes, suas gravações originais frequentemente inspiram versões de pista, arrocha eletrônico e transições indispensáveis para DJs de eventos corporativos e baladas.",
    genres: [
      "Sertanejo",
      "Bachata",
      "Sertanejo Universitário",
    ],
    origin: "Presidente Olegário, MG",
    yearsActive: "2009–atual",
    notableWorks: [
      "Balada (Tchê Tcherere)",
      "Apelido Carinhoso",
      "Cem Mil",
      "Bloqueado",
      "Zé da Recaída",
    ],
    imageUrl: null,
    spotifyUrl: null,
    featured: true,
  },
  {
    name: "Wesley Safadão",
    aliases: [
      "Safadão",
      "Wesley Oliveira",
    ],
    shortBio: "Pioneiro da modernização do forró eletrônico com batidas pop e funk, um dos maiores showmen do entretenimento brasileiro.",
    bio: "Nascido em Fortaleza, Wesley Safadão liderou o grupo Garota Safada antes de despontar em carreira solo como um dos nomes mais bem-sucedidos da música nacional. Foi peça fundamental na renovação do forró, acelerando andamentos e mesclando o gênero com pop, axé e sertanejo.\n\nSeus temas ritmados e vocais acelerados são matéria-prima padrão em sets de open format, servindo de ponte perfeita entre o regional e a música eletrônica de pista.",
    genres: [
      "Forró Eletrônico",
      "Pisadinha",
      "Piseiro",
      "Pop",
    ],
    origin: "Fortaleza, CE",
    yearsActive: "2003–atual",
    notableWorks: [
      "Camarote",
      "Aquele 1%",
      "Coração Machucado",
      "Ar Condicionado no 15",
      "Sonhei Que Tava Me Casando",
    ],
    imageUrl: null,
    spotifyUrl: null,
    featured: true,
  },
  {
    name: "Tropkillaz",
    aliases: [
      "Zegon & Laudz",
    ],
    shortBio: "Dupla pioneira na fusão de bass global com funk brasileiro, com forte projeção e respeito na cena internacional.",
    bio: "Formado pelos veteranos produtores e DJs DJ Zegon e Laudz, o projeto Tropkillaz estabeleceu a ponte definitiva entre o trap, hip hop, dancehall e o funk das favelas brasileiras, colocando o país na rota dos grandes festivais globais de bass music.\n\nCom produções autorais emblemáticas e colaborações no topo dos charts, a dupla é referência obrigatória para DJs de música urbana e eletrônica contemporânea ao redor do mundo.",
    genres: [
      "Trap",
      "Funk",
      "Bass Music",
      "Eletrônica",
    ],
    origin: "São Paulo, SP / Curitiba, PR",
    yearsActive: "2012–atual",
    notableWorks: [
      "Vai Malandra",
      "Bola Rebola",
      "Mambo",
      "Kriola",
      "Boa Noite",
    ],
    imageUrl: null,
    spotifyUrl: null,
    featured: true,
  },
  {
    name: "Liu",
    aliases: [
      "Christian Liu de Almeida",
    ],
    shortBio: "Destaque da dance music brasileira, conhecido por grooves enérgicos de bass house e tech house em grandes festivais.",
    bio: "Christian Liu de Almeida despontou ainda jovem como uma das grandes promessas da cena eletrônica nacional, apadrinhado por gigantes do setor. Seu som é caracterizado por linhas de baixo agressivas, melodias contagiantes e um apelo direto para os palcos principais.\n\nCom presença constante em festivais como Tomorrowland Brasil e Rock in Rio, Liu mantém produções e club edits essenciais para sets dinâmicos de dance music e club culture.",
    genres: [
      "Brazilian Bass",
      "Bass House",
      "Tech House",
      "Eletrônica",
    ],
    origin: "São Paulo, SP",
    yearsActive: "2015–atual",
    notableWorks: [
      "Don't Look Back",
      "Coastline",
      "Nave Espacial",
      "Step Ahead",
      "Ring Road",
    ],
    imageUrl: null,
    spotifyUrl: null,
    featured: true,
  },
  {
    name: "Illusionize",
    aliases: [
      "Pedro Mendes",
      "O Garoto do Chapéu",
    ],
    shortBio: "Criador de uma assinatura sonora hipnótica no tech house nacional, com graves profundos e timbres inconfundíveis.",
    bio: "Nascido em Goiânia, Pedro Mendes construiu uma das identidades sonoras mais sólidas e reconhecíveis do cenário eletrônico brasileiro. Conhecido pela marca registrada de seus graves encorpados e timbres autorais, tornou-se líder de uma legião de ouvintes dedicados.\n\nFundador de label própria e presença cativa nos maiores clubs do país, suas produções originais e club cuts são referências constantes nas maletas de DJs de house e tech house.",
    genres: [
      "Tech House",
      "Brazilian Bass",
      "Deep House",
      "Eletrônica",
    ],
    origin: "Goiânia, GO",
    yearsActive: "2014–atual",
    notableWorks: [
      "Bass",
      "Down",
      "Toma",
      "Phoenup",
      "Work",
    ],
    imageUrl: null,
    spotifyUrl: null,
    featured: true,
  },
  {
    name: "Dubdogz",
    aliases: [
      "Marcos e Lucas Schmidt",
    ],
    shortBio: "Irmãos gêmeos mestres em criar reinterpretações enérgicas e melodias marcantes que conquistaram as pistas globais.",
    bio: "O duo formado pelos irmãos gêmeos Marcos e Lucas Schmidt é um dos maiores fenômenos de exportação da dance music brasileira. Misturando elementos de slap house, nu disco e brazilian bass, construíram um catálogo repleto de remixes e hits que acumulam centenas de milhões de reproduções.\n\nCom apresentações elétricas por festivais de todo o planeta, suas versões de clássicos e faixas originais são presenças obrigatórias em sets de DJs que buscam conexão imediata com o público.",
    genres: [
      "Brazilian Bass",
      "Slap House",
      "House",
      "Dance Pop",
    ],
    origin: "Juiz de Fora, MG",
    yearsActive: "2015–atual",
    notableWorks: [
      "Techno Prank",
      "Infinity (Dubdogz & Bhaskar Edit)",
      "Dog Days",
      "Are You OK?",
      "Everybody Wants to Rule the World",
    ],
    imageUrl: null,
    spotifyUrl: null,
    featured: true,
  },
  {
    name: "Cat Dealers",
    aliases: [
      "Lugui & Pedrão",
    ],
    shortBio: "Duo carioca que redefiniu o Brazilian Bass e conquistou as pistas e festivais de música eletrônica pelo mundo.",
    bio: "Formado pelos irmãos Lugui e Pedrão no Rio de Janeiro, o Cat Dealers ascendeu rapidamente como um dos maiores expoentes da música eletrônica brasileira contemporânea. O duo sintetizou elementos de Brazilian Bass e Slap House com melodias pop cativantes, alcançando dezenas de milhões de ouvintes globais.\n\nCom presença constante nos maiores festivais internacionais, como Tomorrowland e EDC, suas faixas e remixes são presença obrigatória em sets de DJs que buscam alta energia e pressão nas frequências graves.",
    genres: [
      "Brazilian Bass",
      "Slap House",
      "Tech House",
      "EDM",
    ],
    origin: "Rio de Janeiro, RJ",
    yearsActive: "2016–atual",
    notableWorks: [
      "Your Body",
      "Gravity",
      "Sunshine",
      "Gone Too Long",
    ],
    imageUrl: null,
    spotifyUrl: null,
    featured: true,
  },
  {
    name: "Bruno Martini",
    aliases: [],
    shortBio: "Produtor e DJ paulistano por trás de hinos globais que fundem dance-pop, deep house e sonoridades brasileiras.",
    bio: "Nascido em São Paulo em família de músicos, Bruno Martini construiu uma sólida trajetória internacional como multi-instrumentista, produtor e DJ. Ganhou projeção global estrondosa como coautor e produtor de hinos da dance music que acumulam bilhões de streams.\n\nSua habilidade em conectar a house music refinada à estrutura melódica do pop o tornou um colaborador disputado por artistas de peso internacional e fonte certeira de hits e remixes para pistas comerciais do mundo todo.",
    genres: [
      "Dance-Pop",
      "Deep House",
      "Electro Pop",
      "Brazilian Bass",
    ],
    origin: "São Paulo, SP",
    yearsActive: "2016–atual",
    notableWorks: [
      "Hear Me Now",
      "Never Let Me Go",
      "Sun Goes Down",
      "Bend the Knee",
    ],
    imageUrl: null,
    spotifyUrl: null,
    featured: true,
  },
  {
    name: "MC Livinho",
    aliases: [
      "Livinho",
      "Oliver Decesary Santos",
    ],
    shortBio: "Pioneiro do funk ousadia e cantor versátil que une batidas dançantes a performances vocais marcadas pelo R&B.",
    bio: "Vindo da zona norte paulistana, MC Livinho revolucionou a cena urbana ao introduzir falsetes, afinação impecável e estética do R&B ao funk paulista. Ele liderou a vertente do funk ousadia antes de expandir seu repertório para o trap, pop e reggaeton.\n\nSua voz melódica e presença de palco magnética geraram clássicos de pista que ganharam incontáveis remixes, bootlegs e edits de open format em festas e bailes por todo o país.",
    genres: [
      "Funk Paulista",
      "Funk Ousadia",
      "Trap Funk",
      "R&B Brasileiro",
    ],
    origin: "São Paulo, SP",
    yearsActive: "2008–atual",
    notableWorks: [
      "Cheia de Marra",
      "Fazer Falta",
      "Hoje Eu Vou Parar na Gaiola",
      "Bem Querer",
      "Azul Piscina",
    ],
    imageUrl: null,
    spotifyUrl: null,
    featured: true,
  },
  {
    name: "MC Don Juan",
    aliases: [
      "Don Juan",
      "Matheus Wallace Mendonça da Cruz",
    ],
    shortBio: "Uma das maiores vozes do funk paulista, dono de hits astronômicos e melodias que embalam os bailes do país.",
    bio: "MC Don Juan despontou na adolescência como um dos maiores fenômenos do funk de São Paulo. Dono de um timbre anasalado característico e extrema facilidade para criar refrões grudentos, ele acumulou bilhões de plays transitando entre o funk romântico, o mandelão e parcerias com o sertanejo e o pop.\n\nSuas acapellas e ganchos são ferramentas essenciais para DJs e produtores de pista, servindo de base para montagens virais e remixes que definem a energia das noites brasileiras.",
    genres: [
      "Funk Paulista",
      "Funk Mandelão",
      "Funk Melody",
      "Funk Consciente",
    ],
    origin: "São Paulo, SP",
    yearsActive: "2015–atual",
    notableWorks: [
      "Oh Novinha",
      "Amar Amei",
      "Lei do Retorno",
      "Bota Amor Que Bota Chá",
      "Te Prometo",
    ],
    imageUrl: null,
    spotifyUrl: null,
    featured: true,
  },
  {
    name: "Djonga",
    aliases: [
      "Gustavo Pereira Marques",
    ],
    shortBio: "Um dos pilares do rap brasileiro contemporâneo, aclamado por lírica contundente, flow potente e visão social.",
    bio: "Nascido em Belo Horizonte, Djonga é uma das figuras centrais e mais respeitadas da música urbana brasileira contemporânea. Com uma sequência histórica de álbuns lançados ano a ano, ele estabeleceu um novo padrão de lirismo contundente, denúncia social e entrega visceral no rap e trap nacional.\n\nSua dicção marcante e frases de impacto tornaram suas faixas presenças cativas em pistas alternativas e sets de hip hop, gerando remixes intensos de drill, bass music e montagens eletrônicas.",
    genres: [
      "Trap",
      "Hip Hop",
      "Boom Bap",
      "Rap Nacional",
    ],
    origin: "Belo Horizonte, MG",
    yearsActive: "2015–atual",
    notableWorks: [
      "Leal",
      "Junho de 94",
      "Olho de Tigre",
      "Solto",
      "Ladrão",
    ],
    imageUrl: null,
    spotifyUrl: null,
    featured: true,
  },
  {
    name: "Criolo",
    aliases: [
      "Criolo Doido",
      "Kleber Cavalcante Gomes",
    ],
    shortBio: "Voz poética e versátil de São Paulo que costura rap, MPB, samba e eletrônica com profundidade crítica e alma.",
    bio: "Criado no Grajaú, periferia de São Paulo, Criolo construiu uma das trajetórias mais brilhantes da música brasileira moderna. Após anos no underground do rap, explodiu nacionalmente ao unir a crônica urbana a arranjos primorosos de samba, afrobeat e MPB clássica.\n\nSua obra multifacetada é rica em timbres e mensagens profundas, tornando-se terreno fértil para remixes conceituais de downtempo, afro house e produções sofisticadas de pistas alternativas.",
    genres: [
      "Rap Nacional",
      "MPB",
      "Samba",
      "Afrobeat",
    ],
    origin: "São Paulo, SP",
    yearsActive: "1989–atual",
    notableWorks: [
      "Não Existe Amor em SP",
      "Bogotá",
      "Subirusdoistiozin",
      "Menino Mimado",
      "Boca de Lobo",
    ],
    imageUrl: null,
    spotifyUrl: null,
    featured: true,
  },
  {
    name: "Gal Costa",
    aliases: [
      "Gal",
      "Maria da Graça Costa Penna Burgos",
    ],
    shortBio: "Voz monumental da Tropicália e da MPB, sinônimo de vanguarda, sensualidade vocal e arrojo interpretativo.",
    bio: "Nascida em Salvador, Gal Costa foi uma das maiores cantoras de todos os tempos. Musa da Tropicália, sua voz cristalina e visceral transitou com genialidade pelo desbunde psicodélico, a contenção da bossa nova, a força do frevo e a sofisticação do pop brasileiro dos anos 1980.\n\nCom uma discografia histórica, suas gravações originais continuam sendo amplamente sampleadas e revisitadas por DJs e produtores em remixes de nu-disco, house e edits festivos em pistas ao redor do mundo.",
    genres: [
      "MPB",
      "Tropicália",
      "Bossa Nova",
      "Samba-Rock",
      "Pop Brasileiro",
    ],
    origin: "Salvador, BA",
    yearsActive: "1965–2022",
    notableWorks: [
      "Baby",
      "Chuva de Prata",
      "Vapor Barato",
      "Balancê",
      "Festa do Interior",
      "Meu Nome É Gal",
    ],
    imageUrl: null,
    spotifyUrl: null,
    featured: true,
  },
  {
    name: "Elis Regina",
    aliases: [
      "Elis",
      "Pimentinha",
    ],
    shortBio: "Maior intérprete da música brasileira, dona de uma extensão vocal magistral e dramaticidade inigualável.",
    bio: "Natural de Porto Alegre, Elis Regina é reverenciada como o ápice da interpretação vocal no Brasil. Com técnica assombrosa, divisão rítmica impecável e carga dramática única, ela revelou compositores seminais e definiu a Era dos Festivais nas décadas de 1960 e 1970.\n\nO suingue natural de seu canto influenciou diretamente a música contemporânea mundial, inspirando clássicos remixes de drum and bass, jazz house e cortes de hip hop que celebram seu suingue eterno.",
    genres: [
      "MPB",
      "Bossa Nova",
      "Samba Jazz",
      "Samba",
    ],
    origin: "Porto Alegre, RS",
    yearsActive: "1959–1982",
    notableWorks: [
      "Águas de Março",
      "Como Nossos Pais",
      "O Bêbado e a Equilibrista",
      "Madalena",
      "Fascinação",
    ],
    imageUrl: null,
    spotifyUrl: null,
    featured: true,
  },
  {
    name: "Chico Buarque",
    aliases: [
      "Chico Buarque de Hollanda",
      "Julinho da Adelaide",
    ],
    shortBio: "Mestre supremo da canção e da poesia brasileira, autor de crônicas viscerais sobre o amor e a sociedade.",
    bio: "Nascido no Rio de Janeiro, Chico Buarque é uma das mentes mais brilhantes da cultura lusófona. Letrista genial e melodista refinado, compôs alguns dos maiores clássicos da música popular brasileira, aliando beleza poética, lirismo afiado e resistência política.\n\nSuas harmonias sincopadas e melodias imortais são constantemente homenageadas e retrabalhadas na cultura DJ, servindo de base para edits de bossa lounge, beats de lofi hip hop e releituras de samba de pista.",
    genres: [
      "MPB",
      "Samba",
      "Bossa Nova",
      "Choro",
    ],
    origin: "Rio de Janeiro, RJ",
    yearsActive: "1964–atual",
    notableWorks: [
      "Construção",
      "A Banda",
      "Cálice",
      "Apesar de Você",
      "Roda Viva",
      "O Que Será (À Flor da Terra)",
    ],
    imageUrl: null,
    spotifyUrl: null,
    featured: true,
  },
  {
    name: "Djavan",
    aliases: [
      "Djavan Caetano Viana",
    ],
    shortBio: "Gênio das harmonias sinuosas, do samba-funk e da sofisticação melódica na música popular brasileira.",
    bio: "Nascido em Maceió, Alagoas, Djavan forjou uma sonoridade singular que funde o samba, jazz, soul, pop e ritmos de matriz africana a uma poesia visual inconfundível. Suas construções harmônicas ricas e sofisticadas consolidaram sua obra como uma das mais elegantes do cancioneiro nacional.\n\nO balanço irresistível de suas canções é um dos alvos preferidos de produtores de música eletrônica, figurando em aclamados remixes de soulful house, nu-disco e edits de pista pelo Brasil e pelo mundo.",
    genres: [
      "MPB",
      "Samba-Funk",
      "Soul Brasileiro",
      "Pop",
    ],
    origin: "Maceió, AL",
    yearsActive: "1973–atual",
    notableWorks: [
      "Sina",
      "Samurai",
      "Oceano",
      "Se...",
      "Flor de Lis",
      "Te Devoro",
    ],
    imageUrl: null,
    spotifyUrl: null,
    featured: true,
  }
];

export function knownArtistSlug(artist: VipKnownArtist): string {
  return artist.slug?.trim() || slugifyFolderName(artist.name);
}

export function listFeaturedKnownArtists(): Array<VipKnownArtist & { slug: string }> {
  return VIP_KNOWN_ARTISTS.filter((artist) => artist.featured !== false).map((artist) => ({
    ...artist,
    slug: knownArtistSlug(artist),
  }));
}

export function findKnownArtistBySlug(slug: string): (VipKnownArtist & { slug: string }) | null {
  const normalized = slugifyFolderName(slug);
  if (!normalized) return null;

  for (const artist of VIP_KNOWN_ARTISTS) {
    const canonical = knownArtistSlug(artist);
    if (canonical === normalized) {
      return { ...artist, slug: canonical };
    }
    for (const alias of artist.aliases ?? []) {
      if (slugifyFolderName(alias) === normalized) {
        return { ...artist, slug: canonical };
      }
    }
  }
  return null;
}

/** Resolve slug canônico quando o crédito bate com um artista conhecido (ou aliases). */
export function resolveKnownArtistFromCredit(
  displayArtist: string,
): (VipKnownArtist & { slug: string }) | null {
  const parts = splitArtistCredits(displayArtist);
  for (const part of parts) {
    const hit = findKnownArtistBySlug(slugifyFolderName(part));
    if (hit) return hit;
  }
  return null;
}

export function splitArtistCredits(displayArtist: string): string[] {
  return displayArtist
    .split(/\s*(?:,|&|\/|\bx\b|\bfeat\.?\b|\bft\.?\b|\bvs\.?\b)\s*/i)
    .map((part) => part.trim())
    .filter(Boolean);
}
