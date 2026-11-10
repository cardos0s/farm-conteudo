// Capítulo 19: Peer-to-peer. Segue o modelo do capítulo 6:
// abertura → diagrama centralizado x P2P → como funciona (DHT, NAT, sinalização) → quando usar → medidor
// → na prática (WebRTC) → vantagens e custos → erros comuns → exemplo real → combina com → para lembrar.

import { alerta, codigo, combina, dica, fig, lembre, medidor, passos, pastas, pratica, quando, resumo, tabela } from "../componentes.mjs";
import { bloco, claro, cor, elipse, linha, navegador, passo, quadro, semear, servidor, seta, txt } from "../desenho.mjs";

/** Lado a lado: tudo passando por um servidor x nós ligados entre si. */
function centralizadoXP2P() {
  semear("peer-to-peer-1");
  let s = "";
  const no = (x, y) => navegador(x - 32, y - 22, 64, 44, "");

  // esquerda: centralizado
  s += txt(185, 24, "centralizado", { tam: 18, cor: cor.azul });
  const cx = 185, cy = 168;
  const clientes = [-90, -18, 54, 126, 198].map((g) => {
    const a = (g * Math.PI) / 180;
    return [cx + 135 * Math.cos(a), cy + 100 * Math.sin(a)];
  });
  for (const [x, y] of clientes) s += linha([[x, y], [cx, cy]], { cor: cor.azul, espessura: 1.8 });
  s += servidor(cx - 32, cy - 44, 64, 84, "");
  s += txt(cx, cy + 58, "servidor", { tam: 15, halo: 5 });
  for (const [x, y] of clientes) s += no(x, y);
  s += txt(185, 316, "tudo passa pelo servidor", { tam: 16 });
  s += txt(185, 342, "o servidor cai: todos param", { tam: 16, cor: cor.vermelho });

  // divisória
  s += linha([[380, 20], [380, 350]], { cor: cor.cinza, tracejado: true, espessura: 1.4 });

  // direita: peer-to-peer
  s += txt(570, 24, "peer-to-peer", { tam: 18, cor: cor.verde });
  const px = 570, py = 168;
  const nos = [-90, -30, 30, 90, 150, 210].map((g) => {
    const a = (g * Math.PI) / 180;
    return [px + 140 * Math.cos(a), py + 98 * Math.sin(a)];
  });
  const ligacoes = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0], [0, 3], [1, 4], [5, 2]];
  for (const [a, b] of ligacoes) s += linha([nos[a], nos[b]], { cor: cor.verde, espessura: 1.8 });
  for (const [x, y] of nos) s += no(x, y);
  s += txt(570, 316, "cada nó é cliente e servidor", { tam: 16 });
  s += txt(570, 342, "um nó cai: os outros seguem", { tam: 16, cor: cor.verde });
  return quadro(760, 360, s);
}

