---
apendice: A
titulo: Roteiro para a entrevista de system design
---

Uma entrevista de system design não tem gabarito. O entrevistador quer ver como você pensa: se pergunta antes de desenhar, se usa números para decidir e se sabe dizer quanto custa cada escolha. Este roteiro divide os 45 minutos em oito etapas. Se o entrevistador puxar a conversa para outro lado, vá junto; ter a ordem na cabeça serve para você não se afogar num detalhe nem chegar ao fim sem o sistema desenhado. O apêndice C aplica o roteiro a um encurtador de links.

## As oito etapas

| Etapa | Tempo | O que sai dela | Capítulos |
|---|---|---|---|
| 1. Entender e delimitar o problema | 0–6 min | requisitos funcionais e não funcionais | 2, 3, 5, 7, 48 |
| 2. Estimar a ordem de grandeza | 6–10 min | QPS médio e de pico, armazenamento, banda | 5, 23, 41 |
| 3. Definir a API | 10–13 min | endpoints, com entrada e saída | 19, 20, 21, 36, 49 |
| 4. Esboçar o modelo de dados | 13–16 min | entidades, chaves e tipo de banco | 4, 26, 28, 29 |
| 5. Desenhar a visão de alto nível | 16–25 min | diagrama e um fluxo de ponta a ponta | 8, 9, 11, 14, 15, 16, 41, 44, 45 |
| 6. Aprofundar em 1 ou 2 componentes | 25–37 min | o componente por dentro, com alternativas | 23–27, 30, 38–40, 42, 43, 46 |
| 7. Caçar gargalos e falhas | 37–42 min | pontos fracos e como mitigá-los | 1, 6, 24, 32–35, 37, 50, 51 |
| 8. Encerrar | 42–45 min | resumo, operação e próximos passos | 47, 48 |

Se a sessão gastar alguns minutos com apresentações, encurte as etapas 2 a 4, nunca o aprofundamento.

## 1. Entender e delimitar o problema

O enunciado vem vago de propósito: "projete o Instagram". Antes de desenhar qualquer caixa, transforme isso numa lista curta.

- **Requisitos funcionais:** o que o usuário consegue fazer. Fique com três a cinco e diga em voz alta o que fica de fora.
- **Requisitos não funcionais:** escala, latência, disponibilidade, consistência e durabilidade.

Perguntas que quase sempre valem a pena:

- Quantos usuários ativos por dia? Quantas leituras para cada escrita?
- Que latência o usuário aceita no fluxo principal (cap. 5)?
- Se um dado aparecer com alguns segundos de atraso, alguém sai prejudicado? A resposta decide entre consistência forte e eventual (cap. 7) e o seu lado no CAP (cap. 2) e no PACELC (cap. 3).
- Que disponibilidade se espera? Ela vira o SLO do encerramento (cap. 48).
- Os usuários estão num país só ou no mundo todo?

**Frase útil:** *"Antes de desenhar, quero fechar o escopo: postar e ver o feed. Busca e notificações ficam de fora. Faz sentido?"*

## 2. Estimar a ordem de grandeza

As contas servem para decidir, não para impressionar. Calcule o QPS médio e o de pico (o throughput do capítulo 5), o armazenamento e a banda, arredondando sem dó: um dia tem ~10^5 segundos. O apêndice B traz as tabelas de referência e um exemplo resolvido.

Pare quando o número decidir alguma coisa. Cem escritas por segundo cabem num banco só; cem mil pedem sharding (cap. 23). Milhares de leituras por segundo do mesmo conteúdo pedem cache (cap. 41). Se o entrevistador preferir pular as contas, faça-as mais tarde, quando forem decidir algo.

**Frase útil:** *"Vou arredondar para facilitar: 10 milhões de usuários com 10 leituras por dia dão 10^8 leituras, ou cerca de mil por segundo."*

## 3. Definir a API

Escreva os endpoints que cobrem os requisitos funcionais: verbo, caminho, o que entra e o que sai. Poucas linhas bastam.

```text
POST /v1/posts           cria um post (com Idempotency-Key)
GET  /v1/posts/{id}      lê um post
GET  /v1/feed?cursor=X   lê o feed, 20 posts por página
```

O que mostra maturidade nesta etapa:

- REST para clientes externos e gRPC entre serviços internos (cap. 19). Atualização em tempo real pede WebSocket ou SSE (cap. 20), ou long polling quando a infraestrutura não aceita essas conexões (cap. 21).
- Idempotência em tudo o que cria recurso ou movimenta dinheiro (cap. 36): o retry do cliente não pode duplicar nada.
- Autenticação definida: quem chama e com que token (cap. 49).

## 4. Esboçar o modelo de dados

Liste as entidades, os campos que importam e, principalmente, os padrões de acesso: como cada tela lê os dados. É o padrão de acesso que escolhe o banco.

