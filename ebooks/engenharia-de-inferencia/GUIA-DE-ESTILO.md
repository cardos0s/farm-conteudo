# Guia de estilo: ebook "Engenharia de Inferência"

Título do livro: **Engenharia de Inferência: o guia completo para entrevistas**
Subtítulo: *Os 14 temas e as 50 perguntas que caem em OpenAI, Anthropic, NVIDIA, Google e cia., explicados do zero até o nível sênior.*

## Público e tom

- Leitor: pessoa que já programa (Python, um pouco de ML), mas que **não** é especialista em GPU nem em serving. O livro leva essa pessoa do zero até conseguir responder as perguntas no nível que um entrevistador sênior espera.
- "Hipermega explicativo": explique cada conceito do zero antes de aprofundar. Use analogias do dia a dia (cozinha de restaurante, rodovia, estoque, garçom...), depois os números reais, depois o detalhe técnico. Nenhum termo aparece sem ser explicado na primeira vez.
- Português brasileiro, frases curtas e diretas, voz ativa, segunda pessoa ("você"). Sem enrolação, sem frases de efeito vazias, sem "vale ressaltar", "é importante notar".
- Termos técnicos que o mercado brasileiro usa em inglês ficam em inglês (KV cache, batching, throughput, kernel, prefill, decode, warp, shared memory, tensor core, scheduler...). Na primeira aparência no capítulo, explique em português.

## Formato dos arquivos (Pandoc Markdown)

- Um arquivo por capítulo em `capitulos/`, nome `NN-slug.md`.
- O capítulo começa com: `# Capítulo N — Título {#cap-NN}` (NN com dois dígitos: cap-01 … cap-14). Introdução usa `{#introducao}`, apêndices `{#apendice-a}` etc.
- Seções: `## N.1 Título`, subseções `### N.1.1 Título` (só quando ajudar). Não use `#` de nível 1 para nada além do título do capítulo.
- Cada pergunta da lista vira uma seção própria, com este formato exato:

```markdown
## Q009 — O que é um KV cache? O que é FlashAttention? {#q009}

::: pergunta-meta
**[Relatado]** NVIDIA · Senior Software Engineer · entrevista técnica · 2026 · Médio · [fonte](URL)
:::

### Resposta em 30 segundos

(1 parágrafo: o que você falaria se tivesse só meio minuto.)

### Resposta completa

(A explicação profunda: passo a passo, números, diagramas, código quando fizer sentido.)

### Perguntas de acompanhamento prováveis

- **Pergunta?** Resposta curta (2 a 5 frases).
- ...(3 a 6 itens)

### Armadilhas comuns

- ...(erros que candidatos cometem, 3 a 5 itens)
```

- As seções de pergunta ficam **depois** das seções de teoria do capítulo, numa parte chamada `## Perguntas de entrevista comentadas` (escreva essa linha antes da primeira pergunta; as perguntas usam `##` também, logo em seguida).
- Caixas de destaque (fenced divs do Pandoc). Use com moderação, no máximo 1 a cada ~800 palavras:

```markdown
::: analogia
**Analogia:** ...
:::

::: dica
**Dica de entrevista:** ...
:::

::: atencao
**Cuidado:** ...
:::

::: conta
**Fazendo a conta:** ... (contas passo a passo com números reais)
:::
```

