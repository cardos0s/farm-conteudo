// Capítulo 13: SOA (arquitetura orientada a serviços). Segue a estrutura do capítulo-modelo (06-hexagonal):
// abertura (resumo) → contexto → diagrama principal → como funciona → SOA x microsserviços → quando usar → medidor
// → na prática (pastas + código + passos) → vantagens e custos → erros comuns → exemplo → combina com → para lembrar.

import { alerta, codigo, combina, dica, fig, lembre, medidor, passos, pastas, pratica, quando, resumo, tabela } from "../componentes.mjs";
import { banco, bloco, claro, cor, engrenagem, etiqueta, linha, navegador, nuvem, quadro, ret, semear, seta, txt } from "../desenho.mjs";

/** Diagrama principal: consumidores em cima, o ESB no meio, os serviços corporativos embaixo. */
function diagrama() {
  semear("soa-1");
  let s = "";
  s += txt(380, 18, "consumidores", { tam: 16, cor: cor.azul });
  s += navegador(40, 38, 170, 74, "internet banking");
  s += navegador(295, 38, 170, 74, "sistema da agência");
  s += nuvem(560, 32, 160, 84, "parceiro");
  s += seta(125, 116, 125, 160, { cor: cor.azul, espessura: 2 });
  s += seta(380, 116, 380, 160, { cor: cor.azul, espessura: 2 });
  s += seta(640, 120, 640, 160, { cor: cor.azul, espessura: 2 });

  // o barramento
  s += bloco(20, 164, 720, 104, "", { preench: claro.laranja, gap: 8 });
  s += txt(380, 188, "ESB · barramento corporativo de serviços", { tam: 18, halo: 5 });
  const funcoes = [
    [112, "roteia"],
    [282, "transforma"],
    [458, "orquestra"],
    [632, "segurança e log"],
  ];
  for (const [x, rot] of funcoes) s += etiqueta(x, 236, rot, { preench: "#ffffff", tam: 15 });

  // serviços corporativos e o sistema que existe atrás de cada um
  const servs = [
    [20, "Clientes", "CRM · SOAP"],
    [205, "Contas", "mainframe · MQ"],
    [390, "Crédito", "bureau · REST"],
    [575, "Pagamentos", "ERP · arquivo"],
  ];
  for (const [x, nome, atras] of servs) {
    s += seta(x + 82, 270, x + 82, 312, { cor: cor.verde, espessura: 2 });
    s += bloco(x, 314, 164, 48, nome, { preench: claro.verde, tam: 17 });
    s += txt(x + 82, 382, atras, { tam: 15, cor: cor.cinza });
  }
  s += txt(380, 424, "governança central: catálogo de serviços, contratos, versões e padrões", { tam: 15, cor: cor.violeta });
  return quadro(760, 444, s);
}

/** Por que o barramento apareceu: ligações ponto a ponto x um barramento só. */
function pontoAPonto() {
  semear("soa-2");
  let s = "";
  // lado esquerdo: todo mundo ligado com todo mundo
  s += txt(185, 20, "ponto a ponto", { tam: 18 });
  const nomes = ["CRM", "ERP", "mainframe", "parceiro", "app", "site"];
  const cx = 185, cy = 140, rx = 112, ry = 76;
  const pts = nomes.map((_, i) => {
    const a = (-90 + i * 60) * (Math.PI / 180);
    return [cx + rx * Math.cos(a), cy + ry * Math.sin(a)];
  });
  for (let i = 0; i < pts.length; i++)
    for (let j = i + 1; j < pts.length; j++) s += linha([pts[i], pts[j]], { cor: cor.vermelho, espessura: 1.3 });
  pts.forEach(([x, y], i) => (s += bloco(x - 46, y - 17, 92, 34, nomes[i], { preench: claro.cinza, hachura: "solid", tam: 15 })));
  s += txt(185, 256, "15 ligações, cada uma num formato", { tam: 16, cor: cor.vermelho });

  // divisória
  s += linha([[380, 12], [380, 262]], { cor: cor.cinza, espessura: 1.2, tracejado: true });

  // lado direito: cada sistema liga só no barramento
  s += txt(575, 20, "com barramento", { tam: 18 });
  const xs = [465, 575, 685];
  ["CRM", "ERP", "mainframe"].forEach((n, i) => {
    s += linha([[xs[i], 84], [xs[i], 118]], { espessura: 2 });
    s += bloco(xs[i] - 46, 50, 92, 34, n, { preench: claro.cinza, hachura: "solid", tam: 15 });
  });
  ["parceiro", "app", "site"].forEach((n, i) => {
    s += linha([[xs[i], 160], [xs[i], 196]], { espessura: 2 });
    s += bloco(xs[i] - 46, 196, 92, 34, n, { preench: claro.cinza, hachura: "solid", tam: 15 });
  });
  s += bloco(405, 118, 340, 42, "ESB", { preench: claro.laranja, hachura: "solid", tam: 18 });
  s += txt(575, 256, "6 ligações, um formato comum", { tam: 16, cor: cor.verde });
  return quadro(760, 272, s);
}

