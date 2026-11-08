# Capítulo 1 — Pré-treino {#cap-01}

::: frase
**Em uma frase**

O pré-treino é a primeira e mais cara etapa de treino de um modelo: ele lê uma quantidade enorme de texto tentando prever o próximo pedaço, e os erros dessas previsões ajustam bilhões de pesos até o modelo absorver padrões de linguagem, fatos e raciocínio.
:::

Antes de responder qualquer pergunta sua, um modelo como os que você usa no dia a dia passou meses "lendo" trilhões de palavras. Ninguém explicou gramática para ele, nem deu uma lista de fatos. Ele só tentou adivinhar, de novo e de novo, qual palavra vinha a seguir. Quase tudo o que o modelo sabe vem daí.

Este capítulo explica o que acontece nessa etapa: o que exatamente o modelo tenta prever, de onde vêm os dados, quanto custa, o que ele aprende e o que ele **não** aprende.

## 1.1 O objetivo: prever o próximo token

O texto é quebrado em **tokens**: pedaços de palavras, como "apr", "end", "e". Um modelo de linguagem recebe uma sequência de tokens e devolve, para cada posição, uma **distribuição de probabilidades** sobre todos os tokens do vocabulário (dezenas ou centenas de milhares): quão provável é cada um ser o próximo.

O treino compara essa distribuição com o token que realmente veio a seguir no texto. A medida de erro é a **entropia cruzada** (cross-entropy):

$$\mathcal{L} = -\frac{1}{T}\sum_{t=1}^{T} \log p_\theta(x_t \mid x_1, \ldots, x_{t-1})$$

- $x_t$ é o token verdadeiro na posição $t$.
- $p_\theta(x_t \mid \ldots)$ é a probabilidade que o modelo, com pesos $\theta$, deu a esse token.
- O $\log$ pune muito quando o modelo dá probabilidade baixa ao token certo: $-\log(0{,}9) \approx 0{,}1$, mas $-\log(0{,}01) \approx 4{,}6$.

O treino ajusta os pesos na direção que diminui essa perda (descida do gradiente). Repita isso por trilhões de tokens e o modelo fica muito bom em prever texto.

::: conta
**Fazendo a conta:** o modelo dá probabilidade 0,25 ao token certo.

- Perda nessa posição: $-\ln(0{,}25) \approx$ **1,39**.
- Se ele desse 0,5: $-\ln(0{,}5) \approx 0{,}69$. Se desse 1: perda zero.
- Um modelo que chuta ao acaso num vocabulário de 128 mil tokens dá $1/128.000$ a cada um: perda $\ln(128.000) \approx$ **11,8**. É o ponto de partida do treino.
:::

```python
import math
import torch
import torch.nn.functional as F

# vocabulário de brinquedo com 5 tokens; o certo é o de índice 2
logits = torch.tensor([[1.0, 0.5, 2.0, -1.0, 0.0]])
alvo = torch.tensor([2])
probs = torch.softmax(logits, dim=-1)
perda_manual = -math.log(probs[0, 2].item())
perda = F.cross_entropy(logits, alvo).item()
print(f"p(certo) = {probs[0, 2]:.3f}   perda = {perda:.3f}")
assert abs(perda - perda_manual) < 1e-6
```

Os **logits** são as notas cruas que o modelo dá a cada token; o **softmax** transforma as notas em probabilidades que somam 1. A função `cross_entropy` do PyTorch faz as duas coisas de uma vez.

### Perplexidade

Uma métrica comum derivada da perda é a **perplexidade**: $e^{\mathcal{L}}$. Ela tem uma leitura intuitiva: é como se, a cada passo, o modelo estivesse em dúvida entre esse número de opções igualmente prováveis. Perplexidade 10 significa "na média, hesita entre umas 10 opções". Quanto menor, melhor.

## 1.2 Um texto, milhares de exercícios

Um detalhe importante: o modelo não aprende uma posição por vez. Numa única passada, ele recebe uma sequência inteira e faz a previsão de **todas** as posições ao mesmo tempo. A máscara causal da atenção garante que a previsão da posição $t$ só enxergue os tokens anteriores, então não há trapaça.

