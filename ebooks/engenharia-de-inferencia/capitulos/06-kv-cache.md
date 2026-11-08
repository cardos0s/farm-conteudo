# Capítulo 6 — KV Cache e Gerenciamento de Memória {#cap-06}

Se você só puder estudar um assunto a fundo antes de uma entrevista de inferência, estude este. O levantamento das vagas foi direto: **o KV cache é o recurso escasso**. Os entrevistadores voltam a ele o tempo todo: qual o tamanho, como paginar, como compartilhar, o que fazer quando acaba.

A razão é que o KV cache define quantos usuários cabem numa GPU ao mesmo tempo. E quantos usuários cabem define o throughput, que define o custo. Quase toda técnica moderna de serving é, no fundo, uma forma de guardar mais KV cache na mesma memória, de reaproveitá-lo ou de movê-lo para outro lugar.

O conceito básico (o que é, por que existe, a fórmula do tamanho) está no [Capítulo 2](#cap-02). Este capítulo trata do **gerenciamento**.

## 6.1 Para onde vai a memória da GPU

Uma GPU servindo um LLM divide a memória assim:

```text
 H100 80 GB servindo Llama 3 8B em BF16 (aproximado)

 ┌──────────────────────────────────────────────────────────┐
 │ Pesos do modelo                              16 GB       │
 ├──────────────────────────────────────────────────────────┤
 │ Ativações temporárias do forward              2–4 GB     │
 │ (pico no prefill de prompts longos)                      │
 ├──────────────────────────────────────────────────────────┤
 │ Contexto CUDA, bibliotecas, CUDA graphs       1–3 GB     │
 ├──────────────────────────────────────────────────────────┤
 │                                                          │
 │ KV CACHE: todo o resto                       ~55–60 GB   │
 │                                                          │
 └──────────────────────────────────────────────────────────┘
```

Motores como o vLLM fazem exatamente isso na subida: carregam os pesos, rodam um forward de teste com o maior batch possível para medir o pico de ativações, e reservam a memória restante (até um limite configurável, como `gpu_memory_utilization=0.9`) como um grande depósito de blocos de KV cache.

::: conta
**Fazendo a conta: quantos usuários cabem?**

*Llama 3 8B, 1 H100, BF16:*

- Memória para o KV: ~58 GB.
- Por token: 128 KiB (131.072 bytes).
- Tokens que cabem: 58 × 10⁹ / 131.072 ≈ **442 mil tokens**.
- Com conversas de 4.000 tokens em média: ~**110 sequências** simultâneas.
- Com conversas de 32.000 tokens: ~**13**.

*Llama 3 70B, 8 H100 com tensor parallelism, BF16:*

- Memória total: 640 GB. Pesos: 140 GB. Reserva para o resto: ~40 GB.
- Memória para o KV: ~460 GB.
- Por token: 320 KiB (327.680 bytes).
- Tokens: 460 × 10⁹ / 327.680 ≈ **1,4 milhão**.
- Com 4.000 tokens por conversa: ~**350 sequências**.
:::

Compare com o [Capítulo 1](#cap-01): o decode precisa de batches de centenas para usar bem a GPU. Com contexto longo, a memória acaba antes disso. Esse é o conflito central do serving de LLMs.

## 6.2 A tabela que você deve saber montar

| Modelo | Camadas | KV heads | head_dim | KV por token (BF16) | KV por token (FP8) |
|---|---|---|---|---|---|
| Llama 3 8B | 32 | 8 | 128 | 128 KiB | 64 KiB |
| Llama 3 70B | 80 | 8 | 128 | 320 KiB | 160 KiB |
| 70B hipotético com MHA | 80 | 64 | 128 | 2,5 MiB | 1,25 MiB |

Fórmula, mais uma vez:

$$\text{KV por token} = 2 \times n_{camadas} \times n_{kv\_heads} \times d_{head} \times \text{bytes}$$

E o total para um batch:

$$\text{KV total} = \text{KV por token} \times \sum_{i=1}^{B} \text{tokens}_i$$

::: dica
**Dica de entrevista:** sempre que um design envolver um LLM, faça essa conta logo no início. "Com o 70B, são 320 KB por token; 100 usuários com 8 mil tokens dão 260 GB só de KV cache." Isso muda o design inteiro (quantas GPUs, que paralelismo, se precisa de offload), e o entrevistador nota que você pensa na restrição certa.
:::

## 6.3 O problema da alocação ingênua

A primeira geração de servidores alocava, para cada requisição, um tensor **contíguo** com o tamanho máximo possível (`max_seq_len`), porque não dá para saber de antemão quantos tokens a resposta terá.

```text
 Alocação contígua, max_seq_len = 2048

 Req A (usou 300):  [███░░░░░░░░░░░░░░░░░░░░░░░░░░░░░] 15% útil
 Req B (usou 1500): [████████████████████████░░░░░░░░░] 73% útil
 Req C (usou 50):   [█░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]  2% útil
                    █ = tokens reais  ░ = reservado e vazio

 + fragmentação externa: buracos entre as alocações que
   não servem para nenhuma requisição nova
```

O paper do vLLM (Kwon et al., 2023) mediu que sistemas anteriores aproveitavam, para guardar estados reais de tokens, só algo entre 20% e 40% da memória reservada para o KV cache. O resto era desperdício: reserva para tokens que nunca vieram e fragmentação.

## 6.4 PagedAttention

A solução veio dos sistemas operacionais. Um processo enxerga sua memória como contínua, mas o sistema operacional a guarda em **páginas** de tamanho fixo espalhadas pela memória física, com uma **tabela de páginas** fazendo a tradução.

O **PagedAttention** faz o mesmo com o KV cache:

- A memória do KV é dividida em **blocos físicos** de tamanho fixo (por exemplo, 16 tokens cada, para todas as camadas).
- Cada requisição tem uma **tabela de blocos**: a lista de blocos físicos que guardam seus tokens, na ordem lógica.
- Blocos são alocados **sob demanda**: quando os 16 tokens do último bloco enchem, aloca-se mais um.
- O kernel de atenção recebe a tabela de blocos e lê os K e V de onde eles estiverem.

```text
 Blocos lógicos (por requisição)        Blocos físicos (GPU)
                                        ┌────┬────┬────┬────┐
 Req A: tokens 0–15  → bloco lógico 0 ─▶│ 7  │    │    │    │
        tokens 16–31 → bloco lógico 1 ─┐├────┼────┼────┼────┤
        tokens 32–40 → bloco lógico 2 ┐││    │ A1 │    │ B0 │
                                      │└┼───▶│    │    │    │
 Req B: tokens 0–15  → bloco lógico 0 ┼─┼────┼────┼────┼─▲──┤
        tokens 16–20 → bloco lógico 1 ┼┐│ A2 │    │ B1 │ │  │
                                      └┼┼▶   │    │ ▲  │    │
 tabela de blocos:                     │└────┴────┴─┼──┴────┘
   A: [7, 5, 8]                        └────────────┘
   B: [3, 10]      (desperdício: só o último bloco de cada um,
                    no máximo 15 tokens por requisição)
```

Os ganhos:

1. **Desperdício quase zero.** Só o último bloco de cada requisição fica parcialmente vazio. Com blocos de 16 tokens, a perda média é de uns 8 tokens por sequência.
2. **Sem fragmentação externa.** Todo bloco livre serve para qualquer requisição.
3. **Compartilhamento.** Duas requisições podem apontar para os **mesmos blocos físicos** (contagem de referências). Isso permite:
   - **Parallel sampling** (gerar $n$ respostas para o mesmo prompt): o prompt é guardado uma vez.
   - **Beam search**: os feixes compartilham o prefixo comum.
   - **Prefix caching** entre requisições diferentes (seção 6.5).
4. **Copy-on-write.** Se duas sequências compartilham um bloco e uma delas precisa escrever nele (o último bloco, parcialmente cheio), o bloco é copiado antes. Só o bloco, não o cache inteiro.

O custo: o kernel de atenção precisa fazer uma leitura indireta (consultar a tabela, depois buscar o bloco). Os blocos são grandes o bastante (16 tokens × 8 heads × 128 dimensões × 2 bytes = 32 KB para K, por camada) para que a leitura de cada bloco continue eficiente. Na prática, o ganho de batch maior compensa muito.

### O tamanho do bloco

| Bloco menor (ex.: 8) | Bloco maior (ex.: 32 ou 64) |
|---|---|
| menos desperdício no último bloco | leituras maiores e mais eficientes no kernel |
| tabela de blocos maior | menos entradas na tabela |
| compartilhamento de prefixo mais fino | prefix caching só em múltiplos maiores |

O padrão de 16 tokens é um meio-termo comum. Alguns kernels e hardwares preferem blocos maiores.

## 6.5 Prefix caching

Muitas requisições começam igual:

- O mesmo **system prompt** de 2.000 tokens em todas as chamadas de um produto.
- Num **chat**, cada turno reenvia a conversa inteira: o turno 10 contém os turnos 1 a 9.
- **Agentes** reenviam o mesmo contexto com uma instrução nova a cada passo.
- **Few-shot**: os mesmos exemplos antes de cada pergunta.

Sem cache, o prefill recalcula tudo isso toda vez. Com **prefix caching**, os blocos de KV de prefixos já calculados ficam guardados, e uma requisição nova reaproveita os blocos cujo prefixo bate.

### Como funciona (estilo vLLM)

Cada bloco **cheio** recebe uma chave (hash) calculada a partir do conteúdo do bloco **e da chave do bloco anterior**. Assim, a chave de um bloco identifica o prefixo inteiro até ele, não só seus 16 tokens.

```text
 Req 1: [sys prompt...........][pergunta 1]
         bloco0 bloco1 ... bloco124  bloco125...

 hash(b0)   = H(tokens 0–15)
 hash(b1)   = H(hash(b0), tokens 16–31)
 hash(b124) = H(hash(b123), tokens 1984–1999)

 Req 2: [sys prompt...........][pergunta 2]
         mesmos hashes até b124 → REUSA 125 blocos
         prefill só da pergunta 2
```

Quando uma requisição termina, seus blocos não são apagados na hora: vão para uma lista de **blocos livres, mas ainda com conteúdo válido**. Se outra requisição precisar desse prefixo, ele é "ressuscitado". Se a memória apertar, os blocos menos usados recentemente (LRU) são reutilizados para outra coisa.

O **RadixAttention**, do SGLang, organiza os prefixos numa **árvore radix** (uma árvore de prefixos comprimida), o que facilita encontrar o maior prefixo em comum e decidir o que despejar.

::: conta
**Fazendo a conta: o ganho num chat.** Conversa no turno 10, com 6.000 tokens de histórico e 100 tokens novos, no 70B em 8 H100.

- Sem cache: prefill de 6.100 tokens. Pela conta do [Capítulo 2](#cap-02), algo como 0,2 s.
- Com cache (histórico ainda na memória): prefill de 100 tokens. Poucos milissegundos.
- O TTFT cai de centenas para dezenas de milissegundos, e o custo de cálculo do prefill cai ~98%.
:::

## 6.6 Quando a memória acaba: preempção

Mesmo com paginação, a memória acaba: as sequências crescem a cada passo de decode. Se não houver blocos livres para o próximo token de alguém, o scheduler precisa **liberar memória**. As opções:

```text
 Sem blocos livres no passo t
   │
   ├─ 1. Não admitir requisições novas (fila de espera)
   │
   ├─ 2. PREEMPTAR uma sequência em andamento
   │     (normalmente a que chegou por último):
   │
   │     a) RECOMPUTAR: joga fora o KV dela; quando
   │        voltar, refaz o prefill de prompt + tokens
   │        já gerados. Custo: cálculo.
   │
   │     b) SWAP: copia os blocos dela para a memória da
   │        CPU (PCIe); quando voltar, copia de volta.
   │        Custo: banda PCIe e memória da CPU.
   │
   └─ 3. Despejar blocos de prefix cache não usados (LRU)
         (sempre a primeira coisa a fazer)
```

Recomputar costuma ser mais simples e, para sequências curtas, mais rápido que fazer swap. Para sequências longas, o swap (ou o offload em camadas, a seguir) pode compensar. Preempção frequente é um sinal de que o batch está grande demais para a memória: o sistema fica refazendo trabalho, e a latência das vítimas explode.

## 6.7 Hierarquia de armazenamento do KV cache

A HBM é pequena e cara. Sistemas modernos tratam o KV cache como dados numa **hierarquia**, como os caches de um processador:

| Camada | Capacidade típica | Banda até a GPU | Uso |
|---|---|---|---|
| HBM da GPU | dezenas de GB | ~3,35 TB/s | sequências ativas |
| DRAM da CPU (mesmo nó) | centenas de GB a TB | ~64 GB/s por GPU (PCIe Gen5) | conversas pausadas, prefixos populares |
| SSD NVMe local | TBs | alguns GB/s | prefixos frios |
| Armazenamento remoto (outros nós) | muito grande | rede (RDMA) | compartilhar prefixos entre réplicas |

Sistemas como o **Mooncake** (Kimi, da Moonshot AI) e o **LMCache** constroem esse tipo de camada distribuída de KV cache.

A pergunta-chave é sempre: **é mais rápido trazer o KV de volta ou recalcular?**

::: conta
**Fazendo a conta:** retomar uma conversa de 8.000 tokens no 70B (2,6 GB de KV).

- Trazer da DRAM da CPU: com 8 GPUs, cada uma traz sua fatia (~330 MB) a ~50 GB/s efetivos: **~7 ms**. Mesmo com uma GPU só, 2,6 GB a 50 GB/s seriam ~50 ms.
- Recalcular (prefill de 8.000 tokens em 8 H100): **~0,3 s** e ocupa a GPU inteira.
- Conclusão: para contextos longos, guardar na CPU é muito melhor. Para contextos curtos (centenas de tokens), recalcular é tão rápido que a complexidade do offload pode não valer.
:::

## 6.8 Diminuindo o próprio KV cache

Além de gerenciar melhor, dá para **guardar menos**:

**1. Quantizar o cache.**

- **FP8** (E4M3) para K e V: metade da memória e da leitura, com fatores de escala por tensor ou por head. Costuma ter perda de qualidade pequena e é suportado pelos principais motores.
- **INT4 e menos**: métodos como o KIVI quantizam K por canal e V por token, porque os outliers de K se concentram em certos canais. Mais economia, mais risco de qualidade.

**2. Arquitetura do modelo** (decidido no treino):

- **GQA, MQA, MLA**: menos heads de KV ou KV comprimido ([Capítulo 2](#cap-02)).
- **Sliding window**: algumas ou todas as camadas só olham para os últimos $W$ tokens. O cache dessas camadas fica limitado a $W$ tokens (um buffer circular).
- **Camadas híbridas**: modelos que alternam camadas de atenção local (janela) com camadas de atenção global, e às vezes camadas sem KV cache nenhum (como camadas de modelos de espaço de estados), reduzindo muito o cache total.
- **Compartilhamento entre camadas**: camadas vizinhas usando o mesmo KV.

**3. Despejar tokens (eviction)** em tempo de inferência:

- **StreamingLLM**: mantém os primeiros tokens (os "attention sinks", que recebem muita atenção por razões estruturais) mais uma janela recente.
- **H2O, SnapKV** e similares: mantêm os tokens que receberam mais atenção e descartam o resto.

Essas técnicas de despejo **mudam a saída do modelo** e podem fazer ele "esquecer" algo importante do começo do contexto. Use com avaliação cuidadosa.

## Perguntas de entrevista comentadas

## Q041 — Projete e implemente um cache de chave-valor para inferência autorregressiva num decoder Transformer: shapes dos tensores no prefill e no decode, API de cache por camada, batching e beam search, precisão mista. {#q041}

::: pergunta-meta
**[Relatado]** Applied Intuition · Machine Learning Engineer · triagem técnica · 2025 · Difícil · [fonte](https://prachub.com/interview-questions/implement-kv-cache-for-inference)
:::

### Resposta em 30 segundos

"Pré-aloco, por camada, K e V com shape [batch, kv_heads, max_len, head_dim] no dtype do modelo, mais um vetor de comprimentos por sequência. A API é `update(camada, k_novo, v_novo)`, que escreve os tokens novos na posição de cada sequência e devolve as views válidas para a atenção. No prefill entram T tokens por sequência; no decode, 1. Para batch com tamanhos diferentes, guardo comprimentos por sequência e passo uma máscara para a atenção. Para beam search, reordeno o eixo do batch com `index_select` quando os feixes mudam de pai. Para precisão mista, o cache pode ter dtype próprio, por exemplo FP8 com escala, convertido na leitura. Em produção, trocaria tudo por blocos paginados."

### Resposta completa

**1. Shapes.** Para um batch de $B$ sequências, $H_{kv}$ heads de KV, $D$ = head_dim:

```text
                 entrada x        K, V novos            cache (por camada)
 prefill         [B, T, d]        [B, H_kv, T, D]       [B, H_kv, T_max, D]
 decode          [B, 1, d]        [B, H_kv, 1, D]       (escreve na posição
                                                         comprimento[b])
 atenção usa     Q: [B, H_q, T_q, D]   K, V: [B, H_kv, T_k, D]
```

**2. A implementação.**

```python
import torch

class KVCache:
    """Cache pré-alocado, um par (K, V) por camada."""

    def __init__(self, n_camadas, batch, n_kv_heads, head_dim,
                 max_len, dtype=torch.bfloat16, device="cuda"):
        shape = (batch, n_kv_heads, max_len, head_dim)
        self.k = [torch.zeros(shape, dtype=dtype, device=device)
                  for _ in range(n_camadas)]
        self.v = [torch.zeros(shape, dtype=dtype, device=device)
                  for _ in range(n_camadas)]
        # tokens válidos por sequência (iguais se sem padding)
        self.comp = torch.zeros(batch, dtype=torch.long,
                                device=device)
        self.max_len = max_len

    def update(self, camada, k_novo, v_novo):
        """k_novo, v_novo: [B, H_kv, T_novo, D], já com RoPE
        em K. Escreve após o fim de cada sequência e devolve
        K e V até o maior comprimento do batch."""
        B, _, t, _ = k_novo.shape
        ini = self.comp                       # [B]
        if int(ini.max()) + t > self.max_len:
            raise ValueError("contexto maior que max_len")
        # posições de destino de cada token novo: [B, t]
        pos = ini[:, None] + torch.arange(t, device=ini.device)
        b_idx = torch.arange(B, device=ini.device)[:, None]
        # indexação avançada: escreve [B, t, H, D] de uma vez
        kc, vc = self.k[camada], self.v[camada]
        kc.permute(0, 2, 1, 3)[b_idx, pos] = (
            k_novo.permute(0, 2, 1, 3).to(kc.dtype))
        vc.permute(0, 2, 1, 3)[b_idx, pos] = (
            v_novo.permute(0, 2, 1, 3).to(vc.dtype))
        fim = int((ini + t).max())
        return kc[:, :, :fim], vc[:, :, :fim]

    def avancar(self, t):
        """Chamar UMA vez por passo, depois de todas as
        camadas: os comprimentos valem para todas elas."""
        self.comp += t

    def reordenar(self, indices):
        """Beam search: indices[b] = feixe pai do novo b."""
        for c in range(len(self.k)):
            self.k[c] = self.k[c].index_select(0, indices)
            self.v[c] = self.v[c].index_select(0, indices)
        self.comp = self.comp.index_select(0, indices)
```

O uso dentro de uma camada de atenção:

```python
def atencao_camada(x, camada, cache, pesos, pos_ids, mask):
    # x: [B, T, d]; pos_ids: [B, T] posições ABSOLUTAS
    q, k, v = projeta_qkv(x, pesos)        # [B, H, T, D]
    q, k = aplica_rope(q, pos_ids), aplica_rope(k, pos_ids)
    k_tudo, v_tudo = cache.update(camada, k, v)
    k_tudo = expande_gqa(k_tudo, q.shape[1])   # só na conta
    v_tudo = expande_gqa(v_tudo, q.shape[1])
    # mask: [B, 1, T, T_k] combina causal + padding
    out = torch.nn.functional.scaled_dot_product_attention(
        q, k_tudo.to(q.dtype), v_tudo.to(q.dtype),
        attn_mask=mask)
    return projeta_saida(out, pesos)
```

Depois do forward de todas as camadas, o loop chama `cache.avancar(T)`.

**3. Batching com tamanhos diferentes.** Com o vetor `comp`, cada sequência escreve na sua própria posição. A atenção recebe K e V até o maior comprimento do batch, e a **máscara** precisa esconder, para cada sequência, as posições além do seu comprimento e as posições futuras. As posições do RoPE vêm de `comp[b] + i`, por sequência.

**4. Beam search.** A cada passo, cada feixe novo descende de um feixe antigo. `reordenar` aplica essa permutação ao eixo do batch. Isso copia o cache inteiro a cada passo, o que é caro. A alternativa eficiente é o cache paginado com contagem de referências: os feixes compartilham os blocos do prefixo comum e só copiam o último bloco quando divergem (copy-on-write).

**5. Precisão mista.**

- O cache pode ter `dtype` diferente do cálculo: BF16 para o cálculo, FP8 para o cache.
- Com FP8, guarde também **fatores de escala** (por tensor, por head ou por bloco). Quantize na escrita: $k_{fp8} = \text{round}(k / s)$; dequantize na leitura: $k = k_{fp8} \times s$. Kernels de atenção que leem FP8 direto fazem isso dentro do kernel, sem materializar a versão BF16.
- A atenção em si (scores e softmax) deve acumular em FP32.

**6. O que mudaria para produção.**

- Blocos paginados em vez de `max_len` contíguo (seção [6.4](#cap-06)).
- Layout "ragged": sem padding, todas as sequências concatenadas num eixo só, com offsets.
- Kernel de atenção que lê o cache direto pela tabela de blocos e entende GQA (sem `expande_gqa`).
- Prefix caching e preempção.

### Perguntas de acompanhamento prováveis

- **Por que não usar `torch.cat` a cada passo?** Realoca e copia o cache inteiro em cada passo: custo quadrático no tamanho da sequência e fragmentação no alocador. Pré-alocar escreve só os tokens novos.
- **Qual o custo de memória da pré-alocação com `max_len`?** Reserva o pior caso para todo mundo. Com `max_len` de 8 mil e respostas de 500 tokens em média, a maior parte fica vazia. É o desperdício que o PagedAttention resolve.
- **Como testar essa classe?** Gerar com greedy usando o cache e comparar com a geração sem cache; testar com batch de tamanhos diferentes e verificar que a saída de cada sequência não depende das outras; testar `reordenar` com uma permutação conhecida.
- **E com tensor parallelism?** Cada GPU guarda só as heads de KV da sua fatia ($H_{kv}/\text{TP}$). Com TP maior que o número de heads de KV (por exemplo, TP=16 com 8 heads), as heads são replicadas.

### Armadilhas comuns

- Esquecer o vetor de comprimentos por sequência e quebrar batches com padding.
- Avançar o comprimento dentro de `update` (uma vez por camada, multiplicando o deslocamento pelo número de camadas).
- Aplicar RoPE no cache em vez de nos tokens novos.
- Expandir o GQA dentro do cache, anulando a economia de memória.
- Ignorar a reordenação no beam search.

## Q042 — Sua inferência de LLM está ficando sem memória de GPU em conversas longas. O que você faz? {#q042}

::: pergunta-meta
**[Fornecedor]** Meta, conforme post de um profissional sobre sua entrevista · MLE · 2025-2026 · Médio · [fonte](https://ae.linkedin.com/in/chieunq)
:::

### Resposta em 30 segundos

"Primeiro descubro o que está ocupando a memória: pesos, KV cache, ativações de pico ou fragmentação. Em conversas longas, quase sempre é o KV cache ou o pico de ativações no prefill. Ações imediatas: limitar o contexto máximo e o número de tokens por batch, garantir que o motor tenha preempção em vez de OOM, e calcular logits só do último token. Depois: KV cache paginado, quantização do KV para FP8, chunked prefill para limitar o pico de ativações, prefix caching para não duplicar o histórico, offload do KV para a CPU em conversas pausadas e, se preciso, mais GPUs com tensor parallelism. No produto: resumir ou truncar o histórico."

### Resposta completa

**1. Diagnóstico: onde está a memória?**

```text
 OOM em conversa longa
   │
   ├─ Acontece no PREFILL de um prompt longo?
   │    → pico de ATIVAÇÕES. Suspeitos:
   │      - logits de TODOS os tokens do prompt
   │        (T × vocabulário × 4 bytes)
   │      - atenção sem FlashAttention (T × T)
   │      - MLP intermediário (T × 14.336 × 2 bytes)
   │
   ├─ Acontece no DECODE, crescendo com o tempo?
   │    → KV CACHE sem limite: batch × contexto grande
   │      demais, sem preempção
   │
   └─ Acontece com memória "livre" sobrando?
        → FRAGMENTAÇÃO do alocador (muitas alocações
          de tamanhos variados); ver
          torch.cuda.memory_summary()
```

Ferramentas: `torch.cuda.memory_summary()`, `torch.cuda.max_memory_allocated()`, o snapshot de memória do PyTorch (`torch.cuda.memory._record_memory_history()` + visualizador), e as métricas do motor (uso do KV cache em %, número de preempções).

::: conta
**Fazendo a conta: o assassino silencioso, os logits.** Um prompt de 32.000 tokens no Llama 3 (vocabulário 128.256), com logits em FP32:

- 32.000 × 128.256 × 4 bytes ≈ **16,4 GB**. Só para os logits do prefill.
- Mas só o logit do **último** token importa para gerar o próximo.
- Calcular o LM head só na última posição elimina esse pico. Motores de inferência fazem isso; código de pesquisa adaptado às pressas muitas vezes não faz.
:::

**2. Ações imediatas (horas).**

- **Limites**: contexto máximo por requisição, tokens máximos por batch, número máximo de sequências simultâneas.
- **Preempção em vez de OOM**: o scheduler deve recusar ou pausar requisições quando o KV cache enche, em vez de deixar o processo morrer e levar todos os usuários junto.
- **Logits só do último token**, ativações liberadas camada a camada, `torch.inference_mode()`.

**3. Ações de engenharia (dias a semanas).**

| Técnica | Ataca | Ganho típico |
|---|---|---|
| KV cache paginado | desperdício e fragmentação | de 2 a 4× mais sequências que a alocação contígua |
| KV em FP8 | tamanho do cache | 2× mais tokens |
| Chunked prefill | pico de ativações no prefill | pico limitado pelo tamanho do chunk |
| Prefix caching | histórico duplicado entre turnos e usuários | depende da carga |
| Offload para CPU | conversas pausadas ocupando HBM | libera HBM para as ativas |
| Mais GPUs (TP) | capacidade total | proporcional |

**4. Ações de produto e modelo.**

- **Gerenciar o contexto**: resumir turnos antigos, truncar, ou usar busca (RAG) para trazer só os trechos relevantes do histórico.
- **Modelo com cache menor**: GQA/MLA, sliding window ou arquitetura híbrida, se trocar de modelo for uma opção.
- **Limitar `max_tokens`** de saída.

**5. Prevenção.** Teste de carga com a distribuição real de tamanhos de conversa (incluindo a cauda longa), alertas de uso do KV cache e de preempções, e um limite de admissão baseado em tokens, não em número de requisições.

### Perguntas de acompanhamento prováveis

- **Por que não simplesmente usar uma GPU com mais memória?** Ajuda, mas o problema volta com contextos maiores. E o desperdício (alocação contígua, logits completos) continua lá. Primeiro elimine o desperdício.
- **O que é melhor: recomputar ou fazer swap ao preemptar?** Recomputar para sequências curtas (prefill rápido); swap ou offload para sequências longas. Ver seção [6.6](#cap-06).
- **Como o chunked prefill reduz o pico de memória?** As ativações temporárias (MLP intermediário, scores parciais) são proporcionais ao número de tokens processados no passo. Com chunks de 2.048, o pico corresponde a 2.048 tokens, não a 32.000.
- **Truncar o histórico não piora a qualidade?** Pode piorar. Por isso resumir ou buscar os trechos relevantes costuma ser melhor que cortar. Meça com avaliações de conversas longas.

### Armadilhas comuns

- Responder só "uso uma GPU maior" ou "diminuo o batch".
- Não separar pico de ativações (prefill) de crescimento do KV cache (decode).
- Esquecer os logits do prompt inteiro.
- Não mencionar preempção e controle de admissão.

## Q043 — Um assistente de chat reenvia a conversa inteira a cada turno. Como evitar recalculá-la, e quais são as armadilhas? {#q043}

::: pergunta-meta
**[Fornecedor]** Moonshot AI (Kimi), segundo banco público de perguntas por empresa · Presencial · 2026 · Médio · [fonte](https://github.com/pallavi-shekhar/ai-engineering-interview-questions-company-wise)
:::

### Resposta em 30 segundos

"Com prefix caching: guardo os blocos de KV de conversas recentes, identificados por um hash encadeado dos tokens, e quando chega o turno seguinte reaproveito todos os blocos cujo prefixo bate, fazendo prefill só da parte nova. As armadilhas: o prefixo tem que bater token por token, e mudanças no template do chat, timestamps no system prompt ou tokenização diferente na fronteira quebram o reuso; o cache é local de cada réplica, então preciso de roteamento que leve a conversa para a réplica que tem o cache; a memória é limitada, então preciso de uma política de despejo e talvez de uma camada na CPU; a chave precisa incluir modelo, versão, adaptador LoRA e entradas multimodais; e, em ambiente multi-tenant, o cache compartilhado pode vazar informação por diferença de tempo de resposta, então isolo por tenant quando necessário."

### Resposta completa

**A solução.** Prefix caching (seção [6.5](#cap-06)): hash encadeado por bloco, blocos liberados ficam disponíveis com conteúdo válido, LRU para despejo. Num chat, o turno $n$ reaproveita o KV de todos os turnos anteriores, **inclusive a resposta do assistente** gerada no turno $n-1$, que já está no cache porque foi gerada ali.

```text
 Turno 1: [sys][user1]                → prefill tudo
          gera [asst1] (KV no cache)
 Turno 2: [sys][user1][asst1][user2]  → reusa sys+user1+asst1
                                        prefill só de user2
 Turno 3: [sys][user1][asst1][user2][asst2][user3]
                                      → reusa até asst2
```

**As armadilhas**, em detalhe:

**1. O prefixo precisa bater token por token.**

- **Template do chat**: se o template inclui algo que muda a cada chamada (data e hora no system prompt, um ID de requisição, a lista de ferramentas em ordem diferente), o hash muda logo no começo e **nada** é reaproveitado. Coloque as partes variáveis no fim.
- **Fronteira de tokenização**: a resposta do assistente, ao ser detokenizada e retokenizada no turno seguinte, pode virar uma sequência de tokens diferente da que foi gerada. O prefixo deixa de bater a partir dali. Soluções: guardar os IDs de token gerados, ou aceitar a perda só a partir desse ponto.
- **Edições**: se o usuário edita uma mensagem antiga, tudo a partir dela é inválido.

**2. Granularidade de bloco.** Só blocos **cheios** são cacheados. Os últimos tokens (menos que um bloco) sempre são recalculados. Com blocos de 16, a perda é pequena.

**3. Localidade entre réplicas.** O cache vive na memória de uma réplica. Se o turno 2 cai em outra réplica, não há reuso. Soluções:

```text
 Balanceador ingênuo (round-robin):
   turno 1 → réplica A (cria cache)
   turno 2 → réplica C (cache miss: recalcula tudo)

 Roteamento ciente de prefixo:
   hash(prefixo) → réplica preferida (hash consistente)
   turno 2 → réplica A (cache hit)
   + fallback para outra se A estiver sobrecarregada
```

O trade-off é balanceamento: mandar tudo de uma conversa para a mesma réplica pode desequilibrar a carga. Bons roteadores pesam a afinidade de cache contra a fila de cada réplica.

**4. Memória e despejo.** Conversas inativas ocupam blocos. LRU simples funciona, mas prefixos muito compartilhados (o system prompt de todos os usuários) devem ter prioridade para ficar. Para conversas pausadas por minutos, uma camada de cache na DRAM da CPU (seção [6.7](#cap-06)) evita recalcular quando o usuário volta.

**5. O que entra na chave.** O KV depende de tudo que afeta o forward: tokens, posições, **pesos** (modelo e versão, adaptador LoRA), entradas multimodais (o hash da imagem, não só os tokens de placeholder). Esquecer o adaptador LoRA na chave faz uma requisição usar o KV calculado com outro adaptador: um bug de corretude silencioso.

**6. Segurança e isolamento.** Se o cache é compartilhado entre clientes diferentes, um atacante pode medir o TTFT para descobrir se um prefixo específico está no cache (ou seja, se outra pessoa enviou aquele texto há pouco). Para dados sensíveis, isole o cache por tenant (um "salt" por tenant no hash) ou desligue o compartilhamento entre tenants.

**7. Medição.** Acompanhe a taxa de acerto do cache (tokens reaproveitados / tokens de entrada) por produto. Uma queda súbita normalmente indica uma mudança no template.

::: dica
**Dica de entrevista:** mencione que provedores de API expõem esse mecanismo como **prompt caching**, cobrando menos pelos tokens de entrada que vêm do cache. Isso mostra que você entende o impacto econômico, não só técnico.
:::

### Perguntas de acompanhamento prováveis

- **O cache muda a saída do modelo?** Não deveria. O KV de um prefixo é o mesmo, seja calculado agora ou antes, a menos de pequenas diferenças numéricas entre kernels de prefill e de decode ou entre tamanhos de batch.
- **Os parâmetros de sampling (temperatura) entram na chave?** Não. O KV não depende do sampling, só do forward.
- **E se o histórico passar do contexto máximo e eu truncar o começo?** Tudo muda: as posições de todos os tokens mudam, então o cache inteiro fica inválido. Por isso truncar "pela esquerda" a cada turno destrói o prefix caching. Prefira resumir em blocos maiores e com menos frequência.
- **Qual a diferença entre o vLLM e o RadixAttention do SGLang?** O vLLM usa hashes encadeados por bloco; o SGLang mantém uma árvore radix de prefixos. Os dois encontram o maior prefixo comum; a árvore facilita políticas de despejo e o agendamento ciente de prefixos (rodar juntas as requisições que compartilham prefixo).

### Armadilhas comuns

- Esquecer o roteamento entre réplicas.
- Não perceber que conteúdo variável no começo do prompt anula o cache.
- Esquecer o adaptador LoRA ou a versão do modelo na chave.
- Ignorar o vazamento de informação entre tenants.

## Q044 — Como funciona o PagedAttention do vLLM, e por que ele importa para a eficiência de memória da GPU? {#q044}

::: pergunta-meta
**[Fornecedor]** Lista de perguntas de entrevista sobre LLM de 2026 · Presencial · 2026 · Médio · [fonte](https://letsdatascience.com/blog/50-llm-and-ai-engineer-interview-questions-for-2026)
:::

### Resposta em 30 segundos

"O PagedAttention trata o KV cache como memória virtual paginada. A memória do cache é dividida em blocos de tamanho fixo, por exemplo 16 tokens, e cada requisição tem uma tabela de blocos que mapeia suas posições lógicas para blocos físicos espalhados pela GPU. Blocos são alocados sob demanda, então o desperdício fica limitado ao último bloco de cada requisição e não existe fragmentação externa. O kernel de atenção lê os blocos através da tabela. Com contagem de referências e copy-on-write, várias requisições compartilham blocos, o que permite parallel sampling, beam search e prefix caching sem duplicar memória. Como o batch no decode é limitado pela memória do KV, aproveitar quase toda a memória se traduz em batches maiores e muito mais throughput."

### Resposta completa

Estruture em **problema → mecanismo → kernel → compartilhamento → impacto → custos**.

**Problema.** Alocação contígua por `max_seq_len`: reserva o pior caso, fragmenta, e sistemas anteriores aproveitavam só uma fração pequena da memória do cache (seção [6.3](#cap-06)).

**Mecanismo.** Use o diagrama da seção [6.4](#cap-06) e a analogia com sistemas operacionais:

| Sistema operacional | PagedAttention |
|---|---|
| processo | requisição (sequência) |
| página virtual | bloco lógico (tokens 0–15, 16–31...) |
| quadro físico | bloco físico na HBM |
| tabela de páginas | tabela de blocos |
| alocação sob demanda (page fault) | aloca bloco quando o último enche |
| copy-on-write após fork | copy-on-write entre feixes e amostras |
| swap para disco | swap de blocos para a CPU |

**Kernel.** A atenção do decode, para cada sequência e cada head:

```text
 para cada bloco lógico i da sequência:
     físico = tabela_de_blocos[seq][i]
     K_bloco = cache_k[físico]     (16 tokens × D)
     V_bloco = cache_v[físico]
     scores = q · K_blocoᵀ          (com máscara no último
                                      bloco parcial)
     atualiza máximo, soma e acumulador (softmax online)
 saída = acumulador / soma
```

É o softmax online do FlashAttention ([Capítulo 2](#cap-02)) aplicado a blocos não contíguos. Kernels de produção paralelizam entre sequências, heads e, para contextos longos, entre pedaços do contexto (com uma etapa final de redução).

**Compartilhamento.** Cada bloco físico tem uma contagem de referências.

```text
 Parallel sampling, n = 3, mesmo prompt de 40 tokens:

 prompt: blocos físicos [4, 9, 2*]  (* = parcialmente cheio)
 amostra 1: [4, 9, 2*]   ref(4)=3, ref(9)=3, ref(2)=3
 amostra 2: [4, 9, 2*]
 amostra 3: [4, 9, 2*]

 cada amostra gera seu token 41 → precisa escrever no bloco 2
   amostra 1: ref(2)=3 > 1 → copia para o bloco 7 e escreve
   amostra 2: ref(2)=2 > 1 → copia para o bloco 11
   amostra 3: ref(2)=1     → escreve direto no bloco 2
 o prompt continua guardado UMA vez (blocos 4 e 9)
```

**Impacto.** O vLLM reportou, no paper original, throughput várias vezes maior que os sistemas da época em cargas de chat, principalmente porque batches maiores cabem na mesma memória. Os números exatos dependem do modelo e da carga; o mecanismo é o que importa: **no decode, o batch é limitado pela memória do KV; usar quase toda a memória dá batches maiores; batches maiores dão mais throughput**.

**Custos.**

- O kernel de atenção é mais complexo e faz leituras indiretas.
- A tabela de blocos precisa ser montada e enviada para a GPU a cada passo (overhead de CPU, minimizado com estruturas incrementais).
- Blocos pequenos demais prejudicam a eficiência de leitura; grandes demais aumentam o desperdício.
- Operações que precisam de K e V contíguos (alguns kernels antigos) não funcionam direto.

### Perguntas de acompanhamento prováveis

- **O PagedAttention acelera a atenção?** Não diretamente; o kernel em si pode ser um pouco mais lento que um kernel sobre memória contígua. O ganho é de **capacidade**: mais sequências por GPU.
- **O que acontece quando acabam os blocos livres?** O scheduler preempta sequências (recomputação ou swap) ou para de admitir novas ([6.6](#cap-06)).
- **Como o PagedAttention se relaciona com o prefix caching?** O prefix caching é construído em cima: blocos identificados por hash do prefixo podem ser compartilhados entre requisições diferentes, com a mesma contagem de referências.
- **Existem alternativas?** Sim. Algumas abordagens usam a memória virtual do próprio driver da GPU para manter o cache **virtualmente contíguo** e fisicamente alocado sob demanda, permitindo usar kernels de atenção comuns (como o vAttention, Prabhu et al., 2024).

### Armadilhas comuns

- Dizer que o PagedAttention reduz o tamanho do KV cache. Ele reduz o **desperdício**; o tamanho por token é o mesmo.
- Não saber explicar a tabela de blocos e o copy-on-write.
- Não conectar memória → tamanho do batch → throughput.
- Confundir com offload para a CPU (que é outra técnica, embora o swap use a mesma estrutura de blocos).

## Resumo do capítulo

- O KV cache ocupa toda a memória que sobra depois dos pesos e define quantas sequências cabem: ~110 conversas de 4 mil tokens no 8B numa H100; ~350 no 70B em 8 H100.
- Fórmula: 2 × camadas × kv_heads × head_dim × bytes por token. Faça essa conta no início de todo design.
- Alocação contígua por `max_seq_len` desperdiça a maior parte da memória do cache.
- **PagedAttention**: blocos fixos, tabela de blocos, alocação sob demanda, contagem de referências e copy-on-write. Ganha capacidade, não velocidade de kernel.
- **Prefix caching**: hash encadeado por bloco, reuso entre turnos e usuários, LRU. Armadilhas: template variável, retokenização, roteamento entre réplicas, chave incompleta, isolamento entre tenants.
- **Preempção** por recomputação ou swap quando a memória acaba; preempção frequente é sinal de batch grande demais.
- **Hierarquia**: HBM → DRAM da CPU → SSD → remoto. Para contextos longos, trazer o KV de volta é muito mais barato que recalcular.
- **Diminuir o cache**: FP8/INT4, GQA/MLA, sliding window, camadas híbridas, despejo de tokens (este último muda a saída).
- OOM em conversas longas: separar pico de ativações (prefill, logits) de crescimento do cache (decode).

## Checklist para a entrevista

- [ ] Calculo o KV cache por token e quantas sequências cabem numa configuração.
- [ ] Desenho a divisão da memória da GPU num servidor de LLM.
- [ ] Explico o desperdício da alocação contígua.
- [ ] Explico PagedAttention com a analogia de memória virtual, tabela de blocos e copy-on-write.
- [ ] Implemento uma classe de KV cache pré-alocada com comprimentos por sequência e reordenação para beam search.
- [ ] Explico prefix caching com hash encadeado e cito as sete armadilhas.
- [ ] Comparo recomputação e swap na preempção.
- [ ] Calculo se vale trazer o KV da CPU ou recalcular.
- [ ] Listo as técnicas para diminuir o KV cache e o risco de cada uma.
- [ ] Tenho um roteiro para OOM em conversas longas, incluindo os logits do prompt.
