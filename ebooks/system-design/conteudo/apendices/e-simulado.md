---
apendice: E
titulo: Simulado
---

São 40 questões de múltipla escolha, na ordem das seis partes do livro, e cada uma tem uma única alternativa correta. A maioria é um cenário de entrevista: leia o enunciado até o fim, porque o detalhe que decide a resposta costuma estar nele. Responda tudo antes de conferir; na versão HTML, você marca as alternativas e recebe a nota no fim. Cada explicação aponta o capítulo para revisar. Acertar 32 ou mais (80%) é um bom sinal de que a base está firme.

### 1. Você vai escalar horizontalmente uma aplicação web que guarda a sessão de cada usuário na memória do próprio servidor. O que precisa mudar primeiro?

- [ ] Trocar as máquinas por instâncias com mais memória, para caber mais sessões
- [x] Levar as sessões para um armazenamento compartilhado, como Redis ou banco
- [ ] Desligar os health checks do load balancer, para não derrubar sessões ativas
- [ ] Usar Round Robin no load balancer, para distribuir as sessões por igual

> Com o estado fora da instância, qualquer servidor atende qualquer requisição, e adicionar ou remover máquinas não faz ninguém perder a sessão. Sticky session até funciona como remendo, mas a sessão some quando aquela máquina cai. Capítulos 1 e 8.

### 2. Um colega afirma que o banco distribuído da empresa "é CA". Qual é o problema dessa afirmação?

- [ ] CA só é possível quando o cluster tem pelo menos três réplicas em cada região
- [ ] CA exige abrir mão da durabilidade das escritas que já foram confirmadas
- [ ] CA só vale para bancos relacionais que oferecem transações ACID completas
- [x] Partições são inevitáveis, então a escolha real é entre C e A quando uma acontece

> Num sistema distribuído, tolerar partições não é opcional: cabos, switches e datacenters falham. O CAP pergunta o que o sistema faz quando a rede se divide: recusar para não errar (CP) ou responder com o que tem (AP). Capítulo 2.

### 3. Seu banco replica cada escrita de forma síncrona entre São Paulo e a Virgínia, nos Estados Unidos, para que toda leitura veja o dado mais recente. Mesmo sem nenhuma falha de rede, que preço você paga, segundo o PACELC?

- [x] Latência maior, porque cada escrita espera a confirmação da outra região
- [ ] Disponibilidade menor, porque o CAP proíbe consistência forte sem partição
- [ ] Durabilidade menor, porque a escrita fica só na memória até sincronizar
- [ ] Nenhum, porque sem partição não há trade-off entre latência e consistência

> O "ELC" do PACELC diz que, mesmo sem partição, você troca latência por consistência: a ida e volta entre os continentes, de mais de 100 ms, entra em toda escrita. Bancos que confirmam só na réplica local respondem mais rápido, mas podem servir dado velho na outra região. Capítulo 3.

### 4. Você está projetando uma fintech com transferências entre contas e um feed de atividades com curtidas. Qual combinação faz mais sentido?

- [ ] BASE para tudo, porque escala melhor e o saldo se acerta sozinho depois
- [ ] ACID para tudo, porque consistência eventual é sempre um defeito de projeto
- [x] ACID para as transferências e BASE para o feed e as curtidas
- [ ] BASE para as transferências e ACID para o feed e as curtidas

> Dinheiro não pode sumir nem duplicar, então transferências pedem transações atômicas e isoladas. Um contador de curtidas atrasado alguns segundos não prejudica ninguém, e com BASE o feed ganha disponibilidade e escala. Capítulo 4.

### 5. Um serviço passou a juntar as gravações em lotes de 100 antes de enviá-las ao banco. As gravações por segundo subiram muito, mas os usuários dizem que cada operação ficou mais lenta. O que aconteceu?

- [ ] A latência caiu, mas o throughput caiu junto por causa do tamanho dos lotes
- [ ] O banco virou gargalo, e o throughput do sistema como um todo diminuiu
- [x] O throughput subiu, mas a latência aumentou, porque cada item espera o lote encher
- [ ] Nada mudou de fato, porque lotes não afetam nem o throughput nem a latência

> Lotes diluem o custo fixo de cada ida ao banco e aumentam a vazão, mas cada gravação espera as outras chegarem. Throughput e latência medem coisas diferentes, e melhorar um pode piorar o outro. Capítulo 5.