/** DHT em anel (desenho simplificado): a chave 42 fica com o primeiro nó depois dela. */
function dht() {
  semear("peer-to-peer-2");
  let s = "";
  const cx = 230, cy = 170, rx = 160, ry = 117;
  const pos = (v) => {
    const a = ((-90 + (v / 100) * 360) * Math.PI) / 180;
    return [cx + rx * Math.cos(a), cy + ry * Math.sin(a)];
  };
  s += elipse(cx, cy, rx * 2, ry * 2, { cor: cor.cinza, espessura: 1.6 });
  s += txt(cx, cy - 22, "hash(\"filme.mp4\")", { tam: 15, cor: cor.cinza });
  s += txt(cx, cy + 6, "= 42", { tam: 22, cor: cor.laranja });

  // a busca: você (05) → 33 → 47
  const ir = (de, para, n) => {
    const [x1, y1] = pos(de), [x2, y2] = pos(para);
    const d = Math.hypot(x2 - x1, y2 - y1), ux = (x2 - x1) / d, uy = (y2 - y1) / d;
    return seta(x1 + ux * 30, y1 + uy * 30, x2 - ux * 32, y2 - uy * 32, { cor: cor.laranja, espessura: 2.2 }) + passo((x1 + x2) / 2, (y1 + y2) / 2, String(n), cor.laranja);
  };
  s += ir(5, 33, 2);
  s += ir(33, 47, 3);

  const ids = [5, 20, 33, 47, 61, 74, 88];
  for (const v of ids) {
    const [x, y] = pos(v);
    const preench = v === 5 ? claro.azul : v === 47 ? claro.verde : "#ffffff";
    s += elipse(x, y, 54, 54, { preench, hachura: "solid", espessura: 1.8 });
    s += txt(x, y + 1, String(v).padStart(2, "0"), { tam: 17 });
  }
  const [vx, vy] = pos(5);
  s += txt(vx + 36, vy - 12, "você", { tam: 16, cor: cor.azul, ancora: "start" });
  const [gx, gy] = pos(47);
  s += txt(gx + 34, gy + 12, "guarda a chave 42", { tam: 15, cor: cor.verde, ancora: "start" });

  // passo a passo à direita
  const x0 = 452;
  s += txt(600, 30, "como achar quem tem o arquivo", { tam: 17 });
  const etapas = [
    ["calcula a chave:", "hash(\"filme.mp4\") = 42"],
    ["pergunta ao nó que conhece", "mais perto de 42 (o 33)"],
    ["o 33 aponta o 47: o primeiro", "nó depois de 42 no anel"],
    ["o 47 responde: \"quem tem", "é o IP 203.0.113.7\""],
  ];
  etapas.forEach(([a, b], i) => {
    const y = 82 + i * 62;
    s += passo(x0 + 13, y, String(i + 1), cor.laranja);
    s += txt(x0 + 34, y - 9, a, { tam: 15, ancora: "start" });
    s += txt(x0 + 34, y + 11, b, { tam: 15, ancora: "start" });
  });
  s += txt(x0 + 34, 314, "poucos saltos, mesmo com", { tam: 15, cor: cor.cinza, ancora: "start" });
  s += txt(x0 + 34, 334, "milhões de nós na rede", { tam: 15, cor: cor.cinza, ancora: "start" });
  return quadro(760, 350, s);
}

/** Chamada WebRTC: servidores só apresentam os pares; a mídia vai direto (ou pelo relé, no plano B). */
function webrtc() {
  semear("peer-to-peer-3");
  let s = "";
  // servidores de apoio
  s += bloco(285, 22, 190, 62, "sinalização", { preench: claro.violeta, tam: 17 });
  s += bloco(20, 26, 130, 54, "STUN", { preench: claro.ciano, tam: 17 });
  s += bloco(610, 26, 130, 54, "STUN", { preench: claro.ciano, tam: 17 });

  // os dois navegadores
  s += navegador(25, 152, 150, 96, "Ana", { tam: 18 });
  s += navegador(585, 152, 150, 96, "Beto", { tam: 18 });

  // 1. sinalização
  s += seta(178, 150, 296, 88, { cor: cor.violeta, espessura: 2, duplo: true });
  s += seta(582, 150, 464, 88, { cor: cor.violeta, espessura: 2, duplo: true });
  s += passo(312, 112, "1", cor.violeta);
  s += txt(332, 102, "oferta, resposta", { tam: 15, ancora: "start", cor: cor.violeta });
  s += txt(332, 122, "e candidatos", { tam: 15, ancora: "start", cor: cor.violeta });

  // 2. STUN: qual é o meu endereço público?
  s += seta(70, 150, 70, 84, { cor: cor.ciano, espessura: 2, duplo: true });
  s += passo(70, 117, "2", cor.ciano);
  s += txt(92, 107, "meu IP", { tam: 15, ancora: "start", cor: cor.ciano });
  s += txt(92, 127, "público?", { tam: 15, ancora: "start", cor: cor.ciano });
  s += seta(690, 150, 690, 84, { cor: cor.ciano, espessura: 2, duplo: true });
  s += passo(690, 117, "2", cor.ciano);
  s += txt(668, 107, "meu IP", { tam: 15, ancora: "end", cor: cor.ciano });
  s += txt(668, 127, "público?", { tam: 15, ancora: "end", cor: cor.ciano });

  // 3. mídia direta, atravessando os dois roteadores (NAT)
  s += seta(178, 208, 582, 208, { cor: cor.verde, espessura: 3, duplo: true });
  s += bloco(205, 188, 62, 40, "NAT", { preench: claro.cinza, hachura: "solid", tam: 15 });
  s += bloco(493, 188, 62, 40, "NAT", { preench: claro.cinza, hachura: "solid", tam: 15 });
  s += passo(298, 184, "3", cor.verde);
  s += txt(318, 184, "mídia direta (P2P)", { tam: 15, ancora: "start", cor: cor.verde });

  // 4. plano B: relé TURN
  s += bloco(290, 292, 180, 58, "TURN (relé)", { preench: claro.laranja, tracejado: true, tam: 17 });
  s += seta(110, 252, 286, 318, { cor: cor.laranja, espessura: 1.8, tracejado: true, duplo: true });
  s += seta(650, 252, 474, 318, { cor: cor.laranja, espessura: 1.8, tracejado: true, duplo: true });
  s += passo(198, 285, "4", cor.laranja);
  s += txt(380, 378, "plano B: se o caminho direto falhar, a mídia passa pelo relé", { tam: 15, cor: cor.laranja });
  return quadro(760, 394, s);
}