```text
 texto:     O   gato   subiu   no   telhado
 entrada:   O   gato   subiu   no
 alvo:      gato subiu  no     telhado
            ▲    ▲      ▲      ▲
            4 exercícios de "adivinhe o próximo"
            calculados numa única passada
```

Isso se chama **teacher forcing**: durante o treino, o modelo sempre recebe o texto verdadeiro como contexto, não as próprias previsões. É o que torna o pré-treino eficiente o bastante para usar trilhões de tokens. Na hora de gerar texto ([Capítulo 3](#cap-03)), é diferente: o modelo precisa usar as próprias saídas, um token de cada vez.

Um modelo minúsculo mostra o processo inteiro. O código abaixo treina um modelo **bigrama** (que prevê o próximo caractere só a partir do caractere atual) com exatamente a mesma perda de um LLM:

```python
texto = ("o modelo aprende a prever o próximo token. "
         "o próximo token depende do contexto. "
         "o contexto vem dos tokens anteriores. ") * 20
chars = sorted(set(texto))
stoi = {c: i for i, c in enumerate(chars)}
dados = torch.tensor([stoi[c] for c in texto])
V = len(chars)

torch.manual_seed(0)
# o "modelo": uma tabela de logits [caractere atual x próximo]
tabela = torch.zeros(V, V, requires_grad=True)
otim = torch.optim.Adam([tabela], lr=0.1)
entrada, alvo = dados[:-1], dados[1:]    # alvo = entrada deslocada
inicial = F.cross_entropy(tabela[entrada], alvo).item()
for passo in range(201):
    perda = F.cross_entropy(tabela[entrada], alvo)
    otim.zero_grad()
    perda.backward()
    otim.step()
    if passo % 50 == 0:
        print(f"passo {passo:3d}  perda {perda.item():.3f}  "
              f"perplexidade {math.exp(perda.item()):5.1f}")
print(f"chute ao acaso: perda {math.log(V):.3f} (= ln {V})")
assert abs(inicial - math.log(V)) < 1e-4
assert perda.item() < inicial - 1.0
```

A perda começa em $\ln V$ (o modelo não sabe nada e dá a mesma probabilidade a todo caractere) e cai conforme ele aprende quais caracteres costumam seguir quais. Um LLM faz a mesma coisa com uma rede de bilhões de parâmetros no lugar da tabela, e com um contexto de milhares de tokens no lugar de um único caractere.

```python
def amostra(n=60, inicio="o", semente=1):
    g = torch.Generator().manual_seed(semente)
    saida = [stoi[inicio]]
    for _ in range(n):
        p = torch.softmax(tabela[saida[-1]].detach(), dim=-1)
        saida.append(torch.multinomial(p, 1, generator=g).item())
    return "".join(chars[i] for i in saida)

print(amostra())
```

O resultado lembra o texto de treino, mas sem sentido: um bigrama só olha um caractere para trás. É o mesmo tipo de máquina de um LLM, só que com memória curtíssima.

## 1.3 Os dados

A qualidade do modelo depende muito dos dados. Um pipeline típico de dados de pré-treino:

```text
 fontes brutas
 (páginas da web, código, livros,
  artigos científicos, fóruns, ...)
        │
        ▼
 1. EXTRAÇÃO       HTML → texto limpo, sem menus e anúncios
        ▼
 2. IDIOMA         identificar a língua de cada documento
        ▼
 3. QUALIDADE      filtros por regras (tamanho, símbolos,
                   repetição) e por classificadores
                   ("parece um texto educativo?")
        ▼
 4. DEDUPLICAÇÃO   exata e aproximada (ex.: MinHash):
                   texto repetido é decorado, não aprendido
        ▼
 5. SEGURANÇA      remover dados pessoais, conteúdo tóxico
        ▼
 6. DESCONTAMINAÇÃO tirar textos de benchmarks de avaliação
        ▼
 7. MISTURA        quanto de cada fonte? (ex.: mais código
                   melhora raciocínio; mais idiomas melhora
                   o multilíngue)
        ▼
 tokenização → trilhões de tokens prontos para o treino
```

Algumas escalas para referência: modelos abertos recentes de porte médio foram treinados com **dezenas de trilhões de tokens** (a Meta informou mais de 15 trilhões para o Llama 3, por exemplo). Para comparar: um livro tem algumas centenas de milhares de tokens; 15 trilhões de tokens são dezenas de milhões de livros.

::: atencao
**Cuidado:** "mais dados" só ajuda se forem dados bons. Repetir o mesmo texto muitas vezes leva o modelo a decorá-lo (e às vezes a reproduzi-lo literalmente), e texto de baixa qualidade ensina padrões de baixa qualidade. Boa parte do trabalho de pré-treino em grandes laboratórios é engenharia de dados.
:::

## 1.4 Quanto custa

Há uma regra prática muito usada para estimar o custo de cálculo de um treino:

$$C \approx 6 \times N \times D$$

- $C$: operações de ponto flutuante (FLOPs) totais.
- $N$: número de parâmetros do modelo.
- $D$: número de tokens de treino.
- O 6 vem de ~2 operações por parâmetro por token no forward e ~4 no backward.

::: conta
**Fazendo a conta:** um modelo de 8 bilhões de parâmetros treinado com 15 trilhões de tokens.

- $C = 6 \times 8 \times 10^9 \times 15 \times 10^{12} = 7{,}2 \times 10^{23}$ FLOPs.
- Uma GPU H100 faz ~989 TFLOPS em BF16 no pico; em treino real, uns 40% disso (~400 TFLOPS) é um bom resultado.
- Tempo de GPU: $7{,}2 \times 10^{23} / 4 \times 10^{14} \approx 1{,}8 \times 10^9$ segundos ≈ **500 mil horas de GPU**.
- Com 2.048 GPUs: uns **10 dias**. Na prática leva mais, por falhas, reinícios, avaliações e eficiência menor.
- A US$ 2 por hora de GPU (valor hipotético), só o cálculo custaria ~US$ 1 milhão. Modelos de fronteira são ordens de grandeza maiores.
:::

## 1.5 Leis de escala

Uma das descobertas mais importantes da área: a perda do pré-treino cai de forma **previsível** quando se aumenta o modelo, os dados ou o cálculo. Ela segue aproximadamente uma **lei de potência**: dobrar o cálculo reduz a perda numa proporção parecida a cada vez (Kaplan et al., 2020).

```text
 perda
  │●
  │  ●
  │     ●
  │        ●  ●
  │              ●   ●    ●     ●      ●
  │                                        (cada vez menos
  └──────────────────────────────────────▶  ganho por dobra)
     cálculo (escala log)
```

Isso permite **planejar**: treinar modelos pequenos, medir a curva e prever quanto um modelo grande vai atingir antes de gastar milhões.

O estudo **Chinchilla** (Hoffmann et al., 2022) mostrou que, para um orçamento fixo de cálculo, o melhor é crescer o modelo e os dados juntos, numa proporção de **cerca de 20 tokens por parâmetro**. Um modelo de 8B seria "ótimo em cálculo" com ~160 bilhões de tokens.

Mas a prática atual treina modelos pequenos com **muito mais** tokens que isso (15 trilhões para 8B são quase 1.900 tokens por parâmetro). O motivo é econômico: o Chinchilla otimiza o custo do **treino**, mas um modelo popular é usado bilhões de vezes, e a **inferência** de um modelo menor é muito mais barata. Vale gastar mais no treino para ter um modelo pequeno e forte.

## 1.6 O que o pré-treino ensina (e o que não ensina)

Para prever bem o próximo token em textos variados, o modelo precisa aprender muita coisa ao mesmo tempo:

| Para prever... | ...o modelo precisa de |
|---|---|
| "As crianças **estão**" vs "A criança **está**" | gramática, concordância |
| "A capital do Japão é **Tóquio**" | fatos do mundo |
| o resultado numa demonstração matemática | padrões de raciocínio |
| a próxima linha de uma função Python | sintaxe e lógica de programação |
| a resposta de um personagem num diálogo | estados mentais, tom, contexto |

O que ele **não** ganha só com o pré-treino:

- **Comportamento de assistente.** Um modelo base continua textos; ele não "responde perguntas". Se você escrever "Qual a capital da França?", ele pode continuar com "Qual a capital da Alemanha? Qual a capital da Itália?", porque em muitos textos da internet uma pergunta é seguida de outras perguntas (uma lista de exercícios, por exemplo).
- **Conhecimento depois da data de corte.** O modelo só sabe o que estava nos dados até a data em que eles foram coletados.
- **Garantia de verdade.** O objetivo é prever texto **plausível**, não texto **verdadeiro**. Essa diferença está na raiz das alucinações ([Capítulo 16](#cap-16)).
- **Igualdade entre assuntos e idiomas.** O que é raro nos dados (uma língua menos representada, um domínio técnico específico) é aprendido pior.

::: analogia
**Analogia:** o pré-treino é como uma educação geral muito ampla, feita lendo uma biblioteca inteira. A pessoa sai sabendo um pouco de tudo, com mais profundidade no que leu mais. Mas ninguém ensinou como atender um cliente: isso é um curso posterior (o pós-treino, Capítulos [4](#cap-04) e [5](#cap-05)).
:::

## 1.7 Do modelo base ao assistente

O pré-treino produz o **modelo base** (ou fundacional). As etapas seguintes são chamadas de **pós-treino**:

```text
 PRÉ-TREINO               MID-TRAINING            PÓS-TREINO
 ──────────               ────────────            ──────────
 trilhões de tokens       dados de alta           ajuste supervisionado
 de texto variado         qualidade no fim;       (SFT): exemplos de
                          extensão de contexto    pergunta → boa resposta
                          longo                          │
 resultado:                                       preferências (RLHF,
 MODELO BASE              ─▶                      DPO): o que é melhor
 (continua textos)                                       │
                                                  aprendizado por reforço
                                                  com tarefas verificáveis
                                                         ▼
                                                  ASSISTENTE
```

- **Mid-training** (ou "annealing"): no final do pré-treino, a mistura de dados muda para textos de mais qualidade, e o modelo aprende a lidar com contextos mais longos ([Capítulo 9](#cap-09)).
- **Pré-treino continuado**: pegar um modelo base pronto e continuar o pré-treino com dados de um domínio (jurídico, médico, um idioma). É mais barato que começar do zero e adiciona conhecimento de verdade, coisa que o ajuste fino com poucos exemplos faz mal.

## Erros comuns

- **Achar que o pré-treino produz um assistente pronto.** Produz um modelo que continua textos. O comportamento de assistente vem do pós-treino.
- **Confundir "o modelo leu" com "o modelo sabe".** Algo que aparece poucas vezes nos dados pode não ser aprendido, ou ser aprendido errado.
- **Usar ajuste fino para ensinar muitos fatos novos.** Poucos exemplos de ajuste mudam o estilo e o formato bem, mas ensinam conhecimento novo mal e de forma frágil. Para conhecimento, use busca ([Parte III](#cap-11)) ou pré-treino continuado.
- **Comparar modelos só pelo número de parâmetros.** Um modelo menor treinado com mais e melhores dados pode superar um maior.
- **Ignorar a data de corte.** Perguntar sobre eventos recentes a um modelo sem acesso a busca convida alucinações.

## Por que importa

O pré-treino define o **teto** das capacidades do modelo: tudo o que vem depois (pós-treino, prompts, busca) trabalha em cima do que ele aprendeu ali. Entender essa etapa explica por que modelos sabem mais sobre uns assuntos que outros, por que têm data de corte, por que alucinam, e por que um modelo menor bem treinado pode ser a melhor escolha para o seu produto.

## Teste-se

1. Qual é exatamente a tarefa que o modelo executa no pré-treino?
2. Um modelo deu probabilidade 0,1 ao token certo. Qual a perda nessa posição? E a perplexidade, se essa fosse a perda média?
3. Por que o pré-treino consegue usar trilhões de tokens de forma eficiente, mesmo prevendo um token por vez?
4. Estime os FLOPs para treinar um modelo de 70B com 15 trilhões de tokens.
5. Se o Chinchilla diz ~20 tokens por parâmetro, por que modelos pequenos atuais são treinados com muito mais?
6. Por que um modelo base pode responder "Qual a capital da França?" com outra pergunta?
7. Você precisa que um modelo conheça a legislação interna da sua empresa. Por que o ajuste fino com algumas centenas de exemplos é uma má escolha?

::: respostas
1. Prever o próximo token de cada posição de textos reais, minimizando a entropia cruzada entre a distribuição prevista e o token que realmente veio.
2. Perda $= -\ln(0{,}1) \approx 2{,}30$. Perplexidade $= e^{2{,}30} = 10$: é como hesitar entre 10 opções.
3. Por causa do teacher forcing com máscara causal: numa única passada, o modelo calcula a previsão de todas as posições da sequência ao mesmo tempo, sempre com o texto verdadeiro como contexto.
4. $6 \times 70 \times 10^9 \times 15 \times 10^{12} = 6{,}3 \times 10^{24}$ FLOPs, quase 9 vezes o modelo de 8B.
5. Porque o Chinchilla minimiza o custo do treino, mas o modelo é usado bilhões de vezes; um modelo menor e mais treinado custa menos na inferência, e o custo extra de treino se paga.
6. Porque ele continua textos de forma plausível, e em muitos textos uma pergunta é seguida de outras (listas de exercícios, por exemplo). Responder como assistente vem do pós-treino.
7. Porque poucos exemplos de ajuste mudam bem estilo e formato, mas ensinam fatos novos de forma pouco confiável. Melhor colocar a legislação num sistema de busca e passar os trechos relevantes no contexto (Parte III), ou fazer pré-treino continuado se o volume for grande e estável.
:::

## Flashcards

::: flashcards
- **O que é pré-treino?** A primeira etapa de treino: prever o próximo token em trilhões de tokens de texto, ajustando os pesos para reduzir a entropia cruzada.
- **Qual a fórmula da perda do pré-treino?** Entropia cruzada: média de $-\log p(x_t \mid x_{<t})$ sobre as posições.
- **O que é perplexidade?** $e^{\text{perda}}$; o número de opções igualmente prováveis entre as quais o modelo "hesita" em média.
- **Qual a perda de um chute uniforme num vocabulário de tamanho V?** $\ln V$ (11,8 para 128 mil tokens).
- **O que é teacher forcing?** Treinar com o texto verdadeiro como contexto em todas as posições, calculando todas as previsões numa só passada.
- **Como estimar o custo de cálculo de um treino?** $C \approx 6 N D$ FLOPs (N parâmetros, D tokens).
- **O que diz o Chinchilla?** Para um cálculo fixo, o ótimo é ~20 tokens de treino por parâmetro, crescendo modelo e dados juntos.
- **Por que treinar modelos pequenos além do ótimo do Chinchilla?** Porque a inferência de um modelo menor é mais barata, e o modelo é usado muitas vezes.
- **O que é um modelo base?** O resultado do pré-treino: continua textos, mas não se comporta como assistente.
- **Para que serve o pré-treino continuado?** Adicionar conhecimento de um domínio ou idioma a um modelo base, continuando o pré-treino com dados novos.
:::

## Resumo do capítulo

- Pré-treino = prever o próximo token em trilhões de tokens, minimizando a entropia cruzada.
- Perplexidade = $e^{\text{perda}}$; o chute uniforme dá perda $\ln V$.
- Teacher forcing com máscara causal permite treinar todas as posições numa passada.
- Os dados passam por extração, filtros de idioma e qualidade, deduplicação, segurança, descontaminação e mistura.
- Custo: $C \approx 6ND$. Um 8B com 15 trilhões de tokens: ~$7 \times 10^{23}$ FLOPs, centenas de milhares de horas de H100.
- Leis de escala tornam a perda previsível; o Chinchilla sugere ~20 tokens por parâmetro, mas modelos pequenos são treinados muito além disso por causa do custo de inferência.
- O resultado é um modelo base, que continua textos; o comportamento de assistente vem do pós-treino.
