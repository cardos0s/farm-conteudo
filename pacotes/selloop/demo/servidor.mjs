// Servidor de demonstração da Nova Rota: responde à interface real da Selloop no lugar da API,
// só dentro do navegador da gravação. Nenhuma requisição chega ao servidor de verdade.
//
// Uso (Playwright):
//   const demo = await instalarDemo(page, { usuario: "diogo", agora: new Date("2026-11-10T10:32:00-03:00") });
//   await page.goto("https://app.selloop.com.br/atendimento");
//   demo.chegar("marina", { tipo: "text", texto: "Fechado!" });   // mensagem nova, ao vivo

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as D from "./dados.mjs";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const ARQUIVOS = path.join(AQUI, "arquivos");
const API = /^https:\/\/api\.selloop\.com\.br\/api\/(.*)$/;

const tiposArquivo = { ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml", ".mp3": "audio/mpeg", ".ogg": "audio/ogg", ".pdf": "application/pdf", ".mp4": "video/mp4", ".webp": "image/webp" };

function permissoes(papel) {
  const tudo = { create: true, delete: true, edit: true, view: true };
  const mod = ["tags", "goals", "lists", "roles", "teams", "users", "account", "tickets", "channels", "copiloto", "products", "projects", "settings", "agente_ia", "campaigns", "functions", "automations", "faturamento", "saas_roadmap", "saas_controle", "saas_helpdesk"];
  const p = Object.fromEntries(mod.map((m) => [m, { ...tudo }]));
  p.tasks = { ...tudo, viewAll: true };
  p.pipelines = { ...tudo, viewAll: true };
  p.contacts = { ...tudo, export: true };
  p.companies = { ...tudo, export: true };
  p.contracts = { ...tudo, approve: true };
  p.conversations = { ...tudo, viewAll: papel === "Administrador", viewTeam: papel !== "Administrador" };
  if (papel !== "Administrador") {
    for (const m of ["settings", "roles", "users", "account", "faturamento", "saas_roadmap", "saas_controle", "saas_helpdesk", "channels"]) p[m] = { create: false, delete: false, edit: false, view: m === "channels" };
    p.tasks.viewAll = false;
    p.pipelines.viewAll = false;
  }
  p.saas_roadmap = { create: false, delete: false, edit: false, view: false };
  p.saas_controle = { create: false, delete: false, edit: false, view: false };
  p.saas_helpdesk = { create: false, delete: false, edit: false, view: false };
  return p;
}

export function criarEstado({ usuario = "patricia", agora = new Date() } = {}) {
  const t = (minAtras) => new Date(agora.getTime() - minAtras * 60000).toISOString();
  const eu = D.usuarios[usuario];
  const papeis = {
    Administrador: { id: D.id("r:admin"), name: "Administrador", isSystem: true },
    Operador: { id: D.id("r:operador"), name: "Operador", isSystem: true },
  };

  const contatos = {};
  const conversas = [];
  const mensagens = {};
  let protocolo = 1;
  for (const c of D.conversas) {
    const contatoId = D.id(`ct:${c.chave}`);
    const canal = D.canais[c.canal];
    contatos[c.chave] = {
      id: contatoId,
      name: c.contato,
      role: null,
      photoUrl: fs.existsSync(path.join(ARQUIVOS, "avatares", `${c.chave}.jpg`)) ? `/api/uploads/demo/avatares/${c.chave}.jpg` : null,
      readReceiptsOffAt: null,
      tags: c.etiquetas.map((n) => ({ id: D.id(`tag:${n}`), name: n, color: "#2849db" })),
    };
    const conversaId = D.id(`cv:${c.chave}`);
    const ultimaEntrada = t(c.min);
    conversas.push({
      chave: c.chave,
      id: conversaId,
      workspaceId: D.WS,
      status: "open",
      protocol: `#2026111000${String(protocolo++).padStart(3, "0")}`,
      unreadMessages: c.naoLidas,
      isPinned: false,
      snoozedUntil: null,
      assignedUserId: c.atendente ? D.usuarios[c.atendente].id : null,
      assignedTeamId: D.equipes[c.equipe].id,
      prioridade: "normal",
      lastMessageAt: ultimaEntrada,
      waWindowExpiresAt: canal.tipo === "whatsapp" ? new Date(new Date(ultimaEntrada).getTime() + 86400000).toISOString() : null,
      waLastTemplateAt: null,
      adReferralAt: null,
      adHeadline: null,
      adSourceUrl: null,
      adFirstReplyAt: null,
      closedAt: null,
      archivedAt: null,
      closedByTeamId: null,
      closedByTeamName: null,
      emailSubject: null,
      createdAt: t(c.min + 30),
      updatedAt: ultimaEntrada,
      peerAddress: c.fone,
      lastMessagePreview: c.ultima,
      lastMessageType: "text",
      contact: contatos[c.chave],
      channel: { id: canal.id, type: canal.tipo, name: canal.nome, identifier: canal.identificador },
    });
    const hist = D.historicos[c.chave] ?? [["in", c.min, c.ultima]];
    mensagens[conversaId] = hist.map(([dir, min, texto, quem], i) => mensagem({ conversaId, contatoId, dir, criado: t(min), texto, quem, i }));
  }

  // Relógio da demo: começa em `agora` e anda junto com o relógio real (como o page.clock da página).
  const inicioReal = Date.now();
  const agoraSim = () => new Date(agora.getTime() + (Date.now() - inicioReal));
  return { agora, agoraSim, t, eu, usuario, papeis, contatos, conversas, mensagens, cobrancas: {}, enviados: {}, extras: {}, ws: null, log: [] };
}

const brl = (v) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function produtoApi(p) {
  return {
    id: D.id(`prod:${p.chave}`),
    workspaceId: D.WS,
    name: p.nome,
    code: p.codigo,
    price: p.preco.toFixed(2),
    unit: p.unidade,
    description: null,
    imageUrl: `/api/uploads/demo/produtos/${p.foto}`,
    categoryId: D.categorias.find((c) => c.name.toLowerCase() === D.categoriaDo[p.chave])?.id ?? null,
    status: "active",
    createdAt: "2026-09-01T12:00:00.000Z",
    updatedAt: "2026-09-01T12:00:00.000Z",
    deletedAt: null,
  };
}

/** Cria a mensagem de saída que o backend criaria para cada recurso do clipe. */
function mensagemDeSaida(s, conversa, corpo) {
  const criado = s.agoraSim().toISOString();
  const i = (s.mensagens[conversa.id]?.length ?? 0) + 1;
  const base = { conversaId: conversa.id, contatoId: conversa.contact.id, dir: "out", criado, quem: s.usuario, i };
  const extra = { status: "sent", clientKey: corpo.clientKey ?? null, scheduledFor: corpo.scheduledFor ?? null };
  if (corpo.productId) {
    const p = D.produtos.find((x) => D.id(`prod:${x.chave}`) === corpo.productId);
    return mensagem({ ...base, tipo: "image", texto: `${p.nome}\n${brl(p.preco)}`, extra: { ...extra, fileUrl: `/api/uploads/demo/produtos/${p.foto}`, templateButtons: [{ texto: "Ver produto" }] } });
  }
  if (corpo.productIds?.length) {
    const nomes = corpo.productIds.map((pid) => D.produtos.find((x) => D.id(`prod:${x.chave}`) === pid)?.nome).filter(Boolean);
    return mensagem({ ...base, texto: `${corpo.message || "Separei estes produtos para você:"}\n\n${nomes.map((n) => `• ${n}`).join("\n")}\n\nVeja fotos e preços: https://vitrine.novarota.com.br/7KQ2`, extra });
  }
  if (corpo.formularioId) {
    const f = D.formularios.find((x) => x.id === corpo.formularioId);
    return mensagem({ ...base, texto: f.mensagem, extra: { ...extra, flow: { cta: f.botao, formularioId: f.id } } });
  }
  if (corpo.orcamentoModeloId) {
    const o = D.orcamentos.find((x) => x.id === corpo.orcamentoModeloId) ?? D.orcamentos[0];
    return mensagem({ ...base, texto: o.mensagem, extra: { ...extra, flow: { cta: o.botao, orcamentoModeloId: o.id } } });
  }
  if (corpo.enqueteId || corpo.enquete) {
    const e = D.enquetes.find((x) => x.id === corpo.enqueteId) ?? { id: D.id("enq:nova"), ...corpo.enquete };
    return mensagem({ ...base, texto: e.pergunta, extra: { ...extra, templateButtons: e.opcoes.map((o) => ({ texto: o, enquete: { id: e.id, terminaEm: e.terminaEm ?? null } })) } });
  }
  const tipo = corpo.type ?? "text";
  return mensagem({ ...base, tipo, texto: corpo.message ?? "", extra: { ...extra, fileUrl: corpo.fileUrl ?? null, replyId: corpo.replyId ?? null, hiddenService: !!corpo.hiddenService } });
}

function registrar(s, conversa, msg) {
  (s.mensagens[conversa.id] ??= []).push(msg);
  conversa.lastMessageAt = msg.createdAt;
  conversa.updatedAt = msg.createdAt;
  conversa.lastMessagePreview = msg.message || (msg.cobranca ? "Solicitação de pagamento" : "");
  conversa.lastMessageType = msg.type;
  return msg;
}

function modeloApi(s, m) {
  const nomes = [...new Set([...m.body.matchAll(/\[([a-z_]+)\]/g)].map((x) => x[1]))];
  const exemplos = { contato: "Marina", pedido: "1189", vencimento: "17/11", janela: "9h às 12h" };
  const tid = D.id(`tpl:${m.chave}`);
  return {
    id: tid,
    workspaceId: D.WS,
    name: m.name,
    displayName: m.displayName,
    language: "pt_BR",
    category: m.category,
    headerType: m.headerType,
    headerText: null,
    headerHandle: null,
    headerFileName: m.headerUrl ? m.headerUrl.split("/").pop() : null,
    headerUrl: absoluta(m.headerUrl),
    body: m.body,
    footer: m.footer,
    variables: nomes.map((nome) => ({ nome, tipo: "texto", origem: nome === "contato" ? "contato" : "envio", exemplo: exemplos[nome] ?? nome })),
    buttons: m.buttons,
    availableScope: "empresa",
    availableTeamIds: [],
    availableFunctionIds: [],
    createdByUserId: D.usuarios.patricia.id,
    status: "enviado",
    createdAt: s.t(30000),
    updatedAt: s.t(30000),
    deletedAt: null,
    channels: [{ id: D.id(`tplc:${m.chave}`), templateId: tid, channelId: D.canais.whatsapp.id, status: "aprovado", metaTemplateId: String(1900000000000000 + m.name.length * 7919), rejectedReason: null, createdAt: s.t(30000), updatedAt: s.t(29000), deletedAt: null, canalNome: D.canais.whatsapp.nome, canalNumero: D.canais.whatsapp.identificador }],
  };
}

/** A prévia do cabeçalho usa a URL como está: arquivos da demo precisam do endereço completo da API. */
const absoluta = (u) => (u && u.startsWith("/") ? `https://api.selloop.com.br${u}` : u ?? null);

/** O mesmo modelo no formato da API da Meta (seletor de modelos do agendamento e da campanha). */
function modeloMeta(m) {
  const exemplos = { contato: "Marina", pedido: "1189", vencimento: "17/11", janela: "9h às 12h" };
  const nomes = [...new Set([...m.body.matchAll(/\[([a-z_]+)\]/g)].map((x) => x[1]))];
  const comp = [];
  if (m.headerType === "imagem") comp.push({ type: "HEADER", format: "IMAGE", example: { header_handle: [absoluta(m.headerUrl)] } });
  comp.push({
    type: "BODY",
    text: m.body.replace(/\[([a-z_]+)\]/g, "{{$1}}"),
    ...(nomes.length ? { example: { body_text_named_params: nomes.map((n) => ({ param_name: n, example: exemplos[n] ?? n })) } } : {}),
  });
  if (m.footer) comp.push({ type: "FOOTER", text: m.footer });
  if (m.buttons?.length) comp.push({ type: "BUTTONS", buttons: m.buttons.map((b) => ({ type: "QUICK_REPLY", text: b.texto })) });
  return {
    id: D.id(`meta:${m.chave}`),
    name: m.name,
    language: "pt_BR",
    status: "APPROVED",
    category: m.category,
    displayName: m.displayName,
    components: comp,
    headerMedia: m.headerType === "imagem" ? { type: "image", url: absoluta(m.headerUrl), fileName: m.headerUrl.split("/").pop() } : null,
    automaticas: nomes.includes("contato") ? ["contato"] : [],
  };
}

/** Indicadores de atendimento de uma distribuidora com 4 atendentes e a Lia (agente de IA) à noite. */
function indicadores(s, dias) {
  const k = dias / 7;
  const fim = s.agoraSim();
  const capacidade = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(fim.getTime() - (6 - i) * 86400000);
    const novos = [44, 51, 47, 39, 22, 9, 46][i];
    return { dia: `${d.getDate()}/${d.getMonth() + 1}`, novos, concluidos: novos - [2, 4, 1, 3, 0, 1, 5][i], pendentes: [6, 9, 7, 8, 5, 4, 9][i] };
  });
  const pico = [2, 1, 1, 0, 0, 0, 1, 4, 11, 19, 27, 24, 15, 13, 18, 23, 21, 16, 10, 7, 6, 5, 4, 3];
  const canais = [
    { canal: D.canais.whatsapp, qtd: Math.round(194 * k) },
    { canal: D.canais.instagram, qtd: Math.round(77 * k) },
    { canal: D.canais.facebook, qtd: Math.round(47 * k) },
  ];
  const total = canais.reduce((n, c) => n + c.qtd, 0);
  return {
    status: { novos: 5, emAndamento: 9, aguardando: 3, concluidos: Math.round(301 * k) },
    esperaMin: 3,
    duracaoMin: 18,
    capacidade,
    novosNoPeriodo: Math.round(318 * k),
    concluidosNoPeriodo: Math.round(301 * k),
    porCanal: canais.map((c) => ({ channelId: c.canal.id, nome: c.canal.tipo === "whatsapp" ? "WhatsApp · Nova Rota" : c.canal.tipo === "instagram" ? "Instagram · @novarota" : "Messenger · Nova Rota", removido: false, qtd: c.qtd, pct: Math.round((c.qtd / total) * 100) })),
    horarioPico: pico.map((qtd, h) => ({ hora: `${String(h).padStart(2, "0")}h`, qtd: Math.round(qtd * k) })),
    equipeCampea: { id: D.equipes.comercial.id, qtd: Math.round(164 * k) },
    usuarioCampeao: { id: D.usuarios.diogo.id, qtd: Math.round(97 * k) },
    satisfacao: {
      mediaEmpresa: 4.8,
      totalEmpresa: Math.round(126 * k),
      mediaEscopo: 4.8,
      totalEscopo: Math.round(126 * k),
      porUsuario: [
        { id: D.usuarios.diogo.id, userId: D.usuarios.diogo.id, nome: D.usuarios.diogo.nome, media: 4.9, total: Math.round(48 * k) },
        { id: D.usuarios.bruna.id, userId: D.usuarios.bruna.id, nome: D.usuarios.bruna.nome, media: 4.8, total: Math.round(41 * k) },
        { id: D.usuarios.rafael.id, userId: D.usuarios.rafael.id, nome: D.usuarios.rafael.nome, media: 4.7, total: Math.round(37 * k) },
      ],
      porNota: [1, 1, 4, 17, 103].map((n) => Math.round(n * k)),
    },
    totalConv: total,
  };
}

