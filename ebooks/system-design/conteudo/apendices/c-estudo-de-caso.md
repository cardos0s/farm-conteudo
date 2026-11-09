---
apendice: C
titulo: "Estudo de caso: um encurtador de links"
---

Projetar um encurtador de links, no estilo do bit.ly, é um dos pedidos mais comuns em entrevista: cabe em 45 minutos e passa por boa parte deste livro. Aqui ele segue as oito etapas do apêndice A. Os números são hipotéticos, escolhidos para deixar as contas redondas.

## 1. Requisitos

Funcionais:

1. Criar um link curto a partir de uma URL longa, com apelido personalizado opcional.
2. Redirecionar quem abre o link curto para a URL original.
3. Mostrar ao dono quantos cliques o link teve, por dia e por país.

Ficam de fora: editar o destino, painel completo e QR code.

Não funcionais:

- **Leitura domina:** cada link é criado uma vez e clicado, em média, 100 vezes.
- **Redirecionamento rápido:** 99% das respostas em menos de 50 ms no servidor (p99).
- **Alta disponibilidade:** link que não abre quebra campanha, post e cartaz impresso. Meta de 99,99% (cap. 48).
- **Durabilidade:** link criado não some.
- **Consistência:** o link novo funciona em segundos; as estatísticas podem atrasar minutos (consistência eventual, cap. 7).
- **Códigos difíceis de adivinhar:** ninguém deve listar os links dos outros incrementando o código.

## 2. Estimativas

Premissas: 100 milhões de links novos por mês, 100 cliques por link e pico de 3 vezes a média.

```text
Escritas: 10^8 por mês ÷ 2,6 × 10^6 s ≈ 40/s   pico: ~120/s
Leituras: 100 × 40/s = 4.000/s               pico: ~12.000/s
Registro: código + URL + metadados + índice ≈ 500 bytes
Por mês:  10^8 × 500 B = 50 GB
5 anos:   50 GB × 60 = 3 TB (6 bilhões de links)
Cache:    20% dos links do mês = 2 × 10^7 × 500 B = 10 GB
Banda:    4.000 respostas/s × ~500 B = 2 MB/s
Cliques:  10^10 por mês × 200 B = 2 TB de eventos por mês
```

O que os números dizem: 120 escritas por segundo é pouco para qualquer banco; 12 mil leituras por segundo pedem cache; 3 TB que nunca param de crescer pedem um banco que escale na horizontal; a banda é irrelevante; e o maior volume está nos eventos de clique, não nos links.

## 3. API

A criação exige um token OAuth (cap. 49):

```http
POST /links HTTP/1.1
Authorization: Bearer <token>
Idempotency-Key: 7c0e2a9b-1f4d-4a8e-9b1a-3d2f6e8c5a10
Content-Type: application/json

{"url": "https://loja.example.com/ofertas?origem=insta"}
```

A resposta é `201 Created`, com o código (`aZ3kP9x`) e o link curto (`https://lnk.example/aZ3kP9x`). O redirecionamento é público:

```http
GET /aZ3kP9x HTTP/1.1
Host: lnk.example

HTTP/1.1 302 Found
Location: https://loja.example.com/ofertas?origem=insta
```

Um terceiro endpoint, `GET /links/{codigo}/cliques`, devolve as contagens agregadas.

**Por que 302 e não 301?** O 301 (Moved Permanently) diz que o endereço mudou para sempre, e o navegador guarda essa resposta: nos cliques seguintes, nem passa pelo seu servidor. A carga cai, mas você deixa de contar esses cliques e perde o poder de desativar um link que virou golpe. O 302 (Found) é temporário, então todo clique passa pelo serviço. Como as estatísticas são requisito, fica o 302. (O 307 também serviria; preservar o método HTTP, que é a diferença dele, não pesa num GET.)

## 4. Modelo de dados

| Campo | Tipo | Observação |
|---|---|---|
| `codigo` | texto curto | chave primária e chave de partição |
| `url_longa` | texto | até ~2 KB |
| `dono_id` | inteiro de 64 bits | quem criou |
| `criado_em` | timestamp | |
| `status` | texto | `ativo` ou `bloqueado` |

O acesso é praticamente um só: dado o código, devolver a URL. Sem join nem consulta por intervalo, o caminho é um banco chave-valor distribuído, do tipo DynamoDB ou Cassandra. As estatísticas ficam num banco colunar, feito para agregações: cada dado no banco que o atende melhor (cap. 29).

## 5. Visão de alto nível

![O caminho de um clique: o DNS leva à borda da CDN, o load balancer escolhe uma instância do serviço, e o serviço procura o código no cache e, se faltar, no banco shardeado. O 302 volta ao usuário, e o evento do clique segue para a fila (tracejado) sem atrasar a resposta.](../../diagramas/c-encurtador.svg)