export default `
${resumo(
  "Em vez de todo mundo falar com um servidor central, cada participante (um <b>nó</b>, ou <i>peer</i>) é ao mesmo tempo cliente e servidor: pede dados aos outros e entrega dados para eles.",
  "Numa troca de figurinhas no pátio da escola ninguém compra do jornaleiro: cada um tem algumas, procura quem tem as que faltam e troca direto. Quanto mais gente chega, mais figurinhas circulam. Se alguém vai embora, a troca continua.",
)}

<p>Quase tudo neste livro tem um servidor no meio (capítulo 18). <b>Peer-to-peer</b> (P2P, "de par para par") vira isso do
avesso: os aparelhos dos usuários conversam entre si. A ideia ficou famosa com programas de troca de arquivos e hoje está
no BitTorrent, nas chamadas de vídeo pelo navegador (WebRTC), nas blockchains e nos apps <i>local-first</i> (que guardam os dados no aparelho). Um aviso
logo de cara: na prática, quase todo P2P é <b>híbrido</b>, com algum servidor pequeno ajudando os pares a se encontrarem.</p>

${fig(centralizadoXP2P(), "Os mesmos aparelhos, ligados de dois jeitos. No P2P não existe \"o servidor\": existe a rede, e a capacidade cresce com o número de nós.", "grande")}

<h3>Como funciona</h3>
<ul>
<li><b>Nó (peer)</b>: cada participante roda um programa que fala o mesmo protocolo e faz os dois papéis. Quem baixa um
torrent também está enviando pedaços para outras pessoas.</li>
<li><b>Descoberta</b>: o nó novo acha o primeiro par por uma lista fixa de nós conhecidos (<i>bootstrap nodes</i>), por
um rastreador (<i>tracker</i>) que sabe quem está na rede ou por anúncios na rede local (mDNS). Depois, os próprios
pares apresentam outros pares.</li>
<li><b>Transferência</b>: o dado vai direto entre os pares, muitas vezes em pedaços vindos de vários ao mesmo tempo.
Cada pedaço é conferido pelo hash, porque ninguém na rede é confiável por padrão.</li>
<li><b>Entrada e saída de nós</b> (<i>churn</i>): nós ligam e desligam o tempo todo. Por isso a rede guarda cada
dado em mais de um nó e refaz as rotas sozinha.</li>
</ul>
<p>Dois problemas exigem mais explicação: achar quem tem o dado e atravessar o roteador de casa.</p>

<h4>Achando quem tem o dado: a DHT</h4>
<p>Algumas das primeiras redes de troca de arquivos espalhavam cada busca de vizinho em vizinho (inundação), o que gerava
muito tráfego. Esse boca a boca (<i>gossip</i>, "fofoca") ainda serve para espalhar novidades, como transações novas numa
blockchain. Para achar um dado específico sem perguntar a todo mundo, muitas redes usam uma <b>tabela hash
distribuída</b> (DHT, <i>distributed hash table</i>): um dicionário (chave → valor) dividido entre milhares de máquinas.
A chave é o hash de alguma coisa (o nome ou os metadados de um arquivo, por exemplo); o valor é o próprio dado ou, como
no BitTorrent, a lista de quem tem o arquivo. Cada nó também tem um ID no mesmo espaço de números e fica responsável
pelas chaves "perto" do seu ID. Ninguém conhece a rede inteira, só alguns vizinhos. Mesmo assim a busca chega ao responsável em poucos saltos,
porque o número de saltos cresce com o logaritmo do tamanho da rede.</p>

${fig(dht(), "Uma DHT em anel, desenho simplificado. O Kademlia, usado pela DHT do BitTorrent, mede a distância entre IDs com XOR em vez de um anel, mas a ideia é a mesma: cada salto chega mais perto da chave.")}

<h4>Atravessando o roteador: NAT, STUN, TURN e sinalização</h4>
<p>Seu notebook ou celular quase nunca tem um endereço IPv4 público só dele. O roteador de casa (ou a operadora) faz
<b>NAT</b> (<i>Network Address Translation</i>): vários aparelhos saem para a internet com o mesmo IP público. Efeito
colateral: ninguém de fora consegue abrir uma conexão até você. Com IPv6 o NAT tende a sumir, mas os firewalls costumam
bloquear do mesmo jeito as conexões que chegam. Para dois pares nessa situação conversarem:</p>
<ul>
<li><b>STUN</b>: um servidor simples que responde "de fora, você aparece como IP X, porta Y". Os dois lados trocam esses
endereços e mandam pacotes um para o outro ao mesmo tempo, abrindo caminho pelos roteadores (<i>hole punching</i>).</li>
<li><b>TURN</b>: quando o NAT é restritivo demais (o NAT simétrico, que usa uma porta diferente para cada destino) ou o
firewall bloqueia UDP, comum em redes de empresas e em algumas operadoras móveis, o tráfego passa por um servidor de
relé. Quase sempre funciona (ainda mais com TURN sobre TLS na porta 443), mas a banda sai do seu bolso.</li>
<li><b>ICE</b> (<i>Interactive Connectivity Establishment</i>): junta tudo. Coleta os caminhos possíveis (os
<b>candidatos</b>: endereço local, endereço visto pelo STUN, relé do TURN), testa e fica com o melhor que funcionar.</li>
<li><b>Sinalização</b>: para começar, os dois lados trocam a descrição da sessão (SDP: formatos de áudio e vídeo, dados
para a criptografia) e os candidatos. O WebRTC não define como: você escolhe o canal (WebSocket, HTTP...). O servidor de sinalização,
junto com STUN e TURN, é o que deixa o modelo híbrido.</li>
</ul>

${fig(webrtc(), "Uma chamada de vídeo com WebRTC. Os servidores só ajudam Ana e Beto a se encontrarem; quando o caminho direto funciona, o vídeo não passa por eles.", "grande")}

<h4>Puro ou híbrido?</h4>
${tabela(
  ["Modelo", "O que o servidor faz", "Exemplo"],
  [
    ["P2P puro", "Nada fixo, além de alguns nós de entrada para o primeiro contato", "Redes de blockchain, DHT do BitTorrent"],
    ["Híbrido com índice", "Diz quem tem o quê; o dado vai direto entre os pares", "BitTorrent com tracker"],
    ["Híbrido com sinalização", "Apresenta os pares e serve de relé quando o direto falha", "Chamadas com WebRTC"],
    ["Local-first", "Sincroniza ou guarda cópia quando há internet; o dado mora no aparelho", "Apps feitos com Automerge ou Yjs"],
  ],
)}

<p>O termo também aparece dentro do data center. Bancos como o Cassandra se descrevem como peer-to-peer: não há servidor
principal, todos os nós são iguais, dividem os dados num anel de hash (a mesma ideia da DHT) e trocam notícias por
gossip. A diferença é o dono. Ali, os nós são servidores de uma só empresa, confiáveis e ligados o tempo todo. Neste
capítulo, os nós são de donos diferentes, que não confiam uns nos outros e entram e saem quando querem. É daí que vêm
os problemas de NAT, churn e confiança.</p>

${quando(
  [
    "Muita gente quer o mesmo conteúdo pesado (arquivos grandes, atualizações): cada um que baixa ajuda a distribuir.",
    "Tempo real entre poucas pessoas (chamada 1:1, jogo, compartilhar tela): o caminho direto é o mais curto.",
    "Ninguém deveria ser dono dos dados nem ponto de controle (blockchains, redes resistentes a censura).",
    "O app precisa funcionar offline ou na rede local e sincronizar entre aparelhos depois.",
  ],
  [
    "Você precisa de uma fonte única da verdade com consistência forte (saldo, estoque, reserva de assento).",
    "Precisa controlar acesso, auditar e apagar dados (com cópias espalhadas, atender um pedido de exclusão da LGPD fica difícil).",
    "Chamada em grupo grande: em malha, cada um envia o próprio vídeo para todos. Use um servidor que repassa (SFU).",
    "É um sistema comum de empresa (cadastro, pedidos, painel): cliente-servidor (capítulo 18) é muito mais simples.",
  ],
)}

${medidor({ complexidade: 4, escala: 5, operacao: 3, aprendizado: 4, time: "qualquer tamanho; exige gente forte em redes e segurança" })}

<h3>Como usar na prática</h3>
<p>Vamos montar o caso mais comum hoje: uma chamada de vídeo 1:1 no navegador. O servidor de sinalização só repassa
mensagens; o vídeo vai direto entre os dois navegadores (ou pelo TURN, no plano B).</p>

${pastas(`
chamada-video/
├── servidor/sinalizacao.ts   # WebSocket: só repassa mensagens da sala
├── web/
│   ├── conexao.ts            # RTCPeerConnection + oferta/resposta
│   └── tela.ts               # <video> local e remoto, botões
└── infra/turnserver.conf     # coturn: STUN e relé TURN
`)}

${codigo(
  `
