// Nova Rota Distribuidora: a empresa fictícia dos vídeos da Selloop.
// Tudo aqui é inventado. Os horários são relativos a `agora`, para a tela sempre parecer "ao vivo".

/** UUID estável a partir de um nome (para os ids não mudarem entre gravações). */
export function id(nome) {
  let h1 = 0x811c9dc5;
  let h2 = 0x1b873593;
  for (const ch of nome) {
    const c = ch.codePointAt(0);
    h1 = Math.imul(h1 ^ c, 0x01000193) >>> 0;
    h2 = Math.imul(h2 ^ c, 0x5bd1e995) >>> 0;
  }
  const hex = (n, t) => n.toString(16).padStart(8, "0").repeat(4).slice(0, t);
  const a = hex(h1, 8);
  const b = hex(h2, 12);
  const c = hex((h1 ^ h2) >>> 0, 8);
  return `${a}-${b.slice(0, 4)}-4${b.slice(4, 7)}-8${b.slice(7, 10)}-${c}${b.slice(0, 4)}`;
}

export const WS = id("workspace:nova-rota");

export const usuarios = {
  patricia: { id: id("u:patricia"), nome: "Patrícia Ramos", email: "patricia@novarota.com.br", papel: "Administrador", equipe: null },
  diogo: { id: id("u:diogo"), nome: "Diogo Campos", email: "diogo@novarota.com.br", papel: "Operador", equipe: "comercial" },
  bruna: { id: id("u:bruna"), nome: "Bruna Lima", email: "bruna@novarota.com.br", papel: "Operador", equipe: "financeiro" },
  rafael: { id: id("u:rafael"), nome: "Rafael Nunes", email: "rafael@novarota.com.br", papel: "Operador", equipe: "suporte" },
};

export const equipes = {
  comercial: { id: id("t:comercial"), nome: "Comercial", cor: "#2849db" },
  financeiro: { id: id("t:financeiro"), nome: "Financeiro", cor: "#10b981" },
  suporte: { id: id("t:suporte"), nome: "Suporte", cor: "#f59e0b" },
};

export const canais = {
  whatsapp: { id: id("c:whatsapp"), tipo: "whatsapp", nome: "Nova Rota", identificador: "+55 48 3209-4100" },
  instagram: { id: id("c:instagram"), tipo: "instagram", nome: "Nova Rota", identificador: "@novarota.distribuidora" },
  facebook: { id: id("c:facebook"), tipo: "facebook", nome: "Nova Rota Distribuidora", identificador: null },
};

export const empresa = {
  id: WS,
  nome: "Nova Rota Distribuidora",
  razao: "Nova Rota Distribuidora de Alimentos Ltda",
  cnpj: "41.278.553/0001-00",
  telefone: "(48) 3209-4100",
  email: "contato@novarota.com.br",
  cidade: "Florianópolis",
  uf: "SC",
};

/**
 * Conversas abertas na caixa de entrada. `min` = minutos desde a última mensagem.
 * `atendente` = chave de `usuarios` (ou null para a fila "Novos").
 */