### 6. Você dobrou os servidores de aplicação de 10 para 20, mas o throughput quase não mudou. Toda requisição grava no mesmo banco primário, que está com a CPU no limite. O que explica o resultado?

- [x] O primário é uma parte que não se paraleliza e limita o ganho do todo
- [ ] Faltou trocar o algoritmo do load balancer para Least Connections
- [ ] Servidores stateless não se beneficiam de escalabilidade horizontal
- [ ] O ganho só aparece depois que o cache dos servidores novos esquenta

> É a Lei de Amdahl: a parte que roda em série limita o ganho; se 20% do trabalho for sequencial, nem infinitas máquinas deixam o sistema mais de 5 vezes mais rápido. Antes de adicionar servidores, ataque o gargalo, que aqui é o banco. Capítulo 6.

### 7. Você está começando um produto novo com um time de quatro pessoas, e as regras de negócio ainda mudam toda semana. Qual arquitetura é a escolha mais sensata?

- [ ] Um microsserviço por tabela do banco, para escalar cada parte separadamente
- [ ] Microsserviços que compartilham o mesmo banco e fazem deploy todos juntos
- [ ] Um serviço por desenvolvedor, cada um com sua linguagem e seu banco
- [x] Um monólito bem modularizado, extraindo serviços quando a dor for real

> Microsserviços resolvem problemas de times grandes e de partes com escala muito diferente, e cobram em rede, observabilidade e consistência de dados. Com time pequeno e domínio instável, as fronteiras ainda vão mudar, e mudar uma fronteira dentro de um monólito é barato. Capítulo 9.

### 8. Você está avaliando serverless para quatro cargas de trabalho. Em qual ele se encaixa melhor?

- [ ] Um servidor de jogo que mantém conexões e estado em memória por horas
- [x] Um webhook que recebe rajadas imprevisíveis e fica parado boa parte do dia
- [ ] Uma conversão de vídeo que roda sem parar por seis horas seguidas
- [ ] Uma API de tráfego alto e constante em que cada milissegundo conta

> Serverless brilha em cargas disparadas por eventos e com picos: escala sozinho e não cobra pelo tempo ocioso. Tarefas longas esbarram no limite de duração das funções, não há garantia de que o estado em memória sobreviva entre chamadas e, com tráfego alto e constante, servidores próprios costumam sair mais baratos e ter latência mais previsível. Capítulo 10.

### 9. Seu serviço roda em servidores idênticos e recebe requisições que levam de 5 ms a 30 s (relatórios pesados). Com Round Robin, alguns servidores ficam sobrecarregados enquanto outros ficam ociosos. Qual algoritmo resolve melhor?

- [x] Least Connections
- [ ] IP Hash
- [ ] Round Robin ponderado pelo hardware de cada servidor
- [ ] Aleatório (random)

> Least Connections olha quantas conexões cada servidor tem abertas, então quem está preso num relatório longo recebe menos trabalho novo. Round Robin, ponderado ou não, e o aleatório ignoram a carga do momento, e o IP Hash prende cada cliente a um servidor, por mais ocupado que ele esteja. Capítulo 12.

### 10. O time começou a colocar regras de negócio, cálculo de frete e junção de respostas de vários serviços dentro do API Gateway. Qual é o risco?

- [ ] O gateway deixa de conseguir aplicar rate limiting e autenticação
- [ ] Os clientes passam a precisar do endereço de cada microsserviço
- [x] O gateway vira gargalo e um mini-monólito que todo time precisa alterar
- [ ] O gateway deixa de ser um proxy reverso e vira um proxy direto

> O API Gateway é um proxy reverso que deve ficar fino: roteamento, autenticação, rate limiting e logs. Com lógica de negócio dentro, toda mudança de regra passa a depender de um deploy dele, que concentra acoplamento e carga. Capítulo 14.

### 11. Usuários na Ásia reclamam que as imagens e o JavaScript do seu site, hospedado em São Paulo, demoram para carregar. Qual é a solução mais direta?

- [ ] Aumentar a CPU e a memória do servidor de origem em São Paulo
- [x] Servir os arquivos estáticos por uma CDN, com cópias perto dos usuários
- [ ] Reduzir o TTL do DNS do domínio para as respostas chegarem antes
- [ ] Trocar HTTP por WebSocket para entregar as imagens e os scripts