// servidor/sinalizacao.ts: não entende vídeo, só entrega cada mensagem ao outro lado
import { WebSocketServer, WebSocket } from "ws";

const conectados = new Set<WebSocket>(); // uma sala só, para simplificar

new WebSocketServer({ port: 8080 }).on("connection", (ws) => {
  conectados.add(ws);
  ws.on("message", (msg) => {
    for (const outro of conectados) if (outro !== ws) outro.send(msg.toString());
  });
  ws.on("close", () => conectados.delete(ws));
});`,
  "servidor/sinalizacao.ts",
)}

${codigo(
  `
const sinal = new WebSocket("wss://sinal.example.com/?sala=abc123");
const pc = new RTCPeerConnection({
  iceServers: [
    { urls: "stun:turn.example.com:3478" }, // descobre o IP público
    { urls: "turn:turn.example.com:3478", username: "u", credential: "s" }, // relé
  ],
});
const enviar = (msg: object) => sinal.send(JSON.stringify(msg));

// câmera e microfone entram na conexão (para chat ou arquivos: pc.createDataChannel)
const midia = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
midia.getTracks().forEach((faixa) => pc.addTrack(faixa, midia));

// cada caminho possível (candidato ICE) vai para o outro lado pela sinalização
pc.onicecandidate = (e) => {
  if (e.candidate) enviar({ tipo: "candidato", candidato: e.candidate });
};
// o vídeo do outro lado chega direto e criptografado (o WebRTC exige criptografia)
const remoto = document.querySelector<HTMLVideoElement>("#remoto")!;
pc.ontrack = (e) => { remoto.srcObject = e.streams[0]; };`,
  "web/conexao.ts (1/2): preparar a conexão (os dois lados rodam este código)",
)}

${codigo(
  `