export const conversas = [
  { chave: "marina", contato: "Marina Costa", empresa: "Mercado Bom Dia", canal: "whatsapp", fone: "+55 48 99812-3301", equipe: "comercial", atendente: "diogo", min: 1, naoLidas: 2, ultima: "Ainda tem para entrega esta semana?", etiquetas: ["Cliente ativo", "Mercados"] },
  { chave: "fabio", contato: "Fábio Martins", empresa: "Lanchonete do Porto", canal: "instagram", fone: "@fabio.lanchonetedoporto", equipe: "comercial", atendente: null, min: 2, naoLidas: 1, ultima: "Vi o anúncio. Atendem em Joinville?", etiquetas: ["Lead"] },
  { chave: "carla", contato: "Carla Mendes", empresa: "Padaria Pão Dourado", canal: "facebook", fone: "Carla Mendes", equipe: "comercial", atendente: null, min: 6, naoLidas: 1, ultima: "Vocês parcelam?", etiquetas: ["Lead"] },
  { chave: "juliana", contato: "Juliana Prado", empresa: "Empório Prado", canal: "whatsapp", fone: "+55 48 99654-1022", equipe: "comercial", atendente: null, min: 11, naoLidas: 2, ultima: "Bom dia! Qual o pedido mínimo pra entrega?", etiquetas: ["Lead"] },
  { chave: "elaine", contato: "Elaine Oliveira", empresa: "Bistrô Oliveira", canal: "whatsapp", fone: "+55 48 99133-8740", equipe: "financeiro", atendente: "bruna", min: 14, naoLidas: 0, ultima: "Vou pagar até sexta. Pode mandar o boleto atualizado?", etiquetas: ["Cliente ativo"] },
  { chave: "roberto", contato: "Roberto Alves", empresa: "Mercado Bom Preço", canal: "whatsapp", fone: "+55 48 99270-5518", equipe: "financeiro", atendente: null, min: 18, naoLidas: 1, ultima: "Preciso da 2ª via do boleto", etiquetas: ["Cliente ativo", "Mercados"] },
  { chave: "sabrina", contato: "Sabrina Costa", empresa: "Café Colonial Serra", canal: "instagram", fone: "@cafecolonialserra", equipe: "comercial", atendente: null, min: 26, naoLidas: 1, ultima: "Vocês têm café em grão?", etiquetas: ["Lead"] },
  { chave: "diego", contato: "Diego Santos", empresa: "Empório Santos", canal: "whatsapp", fone: "+55 48 99407-2263", equipe: "suporte", atendente: "rafael", min: 31, naoLidas: 0, ultima: "A entrega chegou com uma caixa a menos", etiquetas: ["Cliente ativo"] },
  { chave: "ana", contato: "Ana Souza", empresa: "Restaurante Sabor da Ilha", canal: "whatsapp", fone: "+55 48 99581-7714", equipe: "comercial", atendente: "diogo", min: 42, naoLidas: 1, ultima: "Pode me mandar a proposta hoje?", etiquetas: ["Restaurantes"] },
  { chave: "lucas", contato: "Lucas Ferreira", empresa: "Supermercado Ferreira", canal: "whatsapp", fone: "+55 48 99316-4480", equipe: "financeiro", atendente: "bruna", min: 55, naoLidas: 0, ultima: "Já paguei, segue o comprovante", etiquetas: ["Mercados"] },
  { chave: "thiago", contato: "Thiago Rocha", empresa: "Hamburgueria Brasa", canal: "instagram", fone: "@hamburgueriabrasa", equipe: "comercial", atendente: "diogo", min: 68, naoLidas: 0, ultima: "Fechado! Pode mandar o pedido.", etiquetas: ["Restaurantes"] },
  { chave: "paula", contato: "Paula Nunes", empresa: "Cantina da Nona", canal: "facebook", fone: "Paula Nunes", equipe: "suporte", atendente: "rafael", min: 125, naoLidas: 0, ultima: "Obrigada pela troca rápida!", etiquetas: ["Restaurantes"] },
  { chave: "gustavo", contato: "Gustavo Lima", empresa: "Bar do Gu", canal: "instagram", fone: "@bardogu", equipe: "comercial", atendente: "diogo", min: 190, naoLidas: 0, ultima: "Vou ver com meu sócio e te falo", etiquetas: ["Lead"] },
  { chave: "renata", contato: "Renata Alves", empresa: "Padaria Nova Era", canal: "whatsapp", fone: "+55 48 99744-0391", equipe: "financeiro", atendente: "bruna", min: 300, naoLidas: 0, ultima: "Recebi a nota, obrigada!", etiquetas: ["Padarias"] },
];

/** Histórico das conversas que aparecem abertas nos vídeos. [direção, minutos atrás, texto, remetente?] */
export const historicos = {
  marina: [
    ["in", 1440 * 6, "Oi, Diogo! Chegou tudo certinho, obrigada."],
    ["out", 1440 * 6 - 3, "Que bom, Marina! Qualquer coisa é só chamar.", "diogo"],
    ["in", 2, "Oi, Diogo, bom dia! Tudo bem?"],
    ["in", 1, "Ainda tem para entrega esta semana? Preciso repor café, açúcar e refrigerante."],
  ],
  elaine: [
    ["in", 40, "Oi! Tô vendo aqui que a fatura venceu. Posso pagar com 10 dias de atraso?"],
    ["system", 38, "Conversa transferida para Financeiro."],
    ["out", 30, "Oi, Elaine! Sim, sem problema. Vou gerar o boleto atualizado.", "bruna"],
    ["in", 14, "Vou pagar até sexta. Pode mandar o boleto atualizado?"],
  ],
  ana: [
    ["in", 60, "Oi, Diogo! Gostei da tabela nova."],
    ["out", 55, "Que ótimo, Ana! Quer que eu monte uma proposta com o volume do mês?", "diogo"],
    ["in", 42, "Pode me mandar a proposta hoje?"],
  ],
  fabio: [["in", 2, "Vi o anúncio. Atendem em Joinville?"]],
  carla: [["in", 6, "Vocês parcelam?"]],
  juliana: [
    ["in", 12, "Bom dia!"],
    ["in", 11, "Bom dia! Qual o pedido mínimo pra entrega?"],
  ],
  roberto: [["in", 18, "Preciso da 2ª via do boleto"]],
  sabrina: [["in", 26, "Vocês têm café em grão?"]],
  diego: [
    ["in", 50, "A entrega chegou com uma caixa a menos"],
    ["out", 45, "Oi, Diego! Já vou verificar com a expedição.", "rafael"],
    ["out", 31, "Confirmado: sai hoje à tarde a caixa que faltou, sem custo.", "rafael"],
  ],
};

