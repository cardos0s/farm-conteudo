import type { Comentario, Notificacao, Post, Repost, Story, Usuario } from "./tipos";

// Conteúdo de demonstração. Pessoas e histórias são fictícias; as fotos têm licença Creative Commons
// (autor e licença em public/midia/creditos.json e na tela de perfil).

const AGORA = Date.now();
const ha = (min: number) => AGORA - min * 60_000;
const m = (nome: string) => `/midia/${nome}`;

export const EU = "voce";

export const USUARIOS: Usuario[] = [
  { id: EU, nome: "Você", seguidores: 312, seguindo: 6, bio: "flagrando o que ninguém acredita" },
  { id: "duda.sem.freio", nome: "Duda", avatar: m("avatar-duda.svg"), seguidores: 48_300, seguindo: 211, bio: "planejo tudo. o Rafa só dirige (mal) 🌴 dia 3 longe de casa" },
  { id: "rafa.na.estrada", nome: "Rafa", avatar: m("avatar-rafa.svg"), seguidores: 39_900, seguindo: 1, bio: "copiloto oficial da @duda.sem.freio · devolvo o que pego emprestado" },
  { id: "vizinha_do_302", nome: "Bia · 302", avatar: m("flamingo.jpg"), seguidores: 18_400, seguindo: 410, bio: "síndica não oficial" },
  { id: "lixeira.cam", nome: "Câmera da Lixeira", avatar: m("guaxinim.jpg"), seguidores: 92_100, seguindo: 12 },
  { id: "bar.do.porto", nome: "Bar do Porto", avatar: m("galo-bar.jpg"), verificado: true, seguidores: 241_000, seguindo: 88 },
  { id: "pedala.everglades", nome: "Pedala Everglades", avatar: m("jacare-grama.jpg"), seguidores: 33_700, seguindo: 301 },
  { id: "miami.agora", nome: "Miami Agora", avatar: m("viatura-rosa.jpg"), verificado: true, seguidores: 1_204_000, seguindo: 38, bio: "o que está rolando em Miami, agora" },
  { id: "meteoro.logo", nome: "Meteoro Logo", avatar: m("iguana.jpg"), seguidores: 57_900, seguindo: 140 },
  { id: "piscina_retro", nome: "Piscina Retrô", avatar: m("salva-vidas.jpg"), seguidores: 21_300, seguindo: 77 },
  { id: "mergulho.crystal", nome: "Mergulho Crystal", avatar: m("peixe-boi.jpg"), seguidores: 64_000, seguindo: 230 },
  { id: "radar_da_orla", nome: "Radar da Orla", avatar: m("golfe.jpg"), verificado: true, seguidores: 512_000, seguindo: 41 },
  { id: "neon.da.orla", nome: "Neon da Orla", avatar: m("neon-placa.jpg"), seguidores: 15_800, seguindo: 190 },
  { id: "galos.de.key.west", nome: "Galos de Key West", avatar: m("galo-rua.jpg"), seguidores: 88_200, seguindo: 5 },
  { id: "ocean.drive.diario", nome: "Ocean Drive Diário", avatar: m("neon-colony.jpg"), seguidores: 403_000, seguindo: 610 },
];

/** Quem "você" segue no começo da demo. */
// Você segue o Rafa, mas ainda não segue a Duda: os posts dela chegam até você pelos reposts dele.
export const SEGUINDO_INICIAL = ["rafa.na.estrada", "vizinha_do_302", "miami.agora", "meteoro.logo", "bar.do.porto", "mergulho.crystal", "ocean.drive.diario"];

const p = (o: Omit<Post, "visualizacoes" | "salvos"> & { visualizacoes?: number; salvos?: number }): Post => ({
  visualizacoes: o.curtidas * 9,
  salvos: Math.round(o.curtidas * 0.06),
  ...o,
});

