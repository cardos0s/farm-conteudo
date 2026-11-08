# Capítulo 10 — Redes e Comunicação entre GPUs {#cap-10}

Assim que um modelo passa a ocupar mais de uma GPU, a comunicação vira parte do caminho crítico. No [Capítulo 9](#cap-09), o tensor parallelism fazia 160 all-reduces por passo de decode no 70B; a desagregação transferia gigabytes de KV cache entre máquinas. Se a comunicação for lenta, nenhuma otimização de kernel salva o sistema.

Este capítulo cobre o hardware de interconexão (PCIe, NVLink, NVSwitch, InfiniBand), as operações coletivas e seus custos, a biblioteca NCCL e a camada de orquestração (Kubernetes com GPUs). Vagas de infraestrutura de IA, como as da Fireworks AI e da CoreWeave, cobram muito este tema.

## 10.1 As interconexões

| Ligação | Liga | Banda (aprox.) | Latência (ordem) |
|---|---|---|---|
| HBM3 (H100) | GPU ↔ sua memória | ~3,35 TB/s | centenas de ns |
| NVLink 4 (H100) | GPU ↔ GPU no nó | 900 GB/s total por GPU (~450 por sentido) | ~µs |
| NVLink-C2C (Grace Hopper) | CPU Grace ↔ GPU | 900 GB/s total | ~µs |
| PCIe Gen5 x16 | CPU ↔ GPU, NIC ↔ GPU | ~64 GB/s por sentido | ~µs |
| PCIe Gen4 x16 | idem, geração anterior | ~32 GB/s por sentido | ~µs |
| InfiniBand NDR | nó ↔ nó (por porta) | 400 Gb/s = ~50 GB/s | poucos µs |
| Ethernet com RoCE | nó ↔ nó | 100–400 Gb/s por porta | poucos µs a dezenas |

Repare nos degraus: da memória da GPU para a NVLink, uma ordem de grandeza; da NVLink para a rede entre nós, outra ordem de grandeza. **O design de sistemas distribuídos de GPU é organizar o trabalho para que a comunicação pesada fique nos degraus mais rápidos.**

### Termos que você precisa conhecer

- **NVLink**: ligação ponto a ponto de alta banda entre GPUs NVIDIA.
- **NVSwitch**: um switch de NVLink. Num servidor HGX H100, 4 NVSwitches conectam as 8 GPUs **todas com todas**, com banda total de NVLink entre qualquer par. Gerações mais novas estendem o domínio NVLink para um rack inteiro (como os sistemas NVL72, com 72 GPUs Blackwell num único domínio NVLink).
- **NVLink SHARP (NVLS)**: os NVSwitches da Hopper podem fazer parte da **redução** dentro do switch, o que reduz o tráfego de um all-reduce.
- **InfiniBand (IB)**: rede de baixa latência e alta banda para clusters, com RDMA nativo. **SHARP** também existe nos switches InfiniBand, fazendo reduções dentro da rede.
- **RDMA** (remote direct memory access): uma máquina lê ou escreve a memória de outra sem passar pela CPU nem pelo kernel do sistema operacional.
- **RoCE** (RDMA over Converged Ethernet): RDMA sobre Ethernet. Mais barato e comum, mas exige configuração cuidadosa para evitar perda de pacotes (controle de fluxo, gerenciamento de congestionamento).
- **GPUDirect RDMA**: a placa de rede lê e escreve **direto na memória da GPU**, sem copiar para a memória da CPU no meio.
- **GPUDirect Storage**: o mesmo, entre armazenamento NVMe e a GPU.

## 10.2 Anatomia de um nó HGX H100

```text
 ┌──────────────────────────── nó ─────────────────────────────┐
 │  CPU 0 ─────── (UPI) ─────── CPU 1          memória da CPU  │
 │    │                           │            (1–2 TB)        │
 │  switches PCIe               switches PCIe                  │
 │  │    │    │    │            │    │    │    │               │
 │ GPU0 NIC0 GPU1 NIC1         GPU4 NIC4 GPU5 NIC5  ...        │
 │ GPU2 NIC2 GPU3 NIC3         GPU6 NIC6 GPU7 NIC7             │
 │  │         │                 │         │                    │
 │  └─────────┴──── NVLink ─────┴─────────┘                    │
 │        ┌──────────┬──────────┬──────────┐                   │
 │        │ NVSwitch │ NVSwitch │ NVSwitch │ NVSwitch          │
 │        └──────────┴──────────┴──────────┘                   │
 │  (todas as 8 GPUs ligadas a todos os NVSwitches)            │
 └─────────────────────────────────────────────────────────────┘
   cada NIC (ex.: 400 Gb/s) ──▶ rede InfiniBand / RoCE do cluster
```

Detalhes que mostram experiência:

- **Uma NIC por GPU**, cada uma ligada ao mesmo switch PCIe da sua GPU. Assim, com GPUDirect RDMA, os dados vão da GPU para a NIC sem atravessar a CPU. Usar a NIC "errada" (ligada a outra CPU) derruba a banda.
- **Afinidade NUMA**: o processo que controla a GPU 0 deveria rodar nos núcleos da CPU 0 e usar a memória dela.
- **Rails**: em clusters grandes, a NIC $i$ de todos os nós vai para o mesmo grupo de switches (o "rail" $i$). Coletivas entre GPUs de mesmo índice em nós diferentes ficam no mesmo rail, com menos saltos.

## 10.3 As operações coletivas

```text
 4 GPUs, cada uma começa com um vetor (a, b, c, d)

 BROADCAST (da GPU 0)        REDUCE (soma, para a GPU 0)
 a . . .  ─▶ a a a a         a b c d ─▶ (a+b+c+d) . . .

 ALL-REDUCE (soma)           ALL-GATHER
 a b c d ─▶ S S S S          a b c d ─▶ [abcd] [abcd] [abcd] [abcd]
 (S = a+b+c+d em todas)      (todas recebem todos os pedaços)

 REDUCE-SCATTER              ALL-TO-ALL
 cada GPU termina com        cada GPU tem 4 pedaços, um para
 1/4 da soma                 cada destino; troca todos com todos
 a b c d ─▶ S0 S1 S2 S3      [a0a1a2a3] ... ─▶ [a0b0c0d0] ...
```

Onde cada uma aparece em inferência:

| Coletiva | Uso |
|---|---|
| All-reduce | tensor parallelism (2 por camada) |
| All-gather | juntar fatias (ex.: logits divididos por vocabulário no TP) |
| Reduce-scatter | variantes de TP com sequence parallelism |
| All-to-all | expert parallelism (dispatch e combine do MoE) |
| Send/recv (ponto a ponto) | pipeline parallelism, transferência de KV na desagregação |
| Broadcast | distribuir pesos ou estado inicial |

Uma identidade útil: **all-reduce = reduce-scatter + all-gather**.

## 10.4 O modelo α-β

Para estimar o custo de uma comunicação, use:

$$T(n) = \alpha + \frac{n}{B}$$

- $\alpha$: latência fixa por mensagem (software, sincronização, rede).
- $B$: banda do enlace. $n/B$ é o tempo para "empurrar" os bytes.

Mensagens **pequenas** são dominadas por $\alpha$ (latency-bound). Mensagens **grandes**, por $n/B$ (bandwidth-bound). O tamanho de mensagem em que os dois termos se igualam é $n^* = \alpha B$.

::: conta
**Fazendo a conta (valores ilustrativos):** NVLink com $\alpha \approx 5\ \mu s$ por etapa e $B \approx 450$ GB/s.

- $n^* = 5 \times 10^{-6} \times 450 \times 10^9 \approx$ **2,25 MB**.
- Um all-reduce do decode com batch 64 no 70B (1 MB) está abaixo de $n^*$: é dominado pela latência.
- Um all-reduce do prefill de 8.000 tokens (131 MB) está muito acima: é dominado pela banda.
- Conclusão: para o decode, reduzir o **número** de coletivas e a latência de cada uma importa mais do que a banda. Para o prefill, o contrário.
:::

## 10.5 Ring vs tree all-reduce

**Ring (anel).** As $p$ GPUs formam um anel. O vetor de $n$ bytes é dividido em $p$ pedaços.

```text
 Fase 1: reduce-scatter (p−1 etapas)
   em cada etapa, cada GPU envia um pedaço para a próxima
   e soma o que recebe no pedaço correspondente
   ao fim, cada GPU tem UM pedaço completamente somado

 Fase 2: all-gather (p−1 etapas)
   os pedaços somados circulam pelo anel até todas
   terem todos

 GPU0 ─▶ GPU1 ─▶ GPU2 ─▶ GPU3 ─┐
   ▲                           │
   └───────────────────────────┘
```

Custo:

$$T_{ring} = 2(p-1)\,\alpha + 2\,\frac{p-1}{p}\,\frac{n}{B}$$

O termo de banda tende a $2n/B$ quando $p$ cresce: **ótimo em banda** (cada GPU envia e recebe o mínimo possível). Mas o termo de latência cresce **linearmente** com $p$.

**Tree (árvore).** A redução sobe por uma árvore até a raiz e o resultado desce por ela. Com pipelining (dividir a mensagem em pedaços que fluem pela árvore), o custo fica perto de:

$$T_{tree} \approx 2\log_2(p)\,\alpha + c \cdot \frac{n}{B}$$

com $c$ pequeno (perto de 2 em implementações com duas árvores complementares, como a **double binary tree** do NCCL, que usa as duas direções dos enlaces). A latência cresce só com $\log p$.

| | Ring | Tree (com pipelining) |
|---|---|---|
| Etapas de latência | $2(p-1)$ | $\sim 2 \log_2 p$ |
| Banda | ótima ($\to 2n/B$) | perto da ótima |
| Melhor para | mensagens grandes, $p$ pequeno ou médio | mensagens pequenas, $p$ grande |
| Exemplo | prefill com TP=8 no nó | decode com TP; all-reduce com milhares de GPUs |

::: conta
**Fazendo a conta:** com $\alpha$ = 5 µs, 450 GB/s, $p$ = 8.

- 1 MB: ring = 14 × 5 µs + 1,75 MB / 450 GB/s ≈ 70 + 3,9 = **74 µs**; tree ≈ 6 × 5 µs + ~2 MB / 450 GB/s ≈ 30 + 4,4 = **34 µs**. A árvore ganha.
- 1 GB: ring ≈ 0,07 ms + 3,9 ms ≈ **3,97 ms**; tree ≈ 0,03 ms + 4,4 ms ≈ **4,43 ms**. O anel ganha.
- Com $p$ = 1.024 e 1 MB: ring = 2.046 × 5 µs ≈ **10 ms** só de latência; tree ≈ 20 × 5 µs = **0,1 ms**.
:::

Na prática, o NCCL escolhe o algoritmo (ring, tree, NVLS e outros) e o protocolo automaticamente, com base no tamanho da mensagem e na topologia. Reduções dentro do switch (NVLS no NVSwitch, SHARP no InfiniBand) mudam a conta: cada GPU envia seus dados uma vez e recebe o resultado uma vez.

## 10.6 NCCL na prática

O **NCCL** (NVIDIA Collective Communications Library) implementa as coletivas para GPUs NVIDIA (na AMD, o equivalente é o RCCL). O PyTorch o usa por baixo do `torch.distributed` com `backend="nccl"`.

Conceitos:

- **Comunicador**: o grupo de GPUs que participa das coletivas (um por grupo de TP, outro por grupo de PP, etc.).
- **Algoritmos**: ring, tree, NVLS, CollNet (com SHARP), entre outros.
- **Protocolos**: LL (low latency, para mensagens pequenas), LL128, Simple (para grandes).
- **Canais**: o NCCL usa vários "canais" em paralelo (cada um com seus blocos de GPU) para ocupar vários enlaces.

Para medir e depurar:

```bash
# benchmark de all-reduce de 8 B a 8 GB, 8 GPUs (nccl-tests)
./build/all_reduce_perf -b 8 -e 8G -f 2 -g 8

# logs detalhados: topologia detectada, algoritmos, NICs
NCCL_DEBUG=INFO NCCL_DEBUG_SUBSYS=INIT,NET python treino.py

# forçar interface e NICs (útil quando a detecção erra)
NCCL_SOCKET_IFNAME=eth0 NCCL_IB_HCA=mlx5_0,mlx5_1 ...
```

O `nccl-tests` reporta duas bandas:

- **algbw** (banda do algoritmo): tamanho da mensagem ÷ tempo.
- **busbw** (banda do barramento): algbw corrigida pelo fator do algoritmo; para all-reduce, $\text{busbw} = \text{algbw} \times 2(p-1)/p$. É a métrica comparável com a banda do hardware: num nó H100 saudável, o busbw de all-reduce para mensagens grandes deve ficar perto da banda de NVLink por sentido.

Um busbw muito abaixo do esperado indica problema: NVLink degradado, NIC errada, afinidade NUMA ruim, cabo com defeito, configuração de RoCE com perdas.

::: atencao
**Cuidado:** coletivas são **bloqueantes em grupo**. Se uma GPU do comunicador não chega à coletiva (travou, ficou lenta, deu erro), todas as outras ficam esperando para sempre. Esse "NCCL hang" é um dos incidentes mais comuns em sistemas distribuídos de GPU. Configure timeouts (`timeout` no `init_process_group` e o watchdog do PyTorch) e monitore stragglers. Ver [Capítulo 12](#cap-12).
:::

## 10.7 Kubernetes e GPUs

A maior parte das frotas de inferência roda em Kubernetes. As peças específicas de GPU:

```text
 ┌──────────────────────── nó com GPUs ─────────────────────────┐
 │ driver NVIDIA (kernel)                                       │
 │ NVIDIA Container Toolkit: expõe as GPUs dentro do contêiner  │
 │ device plugin: anuncia "nvidia.com/gpu: 8" ao kubelet        │
 │ GPU Feature Discovery: rótulos (modelo, memória, MIG...)     │
 │ DCGM exporter: métricas de GPU para o Prometheus             │
 │ (opcional) MIG manager, operador de rede (RDMA, SR-IOV)      │
 └──────────────────────────────────────────────────────────────┘
          ▲ tudo isso pode ser instalado e atualizado pelo
          │ NVIDIA GPU Operator
```

- **Device plugin**: o Kubernetes não sabe nada de GPUs por padrão. O device plugin registra o recurso `nvidia.com/gpu`, e os pods pedem GPUs em `resources.limits`. O scheduler só coloca o pod num nó com GPUs livres suficientes.
- **NVIDIA GPU Operator**: automatiza a instalação de driver, container toolkit, device plugin, GPU Feature Discovery, DCGM exporter e MIG manager em todos os nós.
- **Compartilhamento**: **MIG** (multi-instance GPU) divide uma A100/H100 em até 7 instâncias isoladas em hardware (memória e SMs próprios); **time-slicing** deixa vários pods usarem a mesma GPU em turnos, sem isolamento de memória; **MPS** permite execução concorrente de vários processos.
- **Rede de alto desempenho**: o pod precisa de acesso às NICs de RDMA (via network operator, SR-IOV ou plugins de dispositivos RDMA, e muitas vezes uma segunda interface de rede com Multus).
- **Topologia**: o pod de 8 GPUs precisa das 8 GPUs do mesmo nó (NVLink); jobs multinó precisam de nós próximos na rede. O scheduler padrão não sabe disso; usam-se rótulos, afinidades e schedulers que entendem topologia.
- **Gang scheduling**: um modelo com PP em 2 nós precisa dos 2 ao mesmo tempo; subir só um desperdiça GPUs esperando. Ferramentas como Kueue, Volcano ou LeaderWorkerSet ajudam.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: llm-70b
spec:
  containers:
    - name: servidor
      image: registro.exemplo/llm-servidor:1.4.2
      args: ["--modelo", "/modelos/70b", "--tp", "8"]
      resources:
        limits:
          nvidia.com/gpu: 8          # o nó inteiro
      volumeMounts:
        - { name: shm, mountPath: /dev/shm }
  volumes:
    - name: shm                       # NCCL usa memória
      emptyDir: { medium: Memory }    # compartilhada
  nodeSelector:
    nvidia.com/gpu.product: NVIDIA-H100-80GB-HBM3
```

O volume em `/dev/shm` é um detalhe clássico: o padrão de 64 MB do contêiner é pequeno demais para a comunicação entre processos que o NCCL e o PyTorch usam, e o erro aparece de formas confusas.

## Perguntas de entrevista comentadas

## Q073 — Fale da sua experiência; depois, perguntas sobre GPUs, CI/CD, comunicação entre GPUs, Kubernetes e plugins da NVIDIA para Kubernetes. {#q073}

::: pergunta-meta
**[Relatado]** Fireworks AI · Software Engineer, AI Infrastructure · relatado em nov. 2025 · Difícil · [fonte](https://www.glassdoor.co.uk/Interview/Fireworks-AI-Interview-E9514416-RVW101688578.htm)
:::

### Resposta em 30 segundos

"Essa rodada passeia por vários temas, então eu preparo uma resposta curta e concreta para cada um. GPUs: hierarquia de memória, por que inferência é memory-bound, MIG e como monitorar com DCGM. Comunicação: NVLink e NVSwitch dentro do nó, InfiniBand ou RoCE entre nós, GPUDirect RDMA, coletivas do NCCL, ring vs tree, e como validar com nccl-tests. Kubernetes: device plugin anunciando nvidia.com/gpu, GPU Operator instalando driver, toolkit, DCGM exporter e feature discovery, MIG e time-slicing, topologia e gang scheduling. CI/CD: testes em GPU real, matriz de compatibilidade de driver e CUDA, imagens reprodutíveis, canary e rollback para drivers e motores de inferência. E para a experiência, uma história de incidente ou migração com números."

### Resposta completa

Como é uma rodada ampla, a estratégia é ter **um parágrafo forte por tema**, mais uma história.

**1. A história de abertura.** Siga a estrutura da [Q001](#q001), mas com foco em infraestrutura. Exemplo de formato: "Eu cuidava da plataforma de inferência em Kubernetes com 400 GPUs. Migramos de nós com 4 A100 por PCIe para HGX H100 com NVLink. O desafio foi o tempo de subida dos pods de 70B: 9 minutos, dominado pelo download dos pesos. Coloquei um cache de pesos em NVMe local, pré-aquecido por um DaemonSet, e passei a carregar com várias threads e direto para a GPU. A subida caiu para 90 segundos, o que permitiu autoscaling de verdade."

**2. GPUs.** Hierarquia de memória e números da H100; por que o decode é memory-bound; MIG vs time-slicing vs MPS; métricas do DCGM (uso de SM, tensor, DRAM, temperatura, energia, erros ECC, eventos Xid).

**3. Comunicação entre GPUs.** Seções [10.1](#cap-10) a [10.6](#cap-10). Saiba explicar:

- Por que TP fica dentro do nó.
- O que é GPUDirect RDMA e por que a NIC precisa estar no mesmo switch PCIe da GPU.
- Ring vs tree ([Q074](#q074)).
- Como diagnosticar banda baixa: `nccl-tests`, `NCCL_DEBUG=INFO`, `nvidia-smi topo -m` (mostra a topologia: quais GPUs e NICs estão ligadas por NVLink, PCIe ou pela CPU).

```text
 nvidia-smi topo -m  (trecho ilustrativo)

         GPU0  GPU1  ...  NIC0  NIC1
 GPU0     X    NV18       PIX   SYS
 GPU1    NV18   X         SYS   PIX

 NV18 = 18 enlaces NVLink   PIX = mesmo switch PCIe
 SYS  = atravessa a interconexão entre CPUs (lento)
```

**4. Kubernetes e plugins NVIDIA.** Seção [10.7](#cap-10). Pontos que costumam ser perguntados:

- **Como o pod vê a GPU?** O device plugin anuncia o recurso; o kubelet aloca GPUs específicas para o contêiner; o NVIDIA Container Toolkit monta os dispositivos e as bibliotecas do driver dentro do contêiner.
- **O que o GPU Operator faz?** Instala e mantém, como DaemonSets, o driver, o toolkit, o device plugin, o GPU Feature Discovery, o DCGM exporter e o MIG manager. Atualizar o driver vira uma operação declarativa, nó por nó.
- **E se um nó tiver uma GPU com defeito?** Health checks (DCGM, erros Xid, ECC) marcam a GPU como não saudável; o device plugin deixa de anunciá-la; o nó pode ser isolado (cordon) e drenado automaticamente.
- **Pod em Pending?** Ver [Q089](#q089).

**5. CI/CD para infraestrutura de GPU.**

```text
 Pipeline de mudança (driver, CUDA, motor de inferência,
 imagem do servidor):

 1. build da imagem (versões fixadas: driver mínimo,
    CUDA, NCCL, PyTorch, motor)
 2. testes unitários em CPU
 3. testes em GPU real (runner com GPU no CI):
    - kernels e modelo pequeno: corretude numérica
    - nccl-tests em 1 nó: busbw mínimo
    - benchmark de inferência: TTFT/TPOT/throughput
      contra a linha de base (regressão > X% bloqueia)
 4. staging com tráfego espelhado
 5. canary em produção (1% → 10% → 100%),
    com métricas de erro, latência e qualidade
 6. rollback automático se as métricas piorarem
```

Pontos específicos de GPU: a **matriz de compatibilidade** (versão do driver no nó vs CUDA na imagem), testar em **todos os tipos de GPU** da frota, e atualizar drivers com **rolling update** por grupos de nós, porque exige reiniciar os pods.

### Perguntas de acompanhamento prováveis

- **Como você reduziria o tempo de subida de um pod de modelo grande?** Cache local de pesos, formato que carrega rápido (safetensors, com mmap), carga paralela direto para a GPU, imagens menores (pesos fora da imagem), pré-aquecer nós, manter réplicas quentes. Ver também [Q083](#q083).
- **MIG ou time-slicing para modelos pequenos?** MIG quando precisa de isolamento (memória e desempenho previsíveis, multi-tenant); time-slicing quando a carga é leve e o isolamento não importa.
- **Como saber se a NVLink está saudável?** `nvidia-smi nvlink --status`, contadores de erro de NVLink no DCGM, e busbw do nccl-tests comparado com o esperado.
- **Como fazer deploy de um modelo com PP em dois nós no Kubernetes?** Um grupo de pods agendado junto (gang scheduling, LeaderWorkerSet), nós próximos na rede, rede RDMA nos pods, e um mecanismo para recriar o grupo inteiro se um pod falhar.

### Armadilhas comuns

- Responder de forma genérica sobre Kubernetes, sem os detalhes de GPU.
- Não saber o que o device plugin e o GPU Operator fazem.
- Confundir NVLink com PCIe ou InfiniBand.
- Falar de CI/CD sem testes em GPU real e sem benchmark de regressão.

## Q074 — All-reduce em anel vs. em árvore: custos e quando cada um é usado. {#q074}

::: pergunta-meta
**[Prática]** Prática · Presencial · Médio · Base: operações coletivas nas vagas da DeepMind e da Groq
:::

### Resposta em 30 segundos

"No anel, o vetor é dividido em p pedaços e circula em duas fases, reduce-scatter e all-gather, cada uma com p−1 etapas. Cada GPU envia cerca de 2n(p−1)/p bytes, o que é ótimo em banda, mas a latência cresce linearmente com p. Na árvore, a redução sobe até a raiz e o resultado desce; com pipelining e duas árvores complementares, a banda fica perto da ótima e a latência cresce só com log p. Por isso o anel é melhor para mensagens grandes com poucas GPUs, e a árvore para mensagens pequenas ou muitas GPUs. O NCCL escolhe automaticamente com base no tamanho e na topologia, e reduções dentro do switch, como NVLS e SHARP, podem ganhar das duas."

### Resposta completa

Derive as fórmulas da seção [10.5](#cap-10) no quadro:

**Anel, fase 1 (reduce-scatter):** $p-1$ etapas, cada GPU envia $n/p$ bytes por etapa. **Fase 2 (all-gather):** igual. Total por GPU:

$$2(p-1) \cdot \frac{n}{p} \text{ bytes enviados}, \qquad T_{ring} = 2(p-1)\alpha + \frac{2(p-1)}{p}\frac{n}{B}$$

Por que é ótimo em banda: cada GPU precisa, no mínimo, enviar sua contribuição para os outros e receber o resultado, e o limite inferior teórico para all-reduce é exatamente $2(p-1)n/p$ bytes por GPU.

**Árvore:** sem pipelining, seria $2\log_2 p$ etapas, cada uma com a mensagem inteira: $2\log_2(p)(\alpha + n/B)$, ruim em banda para mensagens grandes. Com pipelining (a mensagem em $k$ pedaços fluindo pela árvore), o termo de banda cai para perto de $2n/B$ (ou um pouco mais), mantendo a latência em $O(\log p)$. A **double binary tree** usa duas árvores, em que cada nó é folha numa e interno na outra, para equilibrar o uso dos enlaces.

Depois, faça a conta com números (seção [10.5](#cap-10)): a árvore ganha para 1 MB com 8 GPUs e de longe com 1.024 GPUs; o anel ganha para 1 GB com 8 GPUs.

E mostre que conhece as variantes:

| Algoritmo | Ideia | Quando |
|---|---|---|
| Ring | anel, ótimo em banda | grandes, p pequeno |
| Tree / double binary tree | log p de latência | pequenas, p grande |
| Recursive halving-doubling | pares que trocam metades em log p etapas | potências de 2, mensagens médias |
| Hierárquico (2D) | reduce no nó (NVLink), all-reduce entre nós (IB), broadcast no nó | multi-nó: usa o degrau rápido primeiro |
| NVLS / SHARP | redução dentro do switch | quando o hardware tem |

Para inferência, ligue com o [Capítulo 9](#cap-09): os all-reduces do TP no decode são pequenos (~1 MB), então latência importa mais; por isso motores usam **all-reduces customizados de uma etapa** (cada GPU lê os dados das outras pela NVLink e soma localmente), que ganham dos algoritmos genéricos nessa faixa.

### Perguntas de acompanhamento prováveis

- **Por que o anel tem $2(p-1)$ etapas e não $p-1$?** Uma fase reduz (cada GPU fica com um pedaço somado), a outra distribui os pedaços somados.
- **Como fica num cluster com vários nós?** Hierárquico: reduce-scatter dentro do nó pela NVLink, all-reduce entre nós (cada GPU com seu pedaço, pelo seu rail de InfiniBand), all-gather dentro do nó. A parte lenta (rede) só move $n/8$ por GPU.
- **O que é busbw?** A banda corrigida pelo fator do algoritmo, comparável com a banda do hardware ([10.6](#cap-10)).
- **E o all-to-all?** Cada GPU envia um pedaço diferente para cada outra; o volume total por GPU é ~$n(p-1)/p$, mas não há redução nem árvore que ajude. É limitado pela banda da bisseção da rede, e por isso o MoE entre nós é caro.

### Armadilhas comuns

- Dizer que a árvore é sempre melhor ou que o anel é sempre melhor.
- Não saber derivar o volume de dados do anel.
- Esquecer o termo de latência.
- Não citar o caso hierárquico multi-nó.

## Q075 — NVLink, PCIe e InfiniBand: quando cada um vira o gargalo na inferência? {#q075}

::: pergunta-meta
**[Prática]** Prática · Presencial · Médio · Base: conhecimento de interconexões presente em várias vagas
:::

### Resposta em 30 segundos

"NVLink vira gargalo no tensor parallelism: no prefill pela banda, com all-reduces de centenas de MB por camada, e no decode pela latência, com centenas de all-reduces pequenos por passo; também no all-to-all de MoE dentro do nó. PCIe vira gargalo em tudo que passa pela CPU: carregar pesos da memória ou do disco, swap e offload de KV cache, e TP em GPUs sem NVLink, que fazem os all-reduces pelo PCIe. InfiniBand vira gargalo no que atravessa nós: pipeline parallelism, expert parallelism entre nós, transferência de KV na desagregação, distribuição de pesos para a frota, e TP multi-nó, que deve ser evitado. Para saber qual é o caso, faço a conta de bytes por segundo de cada fluxo contra a banda do enlace e confirmo com o profiler."

### Resposta completa

Monte uma tabela de fluxos e faça contas:

| Fluxo | Enlace | Vira gargalo quando... |
|---|---|---|
| All-reduce de TP (prefill) | NVLink | prompts longos, TP alto; banda |
| All-reduce de TP (decode) | NVLink | sempre pesa pela latência (muitas coletivas pequenas) |
| All-to-all de MoE no nó | NVLink | batch grande, muitos especialistas |
| TP em GPUs sem NVLink | PCIe | quase sempre; ~10× menos banda que NVLink |
| Carga de pesos (CPU → GPU) | PCIe | subida de réplicas, troca de modelos |
| Swap/offload de KV | PCIe | muitas conversas pausadas, preempção frequente |
| Cópia de tokens e metadados CPU ↔ GPU | PCIe | raramente pela banda; pela latência e sincronização |
| PP entre nós | InfiniBand | raramente (ativações pequenas); latência por salto |
| EP entre nós (MoE grande) | InfiniBand | frequentemente: all-to-all pesado |
| Transferência de KV (desagregação) | InfiniBand | prompts longos com taxa alta |
| Distribuição de pesos para a frota | InfiniBand / Ethernet | lançamentos de modelo, autoscaling |

::: conta
**Fazendo a conta: três casos.**

*1. TP=4 com GPUs sem NVLink (PCIe Gen4, ~32 GB/s).* Prefill de 4.000 tokens num modelo com d = 8.192 e 80 camadas: all-reduce de 4.000 × 8.192 × 2 ≈ 65 MB; cada GPU envia ~2 × (3/4) × 65 ≈ 98 MB; 160 coletivas ≈ 15,7 GB → a 32 GB/s, ~**0,5 s** só de comunicação. Na NVLink da H100 seriam ~35 ms. Esse é o motivo de TP em GPUs PCIe ser tão pior.

*2. Carga de pesos de 140 GB.* Do disco local NVMe (~7 GB/s por drive, alguns em paralelo): dezenas de segundos. Da memória da CPU para 8 GPUs por PCIe Gen5 (~64 GB/s cada, em paralelo, 17,5 GB por GPU): ~**0,3 s** no limite teórico, mais na prática. Da rede, ver [Q083](#q083).

*3. MoE com EP = 16 em 2 nós.* Batch de 4.096 tokens, d = 7.168, 8 especialistas por token, BF16: cada token vai para 8 destinos → 4.096 × 8 × 7.168 × 2 bytes ≈ 470 MB por dispatch, com uma boa parte atravessando a rede entre nós. Com ~50 GB/s por GPU de InfiniBand e o tráfego dividido entre 16 GPUs, cada uma move algo como 30 MB: ~0,6 ms por dispatch, o mesmo no combine, em cada camada de MoE. Com 60 camadas, dezenas de milissegundos por passo. Por isso o EP entre nós exige sobreposição com cálculo e kernels de comunicação especializados.
:::

E como confirmar: Nsight Systems mostra os kernels do NCCL e o tempo em que a GPU espera comunicação; métricas de NVLink e PCIe no DCGM mostram a banda usada; `nccl-tests` mostra o teto disponível.

### Perguntas de acompanhamento prováveis

- **Como reduzir a dependência do PCIe na carga de pesos?** Manter réplicas quentes, carregar direto para a GPU (GPUDirect Storage), ou, em Grace Hopper, usar a NVLink-C2C entre CPU e GPU.
- **InfiniBand ou RoCE?** InfiniBand é mais simples de colocar em alto desempenho (sem perdas por design); RoCE é mais barato e flexível, mas exige configurar controle de fluxo e congestionamento com cuidado. Os dois funcionam em produção.
- **Por que PP entre nós raramente é gargalo de banda?** Só passa o tensor de ativações na fronteira: tokens × d × 2 bytes, poucos MB, uma vez por estágio.
- **O que muda num domínio NVLink de rack (como o NVL72)?** TP e EP podem ir além de 8 GPUs com banda de NVLink, o que muda bastante os designs de MoE grandes.

### Armadilhas comuns

- Responder sem números.
- Esquecer o PCIe (carga de pesos, offload, GPUs sem NVLink).
- Tratar latência e banda como a mesma coisa.
- Não citar como verificar com ferramentas.

## Resumo do capítulo

- Degraus de banda: HBM (~3,35 TB/s) → NVLink (~450 GB/s por sentido) → PCIe Gen5 (~64 GB/s) → InfiniBand NDR (~50 GB/s por porta). Comunicação pesada nos degraus rápidos.
- Nó HGX H100: 8 GPUs todas com todas por NVSwitch, uma NIC por GPU no mesmo switch PCIe, afinidade NUMA importa.
- Coletivas: all-reduce (TP), all-gather, reduce-scatter, all-to-all (MoE), send/recv (PP, KV). All-reduce = reduce-scatter + all-gather.
- Modelo α-β: mensagens pequenas pagam latência, grandes pagam banda. O decode é latency-bound na comunicação; o prefill, bandwidth-bound.
- Ring: $2(p-1)\alpha + 2\frac{p-1}{p}\frac{n}{B}$, ótimo em banda. Tree: $O(\log p)$ de latência. NVLS/SHARP: redução no switch.
- NCCL: comunicadores, algoritmos, protocolos; `nccl-tests` com busbw; `NCCL_DEBUG=INFO`; coletivas travam o grupo inteiro se uma GPU falha.
- Kubernetes: device plugin (`nvidia.com/gpu`), GPU Operator, MIG/time-slicing/MPS, RDMA nos pods, topologia, gang scheduling, `/dev/shm`.

## Checklist para a entrevista

- [ ] Recito a tabela de interconexões com bandas aproximadas.
- [ ] Desenho um nó HGX H100 com GPUs, NVSwitches, NICs e CPUs.
- [ ] Explico GPUDirect RDMA e por que a posição da NIC no PCIe importa.
- [ ] Desenho as seis coletivas e digo onde cada uma aparece em inferência.
- [ ] Aplico o modelo α-β e calculo o tamanho de mensagem de equilíbrio.
- [ ] Derivo o custo do ring all-reduce e comparo com a árvore com números.
- [ ] Sei usar nccl-tests, interpretar busbw e ligar os logs do NCCL.
- [ ] Explico device plugin, GPU Operator, MIG e time-slicing.
- [ ] Descrevo um pipeline de CI/CD com testes em GPU e benchmark de regressão.
- [ ] Digo quando NVLink, PCIe e InfiniBand viram gargalo, com contas.
