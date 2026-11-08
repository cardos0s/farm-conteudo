# Apêndice A — Números e fórmulas de referência {#apendice-a}

Os números abaixo são aproximados e servem para contas de guardanapo. Confira as especificações da geração de hardware com que você vai trabalhar.

## A.1 Hardware

| Item | Valor aproximado |
|---|---|
| H100 SXM: memória | 80 GB HBM3 |
| H100 SXM: banda de memória | ~3,35 TB/s |
| H100 SXM: BF16/FP16 denso (tensor cores) | ~989 TFLOPS |
| H100 SXM: FP8 denso | ~1.979 TFLOPS |
| H100 SXM: FP32 (sem tensor cores) | ~67 TFLOPS |
| H100 SXM: SMs / L2 / shared por SM | 132 / 50 MB / até 228 KB |
| H100: NVLink 4 | 900 GB/s total por GPU (~450 por sentido) |
| A100 80GB SXM: banda / BF16 denso | ~2,0 TB/s / ~312 TFLOPS |
| A100: SMs / L2 / NVLink 3 | 108 / 40 MB / 600 GB/s total |
| PCIe Gen4 / Gen5 x16 | ~32 / ~64 GB/s por sentido |
| InfiniBand NDR (por porta) | 400 Gb/s ≈ 50 GB/s |
| Warp | 32 threads (wavefront na AMD: 64 ou 32) |
| Threads por bloco (máx.) | 1.024 |
| Registradores por SM (H100) | 65.536 × 32 bits (256 KB) |
| Warps por SM (H100) | até 64 (2.048 threads) |

## A.2 Modelos de exemplo

| | Llama 3 8B | Llama 3 70B |
|---|---|---|
| Camadas | 32 | 80 |
| d_model | 4.096 | 8.192 |
| Heads de query / KV | 32 / 8 | 64 / 8 |
| head_dim | 128 | 128 |
| MLP | 14.336 | 28.672 |
| Vocabulário | 128.256 | 128.256 |
| Pesos em BF16 | ~16 GB | ~140 GB |
| KV por token em BF16 | 128 KiB | 320 KiB |

## A.3 Fórmulas

| O quê | Fórmula |
|---|---|
| FLOPs por token (forward, sem atenção) | $\approx 2 \times \text{parâmetros}$ |
| FLOPs da atenção no prefill (com máscara causal) | $\approx 2 \times L \times T^2 \times d_{model}$ |
| KV cache por token | $2 \times L \times H_{kv} \times d_{head} \times \text{bytes}$ |
| Tempo mínimo de um passo de decode | $(\text{bytes dos pesos} + \text{bytes do KV lido}) / \text{banda}$ |
| Intensidade aritmética | FLOPs ÷ bytes lidos |
| Ponto de equilíbrio (ridge point) | pico de FLOPS ÷ banda (H100 BF16: ~295) |
| Roofline | $\min(\text{pico},\ \text{banda} \times \text{intensidade})$ |
| Latência E2E | $\text{TTFT} + (N-1) \times \text{TPOT}$ |
| Custo por 1M tokens | $\text{custo/h} \div \text{tokens/h} \times 10^6$ |
| Lei de Little | itens no sistema = taxa de chegada × tempo no sistema |
| Espera em fila (intuição) | cresce como $\rho / (1 - \rho)$ |
| Amdahl | $1 / ((1-p) + p/s)$ |
| All-reduce em anel | $2(p-1)\alpha + 2\frac{p-1}{p}\frac{n}{B}$ |
| busbw do all-reduce | $\text{algbw} \times 2(p-1)/p$ |
| Intensidade de GEMM em tiles (FP32) | $2 \cdot BM \cdot BN / (4(BM + BN))$ |
| Speculative decoding | $E[\text{tokens}] = (1 - \alpha^{k+1}) / (1 - \alpha)$ |
| Quantização linear | $q = \text{round}(x/s) + z$, $\hat{x} = s(q - z)$ |

## A.4 Regras práticas

- Decode com batch pequeno é memory-bound; prefill com prompts de centenas de tokens ou mais é compute-bound.
- Llama 3 8B numa H100: no máximo ~210 tokens/s para um usuário sozinho (16 GB ÷ 3,35 TB/s).
- Quantizar os pesos de 16 para 8 bits deixa o decode perto de 2× mais rápido no limite teórico; para 4 bits, perto de 4× (menos na prática).
- Tensor parallelism dentro do nó; pipeline parallelism entre nós.
- Mensagens de comunicação abaixo de alguns MB pagam latência; acima, pagam banda.
- Com o SLO de cauda rígido, opere bem abaixo de 100% de utilização.

