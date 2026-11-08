# Capítulo 2 — Transformer e LLMs por dentro {#cap-02}

Você não precisa saber treinar um transformer para trabalhar com inferência. Mas precisa saber **exatamente o que ele calcula, em que ordem, com que formatos de tensor e quanto de memória cada parte usa**. Sem isso, não dá para entender por que o KV cache existe, por que a atenção é cara com contextos longos ou onde estão os bugs sutis que aparecem quando você mexe no motor de inferência.

Os entrevistadores testam este tema de dois jeitos: perguntas conceituais ("o que é o KV cache?", "o que é FlashAttention?") e perguntas de implementação ("implemente o cache e me diga o que pode dar errado"). Este capítulo prepara para as duas.

## 2.1 Do texto aos números: tokenização e embeddings

O modelo não lê letras. Um **tokenizer** quebra o texto em pedaços (tokens) e troca cada pedaço por um número inteiro (o ID do token). Os tokenizers modernos usam variações de **BPE** (byte-pair encoding): começam com bytes e juntam os pares mais frequentes até formar um vocabulário de, por exemplo, 128 mil tokens no Llama 3.

```text
 "Engenharia de inferência"
        │ tokenizer (BPE)
        ▼
 ["Eng", "enh", "aria", " de", " infer", "ência"]   (ilustrativo)
        │
        ▼
 [  6031,  12740,  10649,  409,  12309,  56743 ]    (IDs)
```

Fatos que importam em inferência:

- **Português gasta mais tokens que inglês** na maioria dos tokenizers, porque eles foram treinados com mais texto em inglês. A mesma frase pode virar 20% a 50% mais tokens. Isso aumenta custo e latência.
- **A tokenização roda na CPU**, geralmente em Rust (biblioteca `tokenizers`). Para prompts gigantes, ela pode levar milissegundos e entra no TTFT.
- **Detokenizar no streaming é chato**: um caractere acentuado pode ocupar dois tokens. Se você mandar o texto do primeiro token sozinho, o usuário vê um caractere quebrado. O servidor precisa segurar bytes incompletos até formar UTF-8 válido.

Depois, cada ID vira um vetor por meio de uma **tabela de embeddings**: uma matriz de tamanho [vocabulário × d_model]. No Llama 3 8B, são 128.256 × 4.096 ≈ 525 milhões de parâmetros só nessa tabela. Na GPU, isso é um simples **gather**: copiar a linha correspondente a cada ID.

## 2.2 A estrutura de um decoder moderno

Os LLMs de hoje (Llama, Mistral, Qwen, DeepSeek e muitos outros) são **decoder-only**: uma pilha de blocos iguais, cada um com atenção e MLP, ligados por conexões residuais.

```text
 IDs ─▶ Embedding ─▶ x
                     │
     ┌───────────────┼────────────────── bloco c (×N camadas)
     │               ├──────────────┐
     │               ▼              │ residual
     │           RMSNorm            │
     │               ▼              │
     │        Atenção causal        │
     │       (com RoPE, GQA)        │
     │               ▼              │
     │               ⊕ ◀────────────┘
     │               ├──────────────┐
     │               ▼              │ residual
     │           RMSNorm            │
     │               ▼              │
     │         MLP (SwiGLU)         │
     │               ▼              │
     │               ⊕ ◀────────────┘
     └───────────────┼──────────────────
                     ▼
                 RMSNorm final
                     ▼
            LM head [d_model × V]
                     ▼
           logits (1 número por token
           do vocabulário) ─▶ sampling
```

Os números do Llama 3 8B e 70B, que vamos usar nas contas:

| | Llama 3 8B | Llama 3 70B |
|---|---|---|
| Camadas | 32 | 80 |
| d_model | 4.096 | 8.192 |
| Heads de query | 32 | 64 |
| Heads de KV (GQA) | 8 | 8 |
| head_dim | 128 | 128 |
| Dimensão do MLP | 14.336 | 28.672 |
| Vocabulário | 128.256 | 128.256 |

::: conta
**Fazendo a conta: de onde vêm os 8 bilhões?** Para o Llama 3 8B:

- Atenção por camada: Q (4.096 × 4.096) + K (4.096 × 1.024) + V (4.096 × 1.024) + saída (4.096 × 4.096) ≈ 16,8 + 4,2 + 4,2 + 16,8 = **42 M**. K e V têm 1.024 colunas porque são só 8 heads × 128.
- MLP por camada: 3 matrizes de 4.096 × 14.336 ≈ **176 M**.
- Por camada: ~218 M. Vezes 32 camadas: **~6,98 B**.
- Embedding + LM head (não compartilhados): 2 × 525 M ≈ **1,05 B**.
- Total: **~8,0 B**. Note que o MLP tem cerca de 80% dos parâmetros das camadas.
:::

## 2.3 Atenção, do zero

A atenção deixa cada token "olhar" para os tokens anteriores e puxar informação deles. Para cada token, o modelo calcula três vetores a partir do estado atual $x$:

- **Query** ($q = x W_Q$): "o que eu estou procurando?"
- **Key** ($k = x W_K$): "o que eu ofereço para quem procura?"
- **Value** ($v = x W_V$): "o conteúdo que eu entrego se alguém me escolher."