/** SOA x microsserviços: lógica no cano x lógica nas pontas. */
function canos() {
  semear("soa-3");
  let s = "";
  // SOA: cano inteligente, dados compartilhados
  s += txt(185, 20, "SOA: cano inteligente", { tam: 18 });
  s += bloco(20, 40, 330, 66, "", { preench: claro.laranja, gap: 8 });
  s += txt(185, 58, "ESB: roteia, transforma, orquestra", { tam: 15, halo: 4 });
  for (const x of [125, 185, 245]) s += engrenagem(x, 87, 8);
  const sx = [70, 185, 300];
  ["Clientes", "Contas", "Crédito"].forEach((n, i) => {
    s += linha([[sx[i], 106], [sx[i], 136]], { espessura: 2 });
    s += bloco(sx[i] - 52, 136, 104, 42, n, { preench: claro.verde, tam: 15 });
  });
  s += linha([[70, 178], [150, 214]], { espessura: 1.6 });
  s += linha([[185, 178], [185, 210]], { espessura: 1.6 });
  s += linha([[300, 178], [220, 214]], { espessura: 1.6 });
  s += banco(120, 208, 130, 68, "banco único", { preench: claro.violeta, tam: 15 });
  s += txt(185, 302, "lógica no meio, dados em comum", { tam: 16, cor: cor.vermelho });

  s += linha([[380, 12], [380, 312]], { cor: cor.cinza, espessura: 1.2, tracejado: true });

  // microsserviços: cano burro, cada serviço com seus dados
  s += txt(575, 20, "microsserviços: cano burro", { tam: 18 });
  s += txt(575, 44, "HTTP ou fila: só transporta", { tam: 15, cor: cor.cinza });
  s += ret(410, 60, 330, 14, { preench: claro.cinza, hachura: "solid", espessura: 1.6 });
  const mx = [460, 575, 690];
  ["Pedidos", "Estoque", "Frete"].forEach((n, i) => {
    s += linha([[mx[i], 74], [mx[i], 106]], { espessura: 2 });
    s += bloco(mx[i] - 50, 106, 100, 72, "", { preench: claro.verde });
    s += engrenagem(mx[i], 128, 8);
    s += txt(mx[i], 160, n, { tam: 15, halo: 4 });
    s += linha([[mx[i], 178], [mx[i], 210]], { espessura: 1.6 });
    s += banco(mx[i] - 32, 208, 64, 68, "", { preench: claro.violeta });
  });
  s += txt(575, 302, "lógica nas pontas, cada um com seus dados", { tam: 16, cor: cor.verde });
  return quadro(760, 318, s);
}