export const POSTS: Post[] = [
  // ── Duda e Rafa, o casal da demo ──
  p({ id: "duda-mapa", autor: "duda.sem.freio", tipo: "post", midia: { tipo: "foto", url: m("duda-mapa.jpg"), proporcao: 0.75 }, legenda: "Plano infalível, parte 1. O Rafa não pode saber do final.", tags: ["roadtrip", "plano", "fuga"], local: "Rodovia US-1, Flórida", criadoEm: ha(22), curtidas: 8_420, comentarios: 612, reposts: 940 }),
  p({ id: "rafa-por-do-sol", autor: "rafa.na.estrada", tipo: "post", midia: { tipo: "foto", url: m("rafa-por-do-sol.jpg"), proporcao: 1.6 }, legenda: "Ela dirige, eu cuido da trilha sonora. Divisão justa.", tags: ["roadtrip", "pordosol"], local: "Everglades, Flórida", criadoEm: ha(65), curtidas: 5_130, comentarios: 233, reposts: 310 }),
  p({ id: "duda-chaves", autor: "duda.sem.freio", tipo: "post", midia: { tipo: "foto", url: m("duda-chaves.jpg"), proporcao: 1.33 }, legenda: "Quarto 20. Pago em dinheiro. Nome na ficha: Sra. Silva.", tags: ["motel", "fuga", "roadtrip"], local: "Homestead, Flórida", criadoEm: ha(240), curtidas: 11_870, comentarios: 840, reposts: 1_120 }),
  p({ id: "rafa-esportivo", autor: "rafa.na.estrada", tipo: "post", midia: { tipo: "foto", url: m("rafa-esportivo.jpg"), proporcao: 1.5 }, legenda: "Troquei o carrinho de golfe por um upgrade. Emprestado também.", tags: ["carro", "fuga", "roadtrip"], local: "Miami, Flórida", criadoEm: ha(150), curtidas: 9_960, comentarios: 702, reposts: 880 }),
  p({ id: "duda-florida", autor: "duda.sem.freio", tipo: "post", midia: { tipo: "foto", url: m("duda-florida.jpg"), proporcao: 1.4 }, legenda: "Dia 1. Ele perguntou se precisava de passaporte.", tags: ["roadtrip", "florida"], criadoEm: ha(2_600), curtidas: 6_010, comentarios: 402, reposts: 515 }),
  p({ id: "reel-rafa-fuga", autor: "rafa.na.estrada", tipo: "reel", midia: { tipo: "video", url: m("reel-rafa-fuga.mp4") }, legenda: "POV: você pegou um carrinho de golfe \"emprestado\" e o segurança tem outro.", tags: ["carrinhodegolfe", "fuga", "flagra"], local: "Key Biscayne, Flórida", criadoEm: ha(35), curtidas: 12_300, comentarios: 640, reposts: 1_480, visualizacoes: 210_000, audio: "Perseguição lenta · rafa.na.estrada" }),
  p({ id: "reel-rafa-carrinho", autor: "rafa.na.estrada", tipo: "reel", midia: { tipo: "video", url: m("reel-rafa-carrinho.mp4") }, legenda: "Devolvi. Quase inteiro. A cesta era assim quando eu peguei.", tags: ["carrinhodegolfe", "flagra"], criadoEm: ha(420), curtidas: 7_900, comentarios: 380, reposts: 620, visualizacoes: 120_000, audio: "som original · rafa.na.estrada" }),

  p({ id: "jacare-piscina", autor: "vizinha_do_302", tipo: "post", midia: { tipo: "foto", url: m("jacare-piscina.jpg"), proporcao: 1.53 }, legenda: "Desci pra nadar e já tinha gente na piscina 🐊 o síndico não atende o interfone", tags: ["jacare", "condominio", "bicho"], local: "Fort Lauderdale, Flórida", criadoEm: ha(6), curtidas: 28_430, comentarios: 1_912, reposts: 3_104 }),
  p({ id: "guaxinim", autor: "lixeira.cam", tipo: "post", midia: { tipo: "foto", url: m("guaxinim.jpg"), proporcao: 1.2 }, legenda: "Flagrei o responsável pelo lixo revirado toda manhã. Ele nem disfarçou.", tags: ["guaxinim", "bicho", "flagra"], local: "Orlando, Flórida", criadoEm: ha(25), curtidas: 51_870, comentarios: 3_420, reposts: 6_011 }),
  p({ id: "galo-bar", autor: "bar.do.porto", tipo: "post", midia: { tipo: "foto", url: m("galo-bar.jpg"), proporcao: 1.5 }, legenda: "Cliente mais fiel da casa. Chega às 7h, não paga e ainda traz o filho.", tags: ["galo", "bar", "bicho"], local: "Key West, Flórida", criadoEm: ha(48), curtidas: 12_905, comentarios: 640, reposts: 870 }),
  p({ id: "jacare-ciclovia", autor: "pedala.everglades", tipo: "post", midia: { tipo: "foto", url: m("jacare-ciclovia.jpg"), proporcao: 1.33 }, legenda: "Ciclovia fechada por 5 minutos. Motivo: ele. Ninguém reclamou.", tags: ["jacare", "bike", "bicho"], local: "Everglades, Flórida", criadoEm: ha(95), curtidas: 9_310, comentarios: 402, reposts: 1_220 }),
  p({ id: "viatura-rosa", autor: "miami.agora", tipo: "post", midia: { tipo: "foto", url: m("viatura-rosa.jpg"), proporcao: 1.5 }, legenda: "Viatura rosa estacionada em Miami Beach. Ninguém sabe se é campanha ou se alguém perdeu uma aposta.", tags: ["viatura", "miami", "flagra"], local: "Miami Beach, Flórida", criadoEm: ha(130), curtidas: 184_200, comentarios: 9_870, reposts: 21_400 }),
  p({ id: "iguana", autor: "meteoro.logo", tipo: "post", midia: { tipo: "foto", url: m("iguana.jpg"), proporcao: 1.33 }, legenda: "Frente fria chegando. Quando passa de 10 °C pra baixo, olhe pra cima antes de estacionar debaixo da árvore.", tags: ["iguana", "clima", "bicho"], local: "Miami, Flórida", criadoEm: ha(170), curtidas: 22_010, comentarios: 1_103, reposts: 4_480 }),
  p({ id: "flamingo", autor: "piscina_retro", tipo: "post", midia: { tipo: "foto", url: m("flamingo.jpg"), proporcao: 1 }, legenda: "1987: o flamingo já mandava na piscina. #tbt", tags: ["flamingo", "retro", "piscina"], local: "Miami Beach, Flórida", criadoEm: ha(260), curtidas: 7_640, comentarios: 233, reposts: 512 }),
  p({ id: "peixe-boi", autor: "mergulho.crystal", tipo: "post", midia: { tipo: "foto", url: m("peixe-boi.jpg"), proporcao: 0.67 }, legenda: "Ele veio dar oi pra câmera e ficou 10 minutos posando.", tags: ["peixeboi", "mergulho", "bicho", "fofo"], local: "Crystal River, Flórida", criadoEm: ha(320), curtidas: 40_330, comentarios: 1_660, reposts: 5_090 }),
  p({ id: "golfe", autor: "radar_da_orla", tipo: "post", midia: { tipo: "foto", url: m("golfe.jpg"), proporcao: 1.5 }, legenda: "Engarrafamento de carrinho de golfe na saída do clube. Previsão: 18 km/h.", tags: ["carrinhodegolfe", "transito", "flagra"], local: "The Villages, Flórida", criadoEm: ha(410), curtidas: 15_120, comentarios: 870, reposts: 1_340 }),
  p({ id: "neon-rua", autor: "neon.da.orla", tipo: "post", midia: { tipo: "foto", url: m("neon-rua.jpg"), proporcao: 1.33 }, legenda: "Ocean Drive às 2h da manhã: ninguém dorme, nem o neon.", tags: ["neon", "miami", "noite"], local: "Ocean Drive, Miami Beach", criadoEm: ha(600), curtidas: 24_980, comentarios: 741, reposts: 1_290 }),
  p({ id: "lancha", autor: "radar_da_orla", tipo: "post", midia: { tipo: "foto", url: m("lancha.jpg"), proporcao: 1.35 }, legenda: "Lancha cortando a baía a toda. A guarda costeira foi atrás de jet ski.", tags: ["lancha", "perseguicao", "flagra"], local: "Baía de Biscayne, Flórida", criadoEm: ha(75), curtidas: 33_400, comentarios: 1_520, reposts: 3_870 }),
  p({ id: "aerobarco", autor: "pedala.everglades", tipo: "post", midia: { tipo: "foto", url: m("aerobarco.jpg"), proporcao: 1.37 }, legenda: "Aerobarco: o Uber do pântano. Os jacarés dão 5 estrelas.", tags: ["everglades", "jacare", "bicho"], local: "Everglades, Flórida", criadoEm: ha(190), curtidas: 18_200, comentarios: 690, reposts: 1_140 }),
  p({ id: "salva-vidas", autor: "piscina_retro", tipo: "post", midia: { tipo: "foto", url: m("salva-vidas.jpg"), proporcao: 1.5 }, legenda: "A torre de salva-vidas mais bonita da costa. A gente se encontra aqui.", tags: ["praia", "miami", "retro"], local: "South Beach, Miami", criadoEm: ha(350), curtidas: 12_740, comentarios: 388, reposts: 902 }),

  p({ id: "reel-piscina", autor: "vizinha_do_302", tipo: "reel", midia: { tipo: "video", url: m("reel-piscina.mp4") }, legenda: "Parte 2: ele ainda está lá. Alguém tem o telefone do controle de animais?", tags: ["jacare", "condominio", "bicho"], local: "Fort Lauderdale, Flórida", criadoEm: ha(12), curtidas: 96_200, comentarios: 4_310, reposts: 12_880, visualizacoes: 1_830_000, audio: "som original · vizinha_do_302" }),
  p({ id: "reel-jacare", autor: "pedala.everglades", tipo: "reel", midia: { tipo: "video", url: m("reel-jacare.mp4") }, legenda: "Pegando um sol na beira da trilha. Respeite a distância (e o horário dele).", tags: ["jacare", "bike", "bicho"], criadoEm: ha(70), curtidas: 31_400, comentarios: 980, reposts: 2_210, visualizacoes: 640_000, audio: "Lo-fi da trilha · pedala.everglades" }),
  p({ id: "reel-galo", autor: "galos.de.key.west", tipo: "reel", midia: { tipo: "video", url: m("reel-galo.mp4") }, legenda: "Aqui o galo tem preferência no cruzamento. Lei da cidade (não oficial).", tags: ["galo", "bicho", "flagra"], local: "Key West, Flórida", criadoEm: ha(140), curtidas: 58_700, comentarios: 2_040, reposts: 6_600, visualizacoes: 990_000, audio: "som original · galos.de.key.west" }),
  p({ id: "reel-por-do-sol", autor: "ocean.drive.diario", tipo: "reel", midia: { tipo: "video", url: m("reel-por-do-sol.mp4") }, legenda: "O pôr do sol de hoje sobre a baía passou do ponto (no bom sentido).", tags: ["pordosol", "praia"], local: "Miami Beach, Flórida", criadoEm: ha(200), curtidas: 22_800, comentarios: 410, reposts: 1_090, visualizacoes: 410_000, audio: "Sunset drive · ocean.drive.diario" }),
  p({ id: "reel-peixe-boi-2", autor: "mergulho.crystal", tipo: "reel", midia: { tipo: "video", url: m("reel-peixe-boi-2.mp4") }, legenda: "Café da manhã do peixe-boi: 50 kg de planta por dia.", tags: ["peixeboi", "mergulho", "bicho", "fofo"], local: "Crystal River, Flórida", criadoEm: ha(300), curtidas: 47_100, comentarios: 1_220, reposts: 4_030, visualizacoes: 770_000, audio: "som original · mergulho.crystal" }),
  p({ id: "reel-neon", autor: "neon.da.orla", tipo: "reel", midia: { tipo: "video", url: m("reel-neon.mp4") }, legenda: "Tour pelas placas de neon do Ocean Drive. Parte 1.", tags: ["neon", "miami", "noite"], criadoEm: ha(500), curtidas: 38_300, comentarios: 996, reposts: 2_640, visualizacoes: 650_000, audio: "Synth da madrugada · neon.da.orla" }),
  p({ id: "reel-ponte", autor: "miami.agora", tipo: "reel", midia: { tipo: "video", url: m("reel-ponte.mp4") }, legenda: "A ponte acendeu roxa hoje. Miami à noite não decepciona.", tags: ["miami", "noite"], local: "Miami, Flórida", criadoEm: ha(90), curtidas: 71_000, comentarios: 1_830, reposts: 6_210, visualizacoes: 1_400_000, audio: "Noite na baía · miami.agora" }),
];

