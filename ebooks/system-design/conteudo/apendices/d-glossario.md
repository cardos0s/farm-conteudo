---
apendice: D
titulo: Glossário
---

### A

- **ACID**: atomicidade, consistência, isolamento e durabilidade, as quatro garantias de uma transação confiável num banco de dados. Capítulo 4.
- **API Gateway**: proxy reverso especializado que é a porta de entrada única das chamadas de API e cuida de roteamento, autenticação, rate limiting e logs. Capítulo 14.
- **At-least-once** (*pelo menos uma vez*): garantia de entrega em que nenhuma mensagem se perde, mas algumas podem chegar repetidas, o que exige consumidores idempotentes. Capítulos 36 e 44.

### B

- **Backoff exponencial** (*exponential backoff*): esperar cada vez mais entre uma retentativa e a seguinte (1 s, 2 s, 4 s...) para não sobrecarregar um serviço que já está com problemas. Capítulo 35.
- **Backpressure** (*contrapressão*): sinal que um componente sobrecarregado manda para quem produz trabalho diminuir o ritmo, em vez de deixar as filas crescerem sem limite. Capítulo 44.
- **Banco de dados vetorial** (*vector database*): banco que guarda embeddings e encontra os mais próximos de uma consulta, a chamada busca por vizinhos mais próximos. Capítulo 31.
- **BASE**: sigla de Basically Available, Soft state, Eventual consistency, modelo que prioriza continuar respondendo e aceita inconsistências temporárias, que se resolvem com o tempo. Capítulo 4.
- **Bloom filter** (*filtro de Bloom*): estrutura compacta de bits e funções de hash que responde "com certeza não está" ou "talvez esteja": pode dar falso positivo, nunca falso negativo. Capítulo 30.
- **B-Tree** (*árvore B*): árvore balanceada e ordenada, base dos índices dos bancos relacionais, que encontra uma chave ou um intervalo com poucas leituras de disco. Capítulo 26.
- **Bulkhead**: isolar recursos (pools de conexões, threads, clusters) por funcionalidade, como as anteparas de um navio, para que a falha de uma parte não afunde o resto. Capítulo 34.

### C

- **Cache**: camada de armazenamento rápido, quase sempre em memória, que guarda dados muito acessados para reduzir a latência e a carga sobre o banco. Capítulo 41.
- **Cache-aside**: estratégia em que a aplicação procura no cache e, num miss, lê do banco e grava o resultado no cache; também chamada de lazy loading. Capítulo 42.
- **CAP**: teorema segundo o qual, durante uma partição de rede, um sistema distribuído precisa escolher entre consistência (C) e disponibilidade (A). Capítulo 2.
- **CDN** (*rede de distribuição de conteúdo*): sigla de Content Delivery Network, rede de servidores espalhados pelo mundo que guarda cópias do conteúdo estático perto dos usuários. Capítulo 15.
- **Circuit breaker** (*disjuntor*): componente que, depois de falhas demais, recusa na hora as chamadas a um serviço com problema e só volta a testá-lo após um tempo, evitando falhas em cascata. Capítulo 33.
- **Cold start** (*inicialização a frio*): atraso de uma chamada serverless que precisa de um ambiente de execução novo, criado e inicializado na hora. Capítulo 10.
- **Compaction** (*compactação*): processo de fundo das LSM-Trees que mescla os arquivos do disco, descarta versões antigas e dados apagados e reduz o trabalho das leituras. Capítulo 26.
- **Consenso** (*consensus*): acordo entre os nós de um cluster sobre um mesmo valor ou uma mesma ordem de operações, mesmo com falhas, obtido com algoritmos como Paxos e Raft. Capítulo 38.
- **Consistência eventual** (*eventual consistency*): garantia de que, se as escritas pararem, todas as réplicas convergem para o mesmo valor; até lá, uma leitura pode ver dado velho. Capítulo 7.
- **Consistência forte** (*strong consistency*): garantia de que toda leitura vê a escrita confirmada mais recente, como se existisse uma única cópia dos dados. Capítulo 7.