- Diagramas: em blocos ` ```text `, desenhados com caracteres ASCII/box-drawing (─ │ ┌ ┐ └ ┘ ├ ┤ ┬ ┴ ┼ ▶ ◀ ▲ ▼). **Máximo 76 caracteres por linha** em qualquer bloco de código ou diagrama (o PDF corta o que passar). Prefira diagramas a parágrafos longos quando houver fluxo, hierarquia, linha do tempo ou layout de memória. Meta: pelo menos 3 diagramas por capítulo.
- Código: blocos com linguagem (` ```python `, ` ```cuda `, ` ```cpp `, ` ```bash `). Código correto, comentado em português, e que roda (ou seria compilável) de verdade. Máximo 76 caracteres por linha.
- Fórmulas: LaTeX do Pandoc, `$...$` inline e `$$...$$` em bloco. Use quando ajudar; sempre explique cada símbolo.
- Tabelas: pipe tables simples, poucas colunas (cabem em página A4).
- Links entre partes do livro: `[Q041](#q041)`, `[Capítulo 6](#cap-06)`.
- Todo capítulo termina com:
  - `## Resumo do capítulo` — 6 a 10 bullets com o essencial.
  - `## Checklist para a entrevista` — lista `- [ ]` com o que você precisa saber explicar sem consultar.

## Estrutura de cada capítulo

1. Abertura curta: por que o tema importa e o que o entrevistador está testando.
2. Teoria do zero ao avançado, em seções numeradas, com analogia, número real, diagrama, código.
3. `## Perguntas de entrevista comentadas` + as perguntas do capítulo no formato acima, com o texto da pergunta e os metadados traduzidos exatamente como na tradução já feita nesta conversa (mantendo a URL da fonte).
4. Resumo + checklist.

Tamanho: **4.000 a 7.000 palavras por capítulo**. Profundidade de verdade, não volume vazio.

## Precisão

- Números de hardware de referência (use estes, e diga "aprox." quando for o caso):
  - H100 SXM: 80 GB HBM3, ~3,35 TB/s, ~989 TFLOPS BF16/FP16 denso (sem esparsidade), ~1.979 TFLOPS FP8 denso, 132 SMs, 50 MB de L2, até 228 KB de shared memory por SM, NVLink 4 com 900 GB/s (bidirecional total por GPU).
  - A100 80GB SXM: ~2,0 TB/s, ~312 TFLOPS BF16 denso, 108 SMs, 40 MB de L2, NVLink 3 com 600 GB/s.
  - PCIe Gen5 x16: ~64 GB/s por sentido. PCIe Gen4 x16: ~32 GB/s por sentido.
  - InfiniBand NDR: 400 Gb/s por porta (~50 GB/s).
  - Warp = 32 threads. Máximo de 1.024 threads por bloco.
  - Exemplo de modelo para contas: Llama 3 70B (80 camadas, d_model 8192, 64 query heads, 8 KV heads com GQA, head_dim 128, vocabulário 128K) e Llama 3 8B (32 camadas, d_model 4096, 32 query heads, 8 KV heads, head_dim 128).
- Não invente resultados de benchmark, números de papers que você não tem certeza ou detalhes internos de empresas (nunca diga "a Anthropic faz assim internamente"). Ao citar técnicas de papers, cite o nome do paper/sistema (ex.: "PagedAttention, do paper do vLLM, Kwon et al., 2023").
- Contas: mostre o passo a passo e confira a aritmética.

## Quem escreve o quê (para não repetir conteúdo)

Cada tema tem um capítulo "dono". Nos outros capítulos, mencione brevemente e aponte o link.

| Arquivo | Capítulo | Dono de |
|---|---|---|
| 00-introducao.md | Introdução | o que é engenharia de inferência, carreira e salários, skills das vagas, como usar o livro, as marcações [Relatado]/[Fornecedor]/[Prática], crédito à fonte das perguntas |
| 01-fundamentos.md | 1 Fundamentos | ciclo de vida de uma requisição, memory-bound vs compute-bound, intensidade aritmética e roofline (intro), TTFT/TPOT/ITL/throughput/goodput, p50/p99, custo por token, sync vs async |
| 02-transformer-internals.md | 2 Transformer e LLMs por dentro | tokenização, embeddings, atenção, MHA/MQA/GQA/MLA, RoPE, FFN/SwiGLU, normalização, sampling (temperature, top-k, top-p), prefill vs decode, KV cache (conceito e pitfalls de corretude), FlashAttention (algoritmo, online softmax) |
| 03-gpu-cuda.md | 3 Arquitetura de GPU e CUDA | SMs, warps, SIMT, hierarquia de memória, occupancy, coalescing, bank conflicts, tensor cores (conceito), Amdahl, GEMM: ingênua → tiling (conceito), GEMM sem shared memory |
| 04-gpu-performance.md | 4 Otimização de desempenho em GPU | roofline a fundo, Nsight Systems/Compute, diagnóstico de banda baixa, latency hiding, ILP, reduções e tamanho de bloco, utilização de tensor cores, torch.compile (Dynamo/Inductor), fusão, CUDA graphs, pipeline de benchmark |
| 05-cuda-triton.md | 5 Kernels CUDA e Triton | GEMM FP32 tiled completa em CUDA, reduções (warp shuffle, determinística/ordenada), Triton (modelo de programação, exemplos), como funcionam vLLM e TensorRT-LLM por dentro (visão de engine) |
| 06-kv-cache.md | 6 KV Cache e memória | tamanho do KV cache (contas), API de cache por camada, beam search, PagedAttention, prefix caching/RadixAttention, offload CPU/SSD, quantização do KV, eviction/preemption, conversas longas, sliding window |
| 07-serving-batching.md | 7 Serving e continuous batching | static vs dynamic vs continuous batching (Orca), scheduler (filas, admissão, preempção), chunked prefill (SARATHI), head-of-line blocking, vLLM vs TensorRT-LLM vs SGLang, design do batching single-GPU |
| 08-quantizacao.md | 8 Quantização e compressão | formatos (FP16/BF16/FP8/INT8/INT4/FP4), PTQ vs QAT vs QAD, GPTQ, AWQ, SmoothQuant, pruning, distilação, quando usar cada |
| 09-inferencia-distribuida.md | 9 Inferência distribuída | TP, PP, DP, EP (MoE), sequence/context parallel, GEMM multi-GPU, desagregação prefill/decode (DistServe, Splitwise, Mooncake) |
| 10-redes-comunicacao.md | 10 Redes e comunicação entre GPUs | NCCL e coletivas, ring vs tree all-reduce (custos α-β), NVLink/NVSwitch, PCIe, InfiniBand/RoCE, GPUDirect RDMA, Kubernetes + GPU (device plugin, GPU Operator), CI/CD de infra |
| 11-system-design.md | 11 Design de sistemas de inferência | framework de resposta para system design de inferência, estimativas de capacidade, design do serviço de alta concorrência, API multi-modelo, distribuição de pesos |
| 12-confiabilidade.md | 12 Confiabilidade e observabilidade | métricas, SLOs, tracing, falhas da stack de inferência (OOM, NaN, Xid, NCCL hang, stragglers), Kubernetes Pending, tail latency e endpoints dedicados, incidentes e runbooks |
| 13-coding.md | 13 Programação e depuração de desempenho | loop de inferência em PyTorch (com KV cache e sampling), topological sort, serializar árvore binária, profiling (torch.profiler, py-spy, nsys), como se comportar no coding round |
| 14-arquitetura-avancada.md | 14 Arquitetura avançada | APIs dinamicamente batcheadas, multi-modelo/multi-versão, multi-LoRA, speculative decoding (draft, Medusa, EAGLE), structured output, multimodal e upload de arquivos grandes, MoE serving |
| 90-apendices.md | Apêndices | A: números de referência; B: glossário; C: plano de estudo de 30 dias; D: as 50 perguntas em uma tabela com link; E: referências (papers e docs) |