export const produtos = [
  { chave: "cafe", nome: "Café Torrado e Moído 500 g", codigo: "CAF-500", preco: 18.9, unidade: "pacote", foto: "cafe.png" },
  { chave: "acucar", nome: "Açúcar Cristal 5 kg", codigo: "ACU-5K", preco: 21.5, unidade: "pacote", foto: "acucar.png" },
  { chave: "arroz", nome: "Arroz Tipo 1 5 kg", codigo: "ARZ-5K", preco: 27.9, unidade: "pacote", foto: "arroz.png" },
  { chave: "azeite", nome: "Azeite Extra Virgem 500 ml", codigo: "AZT-500", preco: 34.9, unidade: "garrafa", foto: "azeite.png" },
  { chave: "refri", nome: "Refrigerante Cola 2 L (fardo c/ 6)", codigo: "REF-2L6", preco: 47.4, unidade: "fardo", foto: "refri.png" },
  { chave: "agua", nome: "Água Mineral 500 ml (fardo c/ 12)", codigo: "AGU-12", preco: 16.8, unidade: "fardo", foto: "agua.png" },
  { chave: "suco", nome: "Suco de Uva Integral 1 L", codigo: "SUC-UVA", preco: 15.9, unidade: "garrafa", foto: "suco.png" },
  { chave: "biscoito", nome: "Biscoito Cream Cracker 400 g", codigo: "BIS-400", preco: 6.4, unidade: "pacote", foto: "biscoito.png" },
];

export const categorias = [
  { id: id("cat:mercearia"), name: "Mercearia" },
  { id: id("cat:bebidas"), name: "Bebidas" },
];
export const categoriaDo = { cafe: "mercearia", acucar: "mercearia", arroz: "mercearia", azeite: "mercearia", biscoito: "mercearia", refri: "bebidas", agua: "bebidas", suco: "bebidas" };

export const orcamentos = [
  { id: id("orc:atacado"), nome: "Orçamento atacado", mensagem: "Monte seu pedido e veja o total na hora 👇", botao: "Montar orçamento" },
  { id: id("orc:bebidas"), nome: "Bebidas para eventos", mensagem: "Escolha as bebidas e as quantidades 👇", botao: "Montar orçamento" },
];

export const formularios = [
  {
    id: id("form:cadastro"),
    nome: "Cadastro de cliente",
    titulo: "Cadastro Nova Rota",
    mensagem: "Para liberar o faturamento, confirme seus dados de cadastro 👇",
    botao: "Preencher cadastro",
    perguntas: [
      { pergunta: "CNPJ", tipo: "texto", opcoes: [] },
      { pergunta: "Endereço", tipo: "texto", opcoes: [] },
      { pergunta: "Recebimento", tipo: "opcoes", opcoes: ["Manhã", "Tarde"] },
    ],
  },
  {
    id: id("form:pesquisa"),
    nome: "Pesquisa de mix",
    titulo: "O que você mais vende?",
    mensagem: "Conta pra gente o que mais sai na sua loja 👇",
    botao: "Responder",
    perguntas: [{ pergunta: "Categorias que mais vendem", tipo: "opcoes", opcoes: ["Mercearia", "Bebidas", "Limpeza"] }],
  },
];

export const enquetes = [
  { id: id("enq:entrega"), pergunta: "Qual o melhor dia para receber a entrega?", opcoes: ["Terça-feira", "Quinta-feira", "Sábado"], terminaEm: null },
  { id: id("enq:horario"), pergunta: "Qual horário fica melhor para a visita do vendedor?", opcoes: ["Manhã", "Tarde"], terminaEm: null },
];