// quem liga cria a oferta
export async function ligar() {
  await pc.setLocalDescription(await pc.createOffer());
  enviar({ tipo: "oferta", sdp: pc.localDescription });
}

// quem recebe responde; os dois aceitam os candidatos do outro
sinal.onmessage = async (e) => {
  const msg = JSON.parse(e.data);
  if (msg.tipo === "oferta") {
    await pc.setRemoteDescription(msg.sdp);
    await pc.setLocalDescription(await pc.createAnswer());
    enviar({ tipo: "resposta", sdp: pc.localDescription });
  } else if (msg.tipo === "resposta") {
    await pc.setRemoteDescription(msg.sdp);
  } else if (msg.tipo === "candidato") {
    await pc.addIceCandidate(msg.candidato);
  }
};`,
  "web/conexao.ts (2/2): oferta e resposta pela sinalização",
)}

<h4>Passo a passo para adotar</h4>
${passos([
  "Defina como os pares se encontram: sinalização (WebRTC), tracker ou DHT. Fora do navegador, use uma biblioteca como a libp2p, que já traz descoberta, DHT e travessia de NAT.",
  "Suba STUN e TURN desde o primeiro dia (o coturn, de código aberto, faz os dois) e teste em 4G e em rede de empresa, não só no wifi de casa.",
  "Trate todo par como não confiável: autentique na sinalização, use credenciais de TURN temporárias e confira dados pelo hash.",
  "Projete para nós que somem e para conflitos: reconexão (no WebRTC, reinício de ICE), cópias em mais de um nó e uma regra clara de quem vence.",
  "Meça do lado do cliente, onde a conexão acontece: direto x relé, tempo para conectar, quedas.",
])}

<h3>Vantagens e custos</h3>
${tabela(
  ["Você ganha", "Você paga"],
  [
    ["Nenhum servidor central por onde passam todos os dados", "Ainda precisa de servidores para descoberta, sinalização e relé"],
    ["Capacidade que cresce com os usuários (cada um traz banda e disco)", "<b>Churn</b>: nós que você não controla saem a qualquer hora, têm rede ruim e, no celular, gastam bateria e franquia"],
    ["Pouca banda no servidor e latência menor no caminho direto", "Quando o direto falha, o TURN cobra essa banda de volta"],
    ["Nenhum dono central: mais difícil de derrubar ou censurar", "<b>Segurança e confiança</b>: ninguém no meio barra abuso; cada par valida tudo e a rede precisa resistir a nós falsos"],
    ["Dados podem ficar só nos aparelhos (privacidade, offline)", "<b>Consistência</b>: sem fonte única da verdade, conflitos entre cópias viram problema seu"],
  ],
)}

<h3>Erros comuns</h3>
<ul>
<li><b>Achar que P2P dispensa servidor</b>: sinalização, nós de entrada e relé são pequenos, mas pedem deploy,
monitoramento e plantão como qualquer servidor.</li>
<li><b>Esquecer o TURN</b>: funciona na demo, no wifi de casa, e não conecta para parte dos usuários em rede
móvel ou corporativa.</li>
<li><b>Malha completa em grupo</b>: com 8 pessoas, cada uma envia o próprio vídeo 7 vezes e o upload acaba. Use um SFU
(<i>Selective Forwarding Unit</i>): um servidor que recebe um vídeo de cada um e repassa.</li>
<li><b>Confiar no que chega de um par</b>: pedaço de arquivo sem conferir o hash, placar de jogo sem validar, decisão
por maioria de nós (um atacante cria milhares de nós falsos e vira a maioria: o ataque <i>Sybil</i>). Em P2P, qualquer
cliente pode trapacear.</li>
</ul>

${pratica(
  "No mundo real",
  "<p>O <b>BitTorrent</b> é o exemplo clássico. O arquivo é dividido em pedaços, e os metadados do torrent trazem o hash de cada um: um par mal-intencionado não consegue enfiar dados falsos. Quem baixa já envia os pedaços que tem, então um arquivo popular tende a ficar mais fácil de baixar quanto mais gente baixa: o contrário de um servidor central. Os pares são achados por um tracker ou pela DHT (baseada no Kademlia). Para desestimular quem só baixa e nunca envia, cada cliente dá prioridade a quem está enviando para ele (a estratégia de \"olho por olho\", <i>tit-for-tat</i>). Várias distribuições Linux oferecem a imagem de instalação também por torrent, para dividir a banda com os usuários.</p>",
)}

${dica(
  "Local-first e blockchain",
  "<p>Apps <i>local-first</i> guardam os dados no aparelho e sincronizam quando dá, direto entre aparelhos ou por um servidor. Para os conflitos, usam <b>CRDTs</b> (<i>Conflict-free Replicated Data Types</i>): estruturas que levam todas as cópias ao mesmo resultado, em qualquer ordem de chegada (Automerge e Yjs são bibliotecas conhecidas). Uma <b>blockchain</b> é uma rede P2P em que cada nó guarda uma cópia do mesmo registro e um consenso (prova de trabalho ou de participação) decide qual versão vale: votar custa computação ou dinheiro em garantia, então nós falsos não adiantam. O preço é escrever devagar e caro: só compensa quando não há ninguém em quem todos aceitem confiar.</p>",
)}

${alerta(
  "P2P expõe o endereço de quem participa",
  "<p>Para conectar direto, o outro lado precisa saber o seu IP. Em chamadas com desconhecidos (atendimento, marketplace), isso revela a localização aproximada do usuário. No WebRTC dá para forçar tudo pelo relé com <code>iceTransportPolicy: \"relay\"</code>: você perde o ganho de banda, mas esconde o IP (e o relé não vê a conversa: só repassa pacotes já criptografados).</p>",
)}

${combina([
  [18, "Cliente-servidor", "sinalização, tracker e TURN são servidores comuns"],
  [15, "Serverless", "sinalização barata com funções e WebSocket gerenciado"],
  [22, "Event Sourcing", "log que só cresce, replicado entre nós (como numa blockchain)"],
  [20, "Orientada a eventos", "pares trocando mensagens sem esperar resposta"],
])}

${lembre([
  "Em P2P cada nó é cliente e servidor: a capacidade cresce com os usuários e não há um centro por onde tudo passa.",
  "Quase todo P2P real é híbrido: descoberta, sinalização e relé (STUN/TURN) continuam em servidores pequenos.",
  "Use para conteúdo pesado, tempo real entre poucos e dados sem dono central; evite quando precisa de uma fonte única da verdade.",
])}
`;