> O problema é a distância: cada ida e volta até São Paulo custa centenas de milissegundos para quem está na Ásia, e uma máquina maior não encurta o caminho. A CDN guarda cópias em servidores próximos dos usuários e ainda tira carga da origem. Capítulo 15.

### 12. Você vai migrar o site para um novo endereço IP na semana que vem, e o registro DNS atual tem TTL de 24 horas. O que fazer para a troca se propagar rápido?

- [ ] Aumentar o TTL para 48 horas, para os resolvedores guardarem o IP novo por mais tempo
- [ ] Trocar o registro A por um CNAME que aponte direto para o novo endereço IP
- [ ] Fazer a troca e pedir aos usuários que limpem o cache do navegador
- [x] Baixar o TTL para poucos minutos pelo menos 24 horas antes da troca

> Resolvedores guardam cada resposta pelo TTL que receberam: se você só baixar o TTL na hora da troca, quem já tem o IP antigo em cache fica com ele por até 24 horas. Baixando antes, todos os caches já estarão com TTL curto quando o IP mudar. Capítulo 16.

### 13. Você está projetando o áudio de uma chamada de voz em tempo real. Um pacote que chega 300 ms atrasado já não serve para nada. Qual protocolo de transporte combina mais?

- [ ] TCP, porque garante que todo pacote chegue, ainda que atrasado
- [ ] TCP, porque retransmite pacotes perdidos mais rápido que o UDP
- [ ] UDP, porque garante que os pacotes cheguem na ordem em que saíram
- [x] UDP, porque não segura os pacotes novos esperando um que se perdeu

> No TCP, um pacote perdido faz os seguintes esperarem a retransmissão, e o áudio trava. No UDP, a aplicação segue em frente: perder um pedacinho de som é melhor do que atrasar a conversa. Capítulo 17.

### 14. Qual problema o HTTP/3 resolve e o HTTP/2 não?

- [x] Um pacote TCP perdido travar todos os streams da mesma conexão
- [ ] A falta de multiplexação de várias requisições numa conexão
- [ ] A falta de suporte a criptografia com TLS entre cliente e servidor
- [ ] A ausência de compressão dos cabeçalhos das requisições

> O HTTP/2 já multiplexa streams e comprime cabeçalhos, mas todos os streams dividem uma conexão TCP, que entrega os bytes em ordem: uma perda segura todo mundo (head-of-line blocking no transporte). O QUIC, base do HTTP/3, roda sobre UDP com streams independentes, então só o stream afetado espera. Capítulo 18.

### 15. Você está projetando a comunicação interna entre dezenas de microsserviços com muito tráfego e quer contratos tipados e mensagens pequenas. Qual é a melhor escolha?

- [ ] REST com JSON, porque o JSON fica menor na rede do que o protobuf
- [ ] WebSocket com texto puro, porque o protocolo define contratos tipados
- [x] gRPC com Protocol Buffers, que gera código tipado e usa mensagens binárias
- [ ] Server-Sent Events, porque permitem streaming nos dois sentidos

> O gRPC parte de um contrato (.proto) que gera cliente e servidor tipados, e o protobuf binário é menor e mais rápido de processar que JSON. REST continua ótimo para APIs públicas, em que legibilidade e compatibilidade pesam mais. Capítulo 19.

### 16. Você está projetando o placar ao vivo de um campeonato: só o servidor envia atualizações, e o navegador não manda nada depois de abrir a página. Qual é a opção mais simples que atende bem?

- [ ] WebSocket, porque o SSE não funciona sobre HTTP comum
- [x] Server-Sent Events, um canal de mão única do servidor para o cliente
- [ ] Polling a cada 100 ms, que gasta menos do que manter uma conexão aberta
- [ ] UDP direto do navegador, porque é o transporte mais rápido

> Quando só o servidor fala, SSE resolve sobre HTTP comum, e o navegador ainda reconecta sozinho se a conexão cair. WebSocket também funcionaria, mas é full-duplex e traz mais peças para um problema de mão única. Capítulo 20.

### 17. Você está projetando um cluster de mil nós que entram e saem o tempo todo, e cada nó precisa saber quais outros estão vivos sem depender de um servidor central. Qual é a melhor escolha?

- [x] Gossip: cada nó troca periodicamente o que sabe com alguns nós aleatórios
- [ ] Um coordenador que recebe heartbeats de todos e publica a lista de vivos
- [ ] Two-phase commit entre todos os nós a cada entrada ou saída de um nó
- [ ] Consultar o DNS a cada segundo para ver quais IPs estão respondendo