/** Notas e pedidos (ERP Omie) de cada cliente, por chave da conversa. */
export const documentosErp = {
  marina: {
    cliente: { nome: "Mercado Bom Dia", documento: "23.456.789/0001-10", email: "compras@mercadobomdia.com.br" },
    documentos: [
      { id: "nfe-4521", tipo: "nfe", numero: "4521", data: "2026-11-03", valor: 1284.6, situacao: "Autorizada", temPdf: true },
      { id: "ped-1187", tipo: "pedido", numero: "1187", data: "2026-11-03", valor: 1284.6, situacao: "Faturado", temPdf: true },
      { id: "cob-778", tipo: "cobranca", numero: "778", data: "2026-11-17", valor: 1284.6, situacao: "Em aberto", temPdf: true },
      { id: "nfe-4388", tipo: "nfe", numero: "4388", data: "2026-10-20", valor: 963.2, situacao: "Autorizada", temPdf: true },
      { id: "ped-1102", tipo: "pedido", numero: "1102", data: "2026-10-20", valor: 963.2, situacao: "Entregue", temPdf: true },
    ],
  },
};

/** Modelos aprovados pela Meta no WhatsApp da Nova Rota. Variáveis entre colchetes, como na Selloop. */
export const modelos = [
  { chave: "promo", name: "semana_do_atacado", displayName: "Semana do Atacado", category: "MARKETING", headerType: "imagem", headerUrl: "/api/uploads/demo/banners/semana-atacado.png",
    body: "Oi, [contato]! 🛒 É a *Semana do Atacado* na Nova Rota: até *15% off* em bebidas e mercearia, só até sexta.\n\nQuer que eu já separe o seu pedido?",
    footer: "Nova Rota Distribuidora", buttons: [{ tipo: "resposta_rapida", texto: "Quero aproveitar" }, { tipo: "resposta_rapida", texto: "Falar com vendedor" }] },
  { chave: "ultima", name: "ultima_chamada_atacado", displayName: "Última chamada: Semana do Atacado", category: "MARKETING", headerType: "nenhum",
    body: "[contato], a *Semana do Atacado* termina amanhã ⏰\n\nAinda dá tempo de garantir até *15% off* no seu pedido. Separo pra você?",
    footer: "Nova Rota Distribuidora", buttons: [{ tipo: "resposta_rapida", texto: "Quero aproveitar" }] },
  { chave: "comunicado", name: "horario_fim_de_ano", displayName: "Horário de fim de ano", category: "UTILITY", headerType: "nenhum",
    body: "Olá, [contato]! 📅 Nosso horário de fim de ano:\n\n• Entregas até *23/12*\n• Retorno em *05/01*\n\nProgramar o pedido de dezembro agora garante o estoque.",
    footer: "Nova Rota Distribuidora", buttons: [{ tipo: "resposta_rapida", texto: "Fazer pedido" }] },
  { chave: "boleto", name: "lembrete_de_boleto", displayName: "Lembrete de boleto", category: "UTILITY", headerType: "nenhum",
    body: "Oi, [contato]. O boleto do pedido *[pedido]* vence em *[vencimento]*. Precisa da 2ª via?",
    footer: null, buttons: [{ tipo: "resposta_rapida", texto: "Enviar 2ª via" }, { tipo: "resposta_rapida", texto: "Já paguei" }] },
  { chave: "lancamento", name: "linha_cafes_especiais", displayName: "Lançamento: cafés especiais", category: "MARKETING", headerType: "imagem", headerUrl: "/api/uploads/demo/banners/cafes-especiais.png",
    body: "Chegou a nova linha de *cafés especiais* ☕\n\nGrãos selecionados, torra média e preço de atacado para a sua cafeteria, padaria ou mercado.",
    footer: "Nova Rota Distribuidora", buttons: [{ tipo: "resposta_rapida", texto: "Ver catálogo" }] },
  { chave: "reativacao", name: "sentimos_sua_falta", displayName: "Reativação: 60 dias sem pedido", category: "MARKETING", headerType: "nenhum",
    body: "Oi, [contato]! Faz um tempinho que você não pede com a gente 💙\n\nPara voltar, o próximo pedido tem *10% de desconto* até domingo.",
    footer: null, buttons: [{ tipo: "resposta_rapida", texto: "Quero o desconto" }] },
  { chave: "convite", name: "convite_degustacao", displayName: "Convite: degustação", category: "MARKETING", headerType: "imagem", headerUrl: "/api/uploads/demo/banners/degustacao.png",
    body: "[contato], você está convidado! 🥂 *Degustação de lançamentos* na Nova Rota, dia *21/11 às 15h*.\n\nVagas limitadas.",
    footer: "Nova Rota Distribuidora", buttons: [{ tipo: "resposta_rapida", texto: "Confirmar presença" }] },
  { chave: "entrega", name: "pedido_saiu_para_entrega", displayName: "Pedido saiu para entrega", category: "UTILITY", headerType: "nenhum",
    body: "Bom dia, [contato]! 🚚 Seu pedido sai hoje para entrega. Previsão de chegada: *[janela]*.",
    footer: null, buttons: [{ tipo: "resposta_rapida", texto: "Ok, obrigado!" }] },
];

