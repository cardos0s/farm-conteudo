# Capítulo 13 — Programação e Depuração de Desempenho {#cap-13}

Toda vaga de inferência tem pelo menos uma rodada de código. Os relatos mostram três tipos misturados, às vezes na mesma entrevista (a NVIDIA, por exemplo, pediu um loop de inferência em PyTorch e uma ordenação topológica na mesma rodada):

1. **Algoritmos clássicos**: estruturas de dados e grafos, no estilo LeetCode de dificuldade média. Exemplos da lista: ordenação topológica, serializar uma árvore binária.
2. **Código de ML**: implementar atenção, KV cache, sampling, beam search, um loop de geração, um batcher.
3. **Depuração de desempenho**: "este código está lento; descubra por quê e conserte".

Este capítulo traz um método para as rodadas de código, as ferramentas de profiling que você precisa citar, e as três perguntas da lista resolvidas com código completo. Todo o código deste capítulo foi executado e testado (os testes estão no fim de cada seção).

## 13.1 O método para a rodada de código

```text
 1. ENTENDER (2–3 min)
    repita o problema com suas palavras; pergunte sobre
    entradas, tamanhos, casos de borda, formato da saída
 2. EXEMPLOS (2 min)
    um caso normal e um de borda, escritos no quadro
 3. SOLUÇÃO SIMPLES (2 min)
    diga a força bruta e a complexidade dela
 4. OTIMIZAR (5 min)
    chegue na solução boa; diga a complexidade ANTES
    de codar; combine com o entrevistador
 5. CODAR (15–20 min)
    nomes claros, funções pequenas, falando em voz alta
 6. TESTAR (5 min)
    rode os exemplos à mão, depois os casos de borda;
    corrija com calma
```

Duas observações específicas para vagas de inferência:

- **O entrevistador quer ver você raciocinar sobre desempenho** mesmo em problemas algorítmicos. Depois de resolver, comente: "isso é O(n), sem recursão para não estourar a pilha com árvores degeneradas; se fosse um grafo de operadores de um compilador, eu também guardaria a ordem estável para builds reproduzíveis".
- **Em código de ML, shapes são tudo.** Escreva o shape de cada tensor num comentário. A maioria dos bugs de entrevista é de eixo trocado.

## 13.2 Profiling e depuração de desempenho

### As ferramentas

| Nível | Ferramenta | Responde |
|---|---|---|
| Python | `cProfile`, `py-spy` | que função Python consome a CPU? |
| PyTorch | `torch.profiler` | que operador gerou que kernel, tempo de CPU e GPU |
| GPU (linha do tempo) | Nsight Systems | onde a GPU fica ociosa? cópias? sincronizações? |
| GPU (kernel) | Nsight Compute | por que este kernel está lento? |
| Memória | `torch.cuda.memory_summary`, snapshots | quem alocou a memória? |

O `py-spy` merece destaque: ele inspeciona um processo Python **em execução**, sem reiniciar e sem modificar o código. Perfeito para um servidor em produção que ficou lento:

```bash
py-spy top --pid 12345           # ao vivo, estilo "top"
py-spy dump --pid 12345          # pilha atual de cada thread
py-spy record -o perfil.svg --pid 12345 --duration 30
```

E o `torch.profiler`, para ver CPU e GPU juntos:

```python
import torch
from torch.profiler import profile, ProfilerActivity, record_function

with profile(activities=[ProfilerActivity.CPU,
                         ProfilerActivity.CUDA],
             record_shapes=True) as prof:
    with record_function("passo_de_decode"):
        logits = modelo(entrada)
        torch.cuda.synchronize()

print(prof.key_averages().table(sort_by="cuda_time_total",
                                row_limit=15))
prof.export_chrome_trace("trace.json")   # abrir no Perfetto
```

### Os erros de desempenho mais comuns em código PyTorch

| Padrão | Por que é lento | Correção |
|---|---|---|
| `.item()`, `.tolist()`, `print(tensor)` dentro do laço | sincroniza CPU e GPU a cada chamada | acumular na GPU, sincronizar uma vez |
| laço Python sobre elementos de um tensor | milhares de kernels minúsculos | operações vetorizadas |
| `torch.cat` crescendo um tensor a cada passo | realoca e copia tudo: O(n²) | pré-alocar e escrever com índice |
| `.to("cuda")` dentro do laço | cópia pelo PCIe a cada iteração | mover uma vez, antes |
| tensores não contíguos (`.T`, `permute`) passados para kernels | cópias implícitas ou kernels lentos | `.contiguous()` uma vez, ou reorganizar o layout |
| dtype misturado (FP32 com BF16) | conversões extras e caminhos lentos | padronizar o dtype |
| sem `torch.inference_mode()` | guarda grafo para backward | usar o contexto de inferência |
| batch de tamanho 1 | GPU subutilizada | agrupar requisições |

