# Capítulo 3 — Geração Autorregressiva e Previsão do Próximo Token {#cap-03}

::: frase
**Em uma frase**

Um modelo autorregressivo gera texto um token de cada vez: calcula a probabilidade de cada token possível dado tudo o que veio antes, escolhe um, anexa ao texto e repete, até um token de parada ou um limite.
:::

Quando você vê uma resposta aparecendo aos poucos na tela, está vendo a geração autorregressiva acontecer. O modelo não "pensa a resposta inteira" e depois escreve: ele decide literalmente um pedaço de cada vez, e cada pedaço escolhido passa a fazer parte do contexto que decide o próximo. Entender esse laço explica muita coisa: por que gerar é lento, por que a temperatura muda tanto o resultado, por que um erro no começo contamina o resto, e por que às vezes o modelo entra em loop.

## 3.1 A regra da cadeia

Qualquer probabilidade de uma sequência pode ser escrita como um produto de probabilidades condicionais:

$$P(x_1, x_2, \ldots, x_T) = \prod_{t=1}^{T} P(x_t \mid x_1, \ldots, x_{t-1})$$

Um modelo autorregressivo aprende exatamente cada fator desse produto: "dado tudo até aqui, qual a probabilidade de cada próximo token". O pré-treino ([Capítulo 1](#cap-01)) treina esses fatores; a geração os usa um de cada vez.

::: conta
**Fazendo a conta:** a probabilidade do texto "O gato dormiu".

- $P(\text{O}) = 0{,}2$; $P(\text{gato} \mid \text{O}) = 0{,}1$; $P(\text{dormiu} \mid \text{O gato}) = 0{,}3$.
- Produto: $0{,}2 \times 0{,}1 \times 0{,}3 = 0{,}006$.
- Na prática, somam-se **log-probabilidades** ($\ln 0{,}2 + \ln 0{,}1 + \ln 0{,}3 \approx -5{,}12$), porque multiplicar milhares de números pequenos leva a valores que o computador arredonda para zero.
:::

## 3.2 O laço de geração

```text
 contexto: "A capital do Brasil é"
     │
     ▼
 ┌──────────────┐   logits para os ~128 mil tokens
 │    MODELO    │──▶ softmax ──▶ probabilidades
 └──────────────┘                      │
     ▲                                 ▼
     │                    ESCOLHA (decodificação):
     │                    greedy, amostragem, top-p...
     │                                 │
     │                                 ▼
     └──── anexa o token ◀──── " Brasília"
           ao contexto
           (repete até <fim>, sequência de parada
            ou limite de tokens)
```

Três peças são independentes do modelo e ficam a cargo de quem chama:

1. **A regra de escolha** (decodificação): como transformar probabilidades num token.
2. **A condição de parada**: um token especial de fim (EOS), sequências de parada definidas por você, ou um limite de tokens (`max_tokens`).
3. **O contexto**: o que entra antes de começar ([Capítulo 9](#cap-09)).

## 3.3 Estratégias de decodificação

### Greedy (guloso)

Sempre escolher o token mais provável. Determinístico e simples, mas tem dois problemas: tende a repetir frases e entrar em loop, e não garante a sequência mais provável no total, porque uma escolha boa agora pode levar a continuações piores depois.

### Beam search

Manter as $k$ melhores sequências parciais a cada passo (os "feixes") e expandir todas. Encontra sequências de probabilidade total maior que o greedy. É útil em tarefas com uma resposta certa (tradução, transcrição), mas em texto aberto tende a gerar respostas genéricas e repetitivas, e custa $k$ vezes mais.

### Amostragem com temperatura

Sortear o token de acordo com as probabilidades, depois de dividir os logits por uma **temperatura** $T$:

$$p_i = \frac{\exp(z_i / T)}{\sum_j \exp(z_j / T)}$$

- $T < 1$: a distribuição fica mais concentrada (mais previsível).
- $T = 1$: as probabilidades do modelo, sem mudança.
- $T > 1$: mais espalhada (mais variada e mais arriscada).
- $T \to 0$: vira o greedy.

### Cortes: top-k, top-p e min-p

Mesmo com temperatura moderada, a "cauda" de milhares de tokens improváveis soma uma probabilidade considerável, e de vez em quando um token absurdo é sorteado. Os cortes eliminam a cauda antes do sorteio:

| Corte | Mantém | Característica |
|---|---|---|
| top-k | os $k$ tokens mais prováveis | número fixo, independe da confiança do modelo |
| top-p (nucleus) | o menor conjunto cuja soma passa de $p$ | se adapta: poucos tokens quando o modelo está confiante |
| min-p | tokens com probabilidade ≥ $m \times$ a maior | corte relativo ao favorito |

```python
import torch

tokens = ["fontes", "evidências", "referências", "páginas",
          "provas", "abacaxi"]
logits = torch.tensor([3.0, 2.2, 1.5, 0.3, -1.0, -2.0])

def com_temperatura(logits, t):
    return torch.softmax(logits / t, dim=-1)

def top_k(probs, k):
    corte = probs.topk(k).values[-1]
    p = torch.where(probs >= corte, probs, torch.zeros_like(probs))
    return p / p.sum()

def top_p(probs, p_max):
    ordem = probs.argsort(descending=True)
    acumulada = probs[ordem].cumsum(0)
    # mantém até (e incluindo) o token que faz a soma passar de p
    manter = (acumulada - probs[ordem]) < p_max
    p = torch.zeros_like(probs)
    p[ordem[manter]] = probs[ordem[manter]]
    return p / p.sum()

def min_p(probs, m):
    p = torch.where(probs >= m * probs.max(), probs,
                    torch.zeros_like(probs))
    return p / p.sum()

for t in (0.5, 1.0, 1.5):
    probs = com_temperatura(logits, t)
    print(f"T={t}: " + "  ".join(
        f"{tok}={v:.2f}" for tok, v in zip(tokens, probs.tolist())))
```

```python
base = com_temperatura(logits, 1.0)
print("top-k=3: ", [round(v, 2) for v in top_k(base, 3).tolist()])
print("top-p=0.9:", [round(v, 2) for v in top_p(base, 0.9).tolist()])
print("min-p=0.1:", [round(v, 2) for v in min_p(base, 0.1).tolist()])

# verificações das propriedades
assert top_k(base, 3).gt(0).sum() == 3
mantidos = top_p(base, 0.9).gt(0)
assert base[mantidos].sum() >= 0.9          # cobre pelo menos p
assert torch.allclose(com_temperatura(logits, 0.01),
                      torch.nn.functional.one_hot(
                          logits.argmax(), 6).float(), atol=1e-6)
```

A última verificação mostra que, com temperatura quase zero, a distribuição vira "tudo no favorito": o greedy.

### Greedy em loop, beam e amostragem: um exemplo

Um "modelo" de brinquedo, escrito como uma tabela de probabilidades do próximo token, mostra os comportamentos:

```python
import random

modelo = {
    "<s>":    {"o": 0.6, "um": 0.4},
    "o":      {"modelo": 0.5, "texto": 0.3, "token": 0.2},
    "um":     {"token": 0.8, "texto": 0.2},
    "modelo": {"gera": 0.5, "o": 0.3, "<fim>": 0.2},
    "gera":   {"o": 0.6, "texto": 0.2, "<fim>": 0.2},
    "texto":  {"<fim>": 0.7, "e": 0.3},
    "e":      {"o": 1.0},
    "token":  {"<fim>": 1.0},
}

def gera(escolhe, max_tokens=12):
    seq = ["<s>"]
    while seq[-1] != "<fim>" and len(seq) <= max_tokens:
        seq.append(escolhe(modelo[seq[-1]]))
    return " ".join(seq[1:])

guloso = lambda dist: max(dist, key=dist.get)
rng = random.Random(0)
sorteio = lambda dist: rng.choices(list(dist), list(dist.values()))[0]

print("greedy:    ", gera(guloso))
for _ in range(3):
    print("amostragem:", gera(sorteio))
assert "<fim>" not in gera(guloso)          # o greedy entrou em loop
```

O greedy fica preso em "o modelo gera o modelo gera..." até o limite: em cada passo a escolha mais provável leva de volta ao mesmo ciclo. A amostragem sai do ciclo.

Agora, um caso em que o greedy perde para o beam search:

```python
arvore = {
    "<s>": {"a": 0.55, "b": 0.45},
    "a": {"x": 0.40, "y": 0.35, "z": 0.25},
    "b": {"w": 0.90, "v": 0.10},
}

def beam(k):
    feixes = [(1.0, ["<s>"])]
    for _ in range(2):
        candidatos = []
        for p, seq in feixes:
            for tok, q in arvore[seq[-1]].items():
                candidatos.append((p * q, seq + [tok]))
        feixes = sorted(candidatos, reverse=True)[:k]
    return feixes[0]

p_guloso = 0.55 * 0.40                       # a → x
p_beam, seq_beam = beam(2)
print(f"greedy: a x  p={p_guloso:.3f}   "
      f"beam: {' '.join(seq_beam[1:])}  p={p_beam:.3f}")
assert p_beam > p_guloso
```

O greedy escolhe "a" (0,55 > 0,45), mas todas as continuações de "a" são medianas. O beam mantém "b" vivo e encontra "b w", com probabilidade total 0,405, quase o dobro de "a x" (0,22).

## 3.4 Por que gerar é sequencial (e caro)

Para gerar o token 100, o modelo precisa do token 99, que só existe depois de gerado. Não dá para paralelizar dentro de uma mesma resposta. Cada token exige uma passada completa pelo modelo.

Consequências práticas:

- **Latência proporcional ao tamanho da resposta.** Uma resposta de 1.000 tokens leva perto de 10 vezes mais que uma de 100.
- **O KV cache** evita recalcular o contexto inteiro a cada token: guarda os cálculos dos tokens anteriores ([Capítulo 7](#cap-07)).
- **Streaming** mostra cada token assim que ele sai, o que melhora muito a sensação de velocidade.
- **Tokens de saída costumam custar mais que os de entrada** nas APIs: a entrada é processada toda de uma vez (em paralelo), a saída um token por vez.

## 3.5 Erros que se acumulam

No treino, o modelo sempre viu o texto **verdadeiro** como contexto (teacher forcing, [Capítulo 1](#cap-01)). Na geração, ele vê as **próprias** escolhas. Se uma escolha for ruim, todas as seguintes partem de um contexto que ele nunca viu no treino. Esse descompasso tem nome: **exposure bias**.

```text
 passo 5: escolhe "1987" (errado; o certo era "1978")
 passo 6+: o modelo agora "acredita" em 1987 e constrói
           o resto da resposta coerente com o erro
           ("... portanto, 9 anos depois, em 1996 ...")
```

É uma das razões de as alucinações parecerem tão convincentes ([Capítulo 16](#cap-16)): o modelo é coerente com o que já escreveu, mesmo quando o que já escreveu estava errado.

::: analogia
**Analogia:** é como escrever uma redação à caneta, palavra por palavra, sem poder apagar. Se você erra uma data no primeiro parágrafo, o resto do texto tende a seguir aquela data, porque reescrever não é uma opção.
:::

## 3.6 Determinismo

"Temperatura zero" deveria dar sempre a mesma resposta. Na prática, nem sempre dá: em servidores com muitas requisições, o tamanho do lote e a ordem das somas em ponto flutuante mudam de uma chamada para outra, e uma diferença mínima num logit pode trocar o token escolhido quando dois candidatos estão quase empatados. Daí em diante, as respostas divergem (pelo efeito da seção 3.5). Para reprodutibilidade, fixe semente, temperatura e versão do modelo, e saiba que pode haver pequenas variações.

## 3.7 Além do um-token-por-vez

O laço autorregressivo é lento por natureza, e várias técnicas atacam isso sem mudar a distribuição de saída ou mudando pouco:

- **Speculative decoding**: um modelo pequeno propõe vários tokens, e o grande verifica todos numa passada.
- **Previsão de múltiplos tokens**: modelos treinados para prever os próximos tokens de uma vez.
- **Modelos de linguagem por difusão**: geram e refinam vários tokens em paralelo, como os modelos de imagem do [Capítulo 6](#cap-06).

## Erros comuns

- **Achar que o modelo planeja a resposta inteira antes de escrever.** Ele escolhe um token por vez; qualquer "plano" está implícito nas probabilidades de cada passo.
- **Usar temperatura alta para "deixar mais inteligente".** Temperatura controla variedade, não qualidade. Para extração e respostas objetivas, temperatura baixa; para brainstorming, mais alta.
- **Combinar temperatura alta com corte nenhum.** A cauda de tokens improváveis começa a ser sorteada e o texto degringola.
- **Esquecer `max_tokens` e as sequências de parada.** A resposta pode ser cortada no meio, ou continuar além do que você queria.
- **Esperar determinismo perfeito com temperatura zero** em serviços de produção.

## Por que importa

Todo uso de LLM passa por esse laço. Saber como ele funciona ajuda a escolher parâmetros (temperatura, top-p, limites), a entender latência e custo (proporcionais aos tokens de saída), a depurar comportamentos estranhos (loops, respostas cortadas, variação entre chamadas) e a entender técnicas como saídas estruturadas ([Capítulo 10](#cap-10)), que intervêm exatamente no passo de escolha.

## Teste-se

1. Escreva a probabilidade de uma sequência de 3 tokens em termos das probabilidades condicionais.
2. Por que se usam log-probabilidades em vez de multiplicar probabilidades diretamente?
3. O que acontece com a distribuição quando a temperatura vai de 1 para 0,2? E para 2?
4. Qual a diferença entre top-k e top-p? Em que situação o top-p mantém só um token?
5. Por que o greedy pode entrar em loop?
6. O que é exposure bias e como ele se relaciona com alucinações?
7. Por que tokens de saída costumam custar mais que tokens de entrada?

::: respostas
1. $P(x_1)\,P(x_2 \mid x_1)\,P(x_3 \mid x_1, x_2)$.
2. Porque o produto de muitas probabilidades pequenas fica tão pequeno que o computador arredonda para zero; somar logs é estável.
3. Com 0,2 a distribuição fica muito concentrada no favorito (quase greedy). Com 2 fica mais espalhada, e tokens improváveis ganham chance.
4. Top-k mantém sempre $k$ tokens; top-p mantém o menor conjunto que soma $p$. Se o token favorito sozinho já tem probabilidade ≥ $p$, o top-p mantém só ele.
5. Porque a escolha mais provável a cada passo pode levar de volta a um estado em que a escolha mais provável é a mesma sequência de antes, e o greedy nunca sai do ciclo.
6. No treino o modelo vê o texto verdadeiro; na geração vê as próprias escolhas. Um erro cedo vira contexto, e o modelo continua coerente com o erro, produzindo texto errado e convincente.
7. A entrada é processada toda de uma vez, em paralelo e com bom uso do hardware; a saída é gerada um token por passada.
:::

## Flashcards

::: flashcards
- **O que é geração autorregressiva?** Gerar um token por vez, cada um condicionado a todos os anteriores, anexando a escolha ao contexto.
- **Qual a regra da cadeia para sequências?** $P(x_1..x_T) = \prod_t P(x_t \mid x_{<t})$.
- **O que é decodificação greedy?** Escolher sempre o token mais provável; determinístico, mas pode repetir e entrar em loop.
- **O que é beam search?** Manter os k melhores prefixos a cada passo; acha sequências mais prováveis, mas pode ficar genérico.
- **O que a temperatura faz?** Divide os logits antes do softmax: T<1 concentra, T>1 espalha, T→0 vira greedy.
- **O que é top-p (nucleus)?** Sortear só entre o menor conjunto de tokens cuja probabilidade soma p.
- **O que é min-p?** Manter só tokens com probabilidade ≥ m vezes a do favorito.
- **O que é exposure bias?** O modelo é treinado com o texto verdadeiro, mas gera a partir das próprias escolhas; erros se propagam.
- **Por que gerar é sequencial?** Cada token depende do anterior, que só existe depois de gerado.
- **Por que temperatura 0 nem sempre é determinística em produção?** Lotes e ordem de somas em ponto flutuante mudam entre chamadas; empates quase exatos podem virar para outro lado.
:::

## Resumo do capítulo

- A regra da cadeia transforma a probabilidade de uma sequência num produto de condicionais; o modelo aprende cada uma.
- O laço: logits → probabilidades → escolha → anexa → repete até parar.
- Decodificação: greedy (determinístico, pode entrar em loop), beam (sequências mais prováveis), amostragem com temperatura e cortes (top-k, top-p, min-p).
- Gerar é sequencial: latência e custo crescem com o tamanho da saída; KV cache e streaming ajudam.
- Exposure bias: o modelo segue coerente com os próprios erros.
- Temperatura zero não garante determinismo em serviços com lotes variáveis.