/** Central de Protocolos: as conversas abertas e as concluídas do dia. */
function protocolos(s, q) {
  const linhas = s.conversas.map((c) => {
    const u = Object.values(D.usuarios).find((x) => x.id === c.assignedUserId);
    const eq = Object.values(D.equipes).find((x) => x.id === c.assignedTeamId);
    const criado = new Date(c.createdAt).getTime();
    return {
      id: c.id,
      protocol: c.protocol,
      status: c.status,
      assignedUserId: c.assignedUserId,
      closedAt: c.closedAt,
      createdAt: c.createdAt,
      contactId: c.contact.id,
      contactName: c.contact.name,
      companyName: D.conversas.find((x) => x.chave === c.chave)?.empresa ?? null,
      channelType: c.channel.type,
      channelName: c.channel.name,
      channelIdentifier: c.channel.identifier,
      responsavelUserName: u?.nome ?? null,
      responsavelTeamName: eq?.nome ?? null,
      primeiraRespostaSegundos: 60 + (c.protocol.charCodeAt(c.protocol.length - 1) % 5) * 37,
      tempoTotalSegundos: Math.max(300, Math.round((s.agoraSim().getTime() - criado) / 1000)),
      inatividadeSegundos: Math.round((s.agoraSim().getTime() - new Date(c.lastMessageAt).getTime()) / 1000),
    };
  });
  let r = linhas;
  const st = q.get("status");
  if (st === "aguardando") r = r.filter((x) => !x.closedAt && !x.assignedUserId);
  if (st === "andamento") r = r.filter((x) => !x.closedAt && x.assignedUserId);
  if (st === "concluidos") r = r.filter((x) => x.closedAt);
  const busca = (q.get("q") ?? "").toLowerCase();
  if (busca) r = r.filter((x) => (x.protocol + x.contactName + (x.companyName ?? "")).toLowerCase().includes(busca));
  r.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return { data: r, total: r.length, limit: 50, offset: 0, hasMore: false };
}