::: conta
**Fazendo a conta: o custo de uma sincronização.** Um decode com batch pequeno gera um token a cada ~10 ms. Se o laço chama `.item()` para cada uma das 64 sequências do batch, são 64 sincronizações por passo. Cada uma esvazia a fila de trabalho da GPU e paga a latência de ida e volta (dezenas de microssegundos). Um único `.tolist()` por passo resolve, como no código da [Q097](#q097).
:::

## Perguntas de entrevista comentadas

## Q097 — Implemente um loop de inferência em PyTorch. {#q097}

::: pergunta-meta
**[Relatado]** NVIDIA · Senior Software Engineer · entrevista técnica · 2026 · Médio · [fonte](https://www.glassdoor.sg/Interview/NVIDIA-Interview-E7633-RVW103158258.htm)
:::

### Resposta em 30 segundos

"Tokenizo o prompt, rodo um forward com o prompt inteiro (prefill), que devolve os logits do último token e o KV cache de cada camada. Depois entro num laço: escolho o próximo token com o sampling (greedy, temperatura, top-p), anexo, e rodo um forward só com esse token novo, passando o cache, até atingir o máximo de tokens ou o token de parada. Para batch, uso padding à esquerda com máscara de atenção e posições por sequência. Tudo dentro de `torch.inference_mode()`, com uma sincronização por passo. E testo comparando a geração com cache contra a geração sem cache."

### Resposta completa

Comece pela versão mais curta, com um modelo do Hugging Face, para mostrar que você conhece o padrão. Depois, se o entrevistador quiser, escreva o modelo e o laço do zero.

**Versão 1: com um modelo pronto (Hugging Face).**

```python
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer

tok = AutoTokenizer.from_pretrained("gpt2")
modelo = AutoModelForCausalLM.from_pretrained("gpt2").eval()

@torch.inference_mode()
def gerar_hf(texto, max_novos=30):
    ids = tok(texto, return_tensors="pt").input_ids   # [1, T]
    out = modelo(ids, use_cache=True)                  # prefill
    cache = out.past_key_values
    prox = out.logits[:, -1].argmax(-1, keepdim=True)  # [1, 1]
    gerados = [prox]
    for _ in range(max_novos - 1):                     # decode
        out = modelo(prox, past_key_values=cache,
                     use_cache=True)
        cache = out.past_key_values
        prox = out.logits[:, -1].argmax(-1, keepdim=True)
        gerados.append(prox)
        if prox.item() == tok.eos_token_id:
            break
    return tok.decode(torch.cat(gerados, dim=-1)[0])

print(gerar_hf("Engenharia de inferência é"))
```

**Versão 2: do zero.** Um decoder mínimo no estilo Llama (RMSNorm, RoPE, GQA, SwiGLU), com KV cache por camada, batch com padding à esquerda, sampling e parada por token. É longo para uma entrevista, mas cada pedaço é o que o entrevistador pode pedir isoladamente:

```python
import torch
import torch.nn as nn
import torch.nn.functional as F


class Config:
    vocab = 1000
    d = 128
    n_heads = 8
    n_kv = 2          # GQA: 4 heads de query por head de KV
    n_layers = 2
    d_ff = 344


def rope_cos_sin(pos, head_dim, base=10000.0):
    # pos: [B, T] posições absolutas -> cos, sin: [B, T, D]
    i = torch.arange(0, head_dim, 2, dtype=torch.float32)
    inv_freq = base ** (-i / head_dim)
    ang = pos.float()[..., None] * inv_freq
    ang = torch.cat([ang, ang], dim=-1)
    return ang.cos(), ang.sin()


def aplica_rope(x, cos, sin):
    # x: [B, H, T, D]; cos, sin: [B, 1, T, D]
    d = x.shape[-1]
    x1, x2 = x[..., : d // 2], x[..., d // 2 :]
    return x * cos + torch.cat([-x2, x1], dim=-1) * sin


class RMSNorm(nn.Module):
    def __init__(self, d, eps=1e-6):
        super().__init__()
        self.g = nn.Parameter(torch.ones(d))
        self.eps = eps

    def forward(self, x):
        rms = torch.rsqrt(x.pow(2).mean(-1, keepdim=True) + self.eps)
        return x * rms * self.g


class Atencao(nn.Module):
    def __init__(self, c):
        super().__init__()
        self.h, self.hkv = c.n_heads, c.n_kv
        self.hd = c.d // c.n_heads
        self.wq = nn.Linear(c.d, c.d, bias=False)
        self.wk = nn.Linear(c.d, self.hkv * self.hd, bias=False)
        self.wv = nn.Linear(c.d, self.hkv * self.hd, bias=False)
        self.wo = nn.Linear(c.d, c.d, bias=False)

    def forward(self, x, cos, sin, cache, mask):
        B, T, _ = x.shape
        q = self.wq(x).view(B, T, self.h, self.hd).transpose(1, 2)
        k = self.wk(x).view(B, T, self.hkv, self.hd).transpose(1, 2)
        v = self.wv(x).view(B, T, self.hkv, self.hd).transpose(1, 2)
        q, k = aplica_rope(q, cos, sin), aplica_rope(k, cos, sin)
        if cache is not None:          # K já tem RoPE no cache
            k = torch.cat([cache[0], k], dim=2)
            v = torch.cat([cache[1], v], dim=2)
        rep = self.h // self.hkv       # GQA: expande só na conta
        o = F.scaled_dot_product_attention(
            q, k.repeat_interleave(rep, 1),
            v.repeat_interleave(rep, 1), attn_mask=mask)
        o = o.transpose(1, 2).reshape(B, T, -1)
        return self.wo(o), (k, v)


class Bloco(nn.Module):
    def __init__(self, c):
        super().__init__()
        self.n1, self.att = RMSNorm(c.d), Atencao(c)
        self.n2 = RMSNorm(c.d)
        self.gate = nn.Linear(c.d, c.d_ff, bias=False)
        self.up = nn.Linear(c.d, c.d_ff, bias=False)
        self.down = nn.Linear(c.d_ff, c.d, bias=False)

    def forward(self, x, cos, sin, cache, mask):
        h, cache = self.att(self.n1(x), cos, sin, cache, mask)
        x = x + h
        y = self.n2(x)
        x = x + self.down(F.silu(self.gate(y)) * self.up(y))
        return x, cache


class MiniLLM(nn.Module):
    def __init__(self, c):
        super().__init__()
        self.c = c
        self.emb = nn.Embedding(c.vocab, c.d)
        self.blocos = nn.ModuleList(
            Bloco(c) for _ in range(c.n_layers))
        self.norm = RMSNorm(c.d)
        self.head = nn.Linear(c.d, c.vocab, bias=False)

    def forward(self, ids, pos, attn_mask, caches=None):
        # ids, pos: [B, T]; attn_mask: [B, Tk], 1 = token real
        T, Tk = ids.shape[1], attn_mask.shape[1]
        cos, sin = rope_cos_sin(pos, self.c.d // self.c.n_heads)
        cos, sin = cos[:, None], sin[:, None]
        i = torch.arange(T)[:, None] + (Tk - T)   # pos. das queries
        j = torch.arange(Tk)[None, :]
        mask = (j <= i)[None] & attn_mask[:, None, :].bool()
        mask = (mask | (j == i)[None])[:, None]   # nunca linha vazia
        x = self.emb(ids)
        novos = []
        for n, bloco in enumerate(self.blocos):
            cache = None if caches is None else caches[n]
            x, c = bloco(x, cos, sin, cache, mask)
            novos.append(c)
        logits = self.head(self.norm(x[:, -1]))  # só o último token
        return logits, novos
```

O laço de geração:

```python
def sample(logits, temperatura=0.0, top_p=1.0):
    if temperatura == 0:
        return logits.argmax(dim=-1)
    probs = torch.softmax(logits / temperatura, dim=-1)
    sp, idx = probs.sort(dim=-1, descending=True)
    cum = sp.cumsum(dim=-1)
    sp[(cum - sp) > top_p] = 0.0
    sp = sp / sp.sum(dim=-1, keepdim=True)
    escolha = torch.multinomial(sp, num_samples=1)
    return idx.gather(-1, escolha).squeeze(-1)


@torch.inference_mode()
def gerar(modelo, prompts, max_novos=20, temperatura=0.0,
          top_p=1.0, eos=None):
    B, L = len(prompts), max(len(p) for p in prompts)
    ids = torch.zeros(B, L, dtype=torch.long)
    mask = torch.zeros(B, L, dtype=torch.long)
    for b, p in enumerate(prompts):           # padding à esquerda
        ids[b, L - len(p):] = torch.tensor(p)
        mask[b, L - len(p):] = 1
    pos = (mask.cumsum(-1) - 1).clamp(min=0)
    logits, caches = modelo(ids, pos, mask)   # PREFILL
    saidas = [[] for _ in range(B)]
    ativo = [True] * B
    for _ in range(max_novos):
        prox = sample(logits, temperatura, top_p)       # [B]
        for b, t in enumerate(prox.tolist()):  # 1 sync por passo
            if ativo[b]:
                saidas[b].append(t)
                if eos is not None and t == eos:
                    ativo[b] = False
        if not any(ativo):
            break
        pos = mask.sum(-1, keepdim=True)       # posição do novo
        um = torch.ones(B, 1, dtype=mask.dtype)
        mask = torch.cat([mask, um], dim=-1)
        logits, caches = modelo(prox[:, None], pos, mask, caches)
    return saidas
```

E o teste que prova que o cache está correto: gerar com cache, gerar sem cache (recalculando a sequência inteira a cada passo) e comparar; e gerar cada prompt sozinho e dentro do batch, para provar que o padding e a máscara estão certos:

```python
@torch.inference_mode()
def gerar_sem_cache(modelo, prompt, max_novos=20):
    seq = list(prompt)
    for _ in range(max_novos):
        ids = torch.tensor([seq])
        mask = torch.ones_like(ids)
        pos = torch.arange(len(seq))[None]
        logits, _ = modelo(ids, pos, mask)
        seq.append(int(logits.argmax(-1)))
    return seq[len(prompt):]
```

```python
torch.manual_seed(0)
m = MiniLLM(Config()).eval()
prompts = [[5, 17, 300, 42], [9, 8], [1, 2, 3, 4, 5, 6, 7]]
com_cache = gerar(m, prompts, max_novos=15)
for p, saida in zip(prompts, com_cache):
    assert saida == gerar_sem_cache(m, p, max_novos=15)
    assert saida == gerar(m, [p], max_novos=15)[0]
print("ok: com cache == sem cache; batch == sozinho")
```

**Os pontos que você deve explicar enquanto escreve:**

1. **Prefill e decode são o mesmo `forward`** com entradas diferentes: no prefill, `ids` tem o prompt inteiro e não há cache; no decode, `ids` tem 1 token e o cache vem do passo anterior.
2. **Posições**: com padding à esquerda, a posição de cada token é a contagem de tokens reais antes dele (`cumsum` da máscara), não o índice no tensor. No decode, a posição do token novo é o número de tokens reais da sequência.
3. **Máscara**: combina causal (com o deslocamento entre queries e keys) e padding. A linha extra `mask | (j == i)` garante que nenhuma query fique sem nenhuma key permitida; sem isso, as posições de padding gerariam NaN, que contaminaria as outras posições pela multiplicação por zero.
4. **Logits só do último token**: o `head` roda só em `x[:, -1]`, não em todas as posições do prompt (ver [Q042](#q042)).
5. **GQA**: o cache guarda só as 2 heads de KV; a expansão para 8 heads acontece só na conta.
6. **Uma sincronização por passo**: `prox.tolist()` uma vez, não `.item()` por sequência.
7. **Limitações conscientes**: o cache usa `torch.cat` por simplicidade (em produção, pré-alocar ou paginar, [Q041](#q041)), e as sequências que já terminaram continuam ocupando lugar no batch (em produção, continuous batching, [Capítulo 7](#cap-07)).

### Perguntas de acompanhamento prováveis

- **Como você faria isso rodar mais rápido na GPU?** Pré-alocar o cache, `torch.compile` com CUDA graphs no decode, kernels de atenção como FlashAttention/SDPA, BF16 ou FP8, e evitar qualquer sincronização dentro do passo.
- **Como adicionar parada por sequência de texto (stop strings)?** Detokenizar incrementalmente e checar o sufixo do texto, tomando cuidado com uma stop string que atravessa tokens. Isso exige CPU a cada passo; dá para fazer de forma assíncrona.
- **Como implementar beam search?** Manter $k$ feixes por prompt, expandir cada um com os top-$k$ tokens, somar log-probabilidades, manter os $k$ melhores, e reordenar o cache conforme os feixes pais ([Q041](#q041)).
- **Por que padding à esquerda e não à direita?** Para que o último token de todas as sequências fique na mesma coluna, e o token novo de cada uma seja sempre anexado no fim. Com padding à direita, cada sequência teria o "fim" num lugar diferente.

### Armadilhas comuns

- Rodar o modelo na sequência inteira a cada passo, sem cache.
- Posições erradas com padding.
- Esquecer a máscara de padding e obter resultados que mudam com o batch.
- `.item()` por elemento dentro do laço.
- Não ter um teste de equivalência.

## Q098 — Implemente ordenação topológica em Python. {#q098}

::: pergunta-meta
**[Relatado]** NVIDIA · Senior Software Engineer · entrevista técnica · 2026 · Médio · [fonte](https://www.glassdoor.sg/Interview/NVIDIA-Interview-E7633-RVW103158258.htm)
:::

### Resposta em 30 segundos

"Uso o algoritmo de Kahn: calculo o grau de entrada de cada nó, coloco numa fila os nós com grau zero, e repito: tiro um nó da fila, coloco na resposta e decremento o grau dos vizinhos, colocando na fila os que chegam a zero. Se no fim a resposta tiver menos nós que o grafo, existe ciclo. É O(V + E) em tempo e espaço. Se precisar de uma ordem determinística, por exemplo a menor lexicograficamente, troco a fila por um heap, com custo O((V + E) log V). Alternativa: DFS com três cores, invertendo a pós-ordem; faço iterativa para não estourar a pilha de recursão."

### Resposta completa

**O problema.** Dado um grafo direcionado, encontrar uma ordem dos nós em que, para toda aresta $u \to v$, $u$ aparece antes de $v$. Só existe se o grafo não tiver ciclos (DAG).

**Por que isso cai numa vaga de inferência.** Grafos de computação são DAGs: um compilador de modelos (como o Inductor ou o TensorRT) precisa ordenar as operações respeitando dependências para gerar o código, decidir fusões e planejar a memória. Mencione isso; mostra que você conecta o algoritmo ao trabalho.

```text
 Grafo de um bloco de transformer (simplificado)

 x ─▶ norm1 ─▶ qkv ─▶ rope ─▶ atenção ─▶ proj ─▶ add1 ─▶ norm2
 │                                               ▲        │
 └───────────────────────────────────────────────┘        ▼
                                                         mlp
                                                          │
                                       add2 ◀─────────────┘
 uma ordem topológica válida:
 x, norm1, qkv, rope, atenção, proj, add1, norm2, mlp, add2
```

**Kahn (BFS):**

```python
from collections import deque


def topo_kahn(n, arestas):
    """n nós (0..n-1), arestas (u, v) = u antes de v.
    Retorna uma ordem topológica ou levanta erro se houver ciclo."""
    adj = [[] for _ in range(n)]
    grau = [0] * n
    for u, v in arestas:
        adj[u].append(v)
        grau[v] += 1
    fila = deque(i for i in range(n) if grau[i] == 0)
    ordem = []
    while fila:
        u = fila.popleft()
        ordem.append(u)
        for v in adj[u]:
            grau[v] -= 1
            if grau[v] == 0:
                fila.append(v)
    if len(ordem) != n:
        raise ValueError("o grafo tem ciclo")
    return ordem
```

**Variante com ordem determinística (menor lexicográfica):**

```python
import heapq


def topo_menor_lexico(n, arestas):
    """Mesma ideia, mas sempre escolhe o menor nó disponível."""
    adj = [[] for _ in range(n)]
    grau = [0] * n
    for u, v in arestas:
        adj[u].append(v)
        grau[v] += 1
    heap = [i for i in range(n) if grau[i] == 0]
    heapq.heapify(heap)
    ordem = []
    while heap:
        u = heapq.heappop(heap)
        ordem.append(u)
        for v in adj[u]:
            grau[v] -= 1
            if grau[v] == 0:
                heapq.heappush(heap, v)
    if len(ordem) != n:
        raise ValueError("o grafo tem ciclo")
    return ordem
```

**DFS com três cores, iterativa** (branco = não visitado, cinza = na pilha atual, preto = terminado; encontrar um cinza é encontrar um ciclo):

```python
def topo_dfs(n, arestas):
    """DFS iterativa com 3 cores (sem limite de recursão)."""
    adj = [[] for _ in range(n)]
    for u, v in arestas:
        adj[u].append(v)
    BRANCO, CINZA, PRETO = 0, 1, 2
    cor = [BRANCO] * n
    pos_ordem = []
    for raiz in range(n):
        if cor[raiz] != BRANCO:
            continue
        pilha = [(raiz, 0)]
        cor[raiz] = CINZA
        while pilha:
            u, i = pilha[-1]
            if i < len(adj[u]):
                pilha[-1] = (u, i + 1)
                v = adj[u][i]
                if cor[v] == CINZA:
                    raise ValueError("o grafo tem ciclo")
                if cor[v] == BRANCO:
                    cor[v] = CINZA
                    pilha.append((v, 0))
            else:
                cor[u] = PRETO
                pos_ordem.append(u)
                pilha.pop()
    return pos_ordem[::-1]
```

**Testes.** A forma mais forte de testar é validar a propriedade em vez de comparar com uma resposta fixa (há muitas ordens válidas):

```python
def valida_topo(n, arestas, ordem):
    posicao = {u: i for i, u in enumerate(ordem)}
    return (sorted(ordem) == list(range(n))
            and all(posicao[u] < posicao[v] for u, v in arestas))
```

```python
assert valida_topo(4, [(0, 1), (0, 2), (1, 3), (2, 3)],
                   topo_kahn(4, [(0, 1), (0, 2), (1, 3), (2, 3)]))
assert topo_menor_lexico(4, [(3, 0), (2, 1)]) == [2, 1, 3, 0]
try:
    topo_kahn(3, [(0, 1), (1, 2), (2, 0)])
except ValueError:
    print("ciclo detectado")
```

No teste completo, as três versões foram validadas em 300 DAGs aleatórios de até 40 nós, e as três detectam o ciclo.

**Complexidade.** Kahn e DFS: $O(V + E)$ tempo e espaço. Com heap: $O((V + E) \log V)$.

### Perguntas de acompanhamento prováveis

- **Como encontrar o ciclo, não só detectar?** Na DFS, quando encontrar um nó cinza, a pilha atual contém o ciclo: desempilhe até esse nó.
- **E se o grafo for enorme e não couber na memória?** Processar em partições, ou usar o algoritmo de Kahn com graus guardados em disco. Para grafos de modelos, isso não acontece; a pergunta testa se você pensa em escala.
- **Como paralelizar a execução de um grafo de operações?** Kahn por níveis: todos os nós com grau zero num mesmo momento podem rodar em paralelo (em streams CUDA diferentes, por exemplo).
- **Como escolher uma ordem que minimize o pico de memória?** É um problema difícil em geral; heurísticas escolhem, entre os nós disponíveis, os que liberam mais memória (cujos tensores de entrada não serão mais usados). Compiladores de ML fazem algo assim.

### Armadilhas comuns

- Esquecer a detecção de ciclo.
- DFS recursiva que estoura a pilha em grafos profundos (o limite padrão do Python é de cerca de mil chamadas).
- Usar `list.pop(0)` como fila (O(n) por operação); use `deque`.
- Confundir a direção das arestas.

## Q099 — Serialize e desserialize uma árvore binária, com código limpo e tempo e espaço ótimos. {#q099}

::: pergunta-meta
**[Relatado]** NVIDIA · Deep Learning Software Engineer, Inference · triagem com o gestor da vaga · 2025 · Médio · [fonte](https://www.datainterview.com/courses/nvidia-inference-engineer/the-loop)
:::

### Resposta em 30 segundos

"Serializo em pré-ordem com um marcador para nulos: valor do nó, depois a subárvore esquerda, depois a direita, com '#' para cada filho ausente, separados por vírgula. Os marcadores tornam a pré-ordem suficiente para reconstruir a árvore sem ambiguidade. Para desserializar, leio os tokens na mesma ordem: cada token não nulo vira um nó e seus dois filhos são os próximos itens. Tudo O(n) em tempo e espaço. Faço as duas funções com pilha explícita, sem recursão, porque uma árvore degenerada com centenas de milhares de nós estouraria a recursão do Python."

### Resposta completa

**Por que os marcadores de nulo.** Uma pré-ordem sozinha não define a árvore: as árvores "1 com filho esquerdo 2" e "1 com filho direito 2" têm a mesma pré-ordem [1, 2]. Com os marcadores: "1,2,#,#,#" e "1,#,2,#,#". Cada nó contribui com exatamente um token, e cada nulo também. Uma árvore com $n$ nós tem $n+1$ nulos, então a string tem $2n+1$ tokens: $O(n)$.

```text
        1
       / \          pré-ordem com nulos:
      2   3         1,2,#,#,3,4,#,#,5,#,#
         / \
        4   5       nível a nível (estilo LeetCode):
                    [1,2,3,null,null,4,5]
```

**Pré-ordem, sem recursão:**

```python
class No:
    def __init__(self, val, esq=None, dir=None):
        self.val, self.esq, self.dir = val, esq, dir


def serializar(raiz):
    """Pré-ordem com marcador '#' para nulo. O(n)."""
    partes, pilha = [], [raiz]
    while pilha:
        no = pilha.pop()
        if no is None:
            partes.append("#")
            continue
        partes.append(str(no.val))
        pilha.append(no.dir)     # dir primeiro: esq sai antes
        pilha.append(no.esq)
    return ",".join(partes)


def desserializar(s):
    """Reconstrói a pré-ordem sem recursão. O(n)."""
    tokens = iter(s.split(","))
    primeiro = next(tokens)
    if primeiro == "#":
        return None
    raiz = No(int(primeiro))
    pilha = [(raiz, 0)]          # (nó, filhos já preenchidos)
    for t in tokens:
        pai, k = pilha.pop()
        filho = None if t == "#" else No(int(t))
        if k == 0:
            pai.esq = filho
            pilha.append((pai, 1))
        else:
            pai.dir = filho
        if filho is not None:
            pilha.append((filho, 0))
    return raiz
```

Como funciona a desserialização: a pilha guarda os nós que ainda esperam filhos, junto com quantos filhos já receberam (0 ou 1). Cada token preenche o próximo filho pendente do nó no topo. Se o token é um nó de verdade, ele entra na pilha para receber os próprios filhos, e como está no topo, os próximos tokens vão para ele, exatamente a ordem da pré-ordem.

**Alternativa: nível a nível (BFS).** É o formato usado pelo LeetCode. Também $O(n)$:

```python
def serializar_bfs(raiz):
    """Estilo LeetCode: nível a nível, remove nulos do fim."""
    saida, fila = [], deque([raiz])
    while fila:
        no = fila.popleft()
        if no is None:
            saida.append("null")
            continue
        saida.append(str(no.val))
        fila.append(no.esq)
        fila.append(no.dir)
    while saida and saida[-1] == "null":
        saida.pop()
    return "[" + ",".join(saida) + "]"


def desserializar_bfs(s):
    itens = s.strip("[]")
    if not itens:
        return None
    vals = itens.split(",")
    raiz = No(int(vals[0]))
    fila, i = deque([raiz]), 1
    while fila and i < len(vals):
        no = fila.popleft()
        for lado in ("esq", "dir"):
            if i < len(vals) and vals[i] != "null":
                filho = No(int(vals[i]))
                setattr(no, lado, filho)
                fila.append(filho)
            i += 1
    return raiz
```

**Teste.** Ida e volta em árvores aleatórias e numa árvore degenerada de 200 mil nós (que quebraria uma versão recursiva):

```python
def iguais(a, b):
    pilha = [(a, b)]
    while pilha:
        x, y = pilha.pop()
        if x is None or y is None:
            if x is not y:
                return False
            continue
        if x.val != y.val:
            return False
        pilha.append((x.esq, y.esq))
        pilha.append((x.dir, y.dir))
    return True
```

```python
exemplo = No(1, No(2), No(3, No(4), No(5)))
print(serializar(exemplo))       # 1,2,#,#,3,4,#,#,5,#,#
print(serializar_bfs(exemplo))   # [1,2,3,null,null,4,5]
assert iguais(exemplo, desserializar(serializar(exemplo)))

fundo = None
for i in range(200_000):         # árvore degenerada
    fundo = No(i, esq=fundo)
assert iguais(fundo, desserializar(serializar(fundo)))
```

No teste completo, as duas formas fizeram ida e volta em 300 árvores aleatórias de até 60 nós.

**Complexidade.** Tempo $O(n)$ nas duas direções. Espaço $O(n)$ para a string e $O(h)$ para a pilha (onde $h$ é a altura; no pior caso, $n$).

**Discussão de formato**, que impressiona um gestor de time de inferência:

- **Texto vs binário**: texto é legível e fácil de depurar; binário é menor e mais rápido. Para muitos nós com inteiros, um formato binário com um bit de presença por filho seria bem mais compacto.
- **Valores com vírgula ou "#"**: se os valores forem strings arbitrárias, é preciso escapar ou usar prefixo de tamanho.
- **Versionamento**: um formato que vai para disco precisa de um número de versão no cabeçalho.
- **Analogia com o trabalho**: serializar estruturas com ponteiros num formato linear, eficiente e versionado é o que formatos de checkpoint (como safetensors) fazem com tensores: cabeçalho com metadados e offsets, dados contíguos, carregamento sem execução de código.

### Perguntas de acompanhamento prováveis

- **Dá para usar só a in-ordem?** Não. A in-ordem sozinha (mesmo com nulos) é ambígua. Pré-ordem ou pós-ordem com marcadores funcionam; in-ordem precisa de mais uma travessia (por exemplo, in-ordem + pré-ordem, sem marcadores, se os valores forem únicos).
- **E se for uma árvore binária de busca?** A pré-ordem **sem** marcadores basta, porque os valores determinam a forma (todos os menores que a raiz ficam à esquerda). Desserialização em $O(n)$ com limites superior e inferior.
- **Como paralelizar a serialização de uma árvore enorme?** Serializar subárvores independentes em paralelo, com cabeçalhos que dizem o tamanho de cada pedaço.
- **Por que evitar recursão?** O limite padrão de recursão do Python é de cerca de mil chamadas; árvores degeneradas (listas) passam disso fácil. Aumentar o limite é frágil e pode derrubar o processo.

### Armadilhas comuns

- Esquecer os marcadores de nulo.
- Recursão sem considerar árvores profundas.
- Usar `pop(0)` em lista como fila.
- Concatenar strings num laço em vez de juntar uma lista (`",".join`), que é quadrático em algumas implementações.

## Resumo do capítulo

- Rodadas de código em inferência misturam algoritmos clássicos, código de ML e depuração de desempenho.
- Método: entender, exemplos, solução simples, otimizar, codar, testar. Escreva os shapes em comentários.
- Ferramentas: `cProfile` e `py-spy` (Python), `torch.profiler` (operadores e kernels), Nsight Systems (linha do tempo), Nsight Compute (kernel), snapshots de memória.
- Erros comuns: sincronizações (`.item()`), laços Python sobre tensores, `torch.cat` crescente, cópias dentro do laço, dtypes misturados, batch 1.
- Loop de inferência: prefill com o prompt, decode com um token e o cache; posições e máscara com padding à esquerda; logits só do último token; uma sincronização por passo; teste com cache vs sem cache e batch vs sozinho.
- Ordenação topológica: Kahn com fila (ou heap para ordem determinística), DFS iterativa com três cores; O(V+E); detecção de ciclo.
- Serialização de árvore: pré-ordem com marcadores de nulo ou BFS; O(n); sem recursão para árvores profundas.

## Checklist para a entrevista

- [ ] Sigo o método de seis passos e falo a complexidade antes de codar.
- [ ] Uso `py-spy`, `torch.profiler` e Nsight Systems e sei o que cada um mostra.
- [ ] Reconheço os erros de desempenho comuns em PyTorch e corrijo cada um.
- [ ] Escrevo um loop de geração com Hugging Face de memória.
- [ ] Escrevo um decoder mínimo com KV cache, RoPE, GQA e máscara de padding.
- [ ] Explico posições e máscara com padding à esquerda.
- [ ] Testo o cache comparando com a geração sem cache.
- [ ] Escrevo Kahn e DFS iterativa com detecção de ciclo.
- [ ] Escrevo serialização de árvore em pré-ordem e BFS, sem recursão.
- [ ] Discuto formatos de serialização (texto, binário, versionamento) e a ligação com checkpoints.