# Apêndice B — Glossário {#apendice-b}

**Adaptador LoRA**: matrizes de posto baixo somadas aos pesos de um modelo base para especializá-lo.

**All-reduce**: operação coletiva em que todas as GPUs terminam com a soma (ou outra redução) dos dados de todas.

**All-to-all**: cada GPU envia um pedaço diferente para cada outra; usado no expert parallelism.

**AWQ**: método de quantização de pesos que protege canais salientes com escalas, guiado pelas ativações.

**Bank conflict**: duas threads de um warp acessando endereços diferentes no mesmo banco da shared memory, o que serializa os acessos.

**Batching contínuo (continuous batching)**: agendamento por iteração; sequências entram e saem do batch a cada passo.

**BF16**: formato de 16 bits com 8 bits de expoente (mesma faixa do FP32) e 7 de mantissa.

**Bloco (CUDA)**: grupo de até 1.024 threads que roda num único SM e compartilha shared memory.

**Chunked prefill**: dividir o prefill de um prompt longo em pedaços misturados aos decodes.

**Coalescing**: threads vizinhas de um warp lendo endereços vizinhos, permitindo poucas transações de memória.

**Compute-bound**: limitado pela capacidade de cálculo.

**Copy-on-write**: compartilhar um bloco até alguém precisar escrever nele; aí ele é copiado.

**CUDA graph**: sequência de kernels gravada uma vez e reexecutada com um único lançamento.

**DCGM**: ferramenta da NVIDIA para monitorar e diagnosticar GPUs em data centers.

**Decode**: fase da geração que produz um token por passo, lendo pesos e KV cache.

**Desagregação**: separar prefill e decode em pools de GPUs diferentes.

**Device plugin**: componente que anuncia GPUs ao Kubernetes como recurso (`nvidia.com/gpu`).

**Distilação**: treinar um modelo menor para imitar um maior.

**EP (expert parallelism)**: especialistas de um MoE distribuídos entre GPUs.

**FlashAttention**: atenção exata e ciente da memória, com tiling e softmax online.

**FP8 (E4M3, E5M2)**: formatos de 8 bits de ponto flutuante; E4M3 tem mais precisão, E5M2 mais faixa.

**Fusão de kernels**: juntar operações num único kernel para os dados intermediários não irem à HBM.

**Goodput**: throughput que cumpre o SLO.

**GPTQ**: quantização de pesos que compensa o erro de arredondamento coluna a coluna com informação de segunda ordem.

**GQA**: grouped-query attention; grupos de heads de query compartilham uma head de K e V.

**HBM**: memória principal da GPU, de alta banda.

**Head-of-line blocking**: item no começo de uma fila travando os que estão atrás.

**In-flight batching**: nome da NVIDIA para continuous batching.

**Intensidade aritmética**: FLOPs por byte lido da memória.

**ITL**: inter-token latency; tempo entre dois tokens seguidos.

**Kernel**: função que roda na GPU em muitas threads.

**KV cache**: K e V dos tokens já processados, guardados por camada para não recalcular.

**Lei de Little**: itens no sistema = taxa × tempo no sistema.

**MBU / MFU**: utilização da banda de memória / dos FLOPS, em relação ao pico.

**Memory-bound**: limitado pela banda de memória.

**MIG**: divisão de uma GPU em instâncias isoladas em hardware.

**MLA**: multi-head latent attention; comprime K e V num vetor latente por token.

**MoE**: mixture of experts; cada token usa só alguns especialistas do MLP.

**MQA**: multi-query attention; uma única head de K e V para todas as queries.

**NCCL**: biblioteca de comunicação coletiva da NVIDIA.

**NVLink / NVSwitch**: ligação de alta banda entre GPUs / switch que liga todas as GPUs de um nó.

**Occupancy**: warps ativos num SM ÷ máximo possível.

**PagedAttention**: KV cache em blocos de tamanho fixo com tabela de blocos, como memória virtual.

**Prefill**: fase que processa o prompt inteiro de uma vez e preenche o KV cache.

**Prefix caching**: reaproveitar o KV cache de prefixos já calculados.

**Preempção**: tirar uma sequência do batch para liberar memória (recomputando ou fazendo swap depois).

**PP (pipeline parallelism)**: camadas divididas em estágios em GPUs diferentes.

