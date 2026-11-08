# Capítulo 7 — Inferência {#cap-07}

::: frase
**Em uma frase**

Inferência é usar um modelo já treinado para produzir uma saída: no caso de um LLM, processar o prompt de uma vez (prefill) e depois gerar a resposta um token por passo (decode), com custo, latência e memória que dependem do tamanho do modelo, do contexto e da resposta.
:::

O treino acontece uma vez. A inferência acontece toda vez que alguém usa o modelo, para sempre. Para quem constrói aplicações, é aqui que está o dia a dia: quanto tempo o usuário espera, quanto custa cada conversa, quantos usuários cabem num servidor, se vale usar uma API ou rodar o próprio modelo.

Este capítulo é a visão de quem **usa e constrói** com modelos. Se você quiser ir ao nível das GPUs, kernels e schedulers, o livro *Engenharia de Inferência*, desta coleção, aprofunda cada tópico.

## 7.1 O caminho de uma requisição

```text
 aplicativo                                          aplicativo
     │ "Resuma este contrato: ..."                       ▲
     ▼                                                   │ texto
 TOKENIZAÇÃO (CPU) ─▶ IDs dos tokens                      │ (stream)
     │                                                   │
     ▼                                                   │
 ┌────────────────────────── GPU ───────────────────────┐│
 │ PREFILL: processa o prompt inteiro de uma vez         ││
 │          e calcula o 1º token  ──────────────────────▶│┤
 │ DECODE:  gera 1 token por passo, até parar  ─────────▶│┘
 └───────────────────────────────────────────────────────┘
```

As duas fases da GPU têm comportamentos opostos:

| | Prefill | Decode |
|---|---|---|
| O que faz | lê o prompt inteiro | gera a resposta |
| Tokens por passada | todos os do prompt | 1 por sequência |
| Paralelismo | alto | baixo dentro da sequência |
| Gargalo | cálculo | memória (ler os pesos a cada token) |
| Define | o tempo até o primeiro token | a velocidade do texto aparecendo |

## 7.2 Por que gerar é limitado pela memória

Para gerar **cada** token, a GPU precisa ler **todos** os pesos do modelo da memória. E ler é muito mais lento que calcular.

::: conta
**Fazendo a conta:** um modelo de 8 bilhões de parâmetros em 16 bits ocupa 16 GB. Uma GPU H100 lê sua memória a ~3,35 TB/s.

- Tempo só para ler os pesos: 16 GB ÷ 3.350 GB/s ≈ **4,8 ms** por token.
- Limite teórico para um usuário sozinho: 1 ÷ 4,8 ms ≈ **210 tokens por segundo**.
- O cálculo propriamente dito levaria uma fração disso: a GPU passa a maior parte do tempo esperando dados.
:::

A saída é atender **vários usuários ao mesmo tempo**: os pesos são lidos uma vez e usados para todos do lote. O tempo do passo quase não muda, mas ele produz um token para cada usuário. Esse é o **batching**, e é o que torna a inferência econômica.

## 7.3 O KV cache

Para gerar o token 501, o modelo precisa "levar em conta" os 500 anteriores. Recalcular tudo a cada token seria desperdício. O **KV cache** guarda, para cada token já processado e cada camada, dois vetores (chamados K e V) usados pela atenção. Cada token novo só calcula os seus e consulta os guardados.

O preço é memória:

$$\text{KV por token} = 2 \times \text{camadas} \times \text{heads de KV} \times \text{dimensão por head} \times \text{bytes}$$

```python
def kv_por_token(camadas, heads_kv, dim_head, bytes_por_valor=2):
    return 2 * camadas * heads_kv * dim_head * bytes_por_valor

def kv_total_gb(tokens, **cfg):
    return tokens * kv_por_token(**cfg) / 1e9

llama3_8b = dict(camadas=32, heads_kv=8, dim_head=128)
llama3_70b = dict(camadas=80, heads_kv=8, dim_head=128)
print(f"8B:  {kv_por_token(**llama3_8b) / 1024:.0f} KiB por token")
print(f"70B: {kv_por_token(**llama3_70b) / 1024:.0f} KiB por token")
print(f"70B, conversa de 32 mil tokens: "
      f"{kv_total_gb(32_000, **llama3_70b):.1f} GB")
assert kv_por_token(**llama3_8b) == 131_072
```