export default `
${resumo(
  "A empresa transforma cada capacidade do negócio (clientes, contas, pagamentos) num <b>serviço corporativo reutilizável</b>, com <b>contrato formal</b>, e liga todos os sistemas por um <b>barramento central (ESB)</b> que roteia, traduz e orquestra as conversas.",
  "Numa empresa grande, cada departamento atende os outros por formulários padronizados. Um setor de protocolo recebe tudo, traduz para o formulário de cada departamento e encaminha. Funciona muito bem, até o dia em que o protocolo para e a empresa inteira para junto.",
)}

<p>A SOA (<i>Service-Oriented Architecture</i>, arquitetura orientada a serviços) se popularizou nos anos 2000 em bancos,
seguradoras, operadoras de telefonia e governos. O problema dessas empresas não era escrever um sistema novo: era fazer
<b>dezenas de sistemas antigos conversarem</b>. Mainframe de contas, ERP, CRM comprado de um fornecedor, sistema de um
parceiro, cada um com seu formato e seu protocolo. Ligar tudo com tudo vira um emaranhado: com 6 sistemas são até 15
integrações; com 10, até 45. A proposta da SOA foi expor cada capacidade como um serviço com contrato e fazer todo mundo
passar por um barramento comum. Foi a época dos <i>Web Services</i>: SOAP, WSDL e XML por toda parte.</p>

${fig(diagrama(), "Ninguém chama um serviço direto: tudo passa pelo ESB. Atrás de cada serviço corporativo pode estar um sistema antigo, num protocolo antigo.", "grande")}

<h3>Como funciona</h3>
<ul>
<li><b>Serviços corporativos</b>: cada serviço é uma capacidade do negócio e atende a empresa inteira. O "Serviço de
Clientes" é o único jeito de consultar um cliente, seja no internet banking, na agência ou no call center. Costumam ser
serviços grandes (de granularidade grossa), feitos para serem <b>reutilizados</b>.</li>
<li><b>Contratos formais</b>: o consumidor só conhece o contrato, nunca o sistema por trás. No SOA clássico, o contrato é
um <b>WSDL</b> (operações e mensagens), os dados seguem um <b>XSD</b> (esquema XML) e a mensagem viaja num envelope
<b>SOAP</b>. Depois, muitas empresas trocaram por REST, JSON e OpenAPI, mantendo a ideia.</li>
<li><b>Modelo canônico</b>: um formato comum para os dados que circulam no barramento ("cliente", "endereço",
"dinheiro"). Cada sistema traduz do seu formato para o canônico, e não para o formato de cada vizinho.</li>
<li><b>ESB</b> (<i>Enterprise Service Bus</i>): a peça do meio. Faz <b>roteamento</b> (manda cada mensagem ao serviço
certo, às vezes olhando o conteúdo), <b>transformação</b> (JSON para XML, SOAP para fila, registro posicional do
mainframe para o canônico) e <b>orquestração</b> (chama vários serviços em ordem para montar um processo, como "abrir
conta", muitas vezes descrito numa linguagem de processos como o BPEL), além de aplicar segurança, log e auditoria. Fala
tanto síncrono (pedido e resposta) quanto assíncrono (filas).</li>
<li><b>Governança central</b>: um time de arquitetura mantém o catálogo de serviços, aprova contratos, define padrões e
controla versões e SLAs (acordos de nível de serviço: disponibilidade e tempo de resposta prometidos).</li>
</ul>

${fig(pontoAPonto(), "Por que o barramento e o modelo canônico apareceram: com 6 sistemas, até 15 integrações diferentes; com o ESB, uma ligação por sistema, num formato comum.")}

<h3>SOA x microsserviços</h3>
<p>Microsserviços (capítulo 14) também são serviços, e por isso muita gente confunde os dois. O artigo de James Lewis e
Martin Fowler (2014), que popularizou o termo, marca a diferença com uma expressão: <i>smart endpoints and dumb pipes</i>
(pontas inteligentes, canos burros), em oposição aos ESBs, que concentram roteamento, transformação e regras no meio do
caminho.</p>

<p>Mark Richards resume bem: a SOA tenta <b>compartilhar o máximo possível</b> (serviços, dados, modelo); microsserviços
tentam <b>compartilhar o mínimo possível</b>. Uma otimiza reuso; a outra, independência.</p>

${fig(canos(), "Na SOA, a inteligência mora no barramento e os dados costumam ser compartilhados. Em microsserviços, o cano só transporta e cada serviço cuida dos seus dados.")}

${tabela(
  ["", "SOA", "Microsserviços"],
  [
    ["<b>Objetivo</b>", "Reuso: escrever uma vez, usar na empresa toda", "Independência: mudar e publicar sem esperar ninguém"],
    ["<b>Tamanho</b>", "Grande: uma capacidade da empresa inteira (Clientes)", "Menor: um contexto do negócio, com um time dono"],
    ["<b>Dados</b>", "Muitas vezes um banco corporativo compartilhado", "Cada serviço é dono dos seus dados"],
    ["<b>Comunicação</b>", "Canos inteligentes: o ESB roteia, transforma e orquestra", "Canos burros: HTTP ou fila; a lógica fica nas pontas"],
    ["<b>Contratos</b>", "Formais (WSDL, XSD) e um modelo canônico único", "Leves (OpenAPI, JSON, eventos), cada serviço com o seu modelo"],
    ["<b>Governança</b>", "Central: um comitê aprova serviços, padrões e versões", "Descentralizada: times autônomos e poucos padrões comuns"],
    ["<b>Deploy</b>", "Coordenado, muitas vezes junto com o barramento", "Independente, serviço por serviço"],
  ],
)}

${quando(
  [
    "Empresa grande com muitos sistemas de épocas e fornecedores diferentes (mainframe, ERP, CRM comprado) que precisam trocar dados.",
    "Parceiros e governo exigem contratos formais, XML assinado e protocolos específicos.",
    "Há sistemas legados que não dá (ou não vale a pena) alterar: o adaptador fala a língua deles.",
    "O regulador exige segurança e auditoria centralizadas (bancos, saúde, seguros).",
  ],
  [
    "Produto novo, de um ou poucos times: um monólito (capítulo 11) ou monólito modular (capítulo 12) é bem mais simples.",
    "Você quer times publicando sozinhos, várias vezes por dia: veja microsserviços (capítulo 14).",
    "Não há legado nem terceiros para integrar: o barramento vira só um salto a mais.",
    "Ninguém vai operar o barramento como sistema crítico, 24 horas por dia.",
  ],
)}

${medidor({ complexidade: 4, escala: 3, operacao: 4, aprendizado: 4, time: "empresas grandes, com um time central de integração" })}

<h3>Como usar na prática</h3>
<p>Hoje quase ninguém começa um produto novo com ESB. O mais comum é entrar numa empresa que já tem um barramento e
precisar <b>expor um sistema antigo como serviço</b>. Produtos de mercado (MuleSoft, IBM App Connect, Oracle Service Bus,
WSO2) fazem boa parte disso por configuração; abaixo está a mesma lógica em TypeScript, para você ver o que acontece por
dentro.</p>

${pastas(`
integracao/
├── contratos/                    # publicados no catálogo, versionados
│   ├── clientes/v1.ts            # contrato canônico (vira WSDL ou OpenAPI)
│   └── clientes/v2.ts            # mudança que quebra = nova versão
├── adaptadores/                  # um por sistema de trás
│   ├── crm-legado.ts             # CRM antigo, via SOAP
│   └── mainframe-contas.ts       # fila MQ com registro posicional
├── barramento/
│   ├── rotas.ts                  # quem atende cada mensagem
│   └── politicas.ts              # autenticação, log, limites por consumidor
└── catalogo.yaml                 # serviços, donos, versões e SLAs
`)}

${codigo(
  `