A atenção do token $i$ compara seu query com os keys de todos os tokens $j \le i$, transforma as similaridades em pesos com softmax e faz uma média ponderada dos values:

$$\text{Atenção}(Q, K, V) = \text{softmax}\left(\frac{QK^\top}{\sqrt{d}} + M\right) V$$

- $d$ é o head_dim (128). Dividir por $\sqrt{d}$ evita que os produtos fiquem grandes demais e o softmax sature.
- $M$ é a **máscara causal**: 0 onde $j \le i$ e $-\infty$ onde $j > i$. Assim um token nunca vê o futuro.

::: analogia
**Analogia:** pense numa biblioteca. A query é a pergunta que você leva ao balcão. Cada livro tem uma etiqueta na lombada (a key) e um conteúdo (o value). Você compara sua pergunta com todas as etiquetas, dá uma nota para cada livro e monta a resposta misturando os conteúdos, com mais peso para os livros com nota maior. A máscara causal diz que você só pode consultar livros que já chegaram na biblioteca.
:::

```text
 Matriz de scores S = Q·Kᵀ para 5 tokens (com máscara causal)

             k0    k1    k2    k3    k4
          ┌─────┬─────┬─────┬─────┬─────┐
       q0 │  ●  │ -∞  │ -∞  │ -∞  │ -∞  │
       q1 │  ●  │  ●  │ -∞  │ -∞  │ -∞  │
       q2 │  ●  │  ●  │  ●  │ -∞  │ -∞  │
       q3 │  ●  │  ●  │  ●  │  ●  │ -∞  │
       q4 │  ●  │  ●  │  ●  │  ●  │  ●  │
          └─────┴─────┴─────┴─────┴─────┘
   Prefill: calcula o triângulo inteiro de uma vez.
   Decode do token 5: calcula só UMA linha nova (q5 contra
   k0..k5), e precisa de todos os k e v anteriores.
```

### Multi-head, MQA, GQA e MLA

Uma única atenção captura um tipo de relação. Por isso os modelos usam várias **heads** em paralelo, cada uma com suas próprias projeções, e concatenam os resultados. O Llama 3 8B tem 32 heads de 128 dimensões (32 × 128 = 4.096).

O problema para inferência: cada head precisa guardar seus próprios K e V para todos os tokens anteriores. Daí surgiram variações que **compartilham K e V entre heads de query**:

```text
 MHA (multi-head)     GQA (grouped-query)     MQA (multi-query)
 Q: ■■■■■■■■          Q: ■■■■■■■■             Q: ■■■■■■■■
 K: ■■■■■■■■          K: ■ ■ ■ ■  (grupos)     K: ■
 V: ■■■■■■■■          V: ■ ■ ■ ■               V: ■
 8 heads de KV        2 heads de query         1 head de KV para
                      por head de KV           todas as queries
 KV cache: 100%       KV cache: 25%            KV cache: 12,5%
```

- **MQA** (Shazeer, 2019): uma única head de K e V. Economiza muita memória, mas pode perder qualidade.
- **GQA** (Ainslie et al., 2023): grupos de heads de query compartilham uma head de KV. O Llama 3 70B usa 64 heads de query e 8 de KV: o KV cache fica **8 vezes menor** do que seria com MHA, com perda de qualidade pequena.
- **MLA** (multi-head latent attention, DeepSeek-V2): comprime K e V num vetor latente de baixa dimensão por token e reconstrói as heads na hora. Reduz ainda mais o cache, ao custo de mais cálculo.

Para inferência, isso é decisivo: **o KV cache é o que limita o batch**, e GQA/MLA atacam exatamente ele.

## 2.4 Posições: RoPE

A atenção, sozinha, não sabe a ordem dos tokens: trocar dois tokens de lugar não muda os scores. Os modelos modernos codificam a posição com **RoPE** (rotary position embedding, Su et al., 2021): cada par de dimensões de $q$ e $k$ é **girado** por um ângulo proporcional à posição do token.

Para o par de dimensões $(x_1, x_2)$ na posição $p$, com frequência $\theta_i = b^{-2i/d}$ (a base $b$ é 10.000 no Llama 2 e 500.000 no Llama 3):

$$\begin{pmatrix} x_1' \\ x_2' \end{pmatrix} = \begin{pmatrix} \cos(p\,\theta_i) & -\sin(p\,\theta_i) \\ \sin(p\,\theta_i) & \cos(p\,\theta_i) \end{pmatrix} \begin{pmatrix} x_1 \\ x_2 \end{pmatrix}$$

O truque: o produto escalar entre um $q$ girado pela posição $m$ e um $k$ girado pela posição $n$ depende só da **diferença** $m - n$. A atenção passa a enxergar distâncias relativas.