Uma conversa longa no modelo de 70B ocupa mais de 10 GB só de cache. Como a memória da GPU é limitada, o KV cache é o que limita quantos usuários cabem ao mesmo tempo, e por isso contextos longos ([Capítulo 9](#cap-09)) custam caro.

## 7.4 As métricas

| Métrica | O que mede | Quem sente |
|---|---|---|
| **TTFT** (time to first token) | tempo até o primeiro token | "travou?" |
| **TPOT** (time per output token) | tempo médio por token depois do primeiro | velocidade de leitura |
| **Latência total** | do envio ao último token | agentes, chamadas sem streaming |
| **Throughput** | tokens por segundo do sistema todo | custo |

A relação entre elas:

$$\text{latência total} = \text{TTFT} + (N - 1) \times \text{TPOT}$$

onde $N$ é o número de tokens gerados. Sempre olhe **percentis** (p50, p95, p99), não só a média: a experiência ruim está na cauda.

## 7.5 Batching contínuo

O jeito antigo de agrupar requisições (o **batching estático**) junta $B$ requisições e espera **todas** terminarem antes de começar o próximo lote. Como as respostas têm tamanhos muito diferentes, quem termina cedo deixa a vaga vazia. O **batching contínuo** reavalia o lote a cada passo: quem termina sai, quem está na fila entra na hora. A simulação abaixo compara os dois:

```python
import random

def simula(estrategia, n_req=300, vagas=8, semente=0):
    """Fração das vagas do lote ocupadas com trabalho útil."""
    rng = random.Random(semente)
    fila = [rng.choice([5, 10, 20, 50, 300]) for _ in range(n_req)]
    passos = tokens = 0
    if estrategia == "estatico":
        while fila:
            lote, fila = fila[:vagas], fila[vagas:]
            passos += max(lote)        # todos esperam o mais longo
            tokens += sum(lote)
    else:                              # contínuo
        ativos = []
        while fila or ativos:
            while fila and len(ativos) < vagas:
                ativos.append(fila.pop(0))
            passos += 1
            tokens += len(ativos)
            ativos = [r - 1 for r in ativos if r > 1]
    return tokens / (passos * vagas), passos

for e in ("estatico", "continuo"):
    uso, passos = simula(e)
    print(f"{e:9s}: {uso:.0%} das vagas ocupadas, {passos} passos")
assert simula("continuo")[0] > 0.9 > 0.5 > simula("estatico")[0]
```

Com respostas de tamanhos variados, o lote estático passa a maior parte do tempo com vagas ociosas. O contínuo fica quase sempre cheio e termina o mesmo trabalho em muito menos passos. Todos os servidores modernos de LLM (vLLM, TensorRT-LLM, SGLang e as APIs comerciais) fazem batching contínuo.

## 7.6 Cache de prompt

Muitas requisições começam com o mesmo texto: o mesmo prompt de sistema, os mesmos exemplos, o mesmo documento, o histórico de uma conversa. Os servidores podem guardar o KV cache desse **prefixo** e reaproveitá-lo, pulando o prefill da parte repetida. Nas APIs comerciais, isso aparece como **prompt caching**, geralmente com preço menor para os tokens que vêm do cache.

::: dica
**Dica:** para aproveitar o cache, coloque o que é **fixo no começo** do prompt (instruções, exemplos, documentos) e o que **muda no fim** (a pergunta do usuário, a data e hora). Um timestamp no começo do prompt de sistema invalida o cache inteiro em toda chamada.
:::

## 7.7 Custo

O custo de uma chamada é aproximadamente:

$$\text{custo} = \text{tokens de entrada} \times p_{entrada} + \text{tokens de saída} \times p_{saída}$$

e os tokens de saída costumam custar várias vezes mais que os de entrada, porque o decode usa a GPU de forma menos eficiente que o prefill.

```python
def custo_mensal(chamadas_dia, tokens_entrada, tokens_saida,
                 preco_entrada, preco_saida, dias=30):
    """Preços em US$ por milhão de tokens."""
    por_chamada = (tokens_entrada * preco_entrada
                   + tokens_saida * preco_saida) / 1e6
    return por_chamada * chamadas_dia * dias

# preços HIPOTÉTICOS, só para o exercício
base = custo_mensal(10_000, 3_000, 400, preco_entrada=3.0,
                    preco_saida=15.0)
prompt_menor = custo_mensal(10_000, 1_000, 400, 3.0, 15.0)
saida_menor = custo_mensal(10_000, 3_000, 200, 3.0, 15.0)
print(f"base: US$ {base:,.0f}/mês   prompt 3x menor: "
      f"US$ {prompt_menor:,.0f}   saída pela metade: "
      f"US$ {saida_menor:,.0f}")
assert prompt_menor < base and saida_menor < base
```

Repare como, nesse exemplo, o prompt grande pesa mais que a saída, mesmo com o token de saída 5 vezes mais caro: 3.000 tokens de entrada × US$ 3 = US$ 0,009 por chamada, contra 400 × US$ 15 = US$ 0,006. Enxugar prompts e usar cache de prompt costuma ser a economia mais fácil.

## 7.8 Onde rodar o modelo

| Opção | Vantagens | Desvantagens |
|---|---|---|
| API de um provedor | sem infraestrutura, modelos de ponta, escala automática | custo por token, dados saem da sua infraestrutura, dependência |
| Modelo aberto em servidor próprio (vLLM, SGLang, TGI, TensorRT-LLM) | controle, privacidade, custo menor em volume alto | operar GPUs, escalar, atualizar |
| Modelo aberto local (llama.cpp, Ollama) | grátis depois do hardware, offline, privacidade total | modelos menores, velocidade limitada pelo seu computador |
| Batch API (processamento em lote) | desconto, sem pressa | horas para obter o resultado |

Hospedar o próprio modelo só compensa quando o volume é alto o bastante para manter as GPUs ocupadas: GPU parada também custa.

## 7.9 As alavancas de otimização

- **Modelo menor** ou **roteamento**: usar um modelo pequeno para as tarefas fáceis e o grande só quando necessário.
- **Quantização** ([Capítulo 8](#cap-08)): menos bytes por peso, decode mais rápido.
- **Cache de prompt** e **prompts mais enxutos**.
- **Limitar a saída**: `max_tokens`, pedir respostas concisas, formatos estruturados ([Capítulo 10](#cap-10)).
- **Speculative decoding**: um modelo pequeno propõe tokens, o grande verifica vários de uma vez.
- **Streaming**: não reduz a latência total, mas reduz muito a percebida.
- **Assíncrono e em lote** para o que não precisa de resposta imediata.

::: analogia
**Analogia:** a GPU é a cozinha de um restaurante. Montar um prato individual leva quase o mesmo tempo que montar dez iguais, porque o trabalho caro é buscar os ingredientes (ler os pesos). Uma cozinha eficiente não espera a mesa mais lenta terminar para começar a próxima (batching contínuo) e deixa prontos os ingredientes que todo pedido usa (cache de prompt).
:::

## Erros comuns

- **Medir só a média de latência.** Use percentis; a cauda é onde os usuários reclamam.
- **Achar que streaming acelera a resposta.** Ele reduz a latência percebida, não o tempo total.
- **Colocar conteúdo variável no começo do prompt** e perder o cache de prompt.
- **Subestimar o custo dos tokens de entrada** em aplicações com prompts longos (RAG, agentes).
- **Hospedar o próprio modelo com pouco volume**, pagando GPUs ociosas.
- **Ignorar o KV cache ao planejar contextos longos.**

## Por que importa

A inferência é onde o produto encontra o usuário e onde a conta chega todo mês. Entender prefill e decode, KV cache, batching, cache de prompt e a estrutura de custo permite tomar decisões concretas: tamanho de prompt, modelo, API ou servidor próprio, limites de saída, e como prometer uma latência que você consegue cumprir.

## Teste-se

1. Quais são as duas fases da inferência de um LLM e qual é o gargalo de cada uma?
2. Calcule o limite teórico de tokens por segundo, para um usuário, de um modelo de 16 GB numa GPU com 2 TB/s de banda.
3. Calcule o KV cache por token de um modelo com 40 camadas, 8 heads de KV e dimensão 128 por head, em 16 bits.
4. Uma resposta tem TTFT de 500 ms, TPOT de 20 ms e 301 tokens. Qual a latência total?
5. Por que o batching contínuo ocupa melhor a GPU que o estático?
6. Como organizar um prompt para aproveitar o cache de prompt?
7. Em que situação hospedar o próprio modelo começa a compensar em relação a uma API?

::: respostas
1. Prefill (processa o prompt inteiro de uma vez; limitado pelo cálculo) e decode (gera um token por passo; limitado pela memória, porque lê todos os pesos a cada token).
2. 16 GB ÷ 2.000 GB/s = 8 ms por token → ~125 tokens/s.
3. 2 × 40 × 8 × 128 × 2 = 163.840 bytes = 160 KiB por token.
4. 0,5 + 300 × 0,02 = 6,5 segundos.
5. Porque, a cada passo, quem termina sai e quem está na fila entra; no estático, o lote inteiro espera a resposta mais longa, e as vagas de quem terminou ficam ociosas.
6. Tudo o que é fixo (instruções, exemplos, documentos) no começo; o que muda (pergunta, data, dados do usuário) no fim.
7. Quando o volume é alto e constante o bastante para manter as GPUs ocupadas a maior parte do tempo, ou quando há exigências de privacidade e controle que justificam o custo de operação.
:::

## Flashcards

::: flashcards
- **O que é inferência?** Usar um modelo treinado para produzir saídas; em LLMs, prefill do prompt e decode token a token.
- **Qual o gargalo do prefill?** Cálculo: muitos tokens processados em paralelo.
- **Qual o gargalo do decode?** Memória: ler todos os pesos a cada token gerado.
- **Qual o limite de tokens/s de um usuário sozinho?** Aproximadamente banda de memória ÷ tamanho dos pesos.
- **O que é o KV cache?** Vetores K e V guardados por token e camada, para não recalcular o contexto a cada token.
- **Qual a fórmula do KV cache por token?** 2 × camadas × heads de KV × dimensão por head × bytes.
- **Como calcular a latência total?** TTFT + (N − 1) × TPOT.
- **O que é batching contínuo?** Reavaliar o lote a cada passo: quem termina sai, quem espera entra.
- **O que é prompt caching?** Reaproveitar o KV cache de um prefixo repetido, pulando o prefill dessa parte.
- **Por que tokens de saída custam mais?** O decode gera um token por passada e usa a GPU de forma menos eficiente que o prefill.
:::

## Resumo do capítulo

- Inferência = prefill (cálculo, define o TTFT) + decode (memória, define o TPOT).
- Decode limitado pela banda: ~210 tokens/s no máximo para um modelo de 16 GB numa H100, com um usuário; batching resolve o custo.
- KV cache troca cálculo por memória e limita quantos usuários e quanto contexto cabem.
- Métricas: TTFT, TPOT, latência total = TTFT + (N−1)·TPOT, throughput; sempre em percentis.
- Batching contínuo ocupa a GPU muito melhor que o estático; cache de prompt economiza prefill repetido.
- Custo: entrada + saída; prompts longos pesam; escolha entre API, servidor próprio, local e lote pelo volume e pelos requisitos.