### D

- **Desnormalização** (*denormalization*): duplicar dados de propósito para acelerar leituras e evitar joins, pagando com escritas mais trabalhosas e o risco de cópias divergentes. Capítulo 28.
- **DLQ** (*fila de mensagens mortas*): sigla de dead letter queue, a fila para onde vão as mensagens que falharam depois de várias tentativas, para análise e reprocessamento. Capítulo 46.
- **DNS** (*sistema de nomes de domínio*): sigla de Domain Name System, o serviço que traduz nomes de domínio em endereços IP, com cache em várias camadas. Capítulo 16.

### E

- **Embedding**: vetor de números gerado por um modelo para representar o significado de um texto, imagem ou áudio, de modo que itens parecidos fiquem próximos. Capítulo 31.
- **Error budget** (*orçamento de erro*): a margem de falha que o SLO tolera num período; um SLO de 99,9% de disponibilidade mensal deixa cerca de 43 minutos de indisponibilidade. Capítulo 48.
- **Escalabilidade horizontal** (*horizontal scaling*): crescer adicionando máquinas e dividindo o trabalho entre elas (scale out). Capítulo 1.
- **Escalabilidade vertical** (*vertical scaling*): crescer dando mais recursos a uma única máquina, como CPU, memória ou disco mais rápido (scale up). Capítulo 1.
- **Exactly-once** (*exatamente uma vez*): garantia de que o efeito de cada mensagem acontece uma única vez; na prática, sai de entrega at-least-once com deduplicação ou processamento idempotente. Capítulos 36 e 44.

### F

- **Failover**: troca automática de um componente que falhou por um reserva, como promover uma réplica a primário quando o primário cai. Capítulos 24 e 37.
- **Fencing token**: número sempre crescente entregue a cada novo dono de um lock ou da liderança, que permite ao recurso recusar ordens vindas de um dono antigo. Capítulo 38.
- **Fila de mensagens** (*message queue*): estrutura em que um produtor deixa mensagens para processamento posterior, cada uma consumida por um único receptor, desacoplando os dois lados. Capítulo 44.

### G

- **Gossip** (*fofoca*): protocolo em que cada nó troca informações periodicamente com alguns pares aleatórios, até que todo o cluster tenha aproximadamente a mesma visão, sem coordenador central. Capítulo 22.
- **gRPC**: framework de chamadas remotas que usa HTTP/2 e mensagens binárias em Protocol Buffers, com contratos tipados e streaming nos dois sentidos. Capítulo 19.

### H

- **Hashing consistente** (*consistent hashing*): técnica que posiciona chaves e nós num anel lógico, de modo que adicionar ou remover um nó mova só uma pequena parte das chaves. Capítulo 25.
- **Head-of-line blocking** (*bloqueio de cabeça de fila*): quando um item atrasado no começo da fila segura todos os que vêm atrás; no HTTP/2, um pacote TCP perdido trava todos os streams da conexão. Capítulo 18.
- **Heartbeat**: sinal periódico que um nó envia para avisar que está vivo; se ele para de chegar, o nó é dado como fora e o sistema pode disparar o failover. Capítulo 37.
- **Hot spot** (*ponto quente*): shard, nó ou chave que recebe uma fatia desproporcional do tráfego, geralmente por causa de uma chave de particionamento mal escolhida. Capítulo 23.
- **HTTP/2**: versão do HTTP que multiplexa várias requisições numa mesma conexão TCP e comprime os cabeçalhos. Capítulo 18.
- **HTTP/3**: versão do HTTP que roda sobre QUIC, em cima de UDP, e acaba com o head-of-line blocking do TCP entre streams. Capítulo 18.

### I

- **Idempotência** (*idempotency*): propriedade de uma operação que, executada várias vezes, tem o mesmo efeito de uma execução só, como "definir status como ativo". Capítulo 36.
- **Idempotency key** (*chave de idempotência*): identificador único que o cliente envia com a requisição para o servidor reconhecer repetições e não executá-las de novo, como numa cobrança. Capítulo 36.
- **IP Hash**: algoritmo de balanceamento que escolhe o servidor pelo hash do IP do cliente, mandando o mesmo cliente quase sempre para o mesmo servidor. Capítulo 12.