- Transações e consultas variadas pedem um banco relacional, com garantias ACID (cap. 4).
- Acesso por chave em volume gigante pede chave-valor ou wide-column (DynamoDB, Cassandra), em geral com garantias BASE.
- Muito mais leitura que escrita? Considere desnormalizar (cap. 28).
- Cada tipo de dado pode ficar no banco que o atende melhor (cap. 29). Diga também que índices você criaria (cap. 26).

**Frase útil:** *"Quase toda leitura é pelo id do usuário, então ele vai ser a chave de partição."*

## 5. Desenhar a visão de alto nível

Desenhe o caminho de uma requisição de ponta a ponta, com poucas caixas: cliente, DNS (cap. 16), CDN para o conteúdo estático (cap. 15), load balancer (cap. 11) ou API gateway (cap. 14), serviços stateless (cap. 8), cache (cap. 41), banco e, para o que pode esperar, uma fila (cap. 44) ou um tópico de pub/sub (cap. 45).

Comece pelo desenho mais simples que atende aos requisitos e só acrescente uma caixa quando um número da etapa 2 pedir; um monólito bem dividido é resposta legítima (cap. 9). Depois, percorra em voz alta um fluxo de escrita e um de leitura. É assim que aparecem os buracos.

**Frase útil:** *"Vou seguir uma leitura do celular até o banco e de volta; depois, uma escrita. Quer que eu aprofunde alguma parte?"*

## 6. Aprofundar em um ou dois componentes

É aqui que está a maior parte da avaliação, principalmente em vagas sênior. Pergunte se o entrevistador tem preferência; se não tiver, escolha o gargalo que as estimativas apontaram. Os aprofundamentos mais comuns:

- Particionar os dados: sharding (cap. 23) e hashing consistente (cap. 25).
- Replicar (cap. 24) e eleger um líder (cap. 38).
- Cache: escrita e invalidação (cap. 42) e o que remover quando enche (cap. 43).
- Por dentro do banco: B-Tree e LSM-Tree (cap. 26), WAL (cap. 27) e Bloom filter (cap. 30).
- Operações que atravessam serviços: saga (cap. 39) ou 2PC (cap. 40).
- Mensageria: garantias de entrega e dead letter queue (cap. 46).

Em cada ponto, apresente duas opções, compare e escolha com base num requisito.

**Frase útil:** *"Posso particionar por data ou por hash do id. Por data, toda escrita nova cai no mesmo shard; por hash, a carga se espalha. Como a leitura aqui é sempre por id, fico com hash."*

## 7. Caçar gargalos e falhas

Olhe para o seu desenho como quem quer derrubá-lo:

- **E se o tráfego multiplicar por 10?** Descubra o que satura primeiro. Escalar horizontalmente (cap. 1) só acelera a parte do trabalho que dá para paralelizar (cap. 6).
- **E se cada caixa cair?** Procure pontos únicos de falha. Réplicas (cap. 24), heartbeat (cap. 37) e failover cuidam deles.
- **E se uma dependência ficar lenta?** Timeouts, retries com backoff exponencial (cap. 35), circuit breaker (cap. 33) e bulkhead (cap. 34) impedem que a lentidão se espalhe.
- **E se alguém abusar?** Rate limiting (cap. 32), TLS (cap. 50) e zero trust entre serviços (cap. 51).

Diga o trade-off com todas as letras: o que você ganhou, o que pagou e em que cenário mudaria de ideia.

**Frase útil:** *"O ponto fraco é o perfil de uma celebridade, lido milhões de vezes. Se virar problema, replico essas chaves em mais nós do cache, ao custo de memória."*

## 8. Encerrar

Guarde três minutos. Recapitule os requisitos atendidos, as duas ou três decisões principais e o que cada uma custou. Diga como operaria o sistema: que SLIs e SLOs acompanharia (cap. 48) e como acharia uma requisição lenta com tracing distribuído (cap. 47). Feche com o que faria se tivesse mais tempo.

**Frase útil:** *"Recapitulando: o feed prioriza disponibilidade, o cache segura as leituras e a fila absorve o que pode esperar. Com mais tempo, eu detalharia o feed de quem segue celebridades."*

## Erros comuns

- **Desenhar antes de perguntar.** Você resolve com capricho um problema que ninguém pediu.
- **Afogar-se nas contas.** Quinze minutos de aritmética roubam o aprofundamento.
- **Citar tecnologia sem motivo.** "Coloca um Kafka aqui" não é argumento; "preciso de uma fila porque o processamento leva 30 segundos" é.
- **Projetar para a escala do Google** sem nenhum número que justifique.
- **Desenhar só o caminho feliz.** Se você não falar de falhas, o entrevistador vai perguntar.
- **Pensar em silêncio.** O que se avalia é o raciocínio. Narre.
- **Brigar com a dica.** "E se esse banco cair?" quase sempre aponta um buraco. Reconheça e ajuste.
- **Não fechar.** Sem resumo, o desenho parece inacabado.

Para treinar, resolva um problema em voz alta com um cronômetro de 45 minutos, de preferência para outra pessoa, e depois releia os capítulos em que travou.