**PTQ / QAT / QAD**: quantização pós-treino / com treino simulando quantização / com treino e distilação de um professor.

**RDMA**: acesso direto à memória de outra máquina sem passar pela CPU.

**Roofline**: modelo que limita a performance por pico de cálculo e por banda × intensidade.

**RoPE**: codificação de posição que gira Q e K por um ângulo proporcional à posição.

**Shared memory**: memória rápida dentro do SM, compartilhada pelas threads de um bloco.

**SIMT**: modelo em que as 32 threads de um warp executam a mesma instrução.

**SLI / SLO**: indicador / objetivo de nível de serviço.

**SM**: streaming multiprocessor, a unidade de execução da GPU NVIDIA.

**SmoothQuant**: migra a dificuldade de quantizar ativações para os pesos com escalas por canal.

**Speculative decoding**: rascunho propõe tokens, modelo alvo verifica vários de uma vez.

**STE**: straight-through estimator; trata o arredondamento como identidade no backward.

**Tensor core**: unidade da GPU especializada em multiplicação de matrizes pequenas.

**TP (tensor parallelism)**: cada matriz dividida entre GPUs.

**TPOT**: tempo médio por token gerado depois do primeiro.

**Triton**: linguagem em Python para escrever kernels de GPU por blocos.

**TTFT**: tempo até o primeiro token.

**Warp**: grupo de 32 threads que executa junto.

**Xid**: código de erro reportado pelo driver NVIDIA.

# Apêndice C — Plano de estudo de 30 dias {#apendice-c}