> Com gossip, a informação se espalha como boato: em poucas rodadas, da ordem de log N, o cluster todo fica sabendo, sem ponto central de falha. O Cassandra e o Consul usam gossip para saber quem está no cluster e detectar falhas. Capítulo 22.

### 18. Você vai fazer sharding por intervalo da tabela de eventos de um app de analytics, usando a data e hora do evento como shard key. Qual é o problema?

- [ ] Consultas por período ficam impossíveis, porque cada dia cai num shard aleatório
- [ ] Cada evento precisa ser gravado em todos os shards ao mesmo tempo
- [ ] O resharding fica impossível depois que os dados estão distribuídos
- [x] Toda escrita nova cai no shard do intervalo mais recente, que vira hot spot

> Com uma chave sempre crescente, como data e hora, o shard "de agora" recebe todas as gravações enquanto os outros só guardam histórico. Uma saída comum é compor a chave com um hash, por exemplo do ID do dispositivo, para espalhar as escritas. Capítulo 23.

### 19. Um usuário troca a foto do perfil, a página recarrega e mostra a foto antiga. O sistema grava no primário e lê de réplicas com replicação assíncrona. Qual é a correção mais direcionada?

- [ ] Adicionar mais réplicas de leitura para dividir melhor a carga
- [x] Ler do primário os dados do próprio usuário logo depois que ele escreve
- [ ] Trocar a replicação por multi-primário, com escrita em qualquer nó
- [ ] Aumentar o TTL do cache do navegador para a página de perfil

> O sintoma é replication lag: a réplica ainda não recebeu a escrita. Garantir read-your-writes, lendo do primário os dados do próprio usuário por alguns segundos depois que ele escreve, resolve sem tornar toda a replicação síncrona. Capítulo 24.

### 20. Um cluster de cache com 10 nós usa hashing consistente com nós virtuais, e a carga está bem distribuída. Você adiciona o 11º nó. Aproximadamente que fração das chaves muda de nó?

- [ ] Quase todas, como acontece com hash(chave) mod N
- [ ] Cerca de metade, divididas entre o nó novo e os vizinhos
- [x] Cerca de 1/11, só as que passam a pertencer ao nó novo
- [ ] Nenhuma, porque só as chaves criadas depois vão para o nó novo

> No anel, o nó novo assume só os trechos imediatamente antes de cada posição dele, e o resto das chaves fica onde estava. Com hash(chave) mod N, passar de 10 para 11 nós muda o destino de cerca de 10 em cada 11 chaves. Capítulo 25.

### 21. Você está projetando o armazenamento de telemetria de milhões de sensores: centenas de milhares de escritas por segundo e poucas leituras. Qual estrutura favorece essa carga?

- [ ] B-Tree, porque atualiza as páginas no lugar e não precisa de compaction
- [ ] Bloom filter, porque guarda os dados ocupando pouquíssima memória
- [x] LSM-Tree, porque acumula as escritas em memória e grava em lote no disco
- [ ] B-Tree com vários índices secundários, porque índices aceleram inserções

> A LSM-Tree transforma escritas espalhadas em gravações sequenciais em lote, o que a deixa muito rápida para escrever; o preço aparece nas leituras e na compaction. Cassandra, ScyllaDB e RocksDB seguem essa linha. Capítulo 26.

### 22. O feed do seu app mostra cada post com o nome e a foto do autor e é lido milhões de vezes por minuto. O join com a tabela de usuários virou o gargalo. Qual técnica atende?

- [x] Desnormalizar, copiando o nome e a foto do autor para cada post
- [ ] Normalizar mais, separando o nome e a foto em tabelas próprias
- [ ] Remover os índices da tabela de usuários para acelerar o join
- [ ] Ler cada post dentro de uma transação 2PC com a tabela de usuários

> Em caminhos de leitura pesada, duplicar alguns campos troca um join caro por uma leitura direta. O preço é manter as cópias em dia quando o autor muda o nome ou a foto, geralmente com um evento processado em segundo plano. Capítulo 28.

### 23. Antes de ir ao disco, o banco consulta um Bloom filter, que responde "não está" para uma chave. O que você pode concluir?

- [ ] A chave provavelmente não está, mas pode ser um falso negativo
- [ ] A chave está, mas foi apagada há pouco e ainda não foi compactada
- [ ] Nada, porque as respostas negativas do filtro são aleatórias
- [x] A chave com certeza não está, e a leitura no disco pode ser pulada