// contratos/clientes/v1.ts: o que qualquer sistema da empresa pode pedir ao Serviço de Clientes
export interface ClienteCanonico {
  id: string;          // id corporativo: o mesmo em todos os sistemas
  nome: string;
  documento: string;   // CPF ou CNPJ, só dígitos
  segmento: "varejo" | "alta-renda" | "empresa";
}

export interface ServicoDeClientesV1 {
  buscarCliente(req: { id: string }): Promise<ClienteCanonico>;
}

// os erros também fazem parte do contrato: o consumidor trata pelo código, não pelo texto
export type CodigoDeErro =
  | "CLI-404"   // o cliente não existe
  | "CLI-502"   // o sistema de trás respondeu algo que não dá para traduzir
  | "CLI-503";  // o sistema de trás está fora do ar ou lento demais

export class ErroDeServico extends Error {
  constructor(public readonly codigo: CodigoDeErro, mensagem: string) {
    super(mensagem);
  }
}`,
  "integracao/contratos/clientes/v1.ts (o contrato)",
)}

${codigo(
  `
// adaptadores/crm-legado.ts: traduz o contrato canônico para o CRM antigo (SOAP) e de volta
import * as soap from "soap";
import { ClienteCanonico, ErroDeServico, ServicoDeClientesV1 } from "../contratos/clientes/v1";

