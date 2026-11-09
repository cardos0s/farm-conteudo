---
numero: 4
titulo: ACID vs. BASE
original: ACID vs BASE
resumo: ACID garante transações tudo-ou-nada, isoladas e duráveis, ideais para dinheiro e estoque; BASE aceita inconsistências temporárias em troca de disponibilidade e escala, com as réplicas convergindo depois.
relacionados: [2, 7, 27, 39, 40]
---

## O essencial

ACID trata de transações rígidas e confiáveis: **A**tomicidade, **C**onsistência, **I**solamento e **D**urabilidade. Combina com sistemas financeiros, controle de estoque e qualquer coisa em que erros custem muito caro.

BASE significa Basically Available (basicamente disponível), Soft state (estado flexível) e Eventual consistency (consistência eventual), e é usado em grandes sistemas distribuídos que precisam ficar no ar e responder rápido. Sistemas BASE podem mostrar inconsistências temporárias, mas se corrigem com o tempo.

Na prática, muitas arquiteturas combinam os dois: ACID para os fluxos centrais de dinheiro e BASE para coisas como feeds e analytics.

## Aprofundando

### ACID, letra por letra

Pense numa transferência de R$ 200 da Ana para o Bruno:

```sql
BEGIN;
UPDATE contas SET saldo = saldo - 200 WHERE id = 'ana';
UPDATE contas SET saldo = saldo + 200 WHERE id = 'bruno';
COMMIT;
```

- **Atomicidade:** os dois `UPDATE` acontecem juntos ou nenhum acontece. Se o servidor cair entre um e outro, o banco desfaz o primeiro (rollback).
- **Consistência:** a transação leva o banco de um estado válido a outro. Se existe a regra `CHECK (saldo >= 0)` e a Ana só tem R$ 150, a transação inteira é recusada.
- **Isolamento:** transações simultâneas não enxergam o trabalho pela metade umas das outras. Ninguém vê o dinheiro já fora da conta da Ana e ainda não na do Bruno. O rigor depende do nível de isolamento, de read committed a serializable.
- **Durabilidade:** depois que o `COMMIT` é confirmado, a transferência sobrevive a uma queda de energia, porque o banco gravou a mudança num log em disco antes de responder (cap. 27).

### BASE, letra por letra

A sigla surgiu no fim dos anos 1990, no grupo de Eric Brewer (o mesmo do CAP, cap. 2), como contraponto ao ACID:

- **Basically Available:** o sistema responde mesmo com partes falhando, ainda que com dados parciais ou atrasados.
- **Soft state:** o estado pode mudar sem nenhuma escrita nova, enquanto as réplicas trocam atualizações entre si.
- **Eventual consistency:** se as escritas param, todas as réplicas acabam com o mesmo valor (cap. 7).

Exemplo: um post recebe curtidas em São Paulo e em Lisboa ao mesmo tempo. Cada região soma localmente e responde na hora; por alguns segundos, uma mostra 1.204 curtidas e a outra, 1.206. Depois as réplicas trocam os incrementos e as duas chegam ao mesmo número.

### Os dois no mesmo sistema

Num e-commerce, criar o pedido e registrar o pagamento ficam numa transação ACID, num banco relacional. Atualizar o índice de busca, as recomendações e o painel de vendas pode ser BASE: eventos publicados depois do commit são processados com alguns segundos de atraso, e ninguém perde dinheiro com isso.

## Analogia

Comprar um apartamento é ACID: a escritura passa no cartório inteira ou não passa, ninguém registra meio imóvel e, depois de registrada, ela não some. Já a notícia de que a padaria vai fechar no feriado se espalha pelo bairro como BASE: de boca em boca, uns ficam sabendo antes dos outros, ninguém precisou parar a rua para anunciar e, no fim do dia, todo mundo sabe.

## No mundo real

- **PostgreSQL, MySQL (InnoDB), Oracle e SQL Server** oferecem transações ACID completas; é onde mora o dinheiro da maioria das empresas.
- **Cassandra** segue a linha BASE: escritas rápidas, réplicas que convergem depois. Para operações do tipo "grave só se ainda não existir", oferece lightweight transactions, baseadas em Paxos e bem mais lentas.
- **DynamoDB** é BASE no uso comum, mas tem transações ACID desde 2018 (`TransactWriteItems`); o **MongoDB** tem transações com vários documentos desde a versão 4.0.
- **Spanner** e **CockroachDB** entregam ACID distribuído entre regiões, pagando com latência de coordenação.

## Trade-offs

| | ACID | BASE |
|---|---|---|
| Prioridade | Correção de cada transação | Disponibilidade e escala |
| Leitura logo após a escrita | Vê o valor confirmado | Pode ver um valor antigo |
| Falha no meio da operação | Rollback: tudo ou nada | Reconciliação depois |
| Escala | Mais difícil de distribuir | Feita para muitos nós |
| Bom para | Pagamentos, estoque, reservas | Feeds, curtidas, analytics, logs |

## Na entrevista

- Divida o sistema por tipo de dado: *"Pedido e pagamento num banco relacional com transações; feed e contadores num armazenamento eventualmente consistente."*
- Justifique pelo custo do erro: vender o mesmo item duas vezes ou cobrar em dobro exige ACID; um contador de visualizações atrasado, não.
- Se o entrevistador pedir uma transação entre serviços, lembre que ACID não atravessa a rede de graça: fale de sagas (cap. 39) ou de two-phase commit (cap. 40).

## Cuidado com

- **Atualização:** a divisão "SQL é ACID, NoSQL é BASE" envelheceu. MongoDB e DynamoDB têm transações ACID, e bancos como Spanner e CockroachDB oferecem ACID distribuído. Hoje a pergunta é que garantia cada operação precisa.
- **O C do ACID depende de você.** O banco só protege as regras que você declarou (`CHECK`, `UNIQUE`, chaves estrangeiras). Ele não sabe que o estoque não pode ficar negativo se ninguém disse isso a ele.
- **Isolamento padrão não é serializável.** O PostgreSQL usa read committed por padrão e o MySQL (InnoDB), repeatable read. Ler um valor, calcular na aplicação e gravar o resultado pode perder atualizações concorrentes.

## Teste-se

**P:** O que garante o D, de durabilidade?

**R:** Que uma transação confirmada sobrevive a quedas e reinícios. Em geral, o banco grava a mudança num log em disco antes de responder ao `COMMIT`.

**P:** Num app de delivery, o que você deixaria em ACID e o que poderia ser BASE?

**R:** Criação do pedido e pagamento em ACID, porque erro ali custa dinheiro. Posição do entregador no mapa, contagem de avaliações e recomendações podem ser BASE, porque alguns segundos de atraso não prejudicam ninguém.

**P:** Escolher um banco NoSQL significa abrir mão de transações ACID?

**R:** Não necessariamente. MongoDB e DynamoDB oferecem transações ACID, com limites e custo extra. A escolha é por operação, não pelo rótulo do banco.
