// Texto do guia "System design do WhatsApp". Cada capítulo é um bloco de HTML; os títulos
// marcados com data-cap entram no sumário com o número da página (calculado na geração).

import * as D from "./diagramas.mjs";

export const titulo = "System Design do WhatsApp";
export const subtitulo = "Do zero à arquitetura que aguenta bilhões de mensagens por dia, explicado para a entrevista";

const cap = (n, t) => `<h2 data-cap="${n}"><span class="num">${String(n).padStart(2, "0")}</span>${t}</h2>`;
const fig = (svg, legenda, classe = "") =>
  `<figure class="${classe}">${svg}${legenda ? `<figcaption>${legenda}</figcaption>` : ""}</figure>`;
const dica = (t, c) => `<aside class="caixa dica"><b>${t}</b>${c}</aside>`;
const alerta = (t, c) => `<aside class="caixa alerta"><b>${t}</b>${c}</aside>`;
const frase = (c) => `<aside class="caixa frase"><b>Frase pronta para a entrevista</b>${c}</aside>`;

export const capitulos = [
  /* ------------------------------------------------------------------ 0 */
  `
${cap(0, "Como usar este guia")}
<p class="lead">"Projete o WhatsApp" é uma das perguntas mais comuns em entrevista de system design. Ela parece
enorme, mas cabe em 45 minutos quando você sabe a ordem das coisas e onde estão as perguntas difíceis.</p>
<p>Este guia segue exatamente a ordem em que você deve conduzir a entrevista. Cada capítulo termina com o que
falar, o que desenhar e onde costumam aparecer as perguntas de aprofundamento. No fim tem uma cola de uma página
com todos os números e o desenho completo.</p>

<h3>O roteiro de 45 minutos</h3>
<table class="tempo">
<tr><th>Etapa</th><th>Tempo</th><th>O que entregar</th></tr>
<tr><td>1. Requisitos</td><td>5 min</td><td>Lista do que entra e do que fica de fora</td></tr>
<tr><td>2. Estimativas</td><td>5 min</td><td>Mensagens por segundo, armazenamento, conexões</td></tr>
<tr><td>3. API e protocolo</td><td>5 min</td><td>Eventos do WebSocket e rotas REST</td></tr>
<tr><td>4. Arquitetura de alto nível</td><td>10 min</td><td>O desenho com as caixas principais</td></tr>
<tr><td>5. Aprofundar</td><td>15 min</td><td>Entrega, tiques, presença, grupos, banco</td></tr>
<tr><td>6. Gargalos e falhas</td><td>5 min</td><td>O que quebra primeiro e como você resolve</td></tr>
</table>

${dica("A regra de ouro", "O entrevistador não quer o desenho certo: quer ver você <em>decidir</em>. Diga sempre a opção que escolheu, a alternativa e o motivo. \"Escolhi X porque Y; se Z mudasse, eu iria de W.\"")}

<h3>O fio da meada</h3>
<p>Se você lembrar de uma frase só, lembre desta: <b>um app de chat é um monte de conexões abertas que precisam
saber onde o outro usuário está conectado, e uma mensagem só pode ser confirmada depois de gravada.</b>
Quase todas as decisões deste guia saem daí.</p>
`,

  /* ------------------------------------------------------------------ 1 */
  `
${cap(1, "Requisitos: pergunte antes de desenhar")}
<p>O erro mais comum é sair desenhando caixas. Os primeiros minutos servem para <b>cortar escopo</b>: o WhatsApp
tem chamadas, status, comunidades, pagamentos, vários aparelhos… Nada disso cabe em uma hora.</p>

<h3>Perguntas para fazer ao entrevistador</h3>
<table>
<tr><th>Pergunta</th><th>Por que ela importa</th></tr>
<tr><td>Só 1:1 ou também grupos? Até quantas pessoas?</td><td>Grupos trazem o problema de fan-out (capítulo 9).</td></tr>
<tr><td>Só texto ou também foto, vídeo e áudio?</td><td>Mídia muda a banda e pede armazenamento de objetos e CDN.</td></tr>
<tr><td>Precisa de enviada, entregue e lida?</td><td>Os tiques definem o protocolo de confirmações.</td></tr>
<tr><td>Online e "visto por último"?</td><td>Presença gera um volume de escritas que surpreende.</td></tr>
<tr><td>O histórico fica no servidor?</td><td>Muda o tamanho do banco (e o WhatsApp real não guarda, capítulo 13).</td></tr>
<tr><td>Quantos usuários? Crescimento?</td><td>Alimenta as contas do capítulo 2.</td></tr>
</table>

<div class="duas">
<div>
<h3>Funcionais (o que faz)</h3>
<ul class="checks">
<li>Mensagem 1:1 em tempo real</li>
<li>Tiques: enviada, entregue, lida</li>
<li>Online e visto por último</li>
<li>Grupos (com limite de membros)</li>
<li>Foto, vídeo e áudio</li>
<li>Notificação push para quem está offline</li>
<li>Histórico da conversa</li>
</ul>
</div>
<div>
<h3>Não funcionais (como se comporta)</h3>
<ul class="checks">
<li><b>Latência baixa</b>: parecer instantâneo (100–200 ms)</li>
<li><b>Alta disponibilidade</b></li>
<li><b>Não perder mensagem</b>: é o que mais muda o desenho</li>
<li><b>Ordem</b> dentro de cada conversa</li>
<li>Consistência eventual vale para tiques e presença</li>
</ul>
</div>
</div>

<h3>Fora do escopo (diga em voz alta)</h3>
<p>Chamadas de voz e vídeo, status/stories, vários aparelhos na mesma conta, busca no histórico, pagamentos.
Criptografia de ponta a ponta você menciona e deixa para o fim, se sobrar tempo. Começar ainda menor também
vale: "resolvo 1:1 e só texto, e depois mostro o que muda com grupos e mídia" mostra controle do tempo.</p>

${frase("\"Antes de desenhar, deixa eu fechar o escopo: vou cobrir mensagens 1:1 e em grupo, os três tiques, presença, mídia e push. Deixo chamadas e vários aparelhos de fora. O requisito que eu mais vou proteger é não perder mensagem.\"")}
`,

  /* ------------------------------------------------------------------ 2 */
  `
${cap(2, "Estimativas de capacidade")}
<p>As contas não precisam ser exatas: precisam ter a <b>ordem de grandeza</b> certa e levar a uma decisão.
Escolha premissas redondas, escreva no quadro e siga com elas.</p>

<h3>Premissas</h3>
<table>
<tr><td>Usuários cadastrados</td><td class="n">1 bilhão</td></tr>
<tr><td>Ativos por dia</td><td class="n">500 milhões</td></tr>
<tr><td>Mensagens por usuário ativo por dia</td><td class="n">10</td></tr>
<tr><td>Tamanho médio de uma mensagem de texto (com metadados)</td><td class="n">1 KB</td></tr>
<tr><td>Conectados ao mesmo tempo no pico</td><td class="n">50 milhões</td></tr>
</table>

<h3>As contas</h3>
<table class="contas">
<tr><td>Mensagens por dia</td><td>500 mi × 10</td><td class="n">5 bilhões</td></tr>
<tr><td>Média por segundo</td><td>5 bi ÷ 86.400</td><td class="n">~58 mil/s</td></tr>
<tr><td>Pico (×3)</td><td>58 mil × 3</td><td class="n">~175 mil/s</td></tr>
<tr><td>Armazenamento por dia</td><td>5 bi × 1 KB</td><td class="n">5 TB</td></tr>
<tr><td>Por ano</td><td>5 TB × 365</td><td class="n">~1,8 PB</td></tr>
<tr><td>Com 3 réplicas</td><td>1,8 PB × 3</td><td class="n">~5,5 PB</td></tr>
<tr><td>Servidores de chat</td><td>50 mi ÷ 100 mil conexões</td><td class="n">~500</td></tr>
<tr><td>Heartbeats (a cada 30 s)</td><td>50 mi ÷ 30</td><td class="n">~1,7 mi/s</td></tr>
<tr><td>Banda de texto no pico</td><td>175 mil × 1 KB</td><td class="n">~175 MB/s</td></tr>
</table>

<h3 class="nova-pagina">E a mídia?</h3>
<p>Suponha que 5% das mensagens tenham uma foto de 200 KB: 250 milhões × 200 KB = <b>50 TB por dia</b>, dez vezes
o texto. É por isso que o arquivo nunca passa pelos servidores de chat: vai direto para o armazenamento de objetos
e é baixado pela CDN (capítulo 10).</p>

<h3>O que cada número decide</h3>
<ul>
<li><b>175 mil mensagens/s</b> → precisa de uma fila na frente do banco para absorver picos.</li>
<li><b>5,5 PB</b> → nenhuma máquina guarda isso: o banco tem que ser particionado.</li>
<li><b>50 milhões de conexões</b> → centenas de servidores com estado; precisamos saber em qual está cada usuário.</li>
<li><b>1,7 milhão de heartbeats/s</b> → presença fica num cache em memória, nunca no banco principal.</li>
</ul>

${alerta("Cuidado com contas que circulam por aí", "É comum ver a banda calculada como \"10 KB/s por conexão\". Para texto, isso é umas 100 vezes mais do que a conta real (175 MB/s no pico para 50 milhões de conexões). Confira se a conta de banda usa o mesmo número de conexões das premissas.")}

${dica("Curiosidade", "Em 2012 o time do WhatsApp contou que passou de 2 milhões de conexões simultâneas num único servidor, usando Erlang e FreeBSD. Usar 100 mil por servidor na entrevista é conservador e fácil de defender.")}
`,

  /* ------------------------------------------------------------------ 3 */
  `
${cap(3, "Tempo real: polling, long polling ou WebSocket")}
<p>O problema central: o servidor precisa <b>empurrar</b> a mensagem para o celular de quem recebe. No HTTP
comum, o servidor só fala quando o cliente pergunta.</p>

${fig(D.tempoReal(), "As três formas de receber mensagens em tempo real.", "tr")}

<table>
<tr><th></th><th>Polling</th><th>Long polling</th><th>WebSocket</th></tr>
<tr><td>Como funciona</td><td>Pergunta a cada X segundos</td><td>Pergunta e o servidor segura a resposta</td><td>Uma conexão aberta nos dois sentidos</td></tr>
<tr><td>Atraso</td><td>Até X segundos</td><td>Baixo</td><td>Mínimo</td></tr>
<tr><td>Desperdício</td><td>Muito: quase sempre "nada"</td><td>Reabre a cada mensagem</td><td>Quase nenhum</td></tr>
<tr><td>Servidor → cliente</td><td>Não</td><td>Mais ou menos</td><td>Sim</td></tr>
<tr><td>Veredito</td><td>✗</td><td>Plano B</td><td>✓</td></tr>
</table>

<p>O <b>WebSocket</b> começa como uma requisição HTTP comum e faz <em>upgrade</em>. A partir daí a mesma conexão
TCP fica aberta e qualquer lado manda dados quando quiser, sem cabeçalhos HTTP a cada mensagem.</p>

<h3>E quando o app está fechado?</h3>
<p>No celular, quando o app vai para segundo plano o sistema operacional derruba a conexão para economizar bateria.
É aí que entra a <b>notificação push</b>: o servidor pede ao FCM (Android) ou ao APNs (iPhone) para acordar o
aparelho. O app abre, reconecta o WebSocket e busca o que chegou.</p>

${dica("Pergunta que costuma vir", "\"E Server-Sent Events?\" SSE manda só do servidor para o cliente. Para chat, você ainda precisaria de HTTP para enviar. Funciona, mas o WebSocket resolve os dois sentidos numa conexão só.")}
`,

  /* ------------------------------------------------------------------ 4 */
  `
${cap(4, "A arquitetura de alto nível")}
<p>Desenhe aos poucos, uma caixa de cada vez, sempre dizendo <b>por que</b> ela existe.</p>

${fig(D.arquitetura(), "Visão geral. Linhas tracejadas são consultas; setas cheias são o caminho dos dados.", "larga")}

<table class="comp">
<tr><th>Componente</th><th>Papel</th><th>Exemplo</th></tr>
<tr><td>Balanceador</td><td>Espalha as conexões entre os servidores de chat e checa a saúde de cada um</td><td>L4/L7, Envoy</td></tr>
<tr><td>Servidores de chat</td><td>Seguram as conexões WebSocket. <b>Têm estado</b>: cada um sabe quem está conectado nele</td><td>Erlang, Go, Java</td></tr>
<tr><td>Servidores de API</td><td>Login, perfil, histórico, criar grupo. <b>Sem estado</b>, escalam fácil</td><td>REST</td></tr>
<tr><td>Cache de conexões</td><td>Usuário → em qual servidor está + última atividade</td><td>Redis</td></tr>
<tr><td>Fila</td><td>Recebe mensagens e status; desacopla tempo real da gravação</td><td>Kafka</td></tr>
<tr><td>Armazenamento</td><td>Lê a fila e grava no banco de mensagens</td><td>workers</td></tr>
<tr><td>Banco de mensagens</td><td>Muita escrita, leitura por conversa e por tempo</td><td>Cassandra</td></tr>
<tr><td>Notificação</td><td>Push para quem está offline</td><td>FCM, APNs</td></tr>
<tr><td>Grupos + banco relacional</td><td>Membros, admins, configurações</td><td>PostgreSQL</td></tr>
<tr><td>Mídia + objetos + CDN</td><td>Upload direto, guarda os arquivos, entrega perto do usuário</td><td>S3 + CDN</td></tr>
</table>

<h3>Como o app escolhe o servidor de chat</h3>
<p><b>Opção 1, balanceador:</b> o app abre o WebSocket num endereço único e o balanceador escolhe o servidor
(menos conexões, proximidade). Como o WebSocket é uma conexão só, ele naturalmente fica no mesmo servidor enquanto
estiver aberto.</p>
<p><b>Opção 2, descoberta de serviço:</b> o app pergunta a um serviço "em qual servidor eu conecto?" e conecta
direto nele. Dá mais controle (por região, por carga) e tira o balanceador do caminho das conexões longas.</p>

${alerta("Sessão presa por IP não é necessária", "Prender o usuário no mesmo servidor por hash de IP é uma sugestão comum, mas no celular o IP muda o tempo todo (Wi-Fi ↔ 4G, várias pessoas atrás do mesmo IP da operadora). E não precisa: quando o app reconecta em <em>outro</em> servidor, basta atualizar o cache de conexões.")}

${frase("\"Separei em duas camadas: servidores de chat, que têm estado porque seguram os WebSockets, e servidores de API sem estado para o resto. Um cache em memória diz em qual servidor cada usuário está, e uma fila separa a entrega em tempo real da gravação no banco.\"")}
`,

  /* ------------------------------------------------------------------ 5 */
  `
${cap(5, "API e protocolo")}
<p>Duas portas de entrada: o <b>WebSocket</b> para tudo que é tempo real, e <b>REST</b> para o que é pedido
e resposta.</p>

<h3>Eventos no WebSocket</h3>
<pre><code><span class="c">// app → servidor: enviar</span>
{ "tipo": "mensagem", "id_cliente": "7f3a…", "conversa": "c_81", "texto": "oi" }

<span class="c">// servidor → app: gravei (vira ✓)</span>
{ "tipo": "ack", "id_cliente": "7f3a…", "id": "184467302112…", "em": 1731242096789 }

<span class="c">// servidor → destinatário: chegou mensagem</span>
{ "tipo": "mensagem", "id": "184467302112…", "conversa": "c_81", "de": "u_12", "texto": "oi" }

<span class="c">// destinatário → servidor: recebi / li (vira ✓✓ e ✓✓ azul)</span>
{ "tipo": "entregue", "conversa": "c_81", "ate": "184467302112…" }
{ "tipo": "lida",     "conversa": "c_81", "ate": "184467302112…" }

<span class="c">// heartbeat e presença</span>
{ "tipo": "ping" }
{ "tipo": "presenca", "usuario": "u_12", "online": false, "visto": 1731242000000 }</code></pre>

<h3>Rotas REST</h3>
<table class="api">
<tr><td><code>POST /sessoes</code></td><td>Login; devolve o token usado para abrir o WebSocket</td></tr>
<tr><td><code>GET /conversas</code></td><td>Lista de conversas com a última mensagem</td></tr>
<tr><td><code>GET /conversas/{id}/mensagens?antes={id}&amp;limite=50</code></td><td>Histórico, página a página</td></tr>
<tr><td><code>GET /sincronizar?depois={id}</code></td><td>Tudo que chegou desde a última mensagem recebida</td></tr>
<tr><td><code>POST /midia</code></td><td>Pede uma URL de upload (capítulo 10)</td></tr>
<tr><td><code>POST /grupos</code>, <code>PATCH /grupos/{id}</code></td><td>Criar grupo, mudar nome, membros, admins</td></tr>
</table>

${dica("Dois detalhes que valem pontos", "<b>1. id_cliente:</b> o app gera um ID antes de enviar. Se a rede cair e ele reenviar, o servidor reconhece o mesmo ID e não grava duas vezes (idempotência).<br><b>2. \"até\":</b> entregue e lida confirmam <em>até</em> uma mensagem, não uma por uma. Abrir uma conversa com 40 mensagens novas gera 1 evento, não 40.")}

${alerta("REST para enviar mensagem?", "Algumas respostas usam <code>POST /messages</code> para enviar e <code>GET /messages</code> para checar se tem mensagem nova. Isso é polling disfarçado. Enviar por REST até funciona, mas receber tem que ser empurrado pelo WebSocket.")}
`,

  /* ------------------------------------------------------------------ 6 */
  `
${cap(6, "O caminho de uma mensagem")}
<p>Este é o coração da entrevista. Desenhe o fluxo passo a passo.</p>

${fig(D.caminhoMensagem(), "A manda \"oi\" para B, os dois online em servidores diferentes.", "media")}

<ol class="passos">
<li>A manda a mensagem pelo seu WebSocket até o <b>servidor A</b>, com o <code>id_cliente</code>.</li>
<li>O servidor A grava na <b>fila</b> (durável e replicada).</li>
<li>Só depois da gravação ele responde a A: <b>✓ enviada</b>.</li>
<li>O servidor A pergunta ao <b>cache de conexões</b>: onde está o B?</li>
<li>B está no servidor B: o servidor A <b>repassa</b> a mensagem para lá.</li>
<li>O servidor B entrega pelo WebSocket de B.</li>
<li>O celular de B confirma que recebeu.</li>
<li>A confirmação volta até A: <b>✓✓ entregue</b>. O status também vai para a fila, para ficar gravado.</li>
</ol>

${alerta("A regra que mais derruba candidatos", "Nunca devolva o ✓ antes de gravar: se o servidor cair antes de salvar, a mensagem some. O ✓ significa \"o sistema guardou\", não \"chegou no B\".")}

<h3>E se B estiver offline?</h3>
<p>O cache diz que B não está conectado. A mensagem já está gravada (passo 2), então ela entra na lista de
<b>pendentes de B</b> e o serviço de notificação manda um push. A continua vendo só um ✓ até B aparecer
(capítulo 8).</p>

<h3>E se A estiver sem internet?</h3>
<p>A mensagem fica com o reloginho, guardada no celular de A. Quando a conexão volta, o app reenvia com o mesmo
<code>id_cliente</code>. Se o primeiro envio tinha chegado, o servidor só responde o ack de novo.</p>

`,

  /* ------------------------------------------------------------------ 7 */
  `
${cap(7, "Os tiques: enviada, entregue e lida")}
${fig(D.tiques(), "Os quatro estados de uma mensagem para quem enviou.", "baixa")}

<table>
<tr><th>Estado</th><th>Quem dispara</th><th>Quando</th></tr>
<tr><td>Pendente</td><td>App de A</td><td>Ainda não recebeu o ack do servidor</td></tr>
<tr><td>✓ Enviada</td><td>Servidor A</td><td>A mensagem foi gravada na fila</td></tr>
<tr><td>✓✓ Entregue</td><td>App de B</td><td>A mensagem chegou no aparelho de B</td></tr>
<tr><td>✓✓ Lida</td><td>App de B</td><td>B abriu a conversa com a mensagem na tela</td></tr>
</table>

<h3>Três regras que evitam bugs</h3>
<ol>
<li><b>O status só anda para a frente.</b> Os eventos podem chegar fora de ordem (um "entregue" atrasado
depois de um "lida"). Grave o maior estado visto e ignore o resto.</li>
<li><b>Confirme em lote.</b> "Lida até a mensagem X" cobre todas as anteriores da conversa.</li>
<li><b>Status também é gravado.</b> Se A estiver offline quando B leu, A vê o ✓✓ azul quando voltar,
porque o status ficou salvo e é entregue como qualquer outra mensagem.</li>
</ol>

<h3>E a ordem das mensagens?</h3>
<p>Na fila, use o <b>id da conversa como chave</b>. No Kafka, mensagens com a mesma chave caem na mesma partição
e são lidas na ordem em que chegaram; o id da mensagem, ordenável pelo tempo (capítulo 11), resolve a ordem na tela.
Ordem global não importa; ordem dentro da conversa, sim.</p>

${dica("Privacidade", "Se B desligou a confirmação de leitura, o app de B simplesmente não manda o evento \"lida\". A regra fica no cliente e o servidor não precisa saber.")}
`,

  /* ------------------------------------------------------------------ 8 */
  `
${cap(8, "Presença, visto por último e usuário offline")}
<h3>Online e visto por último</h3>
${fig(D.presenca(), "O app manda um ping periódico; o cache guarda a última atividade com prazo de validade.", "baixa")}
<p>Cada heartbeat atualiza no Redis algo como <code>presenca:u_12 = {servidor: "chat-17", visto: …}</code>
com <b>prazo de validade</b> (por exemplo, 60 s). Se a chave existe, o usuário está online; se expirou, vale o
"visto por último". Quando a conexão cai de verdade, o servidor de chat percebe na hora e já atualiza.</p>

${alerta("Heartbeat rápido demais", "Marcar offline quem ficou 3 segundos sem sinal parece preciso, mas obriga o app a mandar ping a cada 1 ou 2 segundos: com 50 milhões de conexões, são uns 17 milhões de escritas por segundo e bateria indo embora. Ping a cada 30 s e prazo de ~60 s resolvem.")}

<h3>Quem precisa saber que você ficou online?</h3>
<p>Avisar todos os seus contatos a cada mudança gera uma enxurrada de eventos. O truque: o app <b>assina</b> a
presença só de quem está na tela (a conversa aberta, a lista visível) e cancela a assinatura quando sai.</p>

<h3>Quando o usuário volta</h3>
<ol>
<li>O app reconecta o WebSocket (em qualquer servidor) e o cache é atualizado.</li>
<li>Pede <code>/sincronizar?depois=&lt;última mensagem recebida&gt;</code> e recebe os pendentes.</li>
<li>Manda "entregue até X" para cada conversa, e os remetentes ganham o ✓✓.</li>
</ol>

${alerta("Push não é entrega", "A notificação push é só um aviso, e pode se perder. A mensagem tem que estar guardada como pendente para o app buscar quando reconectar. Uma resposta que só \"manda push quando o usuário está offline\", sem guardar, perde mensagens.")}
`,

  /* ------------------------------------------------------------------ 9 */
  `
${cap(9, "Grupos")}
${fig(D.grupos(), "Uma mensagem num grupo vira uma entrega por membro.")}
<ol class="passos">
<li>A envia para o grupo; o servidor A grava <b>uma vez</b> na fila.</li>
<li>O servidor A pergunta ao serviço de grupos quem são os membros (com cache, porque muda pouco).</li>
<li>Para cada membro, consulta o cache de conexões: online no próprio servidor, online em outro, ou offline.</li>
<li>Entrega direto, repassa para o outro servidor, ou marca pendente e manda push.</li>
</ol>

<h3>O problema do fan-out</h3>
<p>Num grupo de 1.024 pessoas, cada mensagem vira 1.024 entregas, e cada entrega gera um "entregue" e um "lida"
de volta. Por isso todo app limita o tamanho do grupo (o WhatsApp está em 1.024). Para grupos muito grandes,
o fan-out sai do servidor de chat e vai para workers lendo da fila, e os tiques individuais viram contagem
("lida por 312").</p>

<h3>O que gravar</h3>
<ul>
<li>A mensagem é gravada <b>uma vez</b>, na partição da conversa do grupo.</li>
<li>Cada membro guarda só um cursor: "li até a mensagem X". Isso é bem mais barato que um status por membro por mensagem.</li>
<li>A tela "informações da mensagem" (quem leu) é montada a partir dos cursores.</li>
</ul>

${frase("\"Grupo é 1:1 com fan-out. Gravo a mensagem uma vez, busco os membros no serviço de grupos e entrego para cada um pelo mesmo caminho do 1:1. O custo cresce com o tamanho do grupo, por isso existe limite, e para grupos grandes eu tiro o fan-out do servidor de chat.\"")}
`,

  /* ------------------------------------------------------------------ 10 */
  `
${cap(10, "Fotos, vídeos e áudios")}
<p>Arquivo pesado não passa pelo servidor de chat. A mensagem leva só um <b>link</b>.</p>
${fig(D.midia(), "Upload direto para o armazenamento de objetos; download pela CDN.", "larga")}
<ol class="passos">
<li>O app avisa o serviço de mídia que vai enviar um arquivo (com hash e tamanho).</li>
<li>Recebe uma <b>URL de upload pré-assinada</b>, válida por poucos minutos.</li>
<li>Sobe o arquivo direto para o armazenamento de objetos (S3 ou parecido).</li>
<li>Manda a mensagem normal pelo WebSocket, com o link, a miniatura e o tamanho.</li>
<li>O app de B baixa o arquivo pela <b>CDN</b>, do ponto mais perto dele.</li>
</ol>

<h3>Economias que valem citar</h3>
<ul>
<li><b>Compressão</b> no aparelho antes de enviar (foto e vídeo).</li>
<li><b>Miniatura</b> pequena dentro da própria mensagem, para a conversa abrir rápido.</li>
<li><b>Deduplicação</b> pelo hash: o mesmo meme encaminhado mil vezes não precisa de mil cópias.</li>
<li><b>Metadados</b> (tipo, tamanho, data) num banco separado do arquivo.</li>
<li><b>Armazenamento frio</b> para arquivos antigos que quase ninguém abre.</li>
</ul>

${dica("Com criptografia de ponta a ponta", "O app cifra o arquivo antes de subir e manda a chave dentro da mensagem (que também é cifrada). O servidor guarda um arquivo que não consegue abrir. Isso limita a deduplicação: o mesmo arquivo cifrado com chaves diferentes vira arquivos diferentes.")}
`,

  /* ------------------------------------------------------------------ 11 */
  `
${cap(11, "Modelo de dados e o ID da mensagem")}
<h3>Dois bancos, dois perfis</h3>
<p><b>Relacional (PostgreSQL)</b> para usuários, conversas e grupos: pouco volume, muitas relações, precisa de
transação ("adicionar membro e atualizar admin").<br>
<b>Colunar distribuído (Cassandra)</b> para mensagens: volume gigante, só cresce, muita escrita, leitura sempre
"as últimas N mensagens desta conversa".</p>

<pre><code><span class="c">-- PostgreSQL</span>
usuarios      (id, telefone, nome, foto, criado_em)
conversas     (id, tipo [1:1 | grupo], criada_em)
participantes (conversa_id, usuario_id, papel, entrou_em)
grupos        (conversa_id, nome, descricao, criado_por)

<span class="c">-- Cassandra</span>
CREATE TABLE mensagens (
  conversa_id  text,
  balde        int,        <span class="c">-- mês, para a partição não crescer sem fim</span>
  id           bigint,     <span class="c">-- ordenável pelo tempo</span>
  de           text,
  tipo         text,       <span class="c">-- texto | imagem | áudio …</span>
  conteudo     blob,
  PRIMARY KEY ((conversa_id, balde), id)
) WITH CLUSTERING ORDER BY (id DESC);

CREATE TABLE cursores (    <span class="c">-- até onde cada um recebeu e leu</span>
  conversa_id  text,
  usuario_id   text,
  entregue_ate bigint,
  lida_ate     bigint,
  PRIMARY KEY ((conversa_id), usuario_id)
);

CREATE TABLE pendentes (   <span class="c">-- caixa de entrada de quem está offline</span>
  usuario_id   text,
  id           bigint,
  conversa_id  text,
  PRIMARY KEY ((usuario_id), id)
);</code></pre>

<p>Com essa chave, abrir uma conversa é ler as primeiras linhas de <b>uma partição só</b>, já em ordem. "Carregar
mais" é continuar a leitura a partir do último <code>id</code>.</p>

${fig(D.particoes(), "Particione pela conversa: cada conversa fica inteira num lugar.")}

${alerta("As duas chaves erradas mais comuns", "<b>Particionar pelo id da mensagem</b> espalha uma mesma conversa por todas as máquinas: abrir uma conversa vira perguntar a todo mundo.<br><b>Particionar só pelo id do usuário</b> funciona para \"minhas mensagens\", mas numa conversa 1:1 obriga a gravar cada mensagem duas vezes ou juntar duas partições. A conversa é a unidade natural.")}

<h3>O ID da mensagem</h3>
<p>Queremos um ID <b>único</b> entre centenas de servidores, <b>ordenável pelo tempo</b> e gerado sem
consultar ninguém. O formato clássico é o Snowflake (criado no Twitter), com 64 bits:</p>
${fig(D.snowflake(), "")}
<ul>
<li><b>41 bits de tempo</b> em milissegundos: ordenar pelo ID é ordenar pelo tempo (dá ~69 anos).</li>
<li><b>10 bits de máquina</b>: dois servidores nunca geram o mesmo ID.</li>
<li><b>12 bits de sequência</b>: até 4.096 IDs por milissegundo em cada máquina.</li>
</ul>

${alerta("Sem a parte da máquina, colide", "Um ID tipo <code>data-hora + sequência 001</code> parece suficiente, mas dois servidores no mesmo milissegundo geram o mesmo número. Precisa identificar quem gerou.")}
`,

  /* ------------------------------------------------------------------ 12 */
  `
${cap(12, "Escala, falhas e custo")}
<h3>Quando um servidor de chat cai</h3>
${fig(D.reconexao(), "Os apps do servidor que caiu reconectam nos outros, com espera crescente.", "baixa")}
<ul>
<li>O balanceador percebe pelo <b>health check</b> e para de mandar conexões novas para lá.</li>
<li>Os apps reconectam em outro servidor e o cache de conexões é atualizado.</li>
<li>Reconecte com <b>espera crescente e um pouco de sorteio</b> (backoff exponencial com jitter). Se 100 mil
apps tentarem no mesmo segundo, derrubam o próximo servidor: é o efeito manada.</li>
<li>Nenhuma mensagem se perde, porque o ✓ só foi dado depois de gravar na fila.</li>
<li>O que estava em trânsito para os usuários desse servidor continua nos pendentes e chega na sincronização.</li>
</ul>

<h3>Como achar a partição certa</h3>
<p><b>Hash consistente:</b> a chave (id da conversa) vira um número num anel, e cada máquina cuida de um pedaço.
Adicionar uma máquina move só uma fração dos dados. O Cassandra já faz isso.<br>
<b>Serviço de metadados:</b> um mapa "partição → máquina" consultado antes da leitura. Mais flexível para
mover dados quentes, ao custo de mais um salto.</p>

<h3>Outras falhas que o entrevistador gosta</h3>
<table>
<tr><th>E se…</th><th>Resposta curta</th></tr>
<tr><td>…o Redis de conexões cair?</td><td>Réplicas; e o estado é reconstruível: os servidores de chat sabem quem está conectado neles e republicam.</td></tr>
<tr><td>…a fila ficar lenta?</td><td>Ela absorve o pico; os workers de armazenamento escalam pelo número de partições.</td></tr>
<tr><td>…um usuário trocar de rede no meio?</td><td>A conexão cai, ele reconecta e sincroniza pelo cursor. Mensagens repetidas são descartadas pelo id.</td></tr>
<tr><td>…um datacenter inteiro sair do ar?</td><td>Várias regiões; o usuário conecta na mais próxima e mensagens entre regiões passam por replicação entre elas.</td></tr>
</table>

<p><b>Custo:</b> mensagens antigas vão para armazenamento frio (quase ninguém rola a conversa até três anos
atrás), mídia é comprimida e deduplicada (capítulo 10) e pendentes nunca entregues expiram.</p>
`,

  /* ------------------------------------------------------------------ 13 */
  `
${cap(13, "Como o WhatsApp de verdade faz")}
<p>Quase todo material de entrevista desenha um chat que guarda o histórico no servidor, como Telegram ou
Messenger. O WhatsApp real toma outro caminho, e citar isso no fim da entrevista impressiona.</p>

<h3>O que é público</h3>
<ul>
<li><b>Criptografia de ponta a ponta</b> em todas as conversas desde 2016, com o protocolo Signal. O servidor
transporta conteúdo cifrado e não consegue ler as mensagens.</li>
<li><b>As mensagens ficam no servidor só até serem entregues.</b> Depois de entregues, são apagadas; as que
nunca são entregues são apagadas depois de cerca de 30 dias.</li>
<li><b>O histórico mora no celular.</b> O backup vai para o Google Drive ou o iCloud do próprio usuário.</li>
<li><b>Erlang</b> nos servidores de chat, linguagem feita para manter milhões de processos leves e conexões
abertas (daí os 2 milhões de conexões por servidor de 2012).</li>
<li>Grupos com até <b>1.024</b> membros e mais de <b>2 bilhões</b> de usuários.</li>
</ul>

<h3>O que isso muda no desenho</h3>
<table>
<tr><th>Peça</th><th>Chat com histórico no servidor</th><th>Modelo do WhatsApp</th></tr>
<tr><td>Banco de mensagens</td><td>Petabytes, guarda tudo</td><td>Só pendentes; bem menor</td></tr>
<tr><td>Abrir conversa num aparelho novo</td><td>Baixa do servidor</td><td>Restaura do backup</td></tr>
<tr><td>Busca no histórico</td><td>Pode ser no servidor</td><td>Só no aparelho</td></tr>
<tr><td>Moderação e anúncios no conteúdo</td><td>Possível</td><td>Impossível: o servidor não lê</td></tr>
<tr><td>Grupos</td><td>Cifra uma vez</td><td>Precisa de chaves por grupo e troca quando alguém sai</td></tr>
</table>

${frase("\"O que desenhei guarda o histórico no servidor. O WhatsApp real usa criptografia de ponta a ponta e só guarda a mensagem até entregar, então o banco de mensagens vira uma caixa de pendentes e o histórico fica no aparelho. A arquitetura de conexões, fila e entrega continua a mesma.\"")}

<p class="nota">Este guia é material de estudo independente, sem relação com o WhatsApp ou a Meta. A
arquitetura descrita é um desenho de referência para entrevistas, não a arquitetura interna da empresa.</p>
`,

  /* ------------------------------------------------------------------ 14 */
  `
${cap(14, "Erros comuns e perguntas do entrevistador")}
<h3>Os 8 erros que mais aparecem</h3>
<ol class="erros">
<li><b>Desenhar antes de perguntar.</b> Feche o escopo nos primeiros 5 minutos.</li>
<li><b>Dar o ✓ antes de gravar.</b> Se o servidor cai, a mensagem some.</li>
<li><b>Receber mensagens por polling.</b> Quem recebe precisa de WebSocket (ou push).</li>
<li><b>Tratar push como entrega.</b> Push é aviso; a mensagem precisa ficar pendente.</li>
<li><b>Heartbeat a cada 1–3 segundos.</b> Milhões de escritas por segundo à toa.</li>
<li><b>Particionar mensagens pelo id da mensagem.</b> A conversa se espalha pelo cluster.</li>
<li><b>ID sem identificar a máquina.</b> Colide entre servidores.</li>
<li><b>Mídia passando pelo servidor de chat.</b> Upload direto e só o link na mensagem.</li>
</ol>

<h3>Perguntas de aprofundamento, com resposta curta</h3>
<dl class="qa">
<dt>Como você garante que a mensagem não se perde?</dt>
<dd>Ack só depois de gravar na fila replicada; o cliente reenvia com o mesmo id até receber o ack; pendentes ficam guardados até o "entregue".</dd>
<dt>Como garante a ordem?</dt>
<dd>Ordem por conversa: o id da conversa é a chave na fila (mesma partição) e o id da mensagem é ordenável pelo tempo.</dd>
<dt>E mensagens duplicadas?</dt>
<dd>id_cliente gerado no aparelho; o servidor ignora repetidos e o app também descarta pelo id.</dd>
<dt>Como o servidor A fala com o servidor B?</dt>
<dd>Chamada direta entre servidores (o cache diz o endereço) ou um canal por servidor num pub/sub. A fila de gravação não é o caminho da entrega.</dd>
<dt>Por que Cassandra e não PostgreSQL para mensagens?</dt>
<dd>Escrita muito alta, escala horizontal nativa, leitura por chave de partição + ordenação. Não precisamos de joins nem transações entre mensagens.</dd>
<dt>Como escalar os servidores de chat?</dt>
<dd>Horizontalmente: mais servidores, cada um com ~100 mil conexões. O cache de conexões é o que permite qualquer servidor achar qualquer usuário.</dd>
<dt>E usuários em vários aparelhos?</dt>
<dd>Cada aparelho é uma conexão; o cache guarda uma lista por usuário e a entrega vai para todos. Com ponta a ponta, cada aparelho tem a sua chave.</dd>
<dt>Qual o primeiro gargalo?</dt>
<dd>Escrita no banco de mensagens e o fan-out de grupos. Respostas: fila, particionamento pela conversa, limite de grupo e fan-out em workers.</dd>
</dl>
`,
];