> Se algum dos bits da chave estiver zerado, ela nunca foi inserida: Bloom filter não tem falso negativo. Só o "talvez esteja" pode errar (falso positivo), e nesse caso o banco faz a leitura normal. Capítulo 30.

### 24. Você está projetando a busca de um assistente de IA que precisa achar os trechos da documentação mais parecidos em significado com a pergunta, mesmo sem palavras em comum. Qual é a melhor escolha?

- [ ] Um índice B-Tree sobre o texto, buscando por igualdade exata
- [x] Embeddings num banco vetorial, buscando os vizinhos mais próximos
- [ ] Um Bloom filter com as palavras de cada trecho da documentação
- [ ] Consultas com LIKE '%termo%' sobre o texto no banco relacional

> Embeddings colocam textos de significado parecido perto uns dos outros, então "como cancelo minha assinatura?" encontra "encerrar o plano". O banco vetorial acha os mais próximos por uma medida de distância, como a similaridade de cosseno, em geral com índices aproximados para responder rápido. Capítulo 31.

### 25. Sua API pública precisa aceitar rajadas curtas (um app que sincroniza 20 itens de uma vez ao abrir), mas limitar cada chave a uma média de 10 requisições por segundo. Qual configuração atende?

- [ ] Janela fixa de 1 segundo com limite de 10 requisições
- [x] Token bucket com capacidade de 20 fichas e reposição de 10 por segundo
- [ ] Janela deslizante de 1 segundo com limite de 10 requisições
- [ ] Circuit breaker que abre quando a chave passa de 10 requisições por segundo

> O balde cheio libera uma rajada de até 20 requisições, e a reposição de 10 fichas por segundo segura a média no longo prazo. As janelas com limite de 10 por segundo recusariam parte da rajada, e circuit breaker protege contra falhas de dependências, não contra excesso de uso. Capítulo 32.

### 26. O que um circuit breaker faz quando está aberto?

- [ ] Repete cada chamada com backoff exponencial até o serviço voltar a responder
- [ ] Deixa as chamadas passarem normalmente e só conta quantas falharam
- [ ] Separa as chamadas em pools de threads isolados por funcionalidade
- [x] Falha as chamadas na hora, sem acionar o serviço, até o tempo de espera passar

> Aberto, o circuit breaker poupa o serviço com problema e também quem chama, que deixa de ficar preso em timeouts. Passado o tempo de espera, ele fica meio-aberto, deixa algumas chamadas de teste passarem e fecha de novo se elas derem certo. Capítulo 33.

### 27. Você quer garantir que, se o serviço de relatórios travar, ele não ocupe todas as conexões do pool que o checkout também usa. O que fazer?

- [x] Dar pools de conexões separados ao checkout e aos relatórios
- [ ] Aplicar retry com backoff exponencial nas chamadas de relatório
- [ ] Aumentar o pool compartilhado para caber os dois com folga
- [ ] Exigir uma idempotency key em toda chamada de relatório

> É o bulkhead: os relatórios podem esgotar o próprio pool sem tocar no do checkout, como um compartimento alagado que não afunda o navio. Aumentar o pool compartilhado só adia o problema, porque um serviço travado acaba prendendo qualquer quantidade de conexões. Capítulo 34.

### 28. Depois de uma queda de 30 s no banco, 50 mil clientes que falharam juntos tentam de novo após 1 s, 2 s, 4 s..., todos nos mesmos instantes, e o banco cai de novo ao voltar. O que falta na política de retry?

- [ ] Backoff exponencial entre as tentativas
- [ ] Mais tentativas por cliente antes de desistir
- [x] Jitter, um componente aleatório no tempo de espera
- [ ] Um intervalo fixo de 1 segundo entre as tentativas

> O backoff exponencial já espaça as tentativas de cada cliente, mas, sem jitter, clientes que falharam juntos voltam juntos: é o thundering herd. Sortear parte da espera espalha as novas tentativas e dá ao banco tempo para se recuperar. Capítulo 35.

### 29. O app envia um pagamento, a conexão cai antes da resposta e o app reenvia a mesma requisição. Como evitar a cobrança dupla?

