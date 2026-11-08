# Capítulo 8 — Quantização e Compressão de Modelos {#cap-08}

Quantizar é guardar e calcular com números de menos bits. É a técnica de otimização com o melhor custo-benefício em inferência de LLMs, e por isso aparece em quase toda entrevista: o que é, quais formatos existem, como se faz sem destruir a qualidade, e quando preferir outras formas de compressão, como pruning e distilação.

A conexão com o resto do livro é direta. O decode é memory-bound ([Capítulo 1](#cap-01)): cada passo lê todos os pesos. Se cada peso ocupa metade dos bytes, o passo lê metade dos bytes e fica perto de duas vezes mais rápido. E o KV cache também pode ser quantizado ([Capítulo 6](#cap-06)), o que aumenta o batch.

## 8.1 Por que quantizar

Quatro ganhos, em ordem de importância para inferência:

1. **Menos bytes lidos por passo de decode** → decode mais rápido.
2. **Modelo cabe em menos GPUs** → menos comunicação, menos custo.
3. **Mais memória livre para o KV cache** → batches maiores, mais throughput.
4. **Tensor cores mais rápidos em baixa precisão** → prefill mais rápido (quando ativações também são quantizadas). Na H100, FP8 tem o dobro do pico de BF16.

::: conta
**Fazendo a conta: Llama 3 70B.**

| Formato dos pesos | Tamanho | Mínimo de H100 (só pesos) |
|---|---|---|
| BF16 (16 bits) | ~140 GB | 2 |
| FP8 / INT8 (8 bits) | ~70 GB | 1 (sobram ~10 GB) |
| INT4 (4 bits + escalas) | ~37 GB | 1 (sobram ~43 GB para KV) |

Em INT4, o passo de decode lê ~37 GB em vez de 140 GB: o limite teórico de velocidade quase quadruplica. Na prática o ganho é menor (dequantizar custa, e o KV cache não encolhe), mas é grande.
:::

## 8.2 Formatos numéricos

Um número de ponto flutuante tem **sinal**, **expoente** (define a faixa, ou seja, o quão grande ou pequeno o número pode ser) e **mantissa** (define a precisão, quantos dígitos significativos).

```text
 bits:  S = sinal   E = expoente   M = mantissa

 FP32   S EEEEEEEE MMMMMMMMMMMMMMMMMMMMMMM      1-8-23
 FP16   S EEEEE MMMMMMMMMM                      1-5-10
 BF16   S EEEEEEEE MMMMMMM                      1-8-7
 FP8    S EEEE MMM          (E4M3)              1-4-3
 FP8    S EEEEE MM          (E5M2)              1-5-2
 FP4    S EE M              (E2M1)              1-2-1
 INT8   SVVVVVVV            inteiro de -128 a 127
 INT4   SVVV                inteiro de -8 a 7
```

| Formato | Maior valor (aprox.) | Precisão relativa | Uso típico |
|---|---|---|---|
| FP32 | 3,4 × 10³⁸ | ~7 dígitos | acumuladores, referência |
| FP16 | 65.504 | ~3 dígitos | inferência (risco de overflow) |
| BF16 | 3,4 × 10³⁸ | ~2 dígitos | padrão de treino e inferência |
| FP8 E4M3 | 448 | ~1 dígito | pesos e ativações em inferência |
| FP8 E5M2 | 57.344 | menos que E4M3 | gradientes (mais faixa) |
| FP4 E2M1 | 6 | muito baixa | com escalas por bloco (Blackwell) |
| INT8 | 127 (com escala) | uniforme | pesos e ativações |
| INT4 | 7 (com escala) | uniforme | pesos (W4A16) |

Pontos que entrevistadores gostam de ouvir:

- **BF16 vs FP16**: o BF16 tem a mesma faixa do FP32 (8 bits de expoente), então quase nunca dá overflow; tem menos precisão. O FP16 tem mais precisão e faixa curta (máximo 65.504), o que exige cuidado com valores grandes.
- **FP8 vs INT8**: o FP8 tem precisão relativa (mais densidade de valores perto de zero, onde ficam a maioria dos pesos e ativações); o INT8 tem passo uniforme. O FP8 costuma lidar melhor com distribuições com cauda longa; o INT8 é suportado em mais hardware antigo.
- **FP4 com escalas por bloco**: com só 16 valores possíveis, o FP4 depende de **escalas compartilhadas por pequenos blocos** (por exemplo, a cada 16 ou 32 elementos), como nos formatos MXFP4 (padrão OCP de microscaling) e NVFP4 (NVIDIA).

## 8.3 Quantização linear: a matemática

Para converter um tensor real $x$ para inteiros de $b$ bits, usa-se uma **escala** $s$ e, às vezes, um **ponto zero** $z$:

$$q = \text{clamp}\left(\text{round}\left(\frac{x}{s}\right) + z,\; q_{min},\; q_{max}\right) \qquad \hat{x} = s \cdot (q - z)$$

- **Simétrica** ($z = 0$): $s = \max|x| / q_{max}$. Simples e rápida; ideal para distribuições centradas em zero (pesos).
- **Assimétrica** ($z \ne 0$): usa toda a faixa quando a distribuição não é centrada (por exemplo, saídas de ReLU, sempre positivas).

::: conta
**Fazendo a conta: INT8 simétrico.** Um grupo de pesos: [0,12; −0,50; 0,03; 0,91; −0,27].

- $\max|x| = 0{,}91$. $s = 0{,}91 / 127 = 0{,}007165$.
- $q$ = round(x / s) = [17; −70; 4; 127; −38].
- De volta: $\hat{x}$ = [0,1218; −0,5016; 0,0287; 0,9100; −0,2723].
- Erro máximo: ~0,0023 (no −0,27), menor que $s/2 \approx 0{,}0036$, como esperado.

Agora, se o grupo tivesse um **outlier** de 9,1 em vez de 0,91: $s = 0{,}0717$, e o valor 0,03 viraria round(0,42) = 0. Um único valor grande destrói a precisão de todos os outros do grupo. Esse é o problema central da quantização de LLMs.
:::

## 8.4 Granularidade das escalas

Quanto menor o grupo que compartilha uma escala, menor o estrago de um outlier, e maior o custo de guardar escalas.

```text
 Matriz de pesos W [saída × entrada]

 por tensor:   uma escala para tudo          barato, impreciso
 ┌─────────────────────────┐
 │            s            │
 └─────────────────────────┘

 por canal:    uma escala por linha (saída)  padrão para INT8
 ┌─────────────────────────┐
 │ s0 ─────────────────────│
 │ s1 ─────────────────────│
 └─────────────────────────┘

 por grupo:    uma escala a cada 128 (ou 64,  padrão para INT4
               32) elementos de uma linha
 ┌──────┬──────┬──────┬──────┐
 │ s00  │ s01  │ s02  │ s03  │
 │ s10  │ s11  │ s12  │ s13  │
 └──────┴──────┴──────┴──────┘
```

Para ativações, a escala pode ser **por tensor** (estática, calculada com dados de calibração, mais rápida) ou **por token** (dinâmica, calculada em tempo de execução, mais precisa).

O custo do grupo: em INT4 com grupos de 128 e escalas em FP16, cada grupo adiciona 16 bits para 128 pesos, ou 0,125 bit por peso. O "INT4" vira, na prática, uns 4,125 bits por peso (mais, se houver ponto zero).

## 8.5 O que quantizar

A notação **WxAy** diz quantos bits têm os pesos (W) e as ativações (A):

| Esquema | Pesos | Ativações | Ganho principal | Onde brilha |
|---|---|---|---|---|
| W8A16 / W4A16 | 8 / 4 bits | BF16 | menos bytes lidos | decode com batch pequeno |
| W8A8 (INT8 ou FP8) | 8 bits | 8 bits | menos bytes e GEMMs mais rápidas | prefill e decode com batch grande |
| W4A8, W4A4, FP4 | 4 bits | 8 ou 4 bits | os dois, mais agressivo | hardware com suporte (Blackwell) |
| KV cache FP8/INT8/INT4 | — | KV | mais sequências por GPU | contexto longo, batch grande |

::: atencao
**Cuidado:** W4A16 **não** acelera tudo. Os pesos precisam ser dequantizados para BF16 dentro do kernel antes da multiplicação. Com batch pequeno (memory-bound), isso é quase de graça e o ganho é grande. Com batch grande (compute-bound), o custo da dequantização aparece e um kernel W4A16 pode ficar **mais lento** que BF16 puro. Kernels especializados (como o Marlin) foram criados para manter o ganho em batches médios. Para batches grandes, W8A8 em FP8 costuma ser a melhor escolha na Hopper.
:::

## 8.6 O problema dos outliers

Pesquisas como o **LLM.int8()** (Dettmers et al., 2022) mostraram que, em LLMs grandes, algumas **dimensões das ativações** têm valores muito maiores que as outras (outliers sistemáticos por canal). Quantizar essas ativações por tensor em INT8 destrói a precisão.

```text
 Ativações X [tokens × canais], valores absolutos típicos:

          c0   c1   c2   c3   c4 ... c1000 ... c4095
 tok 0   0,3  0,1  0,5  0,2  0,4      58,0       0,3
 tok 1   0,2  0,4  0,1  0,3  0,2      61,0       0,1
 tok 2   0,5  0,2  0,3  0,1  0,6      55,0       0,4
                                       ▲
                     um canal com valores ~100× maiores
```

Soluções:

- **LLM.int8()**: separa os canais com outliers e os calcula em FP16; o resto em INT8. Preciso, mas o kernel misto é lento.
- **SmoothQuant** (Xiao et al., 2023): **migra a dificuldade** das ativações para os pesos. Como $Y = XW = (X \, \text{diag}(s)^{-1})(\text{diag}(s) \, W)$, dividir cada canal $j$ da ativação por $s_j$ e multiplicar a linha $j$ do peso por $s_j$ não muda o resultado. Escolhendo $s_j = \max|X_j|^\alpha / \max|W_j|^{1-\alpha}$ (com $\alpha$ perto de 0,5), os dois ficam "lisos" o bastante para INT8. A divisão pode ser absorvida na camada anterior (por exemplo, nos pesos da normalização), sem custo em tempo de execução.
- **Rotações** (QuaRot, SpinQuant): multiplicar por matrizes ortogonais (como Hadamard) espalha os outliers por todos os canais antes de quantizar, permitindo até W4A4.
- **FP8**: por ter faixa dinâmica maior que o INT8, tolera melhor os outliers, o que é um dos motivos da sua popularidade.

## 8.7 Métodos de quantização pós-treino (PTQ)

**PTQ** (post-training quantization) quantiza um modelo já treinado, sem treinar de novo, usando no máximo um pequeno conjunto de **dados de calibração** (algumas centenas de exemplos).

**RTN (round-to-nearest).** Arredonda cada peso para o valor quantizado mais próximo, com escalas por grupo. Simples e rápido. Em 8 bits, quase sempre basta. Em 4 bits, perde qualidade visível em vários modelos.

**GPTQ** (Frantar et al., 2022). Quantiza as colunas da matriz de pesos uma de cada vez e **compensa o erro**: depois de arredondar uma coluna, ajusta as colunas ainda não quantizadas para cancelar o erro introduzido, usando informação de segunda ordem (a matriz $H = X^\top X$ calculada com as ativações de calibração). O objetivo é minimizar o erro na **saída** da camada, $\|XW - X\hat{W}\|^2$, não nos pesos.

```text
 GPTQ, uma camada:
   H = Xᵀ X   (das ativações de calibração)
   para cada coluna i:
       q_i = quantiza(w_i)
       erro = (w_i − q_i) / [H⁻¹]_ii
       colunas seguintes −= erro × [H⁻¹]_i,seguintes
   → o erro de cada arredondamento é "absorvido" pelos
     pesos que ainda não foram quantizados
```

**AWQ** (Lin et al., 2023). Observa que uma pequena fração dos pesos é **saliente**: os que multiplicam canais de ativação com valores grandes. Em vez de manter esses pesos em alta precisão (o que exigiria kernels mistos), o AWQ **escala** esses canais para cima antes de quantizar (e divide a ativação correspondente), reduzindo o erro relativo justamente onde mais importa. As escalas são buscadas com os dados de calibração.

| Método | Ideia | Custo de quantizar | Uso comum |
|---|---|---|---|
| RTN | arredondar | segundos | 8 bits |
| GPTQ | compensar erro com segunda ordem | minutos a horas | 4 bits (pesos) |
| AWQ | proteger canais salientes com escala | minutos | 4 bits (pesos) |
| SmoothQuant | migrar dificuldade das ativações para os pesos | minutos | W8A8 INT8 |
| FP8 com calibração | escalas por tensor ou canal | minutos | W8A8 FP8 na Hopper |

## 8.8 QAT e QAD

**QAT** (quantization-aware training): treina (ou faz fine-tuning) com a quantização **simulada** no forward. Os pesos continuam em alta precisão, mas a cada forward passam por "quantiza e dequantiza" (fake quantization), então o modelo aprende a ser robusto ao arredondamento.

O problema é que o arredondamento tem derivada zero em quase todo lugar. A solução é o **straight-through estimator (STE)**: no backward, finge-se que a função de arredondamento é a identidade e o gradiente passa direto.

```text
 forward:   w ─▶ [fake quant: round(w/s)·s] ─▶ ŵ ─▶ camada
 backward:  ∂L/∂w ≈ ∂L/∂ŵ        (STE: ignora o round)
```

**QAD** (quantization-aware distillation): QAT em que o objetivo não é a perda original de treino, mas **imitar o modelo original em precisão total** (o professor). A perda é, por exemplo, a divergência KL entre as distribuições de saída do professor e do aluno quantizado:

$$\mathcal{L}_{QAD} = \text{KL}\big(p_{professor}(\cdot \mid x) \,\|\, p_{aluno\ quantizado}(\cdot \mid x)\big)$$

Vantagens do QAD sobre o QAT comum: não precisa do dataset e do pipeline de treino originais (que muitas vezes não estão disponíveis, como em modelos após RLHF), e o sinal do professor (a distribuição inteira, não só o token correto) é mais rico. Ferramentas como o NVIDIA Model Optimizer oferecem fluxos de QAT e QAD.

| | PTQ | QAT | QAD |
|---|---|---|---|
| Treino | nenhum | fine-tuning com fake quant | fine-tuning com fake quant + professor |
| Dados | calibração (centenas de exemplos) | dados de treino da tarefa | prompts variados; rótulos vêm do professor |
| Custo | minutos a horas | horas a dias de GPU | horas a dias de GPU |
| Qualidade em baixa precisão | boa em 8 bits; variável em 4 | melhor | melhor, sem precisar do pipeline original |

## 8.9 Pruning

**Pruning** (poda) remove pesos ou estruturas inteiras.

- **Não estruturado**: zera pesos individuais (por exemplo, os de menor magnitude, ou com critérios como SparseGPT e Wanda). Alta esparsidade com pouca perda, mas **não acelera** em GPUs sem suporte a esparsidade arbitrária: a matriz continua do mesmo tamanho.
- **Semi-estruturado 2:4**: em cada grupo de 4 pesos, exatamente 2 são zero. Os tensor cores desde a Ampere aceleram esse padrão (até 2× no pico teórico de cálculo, e metade dos bytes nos valores, mais metadados). O ganho real em LLMs costuma ser menor e a perda de qualidade precisa ser recuperada com fine-tuning.
- **Estruturado**: remove heads de atenção, canais do MLP ou camadas inteiras. A matriz fica realmente menor, e o ganho é direto em qualquer hardware. Normalmente exige **distilação** depois, para recuperar a qualidade (abordagens como a Minitron, da NVIDIA, combinam poda de largura e profundidade com distilação).

## 8.10 Distilação

**Distilação** treina um modelo menor (aluno) para imitar um maior (professor). Formas comuns:

- **Por logits**: o aluno aprende a distribuição de probabilidades do professor em cada posição (KL com temperatura). Transmite mais informação do que só o token correto ("o professor acha que 'carro' é 60% provável e 'automóvel' 30%").
- **Por sequência**: o professor gera respostas para muitos prompts, e o aluno é treinado nessas respostas como se fossem dados normais. Simples, funciona até com professores acessíveis só por API (respeitando os termos de uso).
- **Por representações internas**: o aluno imita estados intermediários do professor (exige mapear camadas).

A distilação muda a **arquitetura** (menos camadas, menos largura), então o ganho de velocidade vale para qualquer hardware e se soma à quantização.

## Perguntas de entrevista comentadas

## Q057 — O que é quantização? O que são QAT e QAD? {#q057}

::: pergunta-meta
**[Relatado]** NVIDIA · Senior Software Engineer · entrevista técnica · 2026 · Médio · [fonte](https://www.glassdoor.sg/Interview/NVIDIA-Interview-E7633-RVW103158258.htm)
:::

### Resposta em 30 segundos

"Quantização é representar pesos, ativações ou KV cache com menos bits, como FP8, INT8 ou INT4, usando escalas para mapear os valores reais na faixa do formato. Em inferência de LLMs, ela reduz os bytes lidos no decode, que é memory-bound, faz o modelo caber em menos GPUs e libera memória para o KV cache. QAT, quantization-aware training, é fazer fine-tuning com a quantização simulada no forward e o straight-through estimator no backward, para o modelo aprender a ser robusto ao arredondamento. QAD, quantization-aware distillation, é o mesmo processo, mas com a perda definida como a distância, por exemplo KL, entre as saídas do modelo quantizado e do modelo original em precisão total, que funciona como professor. Isso dispensa os dados e o pipeline de treino originais e costuma recuperar melhor a qualidade em precisões baixas como FP4."

### Resposta completa

Estruture em quatro partes.

**1. O que é, com a fórmula.** Escala e ponto zero ([8.3](#cap-08)), um exemplo numérico e o efeito dos outliers.

**2. As escolhas de projeto.**

```text
 O QUÊ:         pesos │ ativações │ KV cache
 QUANTOS BITS:  8 │ 4 │ (2, FP4 com blocos)
 FORMATO:       INT (uniforme) │ FP (relativo)
 GRANULARIDADE: tensor │ canal │ grupo │ token │ bloco
 ESCALA:        estática (calibração) │ dinâmica (runtime)
 COMO:          PTQ (RTN, GPTQ, AWQ, SmoothQuant)
                │ QAT │ QAD
```

**3. QAT em detalhe.**

- Fake quantization no forward: $\hat{w} = s \cdot \text{round}(w / s)$.
- STE no backward: $\partial \hat{w} / \partial w \approx 1$ (dentro da faixa; zero onde há saturação, em algumas variantes).
- As escalas também podem ser aprendidas (como no LSQ, learned step size quantization).
- Normalmente parte de um modelo já treinado e faz um fine-tuning curto.
- Ganho: em precisões baixas (4 bits e menos), recupera boa parte da qualidade que o PTQ perde.

**4. QAD em detalhe.**

```text
             prompt x
       ┌────────┴────────┐
       ▼                 ▼
 ┌───────────┐     ┌──────────────┐
 │ professor │     │ aluno        │
 │ BF16      │     │ (fake quant  │
 │ congelado │     │  FP8/FP4)    │
 └─────┬─────┘     └──────┬───────┘
       │ p_prof           │ p_aluno
       └───────┬──────────┘
               ▼
       perda = KL(p_prof ‖ p_aluno)
               │
               ▼ backward (STE) só no aluno
```

Por que é melhor que QAT comum em muitos casos:

- O objetivo é exatamente o que importa: **preservar o comportamento do modelo original**, não reaprender a tarefa.
- Não precisa do dataset original nem refazer o alinhamento (instrução, RLHF); qualquer conjunto variado de prompts serve, e as respostas do professor são os rótulos.
- A distribuição completa do professor dá um sinal mais rico por token.

O custo: precisa rodar o professor junto (memória e cálculo extras) e é um processo de treino, com tudo que isso exige.

### Perguntas de acompanhamento prováveis

- **Quando PTQ basta?** Em 8 bits (FP8 ou INT8 bem feito), quase sempre. Em 4 bits só nos pesos, com GPTQ ou AWQ, em muitos modelos. Abaixo disso, ou em W4A4/FP4 com ativações, QAT ou QAD costumam ser necessários.
- **O que o STE faz, exatamente?** Trata o arredondamento como identidade no backward, para o gradiente não ser sempre zero. É uma aproximação, mas funciona bem na prática.
- **Como medir se a quantização estragou o modelo?** Perplexidade é um primeiro sinal, mas insuficiente. Rode as avaliações das tarefas que importam (raciocínio, código, contexto longo, idiomas), compare com o ruído entre execuções e faça comparação lado a lado de respostas.
- **Por que FP8 virou padrão na Hopper?** Tensor cores com o dobro do pico de BF16, faixa dinâmica que tolera outliers e perda de qualidade pequena com escalas simples.

### Armadilhas comuns

- Definir quantização só como "reduzir precisão" sem falar de escala e granularidade.
- Confundir QAT com PTQ com calibração.
- Não saber o que é o STE.
- Não diferenciar QAD de QAT.

## Q058 — Descreva técnicas comuns de otimização de IA para treinamento e inferência: quantização, pruning, distilação, fusão de kernels, otimizações de memória e de throughput. {#q058}

::: pergunta-meta
**[Relatado]** NVIDIA · Software Engineer · triagem técnica · listada em 2026 · Difícil · [fonte](https://prachub.com/interview-questions/explain-optimization-and-tensor-vs-pipeline-parallelism)
:::

### Resposta em 30 segundos

"Eu organizo em três grupos. Reduzir o modelo: quantização (menos bits por número), pruning (menos pesos, estruturado ou 2:4) e distilação (modelo menor que imita um maior). Executar melhor o mesmo modelo: fusão de kernels para evitar idas à memória, FlashAttention, CUDA graphs, compiladores como torch.compile e TensorRT. E gerenciar memória e throughput: no treino, precisão mista, gradient checkpointing, ZeRO/FSDP e paralelismo; na inferência, KV cache paginado, prefix caching, continuous batching, chunked prefill e speculative decoding. A escolha depende do gargalo: memória, cálculo ou overhead, e de quanto de qualidade dá para arriscar."

### Resposta completa

Apresente como uma tabela-mapa e depois aprofunde dois ou três itens, de acordo com o interesse do entrevistador:

| Técnica | Treino | Inferência | Ataca | Afeta qualidade? |
|---|---|---|---|---|
| Precisão mista (BF16) | ✔ | ✔ | cálculo, memória | quase nada |
| Quantização FP8/INT8/INT4 | (FP8) | ✔ | bytes, cálculo | pouco a moderado |
| Pruning 2:4 / estruturado | — | ✔ | cálculo, bytes | sim, recuperar com treino |
| Distilação | gera o modelo | ✔ | tudo (modelo menor) | sim, avaliar |
| Fusão de kernels | ✔ | ✔ | tráfego de memória | não |
| FlashAttention | ✔ | ✔ | memória e tráfego da atenção | não |
| CUDA graphs | ✔ | ✔ | overhead de CPU | não |
| Gradient checkpointing | ✔ | — | memória de ativações | não (mais cálculo) |
| ZeRO / FSDP | ✔ | — | memória de estados do otimizador | não |
| KV cache paginado, prefix caching | — | ✔ | memória do KV | não |
| Continuous batching, chunked prefill | — | ✔ | utilização, latência | não |
| Speculative decoding | — | ✔ | latência do decode | não (com verificação exata) |

Aprofunde as do enunciado:

**Quantização**: [8.3](#cap-08) a [8.8](#cap-08).

**Pruning**: [8.9](#cap-08). Diga a diferença essencial: esparsidade não estruturada reduz o número de pesos, mas não acelera sem suporte de hardware; 2:4 tem suporte nos tensor cores; estruturado reduz as matrizes de verdade e acelera em qualquer lugar, mas pede distilação para recuperar qualidade.

**Distilação**: [8.10](#cap-08).

**Fusão de kernels**: [Capítulo 4](#cap-04). Exemplo concreto: residual + RMSNorm + quantização em um kernel; epílogos de GEMM com ativação.

**Memória e throughput no treino**:

- **Precisão mista**: pesos mestres em FP32, cálculo em BF16 (ou FP8 com escalas).
- **Gradient checkpointing**: guarda só algumas ativações no forward e recalcula as outras no backward. Troca cálculo (~30% a mais) por memória.
- **ZeRO / FSDP**: divide estados do otimizador, gradientes e pesos entre as GPUs, em vez de replicar.
- **Paralelismo** (dados, tensor, pipeline, especialistas): [Capítulo 9](#cap-09).

**Memória e throughput na inferência**: KV cache ([Capítulo 6](#cap-06)), batching ([Capítulo 7](#cap-07)), speculative decoding ([Capítulo 14](#cap-14)).

Termine com o critério de escolha: "Primeiro meço o gargalo. Se o decode é memory-bound com MBU alto, o caminho é ler menos bytes: quantização. Se o problema é custo e há margem de qualidade, distilação. Se o perfil mostra muita GPU ociosa entre kernels, CUDA graphs e fusão. E toda técnica que muda números passa por avaliação."

### Perguntas de acompanhamento prováveis

- **Tensor parallelism vs pipeline parallelism?** É a outra metade desta pergunta no relato original; ver [Q065](#q065).
- **Qual técnica você aplicaria primeiro num modelo novo em produção?** FP8 nos pesos e ativações (se o hardware suportar) e KV cache em FP8: grande ganho, pouco risco, ferramentas maduras.
- **Pruning ajuda em decode memory-bound?** Pruning estruturado sim (menos bytes). Não estruturado só se o kernel souber explorar a esparsidade e ler menos bytes; na maioria das GPUs, não.
- **Distilação e quantização se combinam?** Sim. É comum distilar para um modelo menor e depois quantizá-lo, ou usar o QAD, que é distilação com quantização ao mesmo tempo.

### Armadilhas comuns

- Listar técnicas sem dizer o que cada uma ataca.
- Misturar técnicas de treino e de inferência sem distinguir.
- Esquecer o impacto na qualidade.
- Dizer que esparsidade não estruturada acelera GPUs automaticamente.

## Q059 — Explique quantização e distilação de modelos para otimizar inferência: como escolher entre as duas? {#q059}

::: pergunta-meta
**[Fornecedor]** Relatada "em várias empresas" numa compilação de 2026 · Presencial · 2026 · Médio · [fonte](https://adilshamim8.medium.com/every-ai-engineer-interview-question-you-need-to-know-in-2026-from-100-real-interviews-b5b7ae4b961a)
:::

### Resposta em 30 segundos

"Quantização mantém a arquitetura e reduz os bits por número: é barata, rápida de aplicar, dá 2 a 4 vezes menos memória, e o ganho de velocidade depende do suporte do hardware e do regime (memory-bound ou compute-bound). Distilação treina um modelo menor para imitar o maior: exige um projeto de treino, mas pode reduzir o custo em 5 ou 10 vezes e acelera em qualquer hardware, ao preço de perder capacidade geral. Eu começo pela quantização, porque o risco e o custo são baixos. Parto para a distilação quando preciso de um ganho maior do que a quantização dá, quando a tarefa é estreita e bem definida, ou quando a latência exige um modelo pequeno. E muitas vezes faço as duas: distilo e depois quantizo o aluno."

### Resposta completa

Compare lado a lado:

| | Quantização | Distilação |
|---|---|---|
| O que muda | bits por número | arquitetura (modelo menor) |
| Esforço | horas a dias (PTQ); dias (QAT/QAD) | semanas: dados, treino, avaliação |
| Ganho de memória | 2× (8 bits) a ~4× (4 bits) | proporcional à redução do modelo (5–20×) |
| Ganho de velocidade | depende do hardware e do regime | em qualquer hardware |
| Qualidade | perto do original em 8 bits | perde capacidade fora da tarefa-alvo |
| Generalidade | mantém todas as habilidades (quase) | ótima na tarefa treinada, pior fora dela |
| Reversível | sim (o original continua lá) | é outro modelo, com outro ciclo de vida |

E a árvore de decisão:

```text
 Preciso reduzir custo/latência
   │
   ├─ Ganho de 1,5–3× resolve?
   │    └─ SIM → quantização (FP8; depois INT4 nos pesos)
   │
   ├─ Preciso de 5×+ ou latência muito baixa?
   │    ├─ A tarefa é estreita e estável
   │    │  (classificar, extrair, um domínio)?
   │    │    └─ SIM → distilação + quantização do aluno
   │    └─ Preciso das habilidades gerais do modelo?
   │         └─ quantização agressiva (QAD, FP4) +
   │            speculative decoding + melhor serving;
   │            distilar com dados amplos, aceitando perda
   │
   └─ O hardware suporta o formato (FP8, FP4, INT4)?
        └─ NÃO → a quantização vira só economia de
                 memória; distilação ganha peso
```

Uma conta de custo ajuda a mostrar maturidade:

::: conta
**Fazendo a conta (valores hipotéticos):** um classificador de tickets usa um modelo de 70B, com 50 milhões de chamadas por mês.

- Quantização FP8: corta o custo por chamada em ~40%. Esforço: uma semana.
- Distilação para um 8B especializado: ~8× mais barato por chamada. Esforço: 6 semanas de engenharia + ~US$ 20 mil de GPU para gerar dados com o professor, treinar e avaliar.
- Se o custo atual é US$ 100 mil por mês: a quantização economiza US$ 40 mil por mês; a distilação, ~US$ 87 mil por mês. A distilação se paga em menos de dois meses, **se** a qualidade na tarefa se mantiver, o que precisa ser medido antes de decidir.
:::

### Perguntas de acompanhamento prováveis

- **Como garantir que o modelo distilado não piorou em casos raros?** Avaliação estratificada: casos difíceis, classes raras, idiomas, entradas adversárias. E monitoramento em produção com amostras revisadas e fallback para o modelo grande quando a confiança for baixa.
- **De onde vêm os dados para distilar?** Prompts reais da produção (com as devidas permissões e anonimização) rotulados pelo professor, mais dados sintéticos para cobrir casos raros.
- **O QAD é distilação ou quantização?** As duas coisas: é distilação de um modelo para a sua própria versão quantizada, sem mudar a arquitetura.
- **E LoRA?** É uma técnica de fine-tuning eficiente, não de compressão. Mas é comum distilar um modelo menor usando fine-tuning completo ou LoRA, e servir vários adaptadores LoRA sobre um modelo base quantizado ([Capítulo 14](#cap-14)).

### Armadilhas comuns

- Tratar as duas como alternativas excludentes.
- Ignorar o custo de engenharia da distilação.
- Prometer ganho de velocidade da quantização sem considerar o hardware.
- Não falar de avaliação e de perda de generalidade.

## Resumo do capítulo

- Quantizar reduz bytes lidos (decode mais rápido), faz o modelo caber em menos GPUs, libera memória para o KV cache e usa tensor cores mais rápidos.
- Formatos: BF16 (faixa do FP32), FP16 (mais precisão, faixa curta), FP8 E4M3/E5M2, INT8, INT4, FP4 com escalas por bloco.
- Quantização linear: $q = \text{round}(x/s) + z$. Outliers estragam a escala do grupo inteiro.
- Granularidade: tensor, canal, grupo (128), token, bloco. INT4 por grupo custa ~0,125 bit extra por peso.
- W4A16 brilha com batch pequeno; W8A8 FP8 é o padrão para batch grande na Hopper.
- Outliers de ativação: LLM.int8() (separar), SmoothQuant (migrar para os pesos), rotações (espalhar), FP8 (tolerar).
- PTQ: RTN, GPTQ (compensação de erro com segunda ordem), AWQ (proteger canais salientes). QAT: fake quant + STE. QAD: QAT com professor em precisão total e perda KL.
- Pruning: não estruturado (não acelera sozinho), 2:4 (tensor cores), estruturado (acelera em qualquer hardware, pede distilação).
- Distilação: modelo menor imitando o maior; maior ganho, maior esforço, perda de generalidade.

## Checklist para a entrevista

- [ ] Calculo o tamanho de um modelo em cada formato e quantas GPUs ele exige.
- [ ] Desenho os bits de FP32, BF16, FP16, FP8 e FP4 e explico faixa vs precisão.
- [ ] Quantizo um vetor à mão em INT8 simétrico e mostro o efeito de um outlier.
- [ ] Explico granularidade por tensor, canal, grupo e token, e o custo das escalas.
- [ ] Explico quando W4A16 acelera e quando não acelera.
- [ ] Explico SmoothQuant com a fórmula da escala por canal.
- [ ] Explico GPTQ e AWQ em uma frase cada.
- [ ] Explico QAT com STE e QAD com professor e KL.
- [ ] Comparo pruning não estruturado, 2:4 e estruturado.
- [ ] Escolho entre quantização e distilação com uma árvore de decisão e uma conta de custo.