function hojeMais(s, dias) {
  const d = new Date(s.agoraSim().getTime() + dias * 86400000);
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(d);
}

function pixCopiaCola(valor) {
  const v = valor.toFixed(2);
  return `00020126580014br.gov.bcb.pix0136a1f3c2d4-7b8e-4f19-9c0d-5e6f7a8b9c0d52040000530398654${String(v.length).padStart(2, "0")}${v}5802BR5917NOVA ROTA DISTRIB6013FLORIANOPOLIS62070503***6304B1E4`;
}

function mensagem({ conversaId, contatoId, dir, criado, texto, quem, i, tipo = "text", extra = {} }) {
  const u = quem ? D.usuarios[quem] : null;
  const sistema = dir === "system";
  return {
    id: D.id(`msg:${conversaId}:${i}:${criado}`),
    workspaceId: D.WS,
    conversationId: conversaId,
    contactId: contatoId,
    direction: dir === "in" ? "inbound" : "outbound",
    type: sistema ? "system" : tipo,
    message: texto,
    fileUrl: null,
    transcription: null,
    externalId: `demo-${i}`,
    replyId: null,
    forwarded: false,
    attempts: 0,
    status: dir === "in" ? "received" : "read",
    readInferred: false,
    messageError: null,
    senderPrefix: null,
    senderUserId: u?.id ?? null,
    reactions: [],
    scheduledFor: null,
    deletedByContactAt: null,
    deletedByUsAt: null,
    hiddenService: false,
    templateName: null,
    templateLanguage: null,
    templateParams: null,
    contactCards: null,
    product: null,
    templateButtons: null,
    flow: null,
    assignTeamId: null,
    clientKey: null,
    aiAgentId: null,
    createdAt: criado,
    updatedAt: criado,
    deletedAt: null,
    senderNome: u?.nome ?? null,
    ...extra,
  };
}

// ── Respostas ──────────────────────────────────────────────────────────────────

function lista(data, extra = {}) {
  return { data, limit: 100, offset: 0, ...extra };
}

function workspace() {
  return {
    id: D.WS,
    name: D.empresa.nome,
    ownerUserId: D.usuarios.patricia.id,
    isPlatformOwner: false,
    documentName: D.empresa.razao,
    document: D.empresa.cnpj,
    phone: D.empresa.telefone,
    email: D.empresa.email,
    logoUrl: null,
    primaryColor: "#2849db",
    street: "Rua das Gaivotas",
    number: "120",
    complement: null,
    district: "Centro",
    city: D.empresa.cidade,
    state: D.empresa.uf,
    zip: "88010-000",
    country: "Brasil",
    companyRequiredFields: null,
    companyHiddenFields: null,
    companyRegistrationTypes: null,
    defaultEmailSignature: null,
    sdrIndicatorsEnabled: true,
    satisfactionSurveyEnabled: true,
    satisfactionSurveyMessage: "Como você avalia o nosso atendimento?",
    satisfactionSurveyLabels: ["Péssimo", "Ruim", "Regular", "Bom", "Excelente"],
    satisfactionSurveyThanks: "Obrigado pela avaliação!",
    satisfactionSurveyCloseOnAnswer: true,
    satisfactionSurveyTimeoutHours: 24,
    satisfactionSurveyFormat: "button",
    currency: "BRL",
    timezone: "America/Sao_Paulo",
    locale: "pt-BR",
    dateFormat: "DD/MM/YYYY",
    operatingCountry: "BR",
    goalTypeMode: "both",
    awardRule: "won",
    awardPaymentDay: null,
    responsibleName: D.usuarios.patricia.nome,
    responsibleEmail: D.usuarios.patricia.email,
  };
}

function filtrarConversas(s, q) {
  const status = q.get("status");
  const atrib = q.get("assigned");
  const tipos = (q.get("channelTypes") ?? "whatsapp,instagram,facebook").split(",");
  let r = s.conversas.filter((c) => tipos.includes(c.channel.type));
  if (q.get("contactId")) r = r.filter((c) => c.contact.id === q.get("contactId"));
  if (status) r = r.filter((c) => c.status === status);
  if (q.get("excludeClosed") === "true") r = r.filter((c) => c.status !== "closed");
  if (atrib === "none") r = r.filter((c) => !c.assignedUserId);
  if (atrib === "me") r = r.filter((c) => c.assignedUserId === s.eu.id);
  const busca = q.get("q") ?? q.get("search");
  if (busca) r = r.filter((c) => (c.contact.name + c.protocol).toLowerCase().includes(busca.toLowerCase()));
  r = [...r].sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt));
  return { data: r.map(({ chave, ...c }) => c), limit: Number(q.get("limit") ?? 50), offset: 0, card: null };
}

function contagens(s) {
  const abertas = s.conversas.filter((c) => c.status === "open");
  const porCanal = Object.values(D.canais).map((c) => ({ type: c.tipo, count: abertas.filter((x) => x.channel.id === c.id).length, channelId: c.id }));
  const soma = (f) => abertas.filter(f).reduce((n, c) => n + c.unreadMessages, 0);
  return {
    byStatus: { open: abertas.length, snoozed: 0, closed: s.conversas.length - abertas.length },
    byChannel: porCanal,
    unassigned: abertas.filter((c) => !c.assignedUserId).length,
    archived: 0,
    unreadTotal: soma(() => true),
    unreadMine: soma((c) => c.assignedUserId === s.eu.id),
    unreadAssigned: soma((c) => !!c.assignedUserId),
    unreadUnassigned: soma((c) => !c.assignedUserId),
  };
}