const SEGMENTO: Record<string, ClienteCanonico["segmento"]> = {
  "01": "varejo", "02": "alta-renda", "03": "empresa",
};

export class ClientesViaCrmLegado implements ServicoDeClientesV1 {
  // crm: cliente SOAP gerado a partir do WSDL que o próprio CRM publica
  constructor(private crm: soap.Client) {}

  async buscarCliente({ id }: { id: string }): Promise<ClienteCanonico> {
    const [resp] = await this.crm
      .ConsultarClienteAsync({ codCli: id }, { timeout: 3000 }) // nunca espere para sempre
      .catch(() => { throw new ErroDeServico("CLI-503", "CRM fora do ar ou lento"); });
    const c = resp?.Cliente;
    if (!c) throw new ErroDeServico("CLI-404", "cliente " + id + " não existe no CRM");
    const segmento = SEGMENTO[c.CodSeg];   // códigos do CRM viram nomes do canônico
    if (!segmento) throw new ErroDeServico("CLI-502", "segmento desconhecido: " + c.CodSeg);
    return {
      id,
      nome: c.NomeRazao.trim(),                // o CRM completa com espaços
      documento: c.CpfCnpj.replace(/\\D/g, ""), // "123.456.789-09" vira "12345678909"
      segmento,
    };
  }
}

// na montagem: new ClientesViaCrmLegado(await soap.createClientAsync(urlDoWsdl))`,
  "integracao/adaptadores/crm-legado.ts (o adaptador)",
)}

<h4>Passo a passo para expor um sistema como serviço</h4>
${passos([
  "Comece pela capacidade do negócio, não pelo sistema: o serviço se chama <code>Clientes</code>, não <code>ServicoDoCRM</code>. Se o CRM for trocado, o contrato fica.",
  "Escreva o contrato antes do código: operações, dados no modelo canônico e erros (WSDL + XSD em SOAP; OpenAPI em REST).",
  "Escreva o adaptador: ele traduz do canônico para o sistema de trás e de volta, e conhece as manias do legado (espaços, códigos, datas).",
  "No barramento, registre só o que é integração: rota, transformação, segurança e log. Regra de negócio fica no serviço.",
  "Publique no catálogo com dono, versão e SLA. Mudança que quebra vira v2, e a v1 fica no ar por um prazo anunciado. Monitore latência, erros e filas: alarme no barramento é alarme da empresa inteira.",
])}

<h3>Vantagens e custos</h3>
${tabela(
  ["Você ganha", "Você paga"],
  [
    ["Integra sistemas muito diferentes sem alterá-los", "O barramento vira gargalo e ponto único de falha"],
    ["Uma capacidade servindo dezenas de consumidores", "Mudança lenta: contrato, comitê, janela de deploy"],
    ["Contratos formais: cada lado sabe o que esperar", "Licenças caras e um time especialista para operar"],
    ["Segurança, log e auditoria num lugar só", "Latência extra a cada passagem pelo barramento"],
    ["Quem consome não sabe onde o serviço roda", "Acoplamento escondido: mesmo serviço, mesmo banco"],
  ],
)}

${alerta(
  "O risco número 1: gargalo e ponto único de falha",
  "<p>Todo o tráfego passa pelo ESB: se ele fica lento, tudo fica lento; se ele cai, nenhum sistema conversa com nenhum outro. E 99,9% de disponibilidade ainda são cerca de 8,8 horas fora do ar por ano. Rode o barramento em cluster, com redundância; use filas persistentes para o que pode ser assíncrono; defina timeouts e limites por consumidor; e mantenha regra de negócio fora dele.</p>",
)}