/** Reposts de quem você segue: é assim que um post de alguém que você não segue chega até você. */
export const REPOSTS: Repost[] = [
  { postId: "duda-mapa", por: "rafa.na.estrada", em: ha(10) },
  { postId: "duda-chaves", por: "rafa.na.estrada", em: ha(200) },
  { postId: "jacare-ciclovia", por: "miami.agora", em: ha(40) },
  { postId: "guaxinim", por: "vizinha_do_302", em: ha(15) },
  { postId: "golfe", por: "ocean.drive.diario", em: ha(90) },
];

export const STORIES: Story[] = [
  // Vários stories da mesma pessoa ficam em sequência; o anel só fica cinza quando você vê todos.
  { id: "duda-1", autor: "duda.sem.freio", midia: m("duda-motel.jpg"), criadoEm: ha(50), texto: "dia 3 longe de casa 🌴", visualizacoes: 9_820 },
  { id: "duda-2", autor: "duda.sem.freio", midia: m("duda-mapa.jpg"), criadoEm: ha(40), enquete: { pergunta: "Próxima parada?", opcoes: ["Key West", "Miami"], votos: [1_840, 2_210] }, visualizacoes: 9_100 },
  { id: "duda-3", autor: "duda.sem.freio", midia: m("rafa-parabrisa.jpg"), criadoEm: ha(20), texto: "o Rafa dirigindo. rezem por nós 🙏", visualizacoes: 8_430 },
  { id: "rafa-1", autor: "rafa.na.estrada", midia: m("rafa-carrinho.jpg"), criadoEm: ha(30), texto: "peguei emprestado (vou devolver)", visualizacoes: 7_200 },
  { id: "s1", autor: "miami.agora", midia: m("viatura.jpg"), texto: "plantão na orla 🚨", criadoEm: ha(30) },
  { id: "s2", autor: "galos.de.key.west", midia: m("galo-rua.jpg"), criadoEm: ha(80) },
  { id: "s3", autor: "ocean.drive.diario", midia: m("skyline-cidade.jpg"), criadoEm: ha(120) },
  { id: "s4", autor: "neon.da.orla", midia: m("neon-laranja.jpg"), criadoEm: ha(200) },
  { id: "s5", autor: "mergulho.crystal", midia: m("peixe-boi-2.jpg"), criadoEm: ha(260) },
  { id: "s6", autor: "meteoro.logo", midia: m("iguana.jpg"), criadoEm: ha(400) },
  { id: "s7", autor: "pedala.everglades", midia: m("jacare-grama.jpg"), criadoEm: ha(500) },
];