```python
import torch

def rope(x, pos, base=500000.0):
    # x: [B, H, T, D]   pos: [T] com as posições ABSOLUTAS
    d = x.shape[-1]
    i = torch.arange(0, d, 2, dtype=torch.float32)
    inv_freq = base ** (-i / d)                    # [D/2]
    ang = pos.float()[:, None] * inv_freq[None]    # [T, D/2]
    cos = torch.cat([ang.cos(), ang.cos()], -1)    # [T, D]
    sin = torch.cat([ang.sin(), ang.sin()], -1)
    # convenção "rotate_half" (Llama no Hugging Face):
    # pares são (i, i + D/2), não (2i, 2i+1)
    x1, x2 = x[..., : d // 2], x[..., d // 2 :]
    rot = torch.cat([-x2, x1], dim=-1)
    return x * cos + rot * sin
```

::: atencao
**Cuidado:** existem duas convenções de RoPE. Uma gira pares vizinhos (dimensões 0 e 1, 2 e 3...). A outra, usada pela implementação Llama do Hugging Face, gira a primeira metade com a segunda (dimensões 0 e 64, 1 e 65...). Os pesos de Q e K são permutados de acordo com a convenção. Misturar as duas não dá erro de execução, só gera texto ruim. É um bug clássico ao portar modelos entre motores.
:::

## 2.5 MLP, normalização e o resto

**MLP (SwiGLU).** Depois da atenção, cada token passa sozinho por uma rede de duas camadas com uma porta:

$$\text{MLP}(x) = W_{down}\big(\text{SiLU}(x W_{gate}) \odot (x W_{up})\big)$$

São três GEMMs grandes. Como têm 80% dos parâmetros, dominam a leitura de pesos no decode. A multiplicação elemento a elemento ($\odot$) com SiLU é um ótimo candidato à **fusão de kernels**.

**RMSNorm.** Normaliza cada vetor pelo seu valor quadrático médio e multiplica por um peso aprendido:

$$\text{RMSNorm}(x) = \frac{x}{\sqrt{\frac{1}{d}\sum_i x_i^2 + \epsilon}} \odot g$$

É barata em FLOPs, mas lê e escreve o tensor inteiro: memory-bound. Por isso costuma ser fundida com a soma residual.

**Residual.** Cada bloco soma sua saída à entrada ($x + f(x)$). Isso estabiliza o treinamento e, em inferência, é só uma soma elemento a elemento.

**LM head.** A última GEMM projeta o vetor final ($d_{model}$) para o tamanho do vocabulário, gerando os **logits**: uma nota para cada token possível. Com vocabulários de 128 mil tokens, essa GEMM não é pequena: no 8B, são 525 M de parâmetros.

## 2.6 Sampling: escolhendo o próximo token

Os logits viram probabilidades com softmax. O **sampling** decide qual token sai:

| Método | Como funciona | Uso |
|---|---|---|
| Greedy | pega o de maior probabilidade | determinístico, tarefas objetivas |
| Temperatura $T$ | divide os logits por $T$ antes do softmax; $T<1$ concentra, $T>1$ espalha | controla criatividade |
| Top-k | sorteia só entre os $k$ mais prováveis | corta a cauda de tokens absurdos |
| Top-p (nucleus) | sorteia entre os menores conjuntos cuja soma passa de $p$ | adapta o corte à confiança do modelo |
| Penalidades | reduz logits de tokens já usados | evita repetição |

```python
import torch

def sample(logits, temperature=0.7, top_p=0.9):
    # logits: [B, V]
    if temperature == 0:
        return logits.argmax(dim=-1)
    probs = torch.softmax(logits / temperature, dim=-1)
    sp, idx = probs.sort(dim=-1, descending=True)
    cum = sp.cumsum(dim=-1)
    # remove tokens depois de atingir top_p (mantém o 1º)
    sp[(cum - sp) > top_p] = 0.0
    sp = sp / sp.sum(dim=-1, keepdim=True)
    escolha = torch.multinomial(sp, num_samples=1)
    return idx.gather(-1, escolha).squeeze(-1)
```

Em inferência de produção, o sampling roda na GPU. Ordenar 128 mil valores por usuário a cada passo não é de graça; motores otimizados usam técnicas que evitam a ordenação completa.

## 2.7 Prefill e decode por dentro

Agora dá para ver com precisão o que muda entre as fases. Considere um batch de $B$ sequências:

```text
                    PREFILL                  DECODE (1 passo)
                    ───────                  ────────────────
 entrada x          [B, T, d]                [B, 1, d]
 GEMMs              matriz × matriz          ~matriz × vetor
                    (T linhas por seq.)      (1 linha por seq.)
 Q                  [B, H, T, 128]           [B, H, 1, 128]
 K, V novos         T por sequência          1 por sequência
 atenção            T × T (triângulo)        1 × (contexto todo)
 KV cache           ESCRITO (T tokens)       LIDO (tudo) + 1 escrito
 gargalo            cálculo (FLOPs)          memória (bytes)
 duração típica     dezenas a centenas       alguns a dezenas
                    de ms                    de ms
 métrica afetada    TTFT                     TPOT / ITL
```

O custo da atenção cresce de forma diferente nas duas fases:

- No **prefill**, a matriz de scores tem $T \times T$ elementos: o custo é **quadrático** no tamanho do prompt. Dobrar o prompt quadruplica o trabalho da atenção (as GEMMs crescem linearmente).
- No **decode**, cada passo calcula uma linha nova: o custo é **linear** no contexto. Mas, somando todos os passos, gerar $N$ tokens também custa algo proporcional a $N^2$.

## 2.8 O KV cache, conceito

Repare na linha "KV cache" da tabela. Sem cache, para gerar o token 1.001, o modelo teria que recalcular K e V dos 1.000 tokens anteriores, em todas as camadas. Para gerar o 1.002, recalcularia os 1.001. Isso é desperdício: **K e V de um token não mudam depois de calculados**, porque a máscara causal garante que um token passado nunca vê os tokens novos.

O **KV cache** guarda, para cada camada, os K e V de todos os tokens já processados. A cada passo de decode, o modelo calcula K e V só do token novo, adiciona ao cache e roda a atenção contra o cache inteiro.

```text
 Passo de decode na camada c, com cache

     token novo x_t
         │
         ├──▶ q_t = x_t·W_Q ─────────────────┐
         ├──▶ k_t = x_t·W_K ──┐              │
         └──▶ v_t = x_t·W_V ──┤              │
                              ▼              ▼
   KV cache da camada c: ┌────────────────┐  atenção:
   K: [k_0 k_1 ... k_t-1 │k_t]            │  softmax(q_t·Kᵀ/√d)·V
   V: [v_0 v_1 ... v_t-1 │v_t]            │      │
                         └────────────────┘      ▼
                                              saída_t
```

O preço é memória. O tamanho por token é:

$$\text{bytes por token} = 2 \times n_{camadas} \times n_{kv\_heads} \times d_{head} \times \text{bytes por elemento}$$

O "2" é porque guardamos K e V.

::: conta
**Fazendo a conta:**

- Llama 3 8B em BF16: 2 × 32 × 8 × 128 × 2 bytes = **131.072 bytes = 128 KiB por token**.
- Llama 3 70B em BF16: 2 × 80 × 8 × 128 × 2 = **327.680 bytes = 320 KiB por token**.
- Uma conversa de 8.000 tokens no 70B: 8.000 × 320 KiB ≈ **2,6 GB**. Só uma conversa.
- Se o 70B usasse MHA (64 heads de KV), seriam 8 vezes mais: ~21 GB por conversa de 8.000 tokens. GQA é o que torna esse modelo servível.
:::