<h3>Erros comuns</h3>
<ul>
<li><b>Regra de negócio no barramento</b>: desconto calculado numa transformação, aprovação decidida numa rota. Aos
poucos, o ESB vira o sistema mais importante da empresa, e o único que ninguém consegue testar direito.</li>
<li><b>Serviço com nome de sistema</b>: <code>ServicoSAP</code>, <code>ServicoDoMainframe</code>. Quando o sistema muda,
todos os consumidores quebram. O nome é da capacidade do negócio.</li>
<li><b>Modelo canônico gigante</b>: um "Cliente" com 300 campos para servir todo mundo, que não serve bem a ninguém, e
cada campo novo precisa de reunião de comitê.</li>
<li><b>Cascata de chamadas síncronas</b>: o app chama o ESB, que chama três serviços, que chamam outros. A latência soma e
a disponibilidade multiplica: três saltos de 99,9% cada dão cerca de 99,7% no total.</li>
<li><b>API gateway virando ESB</b>: o gateway (autenticação, limites, roteamento) ganha uma transformação aqui, uma
chamada a dois serviços ali, depois uma regra. Mantenha-o burro: lógica de negócio mora num serviço.</li>
</ul>

${pratica(
  "No mundo real",
  "<p><b>Imagine um banco</b> com mainframe de contas, um CRM antigo, um sistema de cartões terceirizado e um app novo. Com o ESB, o app pede \"saldo e limite\" numa chamada só: o barramento busca o saldo no mainframe (pela fila) e o limite no sistema de cartões (por REST), junta tudo e devolve. Ninguém mexeu no mainframe. Anos depois vêm os custos: cada tela nova do app espera semanas por uma rota nova do time de integração, e uma manutenção no barramento derruba app, agência e call center ao mesmo tempo. O caminho comum: manter o ESB para o legado e fazer o que é novo com APIs e eventos, migrando aos poucos (capítulo 30).</p>",
)}

${dica(
  "SOA não é SOAP (e SOAP não morreu)",
  "<p>SOA é um estilo de arquitetura; SOAP é um protocolo. Dá para fazer SOA com REST e JSON. E SOAP continua por aí: quem integra a emissão de Nota Fiscal Eletrônica (NF-e) encontra web services SOAP, com XML assinado por certificado digital.</p>",
)}

${dica(
  "SOA sem ESB pesado",
  "<p>Muitas empresas mantêm as boas ideias da SOA (serviços com contrato, catálogo, nomes do negócio) sem o barramento central: serviços REST com OpenAPI, um API gateway na frente só para autenticação e limites, e eventos (capítulo 20) para integrar sem cascatas. Na nuvem, plataformas de integração como serviço (iPaaS) fazem o papel do barramento para ligar sistemas comprados. E um processo longo entre serviços pode ser coreografado por eventos em vez de orquestrado num lugar só: é o assunto das sagas (capítulo 23).</p>",
)}

${combina([
  [14, "Microsserviços", "serviços menores, dados próprios e canos burros"],
  [30, "Como migrar sem parar o sistema", "sair do ESB aos poucos, rota por rota"],
  [20, "Orientada a eventos", "integração assíncrona no lugar de cascatas síncronas"],
  [23, "Sagas", "processos entre serviços sem um orquestrador central gigante"],
  [6, "Hexagonal", "adaptadores de integração dentro de cada serviço"],
  [31, "Anti-padrões", "o \"ESB deus\", que acumula a regra da empresa"],
])}

${lembre([
  "SOA organiza a empresa em serviços corporativos reutilizáveis, com contratos formais, ligados por um barramento (ESB) que roteia, transforma e orquestra.",
  "Comparada a microsserviços: serviços maiores, dados compartilhados, cano inteligente e governança central, contra serviços pequenos, dados próprios, cano burro e times autônomos.",
  "Ainda faz sentido para integrar legado e terceiros em empresas grandes; mantenha regra de negócio fora do barramento e trate o ESB como sistema crítico.",
])}
`;
