---
numero: 19
titulo: gRPC vs. REST
original: gRPC vs REST
resumo: REST expõe recursos via HTTP, quase sempre com JSON legível, e domina as APIs públicas; gRPC chama métodos remotos com protobuf binário sobre HTTP/2, contrato forte e streaming, e brilha entre serviços internos.
relacionados: [9, 11, 14, 18, 20]
---

## O essencial

- O **REST** normalmente usa HTTP com JSON e se organiza em torno de recursos, como `/users` ou `/orders`. É simples, legível por humanos e muito usado em APIs públicas.
- O **gRPC** usa HTTP/2 e mensagens codificadas em binário (protobuf), que são menores e mais rápidas de transmitir. Ele também oferece streaming bidirecional e tipagem forte.

Em microsserviços, o gRPC costuma ser o preferido nas chamadas entre serviços, enquanto o REST é comum para clientes externos. Use REST quando legibilidade e compatibilidade importarem, e gRPC quando desempenho e contratos importarem.

## Aprofundando

### A mesma chamada nos dois estilos

Imagine um serviço de pedidos. Em REST, você expõe o recurso e usa os verbos do HTTP:

```http
GET /pedidos/1042 HTTP/1.1
Host: api.loja.example
Accept: application/json
```

```json
{
  "id": 1042,
  "status": "PAGO",
  "total_centavos": 15990
}
```

Em gRPC, você começa pelo contrato, num arquivo `.proto`:

```protobuf
syntax = "proto3";
package loja.v1;

service Pedidos {
  rpc BuscarPedido(BuscarPedidoRequest) returns (Pedido);
}

message BuscarPedidoRequest {
  int64 id = 1;
}

message Pedido {
  int64 id = 1;
  string status = 2;
  int64 total_centavos = 3;
}
```

A partir do contrato, o compilador `protoc` gera o cliente e o esqueleto do servidor em Go, Java, Python, C# e outras linguagens. O cliente chama `BuscarPedido` como se fosse uma função local; por baixo, isso vira um `POST` HTTP/2 para `/loja.v1.Pedidos/BuscarPedido`.

### Por que o protobuf é menor

A resposta acima, em JSON compacto (sem espaços), tem 50 bytes. Em protobuf, a mesma mensagem tem 12. O protobuf não envia o nome dos campos: envia o número deles (o `= 1`, `= 2`, `= 3` do contrato) junto com o tipo, num único byte para os campos de 1 a 15. Os inteiros vão em varint, que usa só os bytes necessários: 1042 cabe em 2. O preço é que, sem o `.proto`, os bytes são ilegíveis.

### Quatro jeitos de chamar

| Tipo de chamada | Quem envia várias mensagens | Exemplo |
|---|---|---|
| Unária | ninguém: um pedido, uma resposta | buscar um pedido |
| Streaming do servidor | o servidor | acompanhar o status de uma entrega |
| Streaming do cliente | o cliente | enviar leituras de um sensor em lote |
| Bidirecional | os dois, ao mesmo tempo | chat, transcrição de áudio ao vivo |

Duas coisas completam o pacote. Deadlines: o cliente diz quanto aceita esperar, o prazo viaja com a chamada e, se estourar, ela termina com `DEADLINE_EXCEEDED` em vez de ficar pendurada. E regras de evolução: campo novo ganha número novo, clientes antigos ignoram o que não conhecem, e um número já usado nunca é reaproveitado.

## Analogia

REST é o cardápio do restaurante: qualquer cliente lê, entende e faz o pedido em linguagem comum. gRPC é o sistema de comandas entre o salão e a cozinha: "mesa 12, item 304, sem cebola", com campos fixos e códigos combinados. É rápido e não deixa margem para erro, mas só funciona entre quem usa o mesmo sistema. Por isso o cliente fala com o garçom em REST, e o garçom fala com a cozinha em gRPC.

## No mundo real

- **Stripe e GitHub** expõem APIs públicas REST com JSON: qualquer linguagem consome, e um `curl` basta para testar.
- **Kubernetes:** o API server fala REST (com JSON ou protobuf), mas o kubelet conversa com o runtime de containers (containerd, CRI-O) pela CRI, uma API gRPC.
- **etcd:** a API da versão 3 é gRPC, e um gateway embutido a traduz para JSON sobre HTTP para quem não fala gRPC.
- **Google Cloud:** muitas APIs aceitam REST com JSON e também gRPC, e várias bibliotecas oficiais usam gRPC por baixo.

## Trade-offs

| | REST | gRPC |
|---|---|---|
| Modelo | recursos e verbos (`GET /pedidos/1042`) | métodos remotos (`BuscarPedido`) |
| Formato | texto, quase sempre JSON | binário (protobuf) |
| Contrato | opcional (OpenAPI) | obrigatório (`.proto`), com código gerado |
| Streaming | não nativo (usa SSE ou WebSocket) | quatro modos, inclusive bidirecional |
| Navegador | nativo (`fetch`) | só com gRPC-Web e um proxy |
| Cache HTTP | `GET` cacheável por CDN e proxies | não aproveita (toda chamada é `POST`) |
| Depuração | `curl` e o navegador bastam | ferramentas próprias (`grpcurl`) |

## Na entrevista

- A frase que resume: *"REST na borda, gRPC no miolo: REST para parceiros e navegadores, gRPC entre os nossos serviços."*
- Justifique com requisitos, não com moda: alcance, legibilidade e cache HTTP de um lado; contrato, código gerado, streaming e menos CPU do outro.
- Trate o `.proto` como fonte da verdade: mudança de API vira revisão de contrato e segue as regras de evolução.
- Fale de deadlines: numa cadeia de cinco serviços, propagar o prazo evita que o último trabalhe numa resposta que ninguém mais espera.

## Cuidado com

- **Atualização:** "binário é menor e mais rápido" depende do caso. Com gzip ou Brotli, a diferença de tamanho encolhe em respostas grandes; o ganho do gRPC costuma vir mais da CPU de serialização, do contrato e da conexão reaproveitada. Meça antes de migrar.
- **Balanceamento:** um load balancer de camada 4 distribui conexões, não chamadas. Como o gRPC reaproveita uma conexão HTTP/2 longa, todo o tráfego de um cliente cai num servidor só. Use balanceamento L7 ou no cliente (cap. 11).
- **Navegador não fala gRPC puro:** precisa de gRPC-Web com um proxy (como o Envoy).
- **REST não é "JSON sobre HTTP".** É modelar recursos e usar os verbos e códigos de status do HTTP. `POST /criarPedido` é RPC com JSON.

## Teste-se

**P:** Por que uma mensagem protobuf costuma ser bem menor que o JSON equivalente?

**R:** Porque não carrega o nome dos campos, só um número e o tipo (geralmente 1 byte), codifica inteiros em varint e dispensa aspas, chaves e espaços.

**P:** Você vai expor uma API para parceiros e ligar 30 microsserviços internos. O que usa em cada ponta?

**R:** REST com JSON para os parceiros: qualquer linguagem consome, há OpenAPI, `curl` e cache HTTP. gRPC entre os serviços internos: contrato forte, código gerado, streaming e menos custo por chamada.

**P:** Por que, atrás de um load balancer de camada 4, todo o tráfego gRPC de um cliente pode cair num único servidor?

**R:** Porque o gRPC abre uma conexão HTTP/2 longa e multiplexa todas as chamadas nela, e o balanceador L4 só escolhe o destino quando a conexão é aberta. A saída é balancear por chamada (L7) ou no próprio cliente.