function rotas(s) {
  const eu = s.eu;
  const papel = s.papeis[eu.papel];
  const membro = (u) => ({ userId: u.id, name: u.nome, email: u.email, image: avatarUsuario(u), roleName: u.papel, status: "active", online: true });
  return [
    ["GET", /^auth\/get-session$/, () => ({
      session: { expiresAt: new Date(s.agora.getTime() + 30 * 86400000).toISOString(), token: "demo", createdAt: s.t(60), updatedAt: s.t(60), ipAddress: "127.0.0.1", userAgent: "demo", userId: eu.id, id: "demo-sessao" },
      user: { name: eu.nome, email: eu.email, emailVerified: true, image: avatarUsuario(eu), createdAt: s.t(100000), updatedAt: s.t(1000), twoFactorEnabled: false, id: eu.id },
    })],
    ["GET", /^carteira$/, () => [workspace()]],
    ["GET", /^backoffice\/me$/, () => ({ userId: eu.id, isPlatformAdmin: false, isSuperAdmin: false, saas: { controle: false, helpdesk: false, roadmap: false, roadmapAdmin: false } })],
    ["GET", /^backoffice\/(roadmap\/unread|helpdesk\/nao-lidas)$/, () => ({ total: 0 })],
    ["GET", /^public\/settings$/, () => ({ selfSignupEnabled: false, comunicacaoTutoriaisVisivel: true, comunicacaoNewsVisivel: true, integracaoLogos: {} })],
    ["GET", /^news$/, () => ({ data: [] })],
    ["GET", /^carteira\/[^/]+$/, () => workspace()],
    ["GET", /^carteira\/[^/]+\/me$/, () => ({
      userId: eu.id,
      role: papel,
      saasRole: null,
      isOwner: eu === D.usuarios.patricia,
      isAdmin: eu.papel === "Administrador",
      canSeeBilling: eu.papel === "Administrador",
      nickname: null,
      nicknameEnabled: true,
      modules: { conversations: true, channels: true, contacts: true, companies: true, pipelines: true, products: true, contracts: true, tasks: true, goals: true, automations: true, copiloto: true, campaigns: true, agente_ia: true, ligacao_whatsapp: false, telefonia: false, pagamentos: true, tickets: false },
      modalidade: "cliente",
      enableIntegrations: true,
      enabledIntegrations: {},
      permissions: permissoes(eu.papel),
    })],
    ["GET", /^carteira\/[^/]+\/me\/notifications$/, () => ({ data: [], unread: 0 })],
    ["GET", /^carteira\/[^/]+\/me\/notice$/, () => null],
    ["GET", /^carteira\/[^/]+\/me\/telefonia$/, () => ({ ativo: false })],
    ["GET", /^carteira\/[^/]+\/support-tickets\/nao-lidas$/, () => ({ total: 0 })],
    ["GET", /^carteira\/[^/]+\/(units|companies|pipelines|roles|lists|functions)$/, () => lista([])],
    ["GET", /^carteira\/[^/]+\/tags$/, () => lista([...new Set([...Object.keys(D.etiquetasCarteira), ...D.conversas.flatMap((c) => c.etiquetas)])].map((n) => ({ id: D.id(`tag:${n}`), name: n, description: null, color: "#2849db", type: "contact", workspaceId: D.WS, createdAt: s.t(9000), updatedAt: s.t(9000), deletedAt: null })))],
    ["GET", /^carteira\/[^/]+\/segments$/, () => lista(["Mercados e supermercados", "Bares e restaurantes", "Padarias e cafés"].map((n) => ({ id: D.id(`seg:${n}`), name: n, description: "", status: "active", workspaceId: D.WS, createdAt: s.t(9000), updatedAt: s.t(9000), deletedAt: null })))],
    ["GET", /^carteira\/[^/]+\/teams$/, () => lista(Object.values(D.equipes).map((e) => ({ id: e.id, name: e.nome, description: "", color: e.cor, isDepartment: true, workspaceId: D.WS, createdAt: s.t(9000), updatedAt: s.t(9000), deletedAt: null, isSystem: false })))],
    ["GET", /^carteira\/[^/]+\/team-chat$/, () => ({ equipe: { naoLidas: 0, ultimaEm: null }, equipes: [], colegas: Object.values(D.usuarios).filter((u) => u !== eu).map((u) => ({ userId: u.id, name: u.nome, image: avatarUsuario(u), naoLidas: 0, ultimaEm: null })), grupos: [], podeGerenciarGrupos: true })],
    ["GET", /^carteira\/[^/]+\/conversations\/atendentes-e-equipes$/, () => ({
      membros: Object.values(D.usuarios).map(membro),
      equipes: Object.values(D.equipes).map((e) => ({ id: e.id, name: e.nome, color: e.cor, isDepartment: true, onlineCount: 1 })),
    })],
    ["GET", /^carteira\/[^/]+\/conversations\/counts$/, () => contagens(s)],
    ["GET", /^carteira\/[^/]+\/conversations$/, (_m, q) => filtrarConversas(s, q)],
    ["GET", /^carteira\/[^/]+\/conversations\/([^/]+)\/messages$/, (m) => {
      const lst = [...(s.mensagens[m[1]] ?? [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      return { data: lst, limit: 50, offset: 0, nextBefore: null };
    }],
    ["GET", /^carteira\/[^/]+\/conversations\/([^/]+)\/agente$/, (m) => ({ agente: s.extras.agentePorConversa?.[m[1]] ?? null })],
    ["GET", /^carteira\/[^/]+\/conversations\/([^/]+)\/notes$/, () => ({ data: [] })],
    ["GET", /^carteira\/[^/]+\/conversations\/([0-9a-f-]{36})$/, (m) => {
      const c = s.conversas.find((x) => x.id === m[1]);
      if (!c) return { __status: 404, corpo: { error: "not_found" } };
      const { chave, ...api } = c;
      return api;
    }],
    // Concluir, transferir, prioridade: o PATCH da conversa.
    ["PATCH", /^carteira\/[^/]+\/conversations\/([^/]+)$/, (m, _q, corpo = {}) => {
      const c = s.conversas.find((x) => x.id === m[1]);
      if (!c) return { __status: 404, corpo: { error: "not_found" } };
      if (process.env.DEMO_DEBUG) console.log("[demo] PATCH conversa", JSON.stringify(corpo));
      const agora = s.agoraSim().toISOString();
      if (corpo.status === "closed" && c.status !== "closed") {
        c.status = "closed";
        c.closedAt = agora;
        c.closedByTeamId = c.assignedTeamId;
        c.closedByTeamName = Object.values(D.equipes).find((e) => e.id === c.assignedTeamId)?.nome ?? null;
        const pesquisa = corpo.sendSurvey ?? corpo.enviarPesquisa ?? corpo.satisfactionSurvey ?? corpo.pesquisa ?? true;
        if (pesquisa) {
          const nome = c.contact.name.split(" ")[0];
          const msg = registrar(s, c, mensagem({ conversaId: c.id, contatoId: c.contact.id, dir: "out", criado: agora, i: (s.mensagens[c.id]?.length ?? 0) + 1,
            texto: `Obrigado pelo contato, ${nome}! 💙\nComo você avalia o nosso atendimento? Leva 5 segundos:\nhttps://app.selloop.com.br/pesquisa/k7Qm${c.protocol.slice(-4)}xNa`, extra: { status: "sent" } }));
          setTimeout(() => s.ws?.send(JSON.stringify({ kind: "message", conversationId: c.id, data: msg })), 300);
        }
      }
      if (corpo.status === "open") {
        c.status = "open";
        c.closedAt = null;
      }
      if ("assignedTeamId" in corpo && corpo.assignedTeamId && corpo.assignedTeamId !== c.assignedTeamId) {
        c.assignedTeamId = corpo.assignedTeamId;
        const eq = Object.values(D.equipes).find((e) => e.id === corpo.assignedTeamId);
        const msg = registrar(s, c, mensagem({ conversaId: c.id, contatoId: c.contact.id, dir: "system", criado: agora, i: (s.mensagens[c.id]?.length ?? 0) + 1, texto: `Conversa transferida para ${eq?.nome ?? "outra equipe"}.` }));
        setTimeout(() => s.ws?.send(JSON.stringify({ kind: "message", conversationId: c.id, data: msg })), 300);
      }
      if ("assignedUserId" in corpo) c.assignedUserId = corpo.assignedUserId;
      if (corpo.prioridade) c.prioridade = corpo.prioridade;
      c.updatedAt = agora;
      const { chave, ...api } = c;
      return api;
    }],
    ["GET", /^carteira\/[^/]+\/documentos-erp\/disponivel$/, () => ({ disponivel: true })],
    ["GET", /^carteira\/[^/]+\/ai\/features$/, () => ({ features: { transcricao_audio: true, atendimento: true, pesquisa_web: true, agenda: true, negocio: true } })],
    ["GET", /^carteira\/[^/]+\/ai-agents$/, () => ({ data: [agenteApi(s)], contratados: 1, emUso: [D.lia.id] })],
    ["GET", /^carteira\/[^/]+\/channels$/, () => lista(Object.values(D.canais).map((c) => ({
      id: c.id, workspaceId: D.WS, type: c.tipo, name: c.nome, externalId: `demo-${c.tipo}`, status: "active", ownerUserId: D.usuarios.patricia.id, config: {},
      connectionHealth: "healthy", connectionHealthDetail: null, connectionCheckedAt: s.t(5), createdAt: s.t(90000), updatedAt: s.t(5), deletedAt: null,
      identifier: c.identificador, whatsappConfigured: c.tipo === "whatsapp", emailConfigured: false, ligacaoEstado: null,
    })))],
    ["GET", /^carteira\/[^/]+\/products$/, (_m, q) => {
      const busca = (q.get("search") ?? q.get("q") ?? "").toLowerCase();
      const r = D.produtos.map(produtoApi).filter((p) => !busca || (p.name + p.code).toLowerCase().includes(busca));
      return lista(r, { total: r.length });
    }],
    ["GET", /^carteira\/[^/]+\/categories$/, () => lista(D.categorias.map((c) => ({ ...c, workspaceId: D.WS })))],
    ["GET", /^carteira\/[^/]+\/orcamentos$/, () => ({
      data: D.orcamentos.map((o) => ({
        ...o,
        agentes: [],
        config: {
          itens: D.produtos.map((p) => ({ productId: D.id(`prod:${p.chave}`), nome: p.nome, preco: p.preco })),
          valorMinimo: 300,
          cnpjObrigatorio: true,
          consultarEstoque: false,
          fob: true,
          cif: true,
          estados: [{ uf: "SC" }],
          regioes: [{ nome: "Grande Florianópolis" }, { nome: "Vale do Itajaí" }, { nome: "Norte catarinense" }],
          pagamentos: [{ id: "pix", nome: "Pix", desconto: "3" }, { id: "boleto", nome: "Boleto 28 dias", desconto: "0" }, { id: "cartao", nome: "Cartão", desconto: "0" }],
        },
      })),
    })],
    ["GET", /^carteira\/[^/]+\/formularios$/, () => ({ data: D.formularios.map((f) => ({ ...f, agentes: [] })) })],
    ["GET", /^carteira\/[^/]+\/enquetes$/, () => ({ data: D.enquetes.map((e) => ({ ...e, votos: 0, enviadas: 0, criadaEm: s.t(9000) })) })],
    ["GET", /^carteira\/[^/]+\/enquetes\/([^/]+)\/resultados$/, (m) => {
      const e = D.enquetes.find((x) => x.id === m[1]) ?? D.enquetes[0];
      return { opcoes: e.opcoes.map((o) => ({ opcao: o, votos: 0 })), pessoas: [], total: 0 };
    }],
    ["GET", /^carteira\/[^/]+\/(quick-messages|chatbots|scheduled-messages|catalogos)$/, () => ({ data: [] })],
    // Campanhas
    ["GET", /^carteira\/[^/]+\/campaigns$/, (_m, q) => ({ data: [...D.campanhas.map((c) => campanhaApi(s, c)), ...(s.extras.campanhasNovas ?? [])].filter((c) => q.get("arquivadas") === "1" ? c.archivedAt : !c.archivedAt) })],
    ["GET", /^carteira\/[^/]+\/campaigns\/indicadores$/, (_m, q) => indicadoresCampanhas(s, Number(q.get("dias") ?? 30))],
    ["GET", /^carteira\/[^/]+\/campaigns\/(interagiram|nao-interagiram)$/, (m) => {
      const pessoas = contatosCarteira(m[1] === "interagiram" ? 38 : 64, m[1] === "interagiram" ? 7 : 9);
      const camp = D.campanhas[0];
      return { data: pessoas.map((p, i) => ({ recipientId: D.id(`rec:${m[1]}:${i}`), campanhaId: D.id(`camp:${camp.chave}`), campanha: camp.nome, contatoId: p.id, nome: p.name, telefone: p.phone, conversaId: D.id(`cvc:${i}`), enviadoEm: s.t(60 * 24 * 7 - i * 3), etapa: i % 5 === 0 ? 1 : 2, totalEtapas: 2, emSequencia: i % 5 === 0, ...(m[1] === "interagiram" ? { respondidoEm: s.t(60 * 24 * 7 - 30 - i * 5), resposta: ["Quero aproveitar", "Falar com vendedor", "Quero aproveitar"][i % 3] } : {}) })) };
    }],
    ["POST", /^carteira\/[^/]+\/campaigns\/nao-interagiram\/acoes$/, (_m, _q, corpo = {}) => ({ ok: true, aplicados: (corpo.recipientIds ?? []).length })],
    ["GET", /^carteira\/[^/]+\/campaigns\/([0-9a-f-]{36})$/, (m) => {
      const c = D.campanhas.find((x) => D.id(`camp:${x.chave}`) === m[1]);
      return c ? campanhaApi(s, c) : (s.extras.campanhasNovas ?? []).find((x) => x.id === m[1]) ?? { __status: 404, corpo: { error: "not_found" } };
    }],
    ["GET", /^carteira\/[^/]+\/campaigns\/([0-9a-f-]{36})\/template$/, (m) => {
      const c = D.campanhas.find((x) => D.id(`camp:${x.chave}`) === m[1]);
      const modelo = D.modelos.find((x) => x.chave === (c?.modelo ?? "promo"));
      return { data: modeloMeta(modelo) };
    }],
    ["GET", /^carteira\/[^/]+\/campaigns\/([0-9a-f-]{36})\/recipients$/, (m) => {
      const c = D.campanhas.find((x) => D.id(`camp:${x.chave}`) === m[1]) ?? D.campanhas[0];
      const t = campanhaApi(s, c).totais;
      const pessoas = contatosCarteira(40, 3);
      const st = (i) => (i < 40 * (t.respondidos / Math.max(1, t.enviados)) ? "respondido" : i < 40 * (t.lidos / Math.max(1, t.enviados)) ? "lido" : i < 40 * (t.entregues / Math.max(1, t.enviados)) ? "entregue" : "falhou");
      return { data: pessoas.map((p, i) => ({ id: D.id(`rcp:${c.chave}:${i}`), contatoId: p.id, nome: p.name, telefone: p.phone, conversaId: D.id(`cvr:${i}`), status: st(i), enviadoEm: s.t(60 * 24 * Math.max(0, c.dias ?? 0) - i), respondidoEm: st(i) === "respondido" ? s.t(60 * 24 * Math.max(0, c.dias ?? 0) - 20 - i) : null, motivoFalha: st(i) === "falhou" ? "Número sem WhatsApp" : null })) };
    }],
    ["GET", /^carteira\/[^/]+\/campaigns\/([0-9a-f-]{36})\/etapas$/, (m) => {
      const c = D.campanhas.find((x) => D.id(`camp:${x.chave}`) === m[1]) ?? D.campanhas[0];
      const t = campanhaApi(s, c).totais;
      const etapas = [{ etapa: 1, enviados: t.enviados, entregues: t.entregues, lidos: t.lidos, interagiram: t.respondidos }];
      if (c.chave === "atacado") etapas.push({ etapa: 2, enviados: Math.round((t.enviados - t.respondidos) * 0.9), entregues: Math.round((t.enviados - t.respondidos) * 0.88), lidos: Math.round((t.enviados - t.respondidos) * 0.61), interagiram: Math.round((t.enviados - t.respondidos) * 0.09) });
      return { data: etapas };
    }],
    ["POST", /^carteira\/[^/]+\/campaigns\/audience\/preview$/, (_m, _q, corpo = {}) => {
      const etiquetas = (corpo.etiquetasIds ?? []).map((tid) => Object.keys(D.etiquetasCarteira).find((n) => D.id(`tag:${n}`) === tid)).filter(Boolean);
      let total = corpo.todaCarteira ? 1580 : etiquetas.reduce((n, e, i) => n + Math.round(D.etiquetasCarteira[e] * (i === 0 ? 1 : 0.82)), 0);
      total += (corpo.contatosIncluidosIds ?? []).length;
      total = Math.max(0, total - (corpo.contatosExcluidosIds ?? []).length);
      return { total, data: contatosCarteira(Math.min(total, 30), etiquetas.length + 1).map((c) => ({ ...c, excluido: (corpo.contatosExcluidosIds ?? []).includes(c.id) })) };
    }],
    ["POST", /^carteira\/[^/]+\/campaigns\/audience\/validar-whatsapp$/, (_m, _q, corpo = {}) => {
      const etiquetas = (corpo.audience?.etiquetasIds ?? []).map((tid) => Object.keys(D.etiquetasCarteira).find((n) => D.id(`tag:${n}`) === tid)).filter(Boolean);
      const total = etiquetas.reduce((n, e, i) => n + Math.round(D.etiquetasCarteira[e] * (i === 0 ? 1 : 0.82)), 0) || 30;
      const sem = contatosCarteira(Math.max(1, Math.round(total * 0.012)), 21);
      return { total, verificados: total, naoVerificados: 0, semWhatsapp: sem.map((c) => ({ id: c.id, name: c.name, phone: c.phone, companyName: c.companyName })) };
    }],
    ["POST", /^carteira\/[^/]+\/campaigns\/audience\/sem-whatsapp$/, () => ({ ok: true })],
    ["POST", /^carteira\/[^/]+\/campaigns$/, (_m, _q, corpo = {}) => {
      const id = D.id(`camp:nova:${(s.extras.campanhasNovas ?? []).length}`);
      const agora = s.agoraSim().toISOString();
      const nova = { id, workspaceId: D.WS, name: corpo.name, channelId: corpo.channelId, teamId: corpo.teamId, enableReceptive: corpo.enableReceptive ?? true, acaoResposta: corpo.acaoResposta ?? null, templateName: corpo.templateName, templateLanguage: corpo.templateLanguage ?? "pt_BR", templateParams: corpo.templateParams ?? {}, sequencia: corpo.sequencia ?? [], acoesSaida: corpo.acoesSaida ?? null, audience: corpo.audience, dispatchConfig: corpo.dispatchConfig, status: corpo.scheduledFor ? "agendada" : "rascunho", scheduledFor: corpo.scheduledFor ?? null, startedAt: null, finishedAt: null, nextSendAt: null, pauseReason: null, pausedAt: null, recipientCount: corpo.recipientCount ?? 0, archivedAt: null, createdByUserId: s.eu.id, createdAt: agora, updatedAt: agora, deletedAt: null, sentCount: 0, totais: { enviados: 0, falhas: 0, cancelados: 0, pendentes: 0, entregues: 0, lidos: 0, respondidos: 0 } };
      (s.extras.campanhasNovas ??= []).unshift(nova);
      return nova;
    }],
    ["POST", /^carteira\/[^/]+\/campaigns\/([0-9a-f-]{36})\/(iniciar|start|agendar)$/, (m, _q, corpo = {}) => {
      const nova = (s.extras.campanhasNovas ?? []).find((x) => x.id === m[1]);
      if (nova) {
        nova.status = corpo.scheduledFor ? "agendada" : "em_envio";
        nova.scheduledFor = corpo.scheduledFor ?? null;
        if (!corpo.scheduledFor) nova.startedAt = s.agoraSim().toISOString();
      }
      return nova ?? { ok: true };
    }],
    ["GET", /^carteira\/[^/]+\/chatbots$/, () => ({ data: [] })],
    ["GET", /^carteira\/[^/]+\/meta-templates$/, () => ({ data: D.modelos.map((m) => modeloApi(s, m)) })],
    ["GET", /^carteira\/[^/]+\/channels\/[^/]+\/whatsapp\/manage-templates$/, () => ({ data: D.modelos.map(modeloMeta) })],
    ["GET", /^carteira\/[^/]+\/dashboard\/atendimento$/, (_m, q) => indicadores(s, Number(q.get("days") ?? 7))],
    ["GET", /^carteira\/[^/]+\/session-report$/, (_m, q) => protocolos(s, q)],
    // Envio (ou agendamento) de modelo aprovado pela Meta dentro da conversa.
    ["POST", /^carteira\/[^/]+\/conversations\/([^/]+)\/whatsapp-template$/, (m, _q, corpo = {}) => {
      const c = s.conversas.find((x) => x.id === m[1]);
      const modelo = D.modelos.find((x) => x.name === corpo.name);
      const params = { contato: c.contact.name.split(" ")[0], ...(corpo.params ?? {}) };
      const texto = (modelo?.body ?? corpo.name).replace(/\[([a-z_]+)\]/g, (_x, v) => params[v] ?? v);
      const msg = mensagem({ conversaId: c.id, contatoId: c.contact.id, dir: "out", criado: s.agoraSim().toISOString(), quem: s.usuario, i: (s.mensagens[c.id]?.length ?? 0) + 1, texto,
        extra: { status: corpo.scheduledFor ? "scheduled" : "sent", scheduledFor: corpo.scheduledFor ?? null, templateName: corpo.name, templateLanguage: corpo.language ?? "pt_BR", templateParams: corpo.params ?? {},
          templateButtons: modelo?.buttons?.length ? modelo.buttons.map((b) => ({ texto: b.texto })) : null, hiddenService: !!corpo.hiddenService } });
      registrar(s, c, msg);
      setTimeout(() => s.ws?.send(JSON.stringify({ kind: "message", conversationId: c.id, data: msg })), 200);
      return msg;
    }],
    ["POST", /^carteira\/[^/]+\/conversations\/([^/]+)\/messages$/, (m, _q, corpo) => {
      const c = s.conversas.find((x) => x.id === m[1]);
      return registrar(s, c, mensagemDeSaida(s, c, corpo ?? {}));
    }],
    ["GET", /^carteira\/[^/]+\/pagamentos-gateways$/, () => ({ data: [{ provedor: "asaas", nome: "Asaas", formas: ["pix", "boleto", "credito"], ativo: true }] })],
    ["GET", /^carteira\/[^/]+\/pagamentos-cobrancas\/contexto$/, (_m, q) => {
      const c = s.conversas.find((x) => x.id === q.get("conversationId"));
      const doc = D.documentosErp[c?.chave]?.cliente;
      return {
        gateways: [{ provedor: "asaas", nome: "Asaas", formas: ["pix", "boleto", "credito"] }],
        contato: { nome: doc?.nome ?? c?.contact.name ?? "", documento: (doc?.documento ?? "").replace(/\D/g, ""), email: doc?.email ?? "" },
        venceEm: hojeMais(s, 3),
      };
    }],
    ["POST", /^carteira\/[^/]+\/pagamentos-cobrancas$/, (_m, _q, corpo) => {
      const c = s.conversas.find((x) => x.id === corpo.conversationId);
      const cobranca = {
        id: D.id(`cob:${corpo.clientKey}`),
        status: "pendente",
        valorCents: corpo.valorCents,
        titulo: corpo.titulo,
        forma: corpo.forma,
        parcelas: corpo.parcelas ?? 1,
        venceEm: corpo.venceEm,
        pixCopiaCola: corpo.forma === "pix" ? pixCopiaCola(corpo.valorCents / 100) : null,
        boletoLinhaDigitavel: corpo.forma === "boleto" ? "23793.38128 60082.677139 66003.996601 1 98760000128460" : null,
        boletoPdfUrl: null,
      };
      const msg = mensagem({ conversaId: c.id, contatoId: c.contact.id, dir: "out", criado: s.agoraSim().toISOString(), quem: s.usuario, i: (s.mensagens[c.id]?.length ?? 0) + 1, texto: "", extra: { status: "sent", cobranca } });
      s.cobrancas[c.chave] = msg;
      registrar(s, c, msg);
      return { id: cobranca.id, status: "pendente" };
    }],
    ["GET", /^carteira\/[^/]+\/documentos-erp\/conversa\/([^/]+)$/, (m) => {
      const c = s.conversas.find((x) => x.id === m[1]);
      const d = D.documentosErp[c?.chave];
      if (!d) return { cliente: { nome: c?.contact.name ?? "", documento: null }, sistemas: [] };
      return { cliente: d.cliente, sistemas: [{ sistema: "omie", nome: "Omie", erro: false, documentos: d.documentos }] };
    }],
    ["POST", /^carteira\/[^/]+\/documentos-erp\/arquivo$/, (_m, _q, corpo) => {
      const nome = corpo.tipo === "pedido" ? `Pedido ${corpo.numero}.pdf` : `NF-e ${corpo.numero}.pdf`;
      return { nome, fileUrl: `/api/uploads/demo/documentos/${corpo.tipo}-${corpo.numero}.pdf` };
    }],
    ["POST", /^carteira\/[^/]+\/documentos-erp\/cobranca$/, () => ({ link: "https://www.asaas.com/i/novarota778" })],
    ["POST", /^carteira\/[^/]+\/realtime\/tickets$/, () => ({ token: "demo" })],
    ["POST", /^carteira\/[^/]+\/conversations\/([^/]+)\/read$/, (m) => {
      const c = s.conversas.find((x) => x.id === m[1]);
      if (c) c.unreadMessages = 0;
      return { ok: true };
    }],
  ];
}

function avatarUsuario(u) {
  const chave = Object.keys(D.usuarios).find((k) => D.usuarios[k] === u);
  return fs.existsSync(path.join(ARQUIVOS, "avatares", `u-${chave}.jpg`)) ? `/api/uploads/demo/avatares/u-${chave}.jpg` : null;
}


// ── Campanhas ─────────────────────────────────────────────────────────────────

const NOMES = ["Ana", "Bruno", "Carla", "Daniel", "Eduarda", "Felipe", "Gabriela", "Henrique", "Isabela", "João", "Karina", "Leonardo", "Mariana", "Nicolas", "Olívia", "Paulo", "Rafaela", "Sérgio", "Tatiane", "Vinícius"];
const SOBRENOMES = ["Silva", "Souza", "Oliveira", "Pereira", "Costa", "Rodrigues", "Almeida", "Nascimento", "Lima", "Araújo", "Fernandes", "Carvalho", "Gomes", "Martins", "Rocha"];
const NEGOCIOS = ["Mercado Bela Vista", "Padaria Pão Nosso", "Restaurante Maré Alta", "Lanchonete Ponto Certo", "Empório Serra Verde", "Bar do Porto", "Mercearia São José", "Cantina Bella", "Supermercado Litoral", "Café da Praça", "Padaria Trigo de Ouro", "Bistrô Lagoa", "Mercado Central", "Hamburgueria Fogo", "Pizzaria Forno a Lenha"];

/** Contatos fictícios da carteira (para o público e os destinatários das campanhas). */
function contatosCarteira(n, semente = 1) {
  return Array.from({ length: n }, (_, i) => {
    const k = i * 7 + semente * 13;
    const nome = `${NOMES[k % NOMES.length]} ${SOBRENOMES[(k * 3 + 1) % SOBRENOMES.length]}`;
    const fone = `+55 48 99${String(100 + ((k * 37) % 900)).padStart(3, "0")}-${String(1000 + ((k * 7919) % 9000)).padStart(4, "0")}`;
    return { id: D.id(`ctc:${semente}:${i}`), name: nome, phone: fone, companyName: NEGOCIOS[(k * 5 + i) % NEGOCIOS.length] };
  });
}

function campanhaApi(s, c) {
  const id = D.id(`camp:${c.chave}`);
  const modelo = D.modelos.find((m) => m.chave === c.modelo);
  // 9h de Brasília no dia de `agora`
  const base = new Date(`${new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(s.agora)}T09:00:00-03:00`);
  const inicio = c.dias == null ? null : new Date(base.getTime() - c.dias * 86400000);
  const enviados = c.status === "em_envio" ? c.enviadosAteAgora : c.status === "concluida" ? c.destinatarios : 0;
  const entregues = Math.round(enviados * c.entregues);
  const lidos = Math.round(enviados * c.lidas);
  const respondidos = Math.round(enviados * c.responderam);
  return {
    id,
    workspaceId: D.WS,
    name: c.nome,
    channelId: D.canais.whatsapp.id,
    teamId: D.equipes[c.equipe].id,
    enableReceptive: !c.agente,
    acaoResposta: c.agente ? { modo: "agente", agenteId: D.lia.id } : null,
    templateName: modelo.name,
    templateLanguage: "pt_BR",
    templateParams: { contato: "Marina", pedido: "1189", vencimento: "17/11" },
    sequencia: c.chave === "atacado" ? [{ templateName: "ultima_chamada_atacado", templateLanguage: "pt_BR", templateParams: { contato: "Marina" }, esperaValor: 2, esperaUnidade: "dias" }] : [],
    acoesSaida: null,
    audience: { etiquetasIds: c.etiquetas.map((n) => D.id(`tag:${n}`)), segmentosIds: [], todaCarteira: false, contatosExcluidosIds: [], contatosIncluidosIds: [], etiquetasExcluidasIds: [] },
    dispatchConfig: { horarioFinal: "18:00", diasPermitidos: [1, 2, 3, 4, 5], horarioInicial: "08:00", intervaloValor: 2, restringirDias: true, intervaloUnidade: "segundos", intervaloAleatorio: true, restringirHorarios: true, esperaConversaValor: 1, conversasEmAndamento: "aguardar_1h", esperaConversaUnidade: "horas" },
    status: c.status,
    scheduledFor: c.status === "agendada" ? inicio.toISOString() : null,
    startedAt: ["concluida", "em_envio"].includes(c.status) ? inicio.toISOString() : null,
    finishedAt: c.status === "concluida" ? new Date(inicio.getTime() + 2.5 * 3600000).toISOString() : null,
    nextSendAt: c.status === "em_envio" ? new Date(s.agoraSim().getTime() + 2000).toISOString() : null,
    pauseReason: null,
    pausedAt: null,
    recipientCount: c.destinatarios,
    archivedAt: null,
    createdByUserId: D.usuarios.patricia.id,
    createdAt: new Date((inicio ?? s.agora).getTime() - 86400000).toISOString(),
    updatedAt: (inicio ?? s.agora).toISOString(),
    deletedAt: null,
    sentCount: enviados,
    totais: { enviados, falhas: Math.round(enviados * (1 - c.entregues) * 0.8), cancelados: 0, pendentes: c.destinatarios - enviados, entregues, lidos, respondidos },
  };
}

function indicadoresCampanhas(s, dias) {
  const lista = D.campanhas.filter((c) => c.dias != null && c.dias >= 0 && c.dias <= dias);
  const tot = lista.map((c) => campanhaApi(s, c).totais).reduce((a, t) => ({ enviadas: a.enviadas + t.enviados, entregues: a.entregues + t.entregues, lidas: a.lidas + t.lidos, responderam: a.responderam + t.respondidos, falhas: a.falhas + t.falhas }), { enviadas: 0, entregues: 0, lidas: 0, responderam: 0, falhas: 0 });
  const porDia = Array.from({ length: dias }, (_, i) => {
    const d = new Date(s.agora.getTime() - (dias - 1 - i) * 86400000);
    const dd = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(d);
    const daqui = lista.filter((c) => c.dias === dias - 1 - i).map((c) => campanhaApi(s, c).totais);
    const r = daqui.reduce((a, t) => ({ enviadas: a.enviadas + t.enviados, entregues: a.entregues + t.entregues, lidas: a.lidas + t.lidos, falhas: a.falhas + t.falhas }), { enviadas: 0, entregues: 0, lidas: 0, falhas: 0 });
    // leituras e respostas continuam chegando no dia seguinte
    const ontem = lista.filter((c) => c.dias === dias - i).map((c) => campanhaApi(s, c).totais);
    for (const t of ontem) r.lidas += Math.round(t.lidos * 0.12);
    return { dia: dd, ...r };
  });
  return { dias, campanhas: lista.length, ...tot, alcancados: tot.entregues, cancelados: 0, porDia };
}


/** A Lia no formato que o Agente Hub espera (lista e editor). */
function agenteApi(s) {
  const L = D.lia;
  return {
    ...L,
    equipeTransferenciaId: D.equipes.comercial.id,
    equipeFallbackId: D.equipes.comercial.id,
    habilidades: {
      infoContato: { ativa: true, campos: ["nome", "empresa", "cnpj"] },
      etiquetar: { ativa: true, etiquetas: [{ acao: "adicionar", tagId: D.id("tag:Lead"), quando: "Quando for um novo contato" }] },
      transferir: { ativa: true, quando: "Quando o cliente pedir para falar com uma pessoa ou fechar um pedido grande" },
      concluir: { ativa: true, quando: "Quando a dúvida for resolvida e o cliente agradecer" },
      criarCard: { ativa: true, pipelineId: D.id("funil:vendas"), responsavelUserId: D.usuarios.diogo.id, quando: "Quando o cliente pedir orçamento" },
      followup: { ativa: true, tentativas: 2, intervaloMin: 120, mensagemFinal: "Fico à disposição! Quando quiser, é só chamar. 😉" },
      agendar: { ativa: true, usuarios: [D.usuarios.diogo.id], duracaoMin: 30, dias: [1, 2, 3, 4, 5], inicio: "09:00", fim: "17:00", antecedenciaHoras: 2, janelaDias: 7, camposObrigatorios: ["nome", "empresa"], quando: "Quando o cliente quiser uma visita do vendedor", linkMeet: true },
      moderacao: { ativa: true },
      interpretarDatas: { ativa: true },
    },
    atualizadoEm: s.t(60 * 24 * 3),
  };
}

/** Instala a demo na página. Chame antes do primeiro page.goto. */
export async function instalarDemo(page, opcoes = {}) {
  const s = criarEstado(opcoes);
  const tabela = rotas(s);
  const ctx = page.context();

  await ctx.addInitScript(
    ({ ws, eu }) => {
      try {
        localStorage.setItem("selloop-active-workspace", ws);
        localStorage.setItem("selloop-boot", JSON.stringify({ v: 1, user: { id: eu.id, name: eu.nome, email: eu.email, image: null } }));
      } catch {}
    },
    { ws: D.WS, eu: s.eu },
  );
  if (opcoes.agora && opcoes.relogio !== false) {
    await page.clock.install({ time: opcoes.agora });
    await page.clock.resume();
  }

  await page.route(/^https:\/\/(api|int)\.selloop\.com\.br\/.*/, async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const caminho = url.pathname.replace(/^\/api\//, "");
    if (caminho === "uploads" && req.method() === "POST") {
      // Upload de anexo: guarda só na memória da gravação e devolve uma URL da demo.
      const tipo = req.headers()["content-type"] ?? "";
      const limite = /boundary=(.+)$/.exec(tipo)?.[1];
      const bruto = req.postDataBuffer() ?? Buffer.alloc(0);
      let nome = `anexo-${Date.now()}.bin`;
      let conteudo = bruto;
      if (limite) {
        const texto = bruto.toString("latin1");
        const parte = texto.split(`--${limite}`).find((x) => /filename="/.test(x));
        if (parte) {
          nome = /filename="([^"]+)"/.exec(parte)[1];
          const ini = texto.indexOf(parte) + parte.indexOf("\r\n\r\n") + 4;
          const fim = texto.indexOf(`\r\n--${limite}`, ini);
          conteudo = bruto.subarray(ini, fim);
        }
      }
      s.enviados[nome] = conteudo;
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ url: `/api/uploads/demo/enviados/${encodeURIComponent(nome)}` }) });
    }
    if (caminho.startsWith("uploads/demo/enviados/")) {
      const nome = decodeURIComponent(caminho.replace("uploads/demo/enviados/", ""));
      const arq = s.enviados[nome];
      if (arq) return route.fulfill({ status: 200, body: arq, contentType: tiposArquivo[path.extname(nome)] ?? "application/octet-stream" });
      return route.fulfill({ status: 404, body: "" });
    }
    if (caminho.startsWith("uploads/demo/")) {
      const arq = path.join(ARQUIVOS, caminho.replace("uploads/demo/", ""));
      if (fs.existsSync(arq)) return route.fulfill({ status: 200, body: fs.readFileSync(arq), contentType: tiposArquivo[path.extname(arq)] ?? "application/octet-stream" });
      return route.fulfill({ status: 404, body: "" });
    }
    let corpo = null;
    try {
      corpo = req.postData() ? JSON.parse(req.postData()) : null;
    } catch {}
    for (const [metodo, re, fn] of [...(s.extras.rotas ?? []), ...tabela]) {
      if (metodo !== req.method()) continue;
      const m = caminho.match(re);
      if (!m) continue;
      const r = await fn(m, url.searchParams, corpo, req);
      if (r && r.__arquivo) return route.fulfill({ status: 200, body: r.__arquivo, contentType: r.tipo });
      return route.fulfill({ status: r?.__status ?? 200, contentType: "application/json", body: JSON.stringify(r?.__status ? r.corpo : r) });
    }
    s.log.push(`${req.method()} ${caminho}${url.search}`);
    if (opcoes.avisar !== false) console.warn(`[demo] sem rota: ${req.method()} ${caminho}${url.search}`);
    return route.fulfill({ status: req.method() === "GET" ? 200 : 200, contentType: "application/json", body: JSON.stringify(req.method() === "GET" ? { data: [] } : { ok: true }) });
  });
  // Telemetria do site e WebSockets: nada sai para fora.
  await page.route(/cloudflareinsights\.com|\/cdn-cgi\/rum/, (r) => r.abort());
  await page.routeWebSocket(/int\.selloop\.com\.br\/agent\/ws/, (ws) => {
    s.ws = ws;
  });
  await page.routeWebSocket(/supabase\.co/, () => {});

  const demo = {
    estado: s,
    /** Adiciona rotas extras (têm prioridade sobre as padrão). */
    rota(metodo, re, fn) {
      (s.extras.rotas ??= []).unshift([metodo, re, fn]);
    },
    conversa(chave) {
      return s.conversas.find((c) => c.chave === chave);
    },
    /** Uma mensagem nova chega ao vivo na conversa (WebSocket do realtime). */
    chegar(chave, { texto, dir = "in", tipo = "text", quem = null, extra = {} }) {
      const c = demo.conversa(chave);
      const criado = s.agoraSim().toISOString();
      const msg = mensagem({ conversaId: c.id, contatoId: c.contact.id, dir, criado, texto, quem, i: (s.mensagens[c.id]?.length ?? 0) + 1, tipo, extra });
      (s.mensagens[c.id] ??= []).push(msg);
      c.lastMessageAt = criado;
      c.lastMessagePreview = texto;
      if (dir === "in") c.unreadMessages += 1;
      s.ws?.send(JSON.stringify({ kind: "message", conversationId: c.id, data: msg }));
      return msg;
    },
    /** A última mensagem enviada pelo atendente nesta conversa (para responder a ela). */
    ultimaSaida(chave) {
      const c = demo.conversa(chave);
      return [...(s.mensagens[c.id] ?? [])].reverse().find((m) => m.direction === "outbound");
    },
    /** O cliente vota na última enquete enviada (resposta à mensagem da enquete). */
    votar(chave, opcao) {
      const enquete = [...(s.mensagens[demo.conversa(chave).id] ?? [])].reverse().find((m) => m.templateButtons?.[0]?.enquete);
      return demo.chegar(chave, { texto: opcao, extra: { replyId: enquete?.id ?? null } });
    },
    /** O cliente devolve o orçamento montado no WhatsApp. */
    solicitarOrcamento(chave, itens) {
      const c = demo.conversa(chave);
      const doc = D.documentosErp[chave]?.cliente;
      const linhas = itens.map(([chaveProd, qtd]) => {
        const p = D.produtos.find((x) => x.chave === chaveProd);
        // valores em centavos, como o cartão de orçamento da Selloop espera
        return { productId: D.id(`prod:${p.chave}`), quantidade: qtd, nome: p.nome, precoFinal: Math.round(p.preco * 100), subtotal: Math.round(p.preco * 100) * qtd };
      });
      const produtos = linhas.reduce((n, l) => n + l.subtotal, 0);
      const desconto = Math.round(produtos * 0.03);
      const sol = { confirmacao: false, nome: c.contact.name, empresa: doc?.nome ?? null, cnpj: doc?.documento ?? null, entrega: "Entrega · Florianópolis/SC", itens: linhas, produtos, desconto, pagamento: "Pix", frete: "CIF", valorFrete: 0, freteACombinar: false, total: produtos - desconto, observacoes: null };
      return demo.chegar(chave, { texto: "Solicitação de orçamento", extra: { solicitacaoOrcamento: sol } });
    },
    /** O cliente responde o formulário (o texto que a Selloop monta com as respostas). */
    responderFormulario(chave, nome, respostas) {
      const texto = `📋 Formulário respondido: ${nome}\n\n` + respostas.map(([p, r]) => `*${p}*\n${r}`).join("\n\n");
      return demo.chegar(chave, { texto });
    },
    /** O cliente paga a cobrança: o balão muda para "Pago" ao vivo. */
    pagar(chave) {
      const c = demo.conversa(chave);
      const msg = s.cobrancas[chave];
      if (!msg) return;
      msg.cobranca = { ...msg.cobranca, status: "pago" };
      msg.updatedAt = s.agoraSim().toISOString();
      s.ws?.send(JSON.stringify({ kind: "message", conversationId: c.id, data: msg }));
    },
  };
  return demo;
}
