---
numero: 29
titulo: Persistência poliglota
original: Polyglot Persistence
resumo: Persistência poliglota é usar vários tipos de banco no mesmo sistema, cada um no papel em que é melhor, pagando com mais operação, mais conhecimento no time e o trabalho de manter os dados sincronizados.
relacionados: [9, 27, 28, 31, 45]
---

## O essencial

Persistência poliglota significa usar vários tipos de banco de dados dentro do mesmo sistema, cada um escolhido por aquilo que faz melhor. Você pode usar um banco relacional para transações, um banco de documentos para logs, um banco chave-valor para cache e um banco de grafos para relacionamentos. Em vez de forçar tudo para dentro de um único banco, você escolhe a ferramenta certa para cada trabalho. O trade-off é mais complexidade operacional e mais conhecimento exigido do time.

## Aprofundando

O termo, popularizado por Martin Fowler, empresta a ideia da programação poliglota: assim como um sistema pode ter várias linguagens, pode ter vários bancos. O ponto de partida é o **padrão de acesso** de cada tipo de dado. Num e-commerce hipotético:

| Dado | Como é usado | Escolha típica |
|---|---|---|
| Pedidos e pagamentos | Transações ACID, consistência forte | Relacional (PostgreSQL, MySQL) |
| Sessões e carrinho | Chave → valor, em milissegundos | Chave-valor em memória (Redis) |
| Busca no catálogo | Texto livre, relevância, filtros | Motor de busca (Elasticsearch, OpenSearch) |
| "Quem comprou isto também comprou" | Percorrer relacionamentos | Grafo (Neo4j) |
| Fotos dos produtos | Arquivos grandes e imutáveis | Object storage (S3) |
| Relatórios | Varrer bilhões de linhas por coluna | Data warehouse (BigQuery, Redshift) |

### O problema que ninguém mostra no slide

Os bancos precisam concordar entre si: o produto cadastrado no PostgreSQL tem que aparecer na busca. A tentação é a **escrita dupla** (dual write): o código grava no PostgreSQL e, em seguida, no Elasticsearch. Se a segunda escrita falhar, ou o processo cair entre as duas, os bancos divergem em silêncio.

As saídas confiáveis partem de uma **fonte da verdade**:

- **Change data capture (CDC):** uma ferramenta lê o log do banco principal (o WAL do cap. 27) e publica cada mudança num tópico (cap. 45); consumidores atualizam a busca, o cache e o warehouse.
- **Outbox transacional:** na mesma transação do pedido, o serviço grava um evento numa tabela `outbox`; um processo separado lê essa tabela e publica os eventos.

Assim, os bancos derivados (busca, cache, warehouse) ficam reconstruíveis: se algo der errado, você os recria a partir da fonte.

### O custo de cada banco novo

Cada tecnologia a mais é mais um sistema para fazer backup, monitorar, atualizar, proteger e entender às três da manhã, quando ele cai. Por isso, a regra prática é começar com o mínimo (muitas vezes, um PostgreSQL resolve quase tudo) e acrescentar um banco especializado quando surgir um requisito que o atual não atende bem.

## Analogia

Uma família guarda a vida em vários lugares: o dinheiro no banco, os documentos na pasta do armário, as fotos na nuvem, os contatos no celular. Cada um é ótimo no seu papel, e ninguém guardaria fotos no internet banking. O preço aparece na mudança de endereço: é preciso avisar o banco, o plano de saúde e a escola das crianças, um por um. Esquecer um deles é a versão doméstica da escrita dupla que falhou.

## No mundo real

- A combinação de **PostgreSQL ou MySQL com Redis e Elasticsearch/OpenSearch** é tão comum em aplicações web que virou quase um padrão.
- A **Netflix** usa o Cassandra para grandes volumes de dados e o EVCache, um cache distribuído baseado em memcached, entre outros armazenamentos.
- O **Debezium** é a ferramenta open source mais conhecida de CDC: lê o log do PostgreSQL, do MySQL e de outros bancos e publica as mudanças no Kafka.
- A **AWS** defende abertamente bancos "purpose-built" (feitos para um propósito) e oferece um para cada modelo, como DynamoDB (chave-valor), DocumentDB (documentos) e Neptune (grafos).

## Trade-offs

**Você ganha:**

- Cada tipo de dado num banco feito para o padrão de acesso dele.
- Desempenho e escala melhores onde importa: busca, cache, análise.
- Liberdade para evoluir uma parte sem mexer nas outras.

**Você paga:**

- Mais sistemas para operar, monitorar, proteger e pagar.
- Sincronização entre bancos, com consistência eventual entre eles.
- Um time que precisa dominar várias tecnologias, e mais pontos de falha.

## Na entrevista

- Propor dois ou três bancos num desenho de sistema é natural. O que conta é justificar cada um pelo padrão de acesso: "Pedidos no PostgreSQL, pelas transações; busca no OpenSearch, pela relevância; sessões no Redis, pela latência."
- Diga qual é a fonte da verdade, como os outros bancos são alimentados (CDC ou outbox) e o que o usuário vê enquanto eles estão atrasados.
- Mostre parcimônia: "Não adicionaria um banco de grafos só para recomendações simples; uma consulta recursiva no PostgreSQL resolve no começo."

## Cuidado com

- **Escrita dupla não é sincronização.** Gravar em dois bancos no mesmo código, sem uma transação que cubra os dois, leva a divergências que ninguém percebe até o cliente reclamar.
- **Banco derivado não é fonte da verdade.** Índices de busca e caches precisam poder ser apagados e reconstruídos.
- **Atualização:** a fronteira entre os tipos de banco ficou borrada. O PostgreSQL tem JSONB, busca textual e, com o pgvector, busca vetorial; MongoDB, Redis e Elasticsearch também ganharam busca vetorial. Hoje, muitos times consolidam no que já têm e só partem para um banco especializado quando o requisito exige.

## Teste-se

**P:** O que é persistência poliglota?

**R:** É usar mais de um tipo de banco de dados no mesmo sistema, escolhendo cada um pelo padrão de acesso que ele atende melhor.

**P:** Num marketplace, onde você guardaria os pedidos, a busca de produtos e as sessões dos usuários?

**R:** Pedidos num banco relacional, pelas transações ACID; a busca num motor como Elasticsearch ou OpenSearch, pela relevância e pelos filtros; as sessões num chave-valor em memória, como o Redis, pela latência.

**P:** "Meu serviço grava o produto no PostgreSQL e logo depois no Elasticsearch, então os dois sempre batem." Certo?

**R:** Não. Se a segunda escrita falhar, ou o processo cair entre as duas, os bancos divergem. O seguro é ter uma fonte da verdade e propagar as mudanças por CDC ou por outbox.
