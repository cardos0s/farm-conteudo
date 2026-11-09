---
apendice: B
titulo: Números e estimativas
---

Na entrevista, ninguém espera que você saiba de cor quanto tempo leva uma leitura em SSD. O que se espera é que você saiba a ordem de grandeza: se algo leva nanossegundos, microssegundos ou milissegundos, e se o sistema precisa de um servidor ou de mil. Este apêndice reúne os números que mais aparecem em entrevista e mostra como fazer as contas de cabeça.

## Latências de referência

Os valores abaixo são **ordens de grandeza**, não medidas exatas. Eles variam com o hardware, a geração do processador, o tipo de SSD e a rota da rede: um SSD NVMe moderno, por exemplo, faz a leitura aleatória em dezenas de microssegundos. O que vale guardar é a distância entre as linhas. A última coluna estica o tempo para a escala humana: se um acesso à cache L1 levasse 1 segundo, quanto levaria cada operação?

| Operação | Tempo típico | Se 1 ns fosse 1 s |
|---|---|---|
| Acesso à cache L1 da CPU | ~1 ns | 1 segundo |
| Acesso à memória RAM | ~100 ns | ~2 minutos |
| Enviar 1 KB numa rede de 1 Gbit/s | ~10 µs | ~3 horas |
| Leitura aleatória de 4 KB em SSD | ~100 µs | ~1 dia |
| Ida e volta na rede do mesmo datacenter | ~0,5 ms | ~6 dias |
| Leitura sequencial de 1 MB em SSD | ~1 ms | ~12 dias |
| Ida e volta entre zonas de disponibilidade da mesma região | ~1 ms | ~12 dias |
| Busca (seek) em disco rígido | ~10 ms | ~4 meses |
| Ida e volta entre continentes (São Paulo ↔ EUA ou Europa) | ~150 ms (100 a 200 ms) | ~5 anos |

O que tirar da tabela:

- **A RAM é ~1.000 vezes mais rápida que o SSD** no acesso aleatório (100 ns contra 100 µs). Por isso o cache em memória (cap. 41) rende tanto.
- **Uma ida e volta no datacenter vale ~5.000 acessos à RAM** (0,5 ms ÷ 100 ns). Dez chamadas encadeadas a outros serviços somam ~5 ms antes de qualquer processamento.
- **Ler em sequência é muito mais barato que ler aos saltos**, sobretudo em disco rígido. É a ideia por trás do WAL (cap. 27) e das LSM-Trees (cap. 26).
- **A distância domina.** Uma ida e volta entre continentes vale ~300 dentro do datacenter (150 ÷ 0,5). Uma conexão HTTPS nova gasta uma ida e volta no TCP e outra no TLS 1.3 antes de a requisição sair (cap. 17, cap. 50): com o servidor do outro lado do oceano, são ~300 ms só de preparação. CDN (cap. 15), conexões reaproveitadas e QUIC (cap. 18) atacam exatamente isso.
- **Um GET no Redis do mesmo datacenter leva menos de 1 ms**, e quase todo esse tempo é rede.

## Potências de 2 e de 10

| Potência de 2 | Valor exato | Aproximação | Unidade |
|---|---|---|---|
| 2^10 | 1.024 | mil (10^3) | KB (kilobyte) |
| 2^20 | 1.048.576 | um milhão (10^6) | MB (megabyte) |
| 2^30 | 1.073.741.824 | um bilhão (10^9) | GB (gigabyte) |
| 2^40 | ~1,1 trilhão | um trilhão (10^12) | TB (terabyte) |
| 2^50 | ~1,13 quatrilhão | um quatrilhão (10^15) | PB (petabyte) |

A aproximação erra 2,4% no KB e ~10% no TB. Numa estimativa, ignore a diferença (a rigor, 2^10 bytes é um KiB, e 10^3 bytes é um KB).

Dois limites que aparecem em entrevista:

- **2^31 − 1 ≈ 2,1 bilhões** é o maior inteiro de 32 bits com sinal. Uma tabela com id `INT` estoura aí; por isso tabelas grandes usam ids de 64 bits.
- **2^32 ≈ 4,3 bilhões** é o total de endereços IPv4.

Tamanhos úteis: um inteiro de 64 bits ou um timestamp ocupa 8 bytes; um UUID, 16 bytes (36 caracteres em texto); um caractere ASCII, 1 byte, e uma letra acentuada em UTF-8, 2 bytes; uma foto comprimida, de centenas de KB a alguns MB.

## Atalhos para conta de cabeça