**O clique.** O DNS (cap. 16) resolve `lnk.example` para a borda mais próxima da CDN (cap. 15), que termina o TLS perto do usuário, encurtando o handshake (cap. 50), e segura picos e ataques. Ela não guarda o 302, para que todo clique seja contado. O load balancer (cap. 11) distribui as requisições entre instâncias stateless do serviço (cap. 8), que procura o código no cache, vai ao banco se não achar, responde 302 e publica o evento do clique numa fila, sem esperar por ela.

**A criação.** O pedido passa pelo rate limiting e pela checagem de idempotência, ganha um código e é gravado no banco e no cache.

O mesmo serviço faz as duas coisas. Como ele não guarda estado, separá-lo em dois mais tarde é fácil, se as cargas divergirem (cap. 9).

## 6. Aprofundamento

### Geração do código

Em base62 (0–9, a–z, A–Z), cada caractere tem 62 valores: seis caracteres dão 62^6 ≈ 56,8 bilhões de códigos, e sete, 62^7 ≈ 3,5 trilhões. Seis durariam ~47 anos no ritmo de 1,2 bilhão de links por ano, mas os 6 bilhões de links de 5 anos ocupariam 10% do espaço: um chute ao acaso acertaria um link a cada dez tentativas. Com sete, a ocupação fica em 0,17%. Ficamos com sete.

Há três jeitos de gerar o código.

**Hash da URL.** Calcula-se um hash (MD5, SHA-256) da URL e ficam os 7 primeiros caracteres em base62. Dispensa coordenação, mas o hash truncado colide, e muito. Pelo paradoxo do aniversário:

```text
colisões ≈ n² ÷ (2 × N)
         = (6 × 10^9)² ÷ (2 × 3,5 × 10^12)
         ≈ 5 milhões em 5 anos
```

Cada colisão exige checar se o código existe e tentar de novo com um sal. E quem encurtasse a mesma URL ganharia o mesmo link, com as estatísticas misturadas.

**Sorteio.** Sorteiam-se 7 caracteres e grava-se com escrita condicional ("só se o código não existir"). É simples e imprevisível, mas tem as mesmas colisões, e cada uma custa uma nova tentativa.

**Contador.** Um número que só cresce, convertido para base62. Nunca colide, mas o contador central vira gargalo e ponto único de falha, e códigos sequenciais são fáceis de enumerar.

**A escolha: contador em faixas.** Cada instância pede ao coordenador uma faixa de mil números e vai gastando localmente; se o coordenador cair, as instâncias seguem com o que têm. Ele precisa ser CP (cap. 2), porque entregar a mesma faixa duas vezes repetiria códigos. Por isso mora num armazenamento consistente, como o etcd, que usa Raft (cap. 38). Antes da conversão, cada número passa por uma permutação fixa e reversível, e códigos vizinhos deixam de parecer vizinhos. Uma instância que morre perde o resto da faixa, o que não faz falta num espaço de 3,5 trilhões.

```python
ALFABETO = ("0123456789"
            "abcdefghijklmnopqrstuvwxyz"
            "ABCDEFGHIJKLMNOPQRSTUVWXYZ")

def base62(n: int) -> str:
    codigo = ""
    while n > 0:
        n, resto = divmod(n, 62)
        codigo = ALFABETO[resto] + codigo
    return codigo or "0"

base62(1_000_000_000)  # '15FTGg'
```

Apelidos usam o mesmo espaço, com escrita condicional; se o apelido já existir, a API responde `409 Conflict`. A gravação dos códigos do contador também é condicional: se um apelido já ocupou aquele texto, o serviço pula para o próximo número.

### Leituras rápidas: cache e sharding

Com até 12 mil leituras por segundo e um conjunto quente de ~10 GB, o cache resolve quase tudo (cap. 41). A estratégia é cache-aside (cap. 42): o serviço procura no Redis; se não acha, lê do banco e guarda com TTL. Na criação, o link já entra no cache, porque quem cria costuma compartilhar na hora. Um link nunca muda, então não há invalidação, exceto no bloqueio, quando o serviço apaga a chave. Para remover, LRU (cap. 43) basta: os links quentes são lidos o tempo todo. Com 90% de acerto, o banco recebe ~1.200 leituras por segundo no pico.

Dois cuidados:

- **Link viral.** Dezenas de milhares de cliques por segundo no mesmo código caem num só nó do Redis. Um cache local em cada instância, com TTL de poucos segundos, absorve o pico.
- **Código inexistente.** Quem varre códigos ao acaso nunca acerta o cache. Guarde também o "não existe", por pouco tempo.

O banco guarda 3 TB em 5 anos e não para de crescer. Ele é particionado pelo hash do código (cap. 23), com hashing consistente (cap. 25): quando entra um nó novo, só ~1/N das chaves muda de lugar, e a carga, inclusive a das escritas novas, se espalha por igual.