Uma a duas horas por dia. Ajuste a ordem ao perfil da vaga ([Introdução](#introducao)).

```text
 SEMANA 1 — FUNDAMENTOS
 dia 1   Cap. 1 até 1.3 (prefill/decode, memory-bound, roofline)
 dia 2   Cap. 1 até o fim; refaça todas as contas à mão
 dia 3   Cap. 2 até 2.6 (decoder, atenção, GQA, RoPE, sampling)
 dia 4   Cap. 2 até o fim (KV cache, FlashAttention)
 dia 5   Prática: rode e modifique o código da Q097 (mini LLM)
 dia 6   Cap. 6 (KV cache e memória)
 dia 7   Revisão: responda Q001–Q011 e Q041–Q044 em voz alta

 SEMANA 2 — SERVING E COMPRESSÃO
 dia 8   Cap. 7 até 7.5 (batching, scheduler, chunked prefill)
 dia 9   Cap. 7 até o fim; escreva o batcher da Q049 de memória
 dia 10  Cap. 8 até 8.6 (formatos, escalas, outliers)
 dia 11  Cap. 8 até o fim (GPTQ, AWQ, QAT, QAD, distilação)
 dia 12  Prática: sirva um modelo pequeno com vLLM; meça TTFT
         e TPOT com batch 1 a 64, BF16 vs quantizado
 dia 13  Cap. 14.1 a 14.3 (speculative, multi-LoRA, saídas
         estruturadas)
 dia 14  Revisão: Q049–Q059 em voz alta, com contas

 SEMANA 3 — GPU E DISTRIBUÍDO
 dia 15  Cap. 3 até 3.5 (SMs, warps, memória, occupancy)
 dia 16  Cap. 3 até o fim; escreva a GEMM com tiling de memória
 dia 17  Cap. 4 (método, roofline, Little, fusão, CUDA graphs)
 dia 18  Cap. 5 (GEMM 2D, reduções, Triton)
 dia 19  Cap. 9 (TP, PP, EP, desagregação)
 dia 20  Cap. 10 (interconexões, coletivas, NCCL, Kubernetes)
 dia 21  Revisão: Q017–Q035 e Q065–Q075

 SEMANA 4 — DESIGN, OPERAÇÃO E SIMULAÇÕES
 dia 22  Cap. 11 (roteiro e arquitetura de referência)
 dia 23  Faça a Q081 sozinho em 45 min, cronometrando
 dia 24  Cap. 12 (confiabilidade); Q089 e Q090
 dia 25  Cap. 14 até o fim; Q105–Q107
 dia 26  Cap. 13; resolva Q098 e Q099 sem consultar
 dia 27  Simulação 1: design (peça a alguém para entrevistar)
 dia 28  Simulação 2: código + conceitos
 dia 29  Prepare 3 histórias (otimização, incidente, kernel)
         no formato contexto → medição → mudança → resultado
 dia 30  Revise os checklists de todos os capítulos
```

# Apêndice D — As 50 perguntas {#apendice-d}

| ID | Pergunta (resumida) | Marcação | Empresa | Capítulo |
|---|---|---|---|---|
| [Q001](#q001) | Experiência com otimização de inferência | Relatado | Groq | 1 |
| [Q002](#q002) | Por que a inferência é memory-bound | Fornecedor | — | 1 |
| [Q003](#q003) | TTFT, TPOT e throughput | Fornecedor | — | 1 |
| [Q004](#q004) | Forward pass na GPU | Fornecedor | — | 1 |
| [Q007](#q007) | Custo acima do orçamento | Fornecedor | — | 1 |
| [Q008](#q008) | Síncrona vs assíncrona | Fornecedor | — | 1 |
| [Q009](#q009) | KV cache e FlashAttention | Relatado | NVIDIA | 2 |
| [Q010](#q010) | Armadilhas do KV cache | Relatado | Startups.com | 2 |
| [Q011](#q011) | Prefill vs decode | Fornecedor | — | 2 |
| [Q017](#q017) | Modelo de execução CUDA + GEMM | Relatado | NVIDIA | 3 |
| [Q018](#q018) | Lei de Amdahl | Relatado | NVIDIA | 3 |
| [Q019](#q019) | GEMM sem shared memory | Relatado | NVIDIA | 3 |
| [Q020](#q020) | Um kernel CUDA que você escreveu | Relatado | NVIDIA | 3 |
| [Q025](#q025) | Kernel a 30% da banda | Fornecedor | NVIDIA | 4 |
| [Q026](#q026) | Redução: 64 vs 256 threads | Fornecedor | NVIDIA | 4 |
| [Q027](#q027) | Alta utilização de tensor cores | Relatado | AMD | 4 |
| [Q028](#q028) | Pipeline otimizado e benchmark | Relatado | NVIDIA | 4 |
| [Q033](#q033) | GEMM FP32 em CUDA | Relatado | NVIDIA | 5 |
| [Q034](#q034) | Redução determinística | Relatado | Applied | 5 |
| [Q035](#q035) | Como funcionam TensorRT-LLM e vLLM | Relatado | NVIDIA | 5 |
| [Q041](#q041) | Implementar KV cache | Relatado | Applied Intuition | 6 |
| [Q042](#q042) | Sem memória em conversas longas | Fornecedor | Meta | 6 |
| [Q043](#q043) | Reenvio da conversa inteira | Fornecedor | Moonshot AI | 6 |
| [Q044](#q044) | PagedAttention | Fornecedor | — | 6 |
| [Q049](#q049) | Batching numa GPU, até 100 entradas | Relatado | Anthropic | 7 |
| [Q050](#q050) | Criticar design de batching | Relatado | Anthropic | 7 |
| [Q051](#q051) | Quando TensorRT-LLM ganha do vLLM | Fornecedor | — | 7 |
| [Q052](#q052) | Scheduler de continuous batching | Fornecedor | — | 7 |
| [Q053](#q053) | Batching sem head-of-line blocking | Fornecedor | Together AI | 7 |
| [Q057](#q057) | Quantização, QAT e QAD | Relatado | NVIDIA | 8 |
| [Q058](#q058) | Técnicas de otimização | Relatado | NVIDIA | 8 |
| [Q059](#q059) | Quantização vs distilação | Fornecedor | — | 8 |
| [Q065](#q065) | Tensor vs pipeline parallelism | Relatado | NVIDIA | 9 |
| [Q066](#q066) | GEMM em múltiplas GPUs | Relatado | Google | 9 |
| [Q067](#q067) | Desagregação de prefill e decode | Fornecedor | Moonshot AI | 9 |
| [Q073](#q073) | GPUs, CI/CD, comunicação, Kubernetes | Relatado | Fireworks AI | 10 |
| [Q074](#q074) | Ring vs tree all-reduce | Prática | — | 10 |
| [Q075](#q075) | NVLink, PCIe e InfiniBand | Prática | — | 10 |
| [Q081](#q081) | Serviço de LLM de alta concorrência | Relatado | Anthropic | 11 |
| [Q082](#q082) | API de inferência multi-modelo | Relatado | Anthropic | 11 |
| [Q083](#q083) | Distribuição de pesos | Relatado | Anthropic | 11 |
| [Q089](#q089) | Pod em Pending | Relatado | CoreWeave | 12 |
| [Q090](#q090) | Stack de inferência e falhas | Relatado | Anthropic | 12 |
| [Q091](#q091) | Endpoint dedicado com p99 rígido | Fornecedor | Together AI | 12 |
| [Q097](#q097) | Loop de inferência em PyTorch | Relatado | NVIDIA | 13 |
| [Q098](#q098) | Ordenação topológica | Relatado | NVIDIA | 13 |
| [Q099](#q099) | Serializar árvore binária | Relatado | NVIDIA | 13 |
| [Q105](#q105) | API com batching dinâmico | Relatado | Anthropic | 14 |
| [Q106](#q106) | Vários modelos e versões | Relatado | Anthropic | 14 |
| [Q107](#q107) | Upload multimodal para chat | Relatado | xAI | 14 |

# Apêndice E — Referências {#apendice-e}

## Fonte das perguntas

- AI Engineering Insider. *You should never walk into an Inference Engineering interview without knowing these 50 questions.* <https://aiengineeringinsider.substack.com/p/you-should-never-walk-into-an-inference>

## Arquitetura de modelos

- Vaswani et al., 2017. *Attention Is All You Need.*
- Shazeer, 2019. *Fast Transformer Decoding: One Write-Head is All You Need* (MQA).
- Ainslie et al., 2023. *GQA: Training Generalized Multi-Query Transformer Models from Multi-Head Checkpoints.*
- DeepSeek-AI, 2024. *DeepSeek-V2* (MLA).
- Su et al., 2021. *RoFormer: Enhanced Transformer with Rotary Position Embedding* (RoPE).

## Atenção e kernels

- Milakov e Gimelshein, 2018. *Online normalizer calculation for softmax.*
- Dao et al., 2022. *FlashAttention.* Dao, 2023. *FlashAttention-2.* Shah et al., 2024. *FlashAttention-3.*
- Volkov, 2010. *Better Performance at Lower Occupancy.*
- Williams, Waterman e Patterson, 2009. *Roofline: An Insightful Visual Performance Model.*
- Tillet et al., 2019. *Triton: An Intermediate Language and Compiler for Tiled Neural Network Computations.*

## Serving

- Yu et al., 2022. *Orca: A Distributed Serving System for Transformer-Based Generative Models.*
- Kwon et al., 2023. *Efficient Memory Management for Large Language Model Serving with PagedAttention* (vLLM).
- Agrawal et al., 2023. *SARATHI.* Agrawal et al., 2024. *Sarathi-Serve.*
- Zheng et al., 2024. *SGLang* (RadixAttention).
- Zhong et al., 2024. *DistServe.*
- Patel et al., 2024. *Splitwise.*
- Qin et al., 2024. *Mooncake: A KVCache-centric Disaggregated Architecture for LLM Serving.*
- Prabhu et al., 2024. *vAttention.*
- Chen et al., 2023. *Punica.* Sheng et al., 2023. *S-LoRA.*

## KV cache

- Xiao et al., 2023. *Efficient Streaming Language Models with Attention Sinks* (StreamingLLM).
- Zhang et al., 2023. *H2O: Heavy-Hitter Oracle.*
- Liu et al., 2024. *KIVI.*

## Quantização e compressão

- Dettmers et al., 2022. *LLM.int8().*
- Xiao et al., 2023. *SmoothQuant.*
- Frantar et al., 2022. *GPTQ.*
- Lin et al., 2023. *AWQ.*
- Frantar e Alistarh, 2023. *SparseGPT.*
- Hinton, Vinyals e Dean, 2015. *Distilling the Knowledge in a Neural Network.*

## Paralelismo

- Shoeybi et al., 2019. *Megatron-LM.*
- Liu et al., 2023. *Ring Attention with Blockwise Transformers.*

## Speculative decoding

- Leviathan et al., 2023. *Fast Inference from Transformers via Speculative Decoding.*
- Chen et al., 2023. *Accelerating Large Language Model Decoding with Speculative Sampling.*
- Cai et al., 2024. *Medusa.* Li et al., 2024. *EAGLE.*

## Documentação

- NVIDIA: *CUDA C++ Programming Guide*, *CUDA C++ Best Practices Guide*, documentação do Nsight Systems, Nsight Compute, NCCL, DCGM e GPU Operator.
- PyTorch: documentação de `torch.compile`, `torch.profiler` e CUDA graphs.
- Documentação do vLLM, TensorRT-LLM, SGLang e Triton (tutoriais).
