---
titulo: Para fechar
---

## As lições principais

O autor do artigo original encerra com cinco ideias. Elas resumem o livro inteiro:

- **System design é, acima de tudo, entender trade-offs:** consistência vs. disponibilidade, latência vs. throughput, simplicidade vs. flexibilidade.
- **Escalar não é só "colocar mais servidores".** Você precisa pensar em balanceamento de carga, sharding, replicação e gargalos.
- **Padrões de confiabilidade** como rate limiting, circuit breakers, retries e bulkheads existem porque falhas são normais em sistemas distribuídos.
- **Cache, filas e pub/sub são seus melhores amigos** para desempenho e desacoplamento, mas trazem novos desafios de consistência e ordenação.
- **Observabilidade e segurança**, com conceitos como tracing, SLIs, OAuth, TLS e Zero Trust, são essenciais para sistemas que não sejam só rápidos, mas também seguros e fáceis de depurar.

## A viagem de um clique

Os 51 conceitos parecem uma lista, mas eles se encaixam. Siga um único clique em "Finalizar compra" numa loja online:

1. O navegador descobre o IP da loja pelo **DNS** (cap. 16) e baixa imagens e scripts de uma **CDN** (cap. 15), já numa conexão **HTTP/2 ou HTTP/3** (cap. 18) protegida por **TLS** (cap. 50).
2. A requisição chega a um **load balancer** (cap. 11), que escolhe um servidor com algum **algoritmo** (cap. 12), e passa por um **API gateway** (cap. 14) que confere o login (**OAuth/OIDC**, cap. 49) e aplica **rate limiting** (cap. 32).
3. Os serviços de pedido, estoque e pagamento são **stateless** (cap. 8), então escalam **horizontalmente** (cap. 1). Cada um tem seu banco (**persistência poliglota**, cap. 29).
4. O pedido percorre uma **SAGA** (cap. 39): reservar estoque, cobrar, agendar entrega. A cobrança usa uma **chave de idempotência** (cap. 36) porque o cliente pode tentar de novo com **backoff** (cap. 35), e um **circuit breaker** (cap. 33) protege o serviço de pagamento quando o provedor externo fica lento.
5. Os dados do pedido ficam num banco com **WAL** (cap. 27), **replicado** (cap. 24) e **shardeado** (cap. 23). O catálogo vem do **cache** (cap. 41) com **cache-aside** (cap. 42).
6. O evento "pedido criado" sai por **pub/sub** (cap. 45) para e-mail, nota fiscal e analytics. A mensagem que falhar três vezes vai para uma **dead letter queue** (cap. 46).
7. Um **trace distribuído** (cap. 47) registra o caminho inteiro, e o tempo total entra no **SLI** que o time compara com o **SLO** (cap. 48).

Um clique, mais de vinte capítulos. Quando você conseguir contar essa história sem olhar, desenhando cada etapa, a entrevista vira uma conversa sobre coisas que você já sabe.

## E agora?

- **Refaça o estudo de caso** (apêndice C) sem consultar, e depois compare.
- **Pratique com os problemas clássicos**: encurtador de links, feed de rede social, chat em tempo real, rate limiter distribuído, sistema de notificações, upload e streaming de vídeo. Para cada um, liste os capítulos deste livro que entram no desenho.
- **Para ir além**: *Designing Data-Intensive Applications*, de Martin Kleppmann, é a referência para a Parte 3 e boa parte da Parte 4; *System Design Interview*, de Alex Xu, traz dezenas de problemas resolvidos; e o livro *Site Reliability Engineering*, do Google, que é gratuito online, aprofunda SLOs, monitoramento e confiabilidade.