## 7. Gargalos, falhas e trade-offs

### Abuso: rate limiting

Encurtador atrai spam e golpe. Na criação, um token bucket por chave de API (ou por IP, para quem não se autentica) limita, digamos, 100 links por hora na conta gratuita; acima disso, a resposta é `429 Too Many Requests` (cap. 32). No redirecionamento, o alvo são as varreduras: um IP que acumula códigos inexistentes também recebe 429. Um verificador assíncrono confere as URLs novas contra listas de sites maliciosos e bloqueia o que for golpe.

### Idempotência na criação

O app envia o POST, a resposta se perde num timeout e o app tenta de novo (cap. 35): sem cuidado, nascem dois links. Por isso o cliente manda um `Idempotency-Key` por operação (cap. 36). O serviço grava a chave com a resposta, por escrita condicional e com validade de 24 horas; se a chave voltar, devolve a resposta guardada. Deduplicar pela URL não serviria: duas pessoas podem querer links diferentes para o mesmo destino.

### Cliques sem atrasar o redirecionamento

Incrementar um contador no banco a cada clique poria uma escrita no caminho crítico e faria do link viral uma hot key de escrita. Em vez disso, o serviço publica o evento (código, horário, país, origem) num tópico de pub/sub (cap. 45), sem esperar. Cada grupo de consumidores lê no seu ritmo: o agregador soma cliques por link, dia e país no banco colunar; o detector de abuso procura padrões estranhos; o arquivador guarda o evento bruto em armazenamento barato. Se o agregador atrasar, os eventos esperam na fila (cap. 44). A entrega é "pelo menos uma vez", então o agregador descarta repetidos pelo id do evento, e eventos malformados vão para uma dead letter queue (cap. 46). Com o broker fora do ar por muito tempo, perder alguns cliques é aceitável; atrasar o redirecionamento, não.

### Replicação e disponibilidade

Cada shard tem três réplicas, uma por zona de disponibilidade (cap. 24), e a escrita espera duas confirmações (W = 2). Como um link nunca muda, qualquer réplica que tenha o registro tem o valor certo. Então a leitura vai a uma réplica (R = 1) e, se ela não achar, confirma com duas (R = 2) antes do 404. Como R + W > N (2 + 2 > 3), uma das duas tem o link recém-criado.

Numa partição de rede (cap. 2), o redirecionamento prefere disponibilidade e responde com o que tem; o coordenador de faixas prefere consistência e recusa, enquanto as instâncias criam links com as faixas que já têm.

E se o cache cair? As 12 mil leituras por segundo iriam a um banco dimensionado para ~1.200. O cache local amortece o impacto, e um circuit breaker (cap. 33) diante do banco recusa o excesso na hora, em vez de deixar tudo lento.

## 8. Encerramento: como operar

SLIs (cap. 48): latência p99 do redirecionamento, taxa de 5xx, taxa de acerto do cache e eventos parados na fila de analytics. SLO: 99,99% dos redirecionamentos com sucesso em 30 dias. Com 10 bilhões de cliques por mês, o orçamento de erro é de 1 milhão de falhas, o equivalente a ~4 minutos fora do ar (apêndice B). Para achar onde o tempo se perde, tracing distribuído (cap. 47) com amostragem: 1% dos cliques já dá dezenas de traces por segundo, e a criação, rara, pode ser rastreada inteira.

## Decisões e alternativas

| Decisão | Alternativa descartada | Por quê |
|---|---|---|
| Redirecionar com 302 | 301 | O navegador guarda o 301 e não volta ao serviço: somem a contagem e o poder de bloquear golpe. |
| Contador em faixas, permutação e base62 | Hash da URL truncado | O hash truncado colide (~5 milhões de vezes em 5 anos) e junta usuários diferentes no mesmo link. |
| Código de 7 caracteres | 6 caracteres | Com 6, um chute acertaria um link em cada dez; com 7, um em ~600. |
| Banco chave-valor particionado com hashing consistente | Relacional num nó só | O acesso é só por chave e o volume cresce para sempre; um nó único vira teto e ponto único de falha. |
| Cache-aside com cache local | Ler sempre do banco | Tira ~90% da carga do banco; o cache local segura o link viral. |
| Cliques via pub/sub, agregados depois | Contador no banco a cada clique | A escrita síncrona aumenta a latência e cria uma hot key de escrita. |
| `Idempotency-Key` no POST | Deduplicar pela URL | A chave identifica a tentativa; a mesma URL pode virar vários links. |
| Ler de 1 réplica e confirmar com 2 antes do 404 | Quórum em toda leitura | O link é imutável: só o raro "não achei" paga o quórum. |