### J

- **Jitter**: aleatoriedade somada ao tempo de espera entre retentativas, para que os clientes não tentem todos no mesmo instante. Capítulo 35.
- **JWT**: sigla de JSON Web Token, token assinado com informações (claims) que quem o recebe valida pela assinatura, sem consultar o emissor a cada requisição; o ID token do OIDC é um JWT. Capítulo 49.

### L

- **Latência** (*latency*): quanto tempo uma única requisição leva, do início ao fim. Capítulo 5.
- **Least Connections** (*menos conexões*): algoritmo de balanceamento que manda cada requisição para o servidor com menos conexões ativas, bom quando as requisições têm durações muito diferentes. Capítulo 12.
- **Lei de Amdahl** (*Amdahl's law*): o ganho com paralelismo é limitado pela parte do trabalho que precisa rodar em sequência; com 20% sequencial, o ganho máximo é de 5 vezes. Capítulo 6.
- **LFU**: sigla de Least Frequently Used, política que remove do cache os itens acessados menos vezes. Capítulo 43.
- **Linearizabilidade** (*linearizability*): a forma mais forte de consistência, em que o sistema se comporta como se houvesse uma única cópia dos dados; é o C do CAP. Capítulos 2 e 7.
- **Load balancer** (*balanceador de carga*): componente que distribui o tráfego entre vários servidores e, com health checks, para de mandar requisições para os que estão com problema. Capítulo 11.
- **Long polling**: técnica em que o servidor segura a requisição aberta até ter novidade ou estourar um timeout, e o cliente abre outra logo em seguida. Capítulo 21.
- **LRU**: sigla de Least Recently Used, política que remove do cache o item que está há mais tempo sem ser acessado. Capítulo 43.
- **LSM-Tree**: sigla de Log-Structured Merge-Tree, estrutura que acumula as escritas em memória e as grava em lote em arquivos ordenados no disco, com escrita muito rápida e leitura mais cara. Capítulo 26.

### M

- **Memtable**: estrutura ordenada em memória que recebe as escritas de uma LSM-Tree até encher e ser gravada no disco como um arquivo imutável (SSTable). Capítulo 26.
- **Microsserviços** (*microservices*): arquitetura que divide as funcionalidades em serviços separados, com deploy independente, que conversam pela rede. Capítulo 9.
- **Monólito** (*monolith*): aplicação única que reúne todas as funcionalidades numa só unidade de deploy. Capítulo 9.
- **mTLS**: TLS mútuo, em que cliente e servidor apresentam certificados e um autentica o outro; é a base da comunicação entre serviços em Zero Trust. Capítulos 50 e 51.
- **Multi-primário** (*multi-primary*): modelo de replicação, antes chamado de master-master, em que vários nós aceitam escritas e precisam resolver os conflitos entre elas. Capítulo 24.

### N

- **Normalização** (*normalization*): organizar os dados em tabelas sem redundância, seguindo as formas normais, para evitar anomalias de inserção e de atualização. Capítulo 28.

### O

- **OAuth 2.0**: framework de autorização delegada em que o usuário permite que um app acesse recursos dele por meio de um access token, sem entregar a senha. Capítulo 49.
- **OIDC**: sigla de OpenID Connect, camada sobre o OAuth 2.0 que adiciona autenticação, entregando um ID token que diz quem é o usuário. Capítulo 49.

### P

- **PACELC**: extensão do CAP: se há partição (P), escolha entre disponibilidade (A) e consistência (C); senão (E), entre latência (L) e consistência (C). Capítulo 3.
- **Partição de rede** (*network partition*): falha em que grupos de nós continuam funcionando, mas param de conseguir se comunicar entre si. Capítulo 2.
- **Paxos**: família de algoritmos de consenso criada por Leslie Lamport, correta e influente, mas famosa por ser difícil de entender e de implementar. Capítulo 38.
- **Percentil** (*percentile*): valor abaixo do qual fica uma fração das medições; o p99 de latência é o tempo que 99% das requisições não ultrapassam. Capítulos 5 e 48.
- **Persistência poliglota** (*polyglot persistence*): usar vários tipos de banco no mesmo sistema, cada um no que faz melhor, como um relacional para pedidos e um chave-valor para sessões. Capítulo 29.
- **Primário-réplica** (*primary-replica*): modelo de replicação, antes chamado de master-slave, em que só o primário aceita escritas e as réplicas recebem as mudanças e atendem leituras. Capítulo 24.
- **Proxy direto** (*forward proxy*): intermediário que fica na frente dos clientes e os representa diante da internet, para filtrar conteúdo, fazer cache ou controlar acesso. Capítulo 13.
- **Proxy reverso** (*reverse proxy*): intermediário que fica na frente dos servidores e os representa para os clientes, escondendo a topologia interna e fazendo terminação TLS, cache e roteamento. Capítulo 13.
- **Pub/Sub** (*publicação/assinatura*): modelo em que publicadores enviam mensagens para tópicos e cada assinante do tópico recebe a sua própria cópia. Capítulo 45.

### Q

- **QUIC**: protocolo de transporte sobre UDP, com TLS 1.3 embutido e streams independentes, que serve de base para o HTTP/3. Capítulo 18.
- **Quórum** (*quorum*): número mínimo de nós que precisa responder para uma leitura ou escrita valer; quóruns de maioria garantem que dois grupos quaisquer tenham pelo menos um nó em comum. Capítulos 24 e 38.

### R

- **Raft**: algoritmo de consenso feito para ser fácil de entender, que elege um líder por mandato e replica um log com confirmação da maioria; é usado no etcd e no Consul. Capítulo 38.
- **Rate limiting** (*limitação de taxa*): limitar quantas requisições um usuário, IP ou chave de API pode fazer numa janela de tempo, com algoritmos como janela fixa, janela deslizante e token bucket. Capítulo 32.
- **Replication lag** (*atraso de replicação*): intervalo entre uma escrita ser confirmada no primário e aparecer nas réplicas, que faz leituras em réplicas devolverem dados velhos. Capítulo 24.
- **Resharding** (*reparticionamento*): redistribuir os dados entre shards quando se adicionam ou removem shards ou quando se troca a chave de particionamento. Capítulo 23.
- **REST**: estilo de API sobre HTTP organizado em recursos (/users, /orders) manipulados pelos verbos HTTP, normalmente com JSON. Capítulo 19.
- **Retry** (*retentativa*): repetir automaticamente uma operação que falhou por um erro transitório, como um timeout. Capítulo 35.
- **Round Robin** (*rodízio*): algoritmo de balanceamento que passa pelos servidores em ordem, um de cada vez, e recomeça do primeiro no fim da lista. Capítulo 12.
- **RTT** (*tempo de ida e volta*): sigla de round-trip time, o tempo que uma mensagem leva para ir até o outro lado e a resposta voltar. Capítulos 18 e 50.

### S

- **SAGA**: padrão que divide uma transação distribuída em passos locais, cada um com uma ação compensatória que o desfaz se um passo seguinte falhar. Capítulo 39.
- **Serverless**: modelo em que você roda funções na nuvem sem gerenciar servidores, paga só pela execução e deixa a escala por conta da plataforma. Capítulo 10.
- **Sharding** (*particionamento*): dividir os dados entre várias máquinas, cada uma com um subconjunto, por intervalo, por hash ou por diretório. Capítulo 23.
- **Shard key** (*chave de particionamento*): campo que decide em qual shard cada registro fica; dele depende a carga se espalhar ou virar um hot spot. Capítulo 23.
- **SLA** (*acordo de nível de serviço*): sigla de Service Level Agreement, a promessa contratual feita ao cliente, como 99,9% de disponibilidade no mês, em geral com compensação se for descumprida. Capítulo 48.
- **SLI** (*indicador de nível de serviço*): sigla de Service Level Indicator, a métrica medida de fato, como a porcentagem de requisições bem-sucedidas. Capítulo 48.
- **SLO** (*objetivo de nível de serviço*): sigla de Service Level Objective, a meta interna para um SLI, normalmente mais rígida que o SLA. Capítulo 48.
- **Span**: trecho de um trace que representa uma operação, como uma chamada ou uma consulta, com início, duração e referência ao span pai. Capítulo 47.
- **Split brain** (*cérebro dividido*): situação em que dois nós se consideram líderes ao mesmo tempo, normalmente depois de uma partição, e aceitam escritas conflitantes. Capítulo 38.
- **SSE**: sigla de Server-Sent Events, canal de mão única sobre HTTP pelo qual o servidor envia eventos ao cliente. Capítulo 20.
- **Stateful**: serviço que guarda o contexto do usuário entre requisições, geralmente na memória da própria instância. Capítulo 8.
- **Stateless**: serviço que trata cada requisição como nova e guarda o estado fora, em banco ou cache, de modo que qualquer instância atende qualquer requisição. Capítulo 8.
- **Sticky session** (*afinidade de sessão*): manter o mesmo cliente sempre no mesmo servidor, por cookie ou hash de IP, quando o estado fica na instância. Capítulos 8 e 12.

### T

- **TCP**: protocolo de transporte orientado a conexão que entrega os bytes em ordem e sem perdas, usando confirmações e retransmissões. Capítulo 17.
- **Throughput** (*vazão*): quantas requisições o sistema atende por segundo. Capítulo 5.
- **Thundering herd**: muitos clientes ou processos atacando o mesmo recurso no mesmo instante, como retentativas sincronizadas depois de uma falha ou uma chave popular que expira no cache. Capítulo 35.
- **TLS**: sigla de Transport Layer Security, protocolo que cifra e autentica a comunicação entre cliente e servidor; sucessor do SSL, é o que protege o HTTPS. Capítulo 50.
- **Token bucket**: algoritmo de rate limiting em que fichas são repostas a uma taxa fixa e cada requisição gasta uma, o que permite rajadas até o tamanho do balde. Capítulo 32.
- **Tracing distribuído** (*distributed tracing*): seguir uma requisição por todos os serviços que ela atravessa, com um trace ID propagado de chamada em chamada e um span por operação. Capítulo 47.
- **Transação compensatória** (*compensating transaction*): ação que desfaz o efeito de um passo já confirmado de uma saga, como estornar um pagamento. Capítulo 39.
- **TTL** (*tempo de vida*): sigla de time to live, o prazo de validade de um item em cache ou de um registro DNS, depois do qual ele expira. Capítulos 16 e 41.
- **Two-phase commit** (*commit em duas fases*): protocolo (2PC) em que um coordenador pergunta a todos os participantes se podem confirmar e só depois manda todos confirmarem ou desfazerem. Capítulo 40.

### U

- **UDP**: protocolo de transporte sem conexão, sem garantia de entrega nem de ordem, mais leve e com menos latência que o TCP. Capítulo 17.

### W

- **WAL**: sigla de write-ahead log, o registro sequencial em que cada mudança é gravada antes de ser aplicada aos dados, o que permite recuperar o banco depois de uma queda. Capítulo 27.
- **WebSocket**: protocolo de conexão persistente e full-duplex, em que cliente e servidor trocam mensagens a qualquer momento. Capítulo 20.
- **Write-back**: estratégia em que a escrita vai para o cache e só depois chega ao banco; é rápida, mas perde dados se o cache cair antes disso. Capítulo 42.
- **Write-through**: estratégia em que cada escrita vai para o cache e para o banco na mesma operação, mantendo os dois sincronizados. Capítulo 42.

### Z

- **Zero Trust** (*confiança zero*): modelo de segurança em que estar dentro da rede não dá confiança: toda requisição é autenticada, autorizada e cifrada, com o acesso mínimo necessário. Capítulo 51.