const c = (postId: string, autor: string, texto: string, min: number, curtidas: number, respostaDe?: string): Comentario => ({
  id: `${postId}-${autor}-${min}`,
  postId,
  autor,
  texto,
  criadoEm: ha(min),
  curtidas,
  respostaDe,
});

export const COMENTARIOS: Comentario[] = [
  c("duda-mapa", "rafa.na.estrada", "que final? 👀", 20, 3_920),
  c("duda-mapa", "duda.sem.freio", "@rafa.na.estrada o final é você lavando a louça do motel", 19, 5_610, "duda-mapa-rafa.na.estrada-20"),
  c("duda-mapa", "rafa.na.estrada", "@duda.sem.freio isso não estava no contrato", 18, 4_280, "duda-mapa-rafa.na.estrada-20"),
  c("duda-mapa", "miami.agora", "acompanhando essa novela de perto 🍿", 15, 2_100),
  c("duda-chaves", "rafa.na.estrada", "Sr. Silva presente", 230, 1_870),
  c("reel-rafa-fuga", "duda.sem.freio", "eu falei pra pegar o azul, o azul é mais rápido", 30, 2_640),
  c("reel-rafa-fuga", "radar_da_orla", "perseguição registrada a 14 km/h", 28, 1_310),
  c("rafa-por-do-sol", "duda.sem.freio", "trilha sonora: a mesma música 40 vezes", 60, 1_990),
  c("jacare-piscina", "bar.do.porto", "Manda ele pra cá que a gente serve um drink", 4, 2_310),
  c("jacare-piscina", "vizinha_do_302", "Ele não tem cara de quem paga a conta", 3, 1_180, "jacare-piscina-bar.do.porto-4"),
  c("jacare-piscina", "meteoro.logo", "Com esse calor eu entendo ele", 5, 840),
  c("jacare-piscina", "miami.agora", "Ele está tecnicamente de férias", 5, 6_020),
  c("guaxinim", "vizinha_do_302", "A cara de culpado não engana ninguém", 20, 3_400),
  c("guaxinim", "radar_da_orla", "Suspeito identificado. Caso encerrado.", 18, 1_290),
  c("galo-bar", "galos.de.key.west", "É nosso primo, pode deixar entrar", 40, 980),
  c("viatura-rosa", "mergulho.crystal", "eu entraria de bom grado nessa viatura", 100, 4_100),
  c("viatura-rosa", "bar.do.porto", "aposta perdida, com certeza", 90, 2_050),
  c("peixe-boi", "miami.agora", "colega de profissão", 300, 5_200),
  c("reel-piscina", "pedala.everglades", "ele saiu da trilha e foi pro condomínio 😂", 9, 7_400),
  c("reel-galo", "bar.do.porto", "esse aí bebe aqui todo dia", 120, 3_330),
];

export const NOTIFICACOES: Notificacao[] = [
  { id: "n1", de: "miami.agora", tipo: "seguir", em: ha(50) },
  { id: "n2", de: "vizinha_do_302", tipo: "curtida", em: ha(180) },
  { id: "n3", de: "bar.do.porto", tipo: "comentario", texto: "kkkkk que flagra", em: ha(400) },
];

/** Fotos com licença e autor, para a tela de créditos. */
export { default as CREDITOS } from "./creditos.json";