- [x] Reenviar com a mesma idempotency key, e o servidor devolver o resultado guardado
- [ ] Reenviar com uma idempotency key nova, para o servidor distinguir as tentativas
- [ ] Trocar o POST por um GET, que pelo protocolo HTTP já é idempotente
- [ ] Colocar um circuit breaker entre o app e o serviço de pagamentos

> O servidor guarda a chave com o resultado da primeira execução; quando a mesma chave chega de novo, ele devolve aquele resultado em vez de cobrar outra vez. Uma chave nova a cada tentativa faria o servidor tratar a repetição como outro pagamento. Capítulo 36.

### 30. Num cluster Raft de 5 nós, uma partição isola o líder atual com apenas mais um nó, e os outros 3 elegem um novo líder. O que impede o líder antigo de confirmar novas escritas?

- [ ] O heartbeat do novo líder chega até ele e o desliga na hora
- [x] Ele não consegue a confirmação da maioria, 3 de 5 nós
- [ ] Ele apaga o próprio log assim que percebe a partição
- [ ] Os clientes passam a usar two-phase commit com ele

> No Raft, uma escrita só é confirmada quando a maioria do cluster a grava no log, e do lado com 2 nós isso nunca acontece. Quando a rede volta, o líder antigo vê o mandato maior do novo líder, vira seguidor, e as entradas que ele não confirmou são substituídas. Capítulo 38.

### 31. Você está projetando o checkout de um e-commerce com serviços de pedidos, pagamento e estoque, cada um com seu banco, em alto volume. Você não quer locks distribuídos nem um coordenador que trave tudo se cair. Qual abordagem usar?

- [ ] Two-phase commit, com um coordenador segurando locks nos três bancos até decidir
- [ ] Gravar nos três serviços em paralelo e ignorar as falhas parciais
- [ ] Repetir cada passo indefinidamente até os três serviços confirmarem
- [x] Uma saga, com transações locais em sequência e ações compensatórias

> Na saga, cada serviço confirma a própria parte e, se o pagamento for recusado, compensações desfazem o que já foi feito, como liberar o estoque reservado. O 2PC daria atomicidade, mas com locks durante a votação e risco de bloqueio se o coordenador cair, exatamente o que o enunciado quer evitar. Capítulos 39 e 40.

### 32. Você está projetando o cache do catálogo de produtos: muita leitura, poucas escritas, e o sistema precisa continuar funcionando se o cache cair. Qual estratégia é a escolha padrão?

- [ ] Write-back, gravando só no cache e levando ao banco depois
- [ ] O cache como única fonte dos dados, sem banco por trás
- [x] Cache-aside, buscando no banco e preenchendo o cache a cada miss
- [ ] Nenhum cache, porque o banco é mais rápido em cargas de leitura

> No cache-aside, o banco continua sendo a fonte da verdade: se o cache cair, a aplicação lê direto do banco, mais devagar, mas sem perder dados. Com write-back, uma queda do cache levaria embora escritas que ainda não chegaram ao banco. Capítulos 41 e 42.

### 33. Um cache com espaço para 3 itens usa LRU e começa vazio. Chegam os acessos A, B, C, A, D. Qual item é removido quando D entra?

- [ ] A, porque foi o primeiro a entrar no cache
- [ ] C, porque foi o último a entrar antes de D
- [ ] Nenhum, porque A foi acessado duas vezes
- [x] B, porque é o que está há mais tempo sem acesso

> O segundo acesso a A o torna o mais recente, então a ordem do menos para o mais recente fica B, C, A, e o LRU remove B. Remover A seria FIFO, que olha só a ordem de entrada. Capítulo 43.

### 34. No seu cadastro, o e-mail de boas-vindas é enviado com uma chamada síncrona ao provedor de e-mail; quando o provedor fica lento, o cadastro inteiro fica lento. Qual é a mudança indicada?

- [x] Colocar o pedido de envio numa fila e deixar um worker mandar o e-mail
- [ ] Aumentar o timeout da chamada ao provedor de e-mail
- [ ] Adicionar retries síncronos com backoff na chamada ao provedor
- [ ] Esperar a confirmação de entrega do e-mail antes de responder

> A fila desacopla o cadastro do envio: o usuário recebe a resposta na hora, e o worker manda o e-mail no ritmo do provedor, tentando de novo se ele falhar. As outras opções mantêm o provedor lento dentro da requisição do usuário. Capítulo 44.