| Atalho | De onde vem |
|---|---|
| 1 dia ≈ 10^5 s | 86.400 s, arredondado para cima |
| 1 mês ≈ 2,6 × 10^6 s | 30 × 86.400 = 2.592.000 s |
| 1 ano ≈ 3 × 10^7 s | 365 × 86.400 = 31.536.000 s |
| 1 milhão por dia ≈ 12 por segundo | 10^6 ÷ 86.400 ≈ 11,6 |
| 1 bilhão por dia ≈ 12 mil por segundo | 10^9 ÷ 86.400 ≈ 11.574 |
| 100 milhões por mês ≈ 40 por segundo | 10^8 ÷ 2.592.000 ≈ 38,6 |
| 1 Gbit/s ≈ 125 MB/s | 10^9 bits ÷ 8 bits por byte |
| Pico ≈ 2 a 3 vezes a média | suposição comum; Black Friday e jogo da Copa passam disso |

Dividir por 10^5 em vez de 86.400 subestima o resultado em ~14%. Para estimar, tudo bem: o fator de pico cobre a diferença com folga. As três fórmulas que resolvem quase tudo:

- **QPS** = ações por dia ÷ 10^5.
- **Armazenamento** = itens por dia × tamanho × dias × número de cópias.
- **Banda** = QPS × tamanho de cada requisição ou resposta.

## Disponibilidade: a tabela dos noves

| Disponibilidade | Fora do ar por ano | Fora do ar por mês (30 dias) |
|---|---|---|
| 99% (dois noves) | ~3,65 dias | ~7,2 horas |
| 99,5% | ~1,8 dia | ~3,6 horas |
| 99,9% (três noves) | ~8,8 horas | ~43 minutos |
| 99,95% | ~4,4 horas | ~22 minutos |
| 99,99% (quatro noves) | ~53 minutos | ~4,3 minutos |
| 99,999% (cinco noves) | ~5,3 minutos | ~26 segundos |

A conta é (1 − disponibilidade) × período. Com 99,9%: 0,001 × 525.600 minutos do ano ≈ 526 minutos, ou 8,76 horas. Esse tempo é o orçamento de erro de um SLO (cap. 48).

Quando há mais de um componente:

- **Em série, multiplique as disponibilidades.** Se a requisição depende de dois componentes com 99,9% cada, o conjunto fica com 0,999 × 0,999 ≈ 99,8%. Cada dependência a mais derruba o total.
- **Em paralelo, multiplique as chances de falha.** Com duas réplicas independentes de 99,9% (cap. 24), o serviço só cai se as duas caírem: 1 − 0,001 × 0,001 = 99,9999%. Na prática as falhas andam juntas (mesmo deploy, mesma região, mesmo bug), então trate esse número como teto otimista.

## Exemplo resolvido: um app de fotos

Um app hipotético em que as pessoas postam fotos e rolam um feed. Premissas, combinadas com o entrevistador:

- 10 milhões de usuários ativos por dia.
- Cada usuário posta uma foto a cada cinco dias (0,2 por dia) e vê 50 fotos por dia.
- Cada foto comprimida tem 500 KB; os metadados (autor, legenda, data) têm ~1 KB.
- O pico é 3 vezes a média.

**Passo 1: QPS.**

```text
Escritas: 10^7 × 0,2 = 2 × 10^6 fotos por dia
          2 × 10^6 ÷ 10^5 s = 20/s          pico: 60/s
Leituras: 10^7 × 50 = 5 × 10^8 fotos vistas por dia
          5 × 10^8 ÷ 10^5 s = 5.000/s       pico: 15.000/s
```

São 250 leituras para cada escrita: um sistema dominado por leitura.

**Passo 2: armazenamento em 5 anos.**

```text
Fotos:     2 × 10^6 × 500 KB = 1 TB por dia
           1 TB × 365 × 5 ≈ 1,8 PB
Metadados: 2 × 10^6 × 1 KB = 2 GB por dia
           2 GB × 365 × 5 ≈ 3,7 TB
```

Guardando três cópias de cada foto, são ~5,5 PB.

**Passo 3: banda.**

```text
Entrada: 1 TB ÷ 10^5 s = 10 MB/s = 80 Mbit/s
         pico: 240 Mbit/s
Saída:   5 × 10^8 × 500 KB = 250 TB por dia
         250 TB ÷ 10^5 s = 2,5 GB/s = 20 Gbit/s
         pico: 60 Gbit/s
```

**O que os números dizem:**

- 60 escritas por segundo no pico é pouco. O desafio está na leitura.
- 15 mil leituras por segundo pedem cache (cap. 41) e réplicas de leitura (cap. 24).
- Foto não vai para o banco: vai para um armazenamento de objetos, e o banco guarda só o endereço (cap. 29). Os 3,7 TB de metadados crescem sem parar, então vale planejar o sharding (cap. 23).
- De 20 a 60 Gbit/s de saída tornam a CDN obrigatória (cap. 15). Servir no feed versões menores das fotos derrubaria esse número.

Uma boa estimativa termina numa decisão de arquitetura. Se a conta não mudou nenhuma escolha, ela podia ter ficado de fora.