O [Capítulo 6](#cap-06) aprofunda: gerenciamento, paginação, compartilhamento, offload e quantização do cache.

## 2.9 FlashAttention

A implementação ingênua da atenção faz três passos, cada um um kernel:

1. $S = QK^\top$ → escreve $S$ (tamanho $T \times T$) na HBM.
2. $P = \text{softmax}(S)$ → lê $S$, escreve $P$ na HBM.
3. $O = PV$ → lê $P$, escreve $O$.

Com $T = 8.192$ e 32 heads, a matriz $S$ tem 8.192² × 32 ≈ 2,1 bilhões de elementos por sequência, uns 4 GB em BF16. Escrever e ler isso várias vezes da HBM é lento, e a memória necessária cresce com $T^2$.

O **FlashAttention** (Dao et al., 2022) nunca materializa $S$ inteira. Ele divide Q, K e V em blocos que cabem na SRAM (shared memory) do SM, calcula a atenção bloco a bloco e acumula o resultado. O desafio é o softmax, que precisa do máximo e da soma da linha inteira. A solução é o **softmax online**: manter, para cada linha, o máximo parcial $m$ e a soma parcial $l$, e corrigir o acumulador quando um bloco novo traz um máximo maior.

```text
 FlashAttention (forward), para um bloco de queries Q_i:

   carrega Q_i na SRAM
   m ← -∞,  l ← 0,  O ← 0          (por linha)
   para cada bloco j:
       carrega K_j, V_j na SRAM
       S   ← Q_i · K_jᵀ / √d        (só na SRAM)
       m'  ← max(m, max_linha(S))
       P   ← exp(S − m')
       l   ← l · exp(m − m') + soma_linha(P)
       O   ← O · exp(m − m') + P · V_j
       m   ← m'
   O ← O / l
   escreve O na HBM                 (uma única vez)
```

O resultado é **exatamente** a mesma atenção (a menos de arredondamento), não uma aproximação. Você pode verificar com um script curto:

```python
import torch

def atencao_ingenua(q, k, v):
    s = q @ k.T / q.shape[-1] ** 0.5
    return torch.softmax(s, dim=-1) @ v

def atencao_online(q, k, v, bloco=64):
    d = q.shape[-1]
    m = torch.full((q.shape[0], 1), float("-inf"))
    l = torch.zeros(q.shape[0], 1)
    o = torch.zeros_like(q)
    for j in range(0, k.shape[0], bloco):
        s = q @ k[j:j + bloco].T / d ** 0.5
        m_novo = torch.maximum(m, s.max(-1, keepdim=True).values)
        p = torch.exp(s - m_novo)
        fator = torch.exp(m - m_novo)
        l = l * fator + p.sum(-1, keepdim=True)
        o = o * fator + p @ v[j:j + bloco]
        m = m_novo
    return o / l

q, k, v = (torch.randn(128, 64) for _ in range(3))
print(torch.allclose(atencao_ingenua(q, k, v),
                     atencao_online(q, k, v), atol=1e-5))  # True
```

Os ganhos:

- **Menos tráfego de HBM**: $S$ e $P$ nunca saem do chip. A atenção passa de memory-bound para muito mais perto do limite de cálculo no prefill.
- **Memória linear** em vez de quadrática: dá para usar contextos longos.
- **Fusão**: máscara, escala, softmax e dropout (no treino) num kernel só.

As versões seguintes melhoraram a eficiência no hardware:

- **FlashAttention-2** (2023): paraleliza também ao longo da sequência, reduz operações fora de GEMM e divide melhor o trabalho entre warps.
- **FlashAttention-3** (2024): específico para Hopper (H100). Usa TMA (cópias assíncronas de memória) e WGMMA (instruções de tensor core por grupo de warps), sobrepõe o softmax com as GEMMs e suporta FP8.
- Para **decode**, a forma do problema é outra (uma query por sequência, cache longo). Variantes como **Flash-Decoding** dividem o cache em pedaços processados em paralelo e juntam os resultados no fim, para ocupar todos os SMs mesmo com batch pequeno.

::: dica
**Dica de entrevista:** a frase que resume FlashAttention: "é uma atenção exata, ciente da hierarquia de memória (IO-aware), que usa tiling e softmax online para nunca escrever a matriz T×T na HBM". Se você disser "IO-aware" e explicar o softmax online, já está acima da média.
:::

## Perguntas de entrevista comentadas

## Q009 — O que é um KV cache? O que é FlashAttention? (perguntadas em sequência) {#q009}

::: pergunta-meta
**[Relatado]** NVIDIA · Senior Software Engineer · entrevista técnica · 2026 · Médio · [fonte](https://www.glassdoor.sg/Interview/NVIDIA-Interview-E7633-RVW103158258.htm)
:::

### Resposta em 30 segundos

"O KV cache guarda os vetores key e value de todos os tokens já processados, em cada camada, para que no decode o modelo calcule K e V só do token novo, em vez de recalcular o prefixo inteiro a cada passo. Isso troca cálculo por memória: no Llama 3 70B são uns 320 KB por token em BF16. FlashAttention é uma implementação exata da atenção que divide Q, K e V em blocos que cabem na SRAM e usa softmax online, para nunca escrever a matriz de scores T×T na memória da GPU. Isso reduz muito o tráfego de HBM e deixa a memória linear no tamanho da sequência. Os dois se complementam: o KV cache evita recalcular, o FlashAttention deixa a atenção que sobra mais rápida."

### Resposta completa

Responda as duas partes com a mesma estrutura: **problema → ideia → custo → números**.

**KV cache.**

- *Problema*: geração autorregressiva. Sem cache, o passo $t$ recalcula K e V de $t$ tokens. Gerar $N$ tokens custa $O(N^2)$ projeções a mais.
- *Ideia*: K e V de tokens passados nunca mudam (máscara causal). Guarde-os.
- *Custo*: memória. Fórmula $2 \times L \times H_{kv} \times d_h \times \text{bytes}$ por token (seção [2.8](#cap-02)).
- *Consequências*: o cache limita o batch, cresce com o contexto e precisa ser gerenciado (paginação, compartilhamento de prefixos, preempção, offload). Também é lido inteiro a cada passo, o que faz a atenção do decode ser memory-bound.

**FlashAttention.**

- *Problema*: a atenção ingênua escreve e lê $S$ e $P$ ($T \times T$) na HBM. Memória quadrática e muito tráfego.
- *Ideia*: tiling + softmax online + fusão num único kernel; recomputação no backward (no treino) em vez de guardar $P$.
- *Custo*: kernel complexo, específico de hardware (por isso há FA2, FA3 e variantes para decode).
- *Consequências*: atenção bem mais rápida em sequências longas, contextos longos viáveis, mesma saída numérica (a menos de arredondamento).

Termine conectando: "No serving, os kernels de atenção do decode, como o PagedAttention do vLLM ou o FlashInfer, combinam as duas ideias: leem um KV cache paginado em blocos e aplicam a mesma lógica de softmax online."

### Perguntas de acompanhamento prováveis

- **O FlashAttention reduz o número de FLOPs?** Não. Ele faz até um pouco mais (por causa das correções do softmax online e, no treino, da recomputação). O ganho vem de mover muito menos bytes entre HBM e SRAM.
- **O FlashAttention ajuda no decode?** Menos que no prefill. No decode, a matriz de scores tem só uma linha por sequência; o custo dominante é ler o KV cache. Variantes como Flash-Decoding ajudam a paralelizar essa leitura.
- **Por que não guardar também Q no cache?** Porque o query de tokens antigos nunca é usado de novo: cada token novo só precisa do próprio query contra os K e V antigos.
- **Como reduzir o tamanho do KV cache?** GQA/MQA/MLA (menos heads de KV), quantização do cache (FP8, INT8, INT4), sliding window, eviction de tokens pouco usados, offload para CPU. Detalhes no [Capítulo 6](#cap-06).
- **O que é o softmax online, exatamente?** Uma forma de calcular o softmax em uma passada, mantendo o máximo parcial e a soma parcial e reescalando o que já foi acumulado sempre que aparece um máximo maior (Milakov e Gimelshein, 2018).

### Armadilhas comuns

- Dizer que FlashAttention é uma aproximação. É exata.
- Dizer que o KV cache "acelera porque usa menos memória". É o contrário: usa mais memória para fazer menos cálculo.
- Esquecer que o cache é por camada e por head de KV.
- Não saber estimar o tamanho do cache.

## Q010 — Explique o que fica em cache em cada camada num KV cache e as armadilhas de corretude ao adicionar um (máscaras, posições, RoPE, shapes). {#q010}

::: pergunta-meta
**[Relatado]** Startups.com · Machine Learning Engineer · presencial · listada em 2026 · Médio · [fonte](https://prachub.com/interview-questions/design-efficient-transformer-inference-with-kv-cache)
:::

### Resposta em 30 segundos

"Em cada camada guardo K e V depois da projeção e depois do RoPE, com shape [batch, kv_heads, tokens, head_dim]. As armadilhas: a máscara causal no prefill precisa considerar o deslocamento do cache e, com batch, o padding; as posições do token novo têm que continuar de onde o cache parou, por sequência; o RoPE deve ser aplicado uma única vez, antes de gravar K, e nunca de novo nos K do cache; com GQA, as heads de KV são expandidas para as de query só na hora da atenção; com beam search, o cache precisa ser reordenado quando os feixes mudam; e concatenar tensores a cada passo é quadrático, então prefiro pré-alocar."

### Resposta completa

**O que guardar, exatamente.** Para cada camada $c$:

```text
 cache_k[c]: [B, H_kv, T_max, D]   (K já com RoPE aplicado)
 cache_v[c]: [B, H_kv, T_max, D]   (V não leva RoPE)
 comprimento[b]: quantos tokens válidos a sequência b tem
```

Não guarde: Q (nunca reusado), a saída da atenção, nem os estados do MLP. Não guarde K e V **antes** da projeção (os $x$ da camada) a menos que queira recalcular as projeções para economizar memória, o que é um trade-off diferente.

Agora as armadilhas, uma por uma. Essa é a parte que o entrevistador quer ouvir.

**1. Máscara causal com deslocamento.** No decode com cache, o query tem 1 token e o key tem $T_{cache} + 1$. A máscara causal "triangular" padrão assume $T_q = T_k$. Se você reusar a máscara do prefill, ela fica desalinhada. A regra correta: o query na posição local $i$ tem posição absoluta $T_k - T_q + i$ e pode ver keys $j \le T_k - T_q + i$.

```python
import torch
import torch.nn.functional as F

def atencao_com_cache(q, k, v):
    # q: [B, H, Tq, D]   k, v: [B, H, Tk, D]  (Tk >= Tq)
    tq, tk = q.shape[-2], k.shape[-2]
    s = q @ k.transpose(-1, -2) / q.shape[-1] ** 0.5
    pos_q = torch.arange(tq).unsqueeze(1) + (tk - tq)
    pos_k = torch.arange(tk).unsqueeze(0)
    s = s.masked_fill(pos_k > pos_q, float("-inf"))
    return F.softmax(s, dim=-1) @ v
```

Isso também cobre o caso de **chunked prefill** e de **prefix caching**, em que um pedaço do prompt já está no cache e o resto chega como várias queries.

**2. Padding no batch.** Sequências de tamanhos diferentes no mesmo batch exigem padding. Com padding à esquerda (comum em geração com Hugging Face), os tokens de padding ocupam as primeiras posições do cache. Você precisa de uma **máscara de atenção por sequência** que impeça os tokens reais de olhar para o padding. Esquecer isso faz a saída mudar conforme o tamanho do batch: um bug que só aparece em produção.

**3. Posições e RoPE.** O token novo de cada sequência tem posição `comprimento[b]`, não `T_max` nem `0`. Com padding à esquerda, a posição não é o índice no tensor: precisa descontar o padding. Erros típicos:

- Reiniciar as posições em 0 a cada passo de decode: o modelo "acha" que todo token novo é o primeiro.
- Usar a mesma posição para todas as sequências do batch.
- Aplicar RoPE de novo nos K que vêm do cache (girando duas vezes).
- Guardar K sem RoPE e esquecer de girar na leitura.

```text
 Prefill de 5 tokens, depois decode:

 posições:   0   1   2   3   4 │ 5   6   7 ...
 cache K:   k0  k1  k2  k3  k4 │k5  k6  k7
            (RoPE aplicado     │ cada novo k recebe RoPE
             com pos 0..4)     │ com SUA posição absoluta,
                               │ uma única vez
```

**4. Shapes e GQA.** O cache tem $H_{kv}$ heads (8), mas o query tem $H_q$ (32 ou 64). Na atenção, cada head de KV serve $H_q / H_{kv}$ heads de query. Não expanda o cache na memória (`repeat_interleave` no cache inteiro anula a economia do GQA); expanda só no cálculo, ou use um kernel que entenda GQA. E cuidado com a ordem: o agrupamento é `query head h` ↔ `kv head h // (H_q/H_kv)`, e ele precisa bater com o que o modelo aprendeu.

**5. Alocação.** `torch.cat([cache, k_novo])` a cada passo realoca e copia o cache inteiro: $O(T^2)$ em cópias e fragmentação de memória. Pré-aloque `T_max` e escreva com índice, ou use blocos (PagedAttention, [Capítulo 6](#cap-06)).

**6. dtype.** Calcular K e V em BF16 e guardar em FP16 (ou vice-versa) causa diferenças numéricas; quantizar o cache para FP8 exige fatores de escala por head ou por bloco. Seja consistente.

**7. Beam search e cópias.** Em beam search, os feixes trocam de ancestral a cada passo. O cache precisa ser **reordenado** (`cache.index_select(0, indices_dos_pais)`) ou, melhor, compartilhado por referência com copy-on-write.

**8. Limite de contexto.** Passar de `T_max` (ou da janela do modelo) silenciosamente corrompe o cache ou extrapola posições que o modelo não viu no treino. Trate explicitamente: erro, truncamento ou sliding window.

**Como testar.** O teste de ouro é simples: gere $N$ tokens com greedy usando o cache e compare com a geração sem cache (recalculando tudo a cada passo). Os logits devem bater dentro da tolerância numérica, e os tokens devem ser idênticos na maioria dos casos. Repita com batch de tamanhos diferentes e padding, para pegar bugs de máscara.

### Perguntas de acompanhamento prováveis

- **Por que gravar K depois do RoPE?** Para não girar todos os K do cache a cada passo. O custo: a posição fica "congelada" no cache, o que complica técnicas que mudam posições depois (por exemplo, remover tokens do meio do contexto).
- **Como lidar com sequências de tamanhos diferentes sem padding?** Com cache paginado e um kernel de atenção que recebe a lista de blocos e o comprimento de cada sequência (layout "ragged"). É o que vLLM e similares fazem.
- **Como o cache muda com sliding window attention?** Você só precisa guardar os últimos $W$ tokens por camada (um buffer circular). Cuidado com as posições: elas continuam crescendo mesmo que o buffer gire.
- **Os resultados com e sem cache são bit a bit iguais?** Em geral não. A ordem das operações muda (kernels diferentes para prefill e decode), e o arredondamento em ponto flutuante não é associativo. Compare com tolerância.

### Armadilhas comuns

- Falar só "guardo K e V" sem shapes, sem RoPE e sem máscara.
- Esquecer padding e GQA.
- Usar `torch.cat` no laço e não perceber o custo quadrático.
- Não propor um teste de equivalência com a versão sem cache.

## Q011 — Explique prefill vs. decode e por que os sistemas de serving tratam cada um de forma diferente. {#q011}

::: pergunta-meta
**[Fornecedor]** Banco público de perguntas de inferência, marcada como "pergunta padrão para sêniores" · Presencial · 2026 · Médio · [fonte](https://tracker-7ex.pages.dev/10_interview_bank/production/inference-serving/)
:::

### Resposta em 30 segundos

"Prefill processa o prompt inteiro numa passada, em paralelo, e preenche o KV cache: são GEMMs grandes, compute-bound, e definem o TTFT. Decode gera um token por passada, lendo todos os pesos e o KV cache inteiro para fazer pouco cálculo: é memory-bound e define o TPOT. Como os gargalos são opostos, misturar os dois num mesmo passo faz um atrapalhar o outro: um prefill longo trava o decode de todo mundo. Por isso os sistemas usam chunked prefill para misturar com controle, priorizam um ou outro conforme o SLO, usam kernels diferentes para cada fase e, em escala, chegam a separar prefill e decode em GPUs diferentes, transferindo o KV cache."

### Resposta completa

Use a tabela da seção [2.7](#cap-02). Depois explique as quatro formas como os sistemas tratam as fases de maneira diferente:

**1. Kernels diferentes.** O prefill usa kernels de atenção otimizados para muitas queries (FlashAttention em tiles grandes). O decode usa kernels otimizados para uma query por sequência contra um cache longo e paginado (PagedAttention, FlashInfer, Flash-Decoding). Tamanhos de tile, paralelização e uso de tensor cores são diferentes.

**2. Scheduling.** O scheduler decide, a cada passo, quais sequências entram:

```text
 Sem cuidado: um prompt de 32k tokens chega
 passo:  D  D  D [██████ PREFILL 32k ██████] D  D  D
                  ▲ todos os usuários em decode
                    ficam centenas de ms sem token

 Chunked prefill: o prompt entra em pedaços de, digamos, 2k
 passo: [D+2k][D+2k][D+2k] ... [D+2k][D][D]
         cada passo tem um "orçamento" de tokens;
         decodes têm prioridade e o resto do orçamento
         vai para o pedaço de prefill
```

O orçamento de tokens por passo controla o trade-off: maior = TTFT melhor e passos de decode mais lentos; menor = o contrário. Detalhes no [Capítulo 7](#cap-07).

**3. Paralelismo e hardware diferentes.** Prefill gosta de muito cálculo (tensor parallelism grande ajuda a reduzir o TTFT de prompts enormes). Decode gosta de banda de memória e capacidade para o KV cache (batch grande). Uma configuração única é um compromisso.

**4. Desagregação.** Em escala, sistemas como DistServe, Splitwise e Mooncake colocam prefill e decode em **pools de GPUs separados**. O prefill gera o KV cache e o transfere (via NVLink, InfiniBand/RDMA) para uma GPU de decode. Vantagens: cada pool é dimensionado e configurado para seu SLO (TTFT ou TPOT), e não há interferência. Custo: transferência do KV cache, que pode ter centenas de MB a alguns GB por requisição longa, e mais complexidade operacional. O [Capítulo 9](#cap-09) aprofunda ([Q067](#q067)).

::: conta
**Fazendo a conta:** quanto tempo leva o prefill de 8.000 tokens no Llama 3 70B em 8 H100?

- FLOPs das matrizes: 2 × 70 B × 8.000 ≈ **1,12 PFLOP**.
- Atenção (QKᵀ e PV, com máscara causal ~metade): 2 × 2 × 80 camadas × 8.000² × 8.192 / 2 ≈ **0,084 PFLOP**.
- Total ~1,2 PFLOP. Com 8 × 989 TFLOPS e uns 50% de eficiência real: 1,2 / (8 × 0,989 × 0,5) ≈ **0,3 s**.
- Já o KV cache gerado: 8.000 × 320 KiB ≈ **2,6 GB**. É isso que a desagregação precisa transferir.
:::

### Perguntas de acompanhamento prováveis

- **Por que não fazer só batches de prefill e só batches de decode, alternando?** Funciona, mas os decodes ficam parados durante cada prefill (picos de ITL), e os prefills esperam os decodes. Chunked prefill junta os dois e aproveita a capacidade ociosa de cálculo do decode para fazer prefill "de carona".
- **O prefill pode ser memory-bound?** Com prompts muito curtos, sim. E a atenção do prefill com contexto muito longo cresce quadraticamente e pode dominar o tempo.
- **Como o prefix caching muda isso?** Se o começo do prompt já está no cache (system prompt, histórico do chat), o prefill só processa o sufixo novo. O TTFT cai muito em chats multi-turno ([Q043](#q043)).
- **Qual fase domina o custo?** Depende da carga. Em chat, as saídas costumam ser bem mais curtas que as entradas acumuladas, mas cada token de saída é mais caro. Em resumo de documentos, o prefill domina. Em geração longa (código, raciocínio), o decode domina.

### Armadilhas comuns

- Dizer só "prefill é o prompt e decode é a resposta", sem falar de gargalos.
- Não conectar as fases às métricas (TTFT e TPOT).
- Esquecer a interferência entre as fases e as soluções (chunked prefill, desagregação).
- Achar que o prefill é sempre rápido: com prompts de 100 mil tokens, ele leva segundos.

## Resumo do capítulo

- Um LLM decoder-only é: embedding → N blocos (RMSNorm, atenção, residual, RMSNorm, MLP, residual) → norma final → LM head → sampling.
- No Llama 3 8B, o MLP tem ~80% dos parâmetros das camadas; embedding e LM head somam ~1 B.
- Atenção = softmax(QKᵀ/√d + máscara)·V. A máscara causal impede ver o futuro.
- **GQA** compartilha K e V entre grupos de heads de query e reduz o KV cache (8× no Llama 3 70B).
- **RoPE** gira Q e K pela posição; o produto escalar passa a depender da distância relativa. Existem duas convenções incompatíveis.
- **Prefill**: T tokens de uma vez, compute-bound, define o TTFT. **Decode**: 1 token por passo, memory-bound, define o TPOT.
- **KV cache**: 2 × camadas × kv_heads × head_dim × bytes por token. 128 KiB (8B) e 320 KiB (70B) em BF16.
- **FlashAttention**: atenção exata e IO-aware, com tiling e softmax online; nunca escreve a matriz T×T na HBM.
- Armadilhas do KV cache: máscara com deslocamento, padding, posições por sequência, RoPE aplicado uma vez, GQA sem expandir na memória, pré-alocação, beam search.

## Checklist para a entrevista

- [ ] Desenho um bloco de decoder moderno de memória e explico cada parte.
- [ ] Calculo os parâmetros de um modelo a partir da configuração.
- [ ] Escrevo a fórmula da atenção e explico a máscara causal.
- [ ] Explico MHA, MQA, GQA e MLA e o efeito de cada um no KV cache.
- [ ] Explico RoPE e por que o produto escalar depende da distância relativa.
- [ ] Calculo o tamanho do KV cache por token e por conversa.
- [ ] Explico o softmax online e escrevo o pseudocódigo do FlashAttention.
- [ ] Listo as armadilhas de corretude do KV cache e como testar a implementação.
- [ ] Comparo prefill e decode em entrada, gargalo, métrica e kernel.
- [ ] Explico chunked prefill e desagregação de prefill e decode.