### 35. Quando um pedido é criado, os serviços de estoque, e-mail e analytics precisam reagir, cada um do seu jeito. Qual modelo de mensageria é o indicado?

- [ ] Uma fila ponto a ponto da qual os três serviços consomem
- [x] Pub/Sub, com um tópico de pedidos e cada serviço como assinante
- [ ] Uma dead letter queue compartilhada pelos três serviços
- [ ] Chamadas encadeadas: pedidos chama estoque, que chama e-mail

> No pub/sub, cada assinante recebe sua própria cópia do evento, e o serviço de pedidos nem precisa saber quem está ouvindo. Numa fila ponto a ponto, cada mensagem vai para um único consumidor, então só um dos três veria cada pedido. Capítulo 45.

### 36. Uma mensagem com um campo malformado faz o consumidor falhar sempre: ela volta para a fila, é reprocessada sem parar e atrasa todas as outras. O que resolve?

- [ ] Aumentar o número máximo de tentativas para ela ter mais chances
- [ ] Apagar a fila inteira e reiniciar os consumidores do zero
- [x] Limitar as tentativas e mover a mensagem para uma dead letter queue
- [ ] Trocar a fila por pub/sub para cada mensagem ter vários consumidores

> Uma poison message nunca vai dar certo sozinha, então tentar de novo só desperdiça trabalho. Na DLQ ela sai do caminho das outras e fica guardada para alguém investigar, corrigir e reprocessar. Capítulo 46.

### 37. Um checkout passa por 12 serviços e às vezes leva 8 s. Você precisa ver, numa requisição lenta específica, quanto tempo cada serviço gastou. O que usar?

- [ ] Logs em nível DEBUG em todos os serviços, lidos um serviço por vez
- [ ] Um heartbeat em cada serviço, para saber quais deles estão vivos
- [x] Tracing distribuído, com trace ID propagado e um span por operação
- [ ] A latência média de cada serviço, num painel de métricas por hora

> O trace ID amarra todos os spans da mesma requisição, e cada span registra início e duração, então o trace mostra exatamente onde os 8 s foram gastos. Médias por serviço escondem a requisição lenta, e logs soltos não dizem quais linhas pertencem a ela. Capítulo 47.

### 38. Qual frase usa SLI, SLO e SLA corretamente?

- [ ] O SLO medido foi 99,95%; o SLI interno é 99,9%; o SLA é a meta da equipe
- [x] O SLI medido foi 99,95%; o SLO interno é 99,9%; o SLA no contrato é 99,5%
- [ ] O SLA medido foi 99,95%; o SLO no contrato é 99,5%; o SLI é a meta interna
- [ ] O SLI no contrato é 99,5%; o SLA interno é 99,9%; o SLO medido foi 99,95%

> SLI é o placar (o que se mede), SLO é a meta interna e SLA é o contrato com o cliente. O SLO fica mais rígido que o SLA para a equipe perceber o problema antes de violar o contrato. Capítulo 48.

### 39. Você está construindo um app com "Entrar com Google" e precisa saber quem é o usuário (nome e e-mail). O que usar?

- [ ] OAuth 2.0 puro, tratando o access token como prova de quem é o usuário
- [ ] Pedir a senha do Google ao usuário e guardá-la criptografada no banco
- [ ] Um certificado TLS de cliente emitido para cada usuário do app
- [x] OIDC, que soma ao OAuth 2.0 um ID token com a identidade do usuário

> O OAuth 2.0 trata de autorização: o access token diz o que o app pode acessar e é destinado à API, não serve como prova de identidade. O OIDC acrescenta a autenticação, com um ID token assinado (um JWT) que o app valida para saber quem fez login. Capítulo 49.

### 40. Você está projetando a comunicação entre microsserviços numa arquitetura Zero Trust. O que se espera?

- [x] Toda chamada é autenticada, autorizada e cifrada (por exemplo, com mTLS), mesmo dentro da VPC
- [ ] Chamadas dentro da VPC dispensam autenticação, porque o firewall já barra o tráfego externo
- [ ] Basta ter TLS no load balancer de borda; o tráfego interno pode seguir em texto puro
- [ ] Um serviço aceita qualquer requisição que venha de um endereço IP da rede interna

> Zero Trust parte do princípio de que o atacante pode já estar dentro: estar na rede não dá confiança. Com mTLS, cada serviço prova sua identidade com um certificado, e cada chamada ainda passa por uma checagem de autorização. Capítulos 50 e 51.