/** Cola de uma página (vai no fim). */
export const cola = `
<h2 data-cap="15"><span class="num">★</span>Cola de uma página</h2>
<div class="cola">
<div>
<h4>Números</h4>
<table class="mini">
<tr><td>Mensagens/dia</td><td>5 bi</td></tr>
<tr><td>Média / pico</td><td>58 mil/s · 175 mil/s</td></tr>
<tr><td>Armazenamento</td><td>5 TB/dia · 1,8 PB/ano · ×3 réplicas</td></tr>
<tr><td>Conexões no pico</td><td>50 mi → ~500 servidores</td></tr>
<tr><td>Heartbeats</td><td>30 s → 1,7 mi/s (Redis)</td></tr>
<tr><td>Banda de texto</td><td>~175 MB/s; mídia ~10× maior</td></tr>
<tr><td>Grupo máximo</td><td>1.024 → 1.024 entregas</td></tr>
</table>
<h4>Fluxo de uma mensagem</h4>
<ol class="mini">
<li>A → servidor A (com id_cliente)</li>
<li>grava na fila → ✓</li>
<li>cache: onde está B?</li>
<li>servidor B → B, ou pendente + push</li>
<li>B confirma → ✓✓ → abre → ✓✓ azul</li>
</ol>
</div>
<div>
<h4>Decisões e o porquê</h4>
<table class="mini">
<tr><td>WebSocket</td><td>servidor empurra; uma conexão</td></tr>
<tr><td>Chat com estado, API sem</td><td>separa conexões do resto</td></tr>
<tr><td>Redis de conexões</td><td>onde está cada um + presença</td></tr>
<tr><td>Kafka</td><td>absorve pico; ordem por conversa</td></tr>
<tr><td>Cassandra</td><td>escrita alta; partição = conversa</td></tr>
<tr><td>PostgreSQL</td><td>usuários e grupos, relacional</td></tr>
<tr><td>S3 + CDN</td><td>mídia fora do caminho do chat</td></tr>
<tr><td>Snowflake</td><td>tempo + máquina + sequência</td></tr>
</table>
<h4>Frases que valem pontos</h4>
<ul class="mini">
<li>"O ✓ significa gravado, não entregue."</li>
<li>"Push é aviso; a entrega é a sincronização."</li>
<li>"Status só anda para a frente."</li>
<li>"Ordem por conversa, não global."</li>
</ul>
</div>
</div>
${fig(D.arquitetura(), "", "larga cola-fig")}
`;