/**
 * Campanhas dos últimos 30 dias. `dias` = há quantos dias começou (negativo = agendada no futuro).
 * Taxas sobre o total de destinatários.
 */
export const campanhas = [
  { chave: "atacado", nome: "Semana do Atacado · bebidas e mercearia", modelo: "promo", status: "concluida", dias: 7, destinatarios: 1240, entregues: 0.97, lidas: 0.81, responderam: 0.24, equipe: "comercial", agente: true, etiquetas: ["Mercados", "Padarias", "Restaurantes"] },
  { chave: "boletos", nome: "Lembrete de boletos · novembro", modelo: "boleto", status: "concluida", dias: 5, destinatarios: 186, entregues: 0.99, lidas: 0.93, responderam: 0.41, equipe: "financeiro", agente: false, etiquetas: ["Cliente ativo"] },
  { chave: "cafes", nome: "Lançamento · cafés especiais", modelo: "lancamento", status: "em_envio", dias: 0, destinatarios: 860, enviadosAteAgora: 512, entregues: 0.98, lidas: 0.62, responderam: 0.17, equipe: "comercial", agente: true, etiquetas: ["Padarias", "Mercados"] },
  { chave: "reativacao", nome: "Reativação · 60 dias sem pedido", modelo: "reativacao", status: "concluida", dias: 13, destinatarios: 312, entregues: 0.96, lidas: 0.74, responderam: 0.18, equipe: "comercial", agente: true, etiquetas: ["Inativos 60 dias"] },
  { chave: "fimdeano", nome: "Comunicado · horário de fim de ano", modelo: "comunicado", status: "agendada", dias: -21, destinatarios: 1418, entregues: 0, lidas: 0, responderam: 0, equipe: "comercial", agente: false, etiquetas: ["Cliente ativo"] },
  { chave: "degustacao", nome: "Convite · degustação 21/11", modelo: "convite", status: "rascunho", dias: null, destinatarios: 240, entregues: 0, lidas: 0, responderam: 0, equipe: "comercial", agente: false, etiquetas: ["Restaurantes"] },
];

/** Etiquetas da carteira e quantos contatos cada uma tem (público das campanhas). */
export const etiquetasCarteira = { "Cliente ativo": 1418, Mercados: 512, Padarias: 286, Restaurantes: 442, "Inativos 60 dias": 312, Lead: 205, "Nova abordagem": 96 };

/** A Lia: agente de IA (Agente Hub) da Nova Rota. Formato do agente na API da Selloop. */
export const lia = {
  id: id("agente:lia"),
  nome: "Lia",
  apelido: "Lia · Nova Rota",
  fotoUrl: null,
  tom: "consultivo",
  formatacao: "curto",
  perfil: "sdr",
  objetivo: "Atender clientes e novos contatos da Nova Rota 24 horas por dia: tirar dúvidas, enviar catálogo e orçamento, marcar visitas e passar para o time quando precisar.",
  comportamento: "Simpática, objetiva e prestativa. Responde em áudio quando o cliente manda áudio.",
  empresaNome: "Nova Rota Distribuidora",
  empresaSetor: "Distribuição de alimentos e bebidas",
  empresaProdutos: "Mercearia (café, açúcar, arroz, azeite, biscoitos) e bebidas (refrigerantes, água e sucos).",
  empresaDiferenciais: "Entrega em até 48 h em Santa Catarina, pedido mínimo de R$ 300 e 3% de desconto no Pix.",
  empresaPublico: "Mercados, padarias, lanchonetes, bares e restaurantes de Santa Catarina.",
  modoPrompt: "unico",
  prompt: "",
  etapas: [],
  scripts: "",
  regras: "",
  equipeTransferenciaId: null,
  mensagemTransferencia: "Vou te passar agora para o nosso time comercial, que já recebe o resumo da nossa conversa. 😉",
  resumoTransferencia: true,
  prioridadeTransferencia: null,
  etiquetasTransferencia: [],
  equipeFallbackId: null,
  tempoRespostaSeg: 5,
  emojis: "moderado",
  transparencia: "silenciosa",
  dividirMensagens: true,
  intervaloMensagensSeg: 2,
  vozId: null,
  vozElevenlabsId: "n2a9VtkZLl8j1FSXHsL7",
  vozGenerica: null,
  provedor: "anthropic",
  modelo: "claude-sonnet-4-5",
  chaveConfigurada: true,
};
