# Capítulo 2 — Aprendizado Autossupervisionado {#cap-02}

::: frase
**Em uma frase**

Aprendizado autossupervisionado é treinar um modelo com rótulos que saem dos próprios dados: esconder ou separar uma parte da entrada e pedir ao modelo que a recupere, sem precisar de nenhuma pessoa rotulando exemplos.
:::

O [Capítulo 1](#cap-01) mostrou que o pré-treino de um LLM usa trilhões de tokens. Ninguém rotulou esses tokens: o "gabarito" de cada previsão é simplesmente o próximo token do próprio texto. Essa ideia, de tirar o gabarito dos dados, tem nome: **aprendizado autossupervisionado**. Ela é a razão de a IA moderna ter escalado, e vai muito além de texto: modelos de imagem, áudio, vídeo e os modelos de embedding usados em busca ([Capítulo 13](#cap-13)) também nascem assim.

## 2.1 De onde vêm os rótulos

Compare as três grandes famílias de aprendizado de máquina:

| Tipo | Dados | Rótulo | Exemplo |
|---|---|---|---|
| Supervisionado | entrada + rótulo humano | uma pessoa escreveu | foto → "gato" (marcado à mão) |
| Não supervisionado | só entrada | não há | agrupar clientes parecidos |
| Autossupervisionado | só entrada | **construído a partir da entrada** | frase com uma palavra escondida → a palavra |

O truque do autossupervisionado é transformar dados sem rótulo num problema supervisionado. Você cria uma **tarefa de pretexto** (pretext task): uma pergunta cuja resposta já está nos dados.

```text
 dado bruto:  "o modelo aprende padrões a partir dos dados"

 tarefa A (próximo token):
   entrada: "o modelo aprende"      alvo: "padrões"

 tarefa B (lacuna):
   entrada: "o modelo [MASK] padrões a partir dos dados"
   alvo:    "aprende"

 tarefa C (par correspondente):
   entrada: (frase, sua tradução)   alvo: "combinam"
   entrada: (frase, outra frase)    alvo: "não combinam"
```

A tarefa de pretexto em si não importa muito. O que importa é que, para resolvê-la bem, o modelo é obrigado a aprender **representações úteis**: gramática, significado, relações entre coisas. Essas representações depois servem para muitas outras tarefas.

::: analogia
**Analogia:** é como estudar uma língua estrangeira com exercícios de completar lacunas em textos reais. Ninguém precisa corrigir: o gabarito é o próprio texto. E, para acertar as lacunas, você acaba aprendendo vocabulário, gramática e contexto, que servem para muito mais do que completar lacunas.
:::

## 2.2 As principais tarefas de pretexto

### Previsão do próximo token (autorregressiva)

É a dos LLMs como GPT, Llama, Claude e Gemini: prever cada token a partir dos anteriores. Vantagem enorme: o mesmo objetivo de treino serve para **gerar** texto ([Capítulo 3](#cap-03)).

### Modelagem de linguagem mascarada

Popularizada pelo **BERT** (Devlin et al., 2018): esconder uma parte dos tokens e prever os escondidos usando o contexto **dos dois lados**. No BERT, 15% dos tokens são escolhidos; desses, 80% viram `[MASK]`, 10% viram um token aleatório e 10% ficam iguais. A mistura evita que o modelo só aprenda algo quando vê `[MASK]`, um token que nunca aparece no uso real.

```python
import random

def mascarar(tokens, vocab, p=0.15, semente=0):
    """Cria um exemplo de treino estilo BERT.
    Retorna (entrada, alvos), com alvo None onde não há previsão."""
    rng = random.Random(semente)
    entrada, alvos = [], []
    for tok in tokens:
        if rng.random() < p:                 # escolhido para prever
            alvos.append(tok)
            r = rng.random()
            if r < 0.8:
                entrada.append("[MASK]")     # 80%: máscara
            elif r < 0.9:
                entrada.append(rng.choice(vocab))  # 10%: aleatório
            else:
                entrada.append(tok)          # 10%: igual
        else:
            entrada.append(tok)
            alvos.append(None)
    return entrada, alvos

frase = "o modelo aprende padrões a partir dos próprios dados".split()
entrada, alvos = mascarar(frase, vocab=frase, p=0.3, semente=3)
print(entrada)
print(alvos)
```

Conferindo as proporções com muitos tokens:

```python
tokens = ["t"] * 200_000
entrada, alvos = mascarar(tokens, vocab=["x"], semente=7)
escolhidos = sum(a is not None for a in alvos)
mascaras = entrada.count("[MASK]")
print(f"escolhidos: {escolhidos / len(tokens):.3f}  "
      f"máscaras entre escolhidos: {mascaras / escolhidos:.3f}")
assert abs(escolhidos / len(tokens) - 0.15) < 0.005
assert abs(mascaras / escolhidos - 0.80) < 0.01
```

Modelos mascarados (os **encoders**, como BERT) não geram texto bem, mas produzem ótimas representações de frases inteiras, úteis para classificação e busca.

### Corrupção e reconstrução (denoising)

Estragar a entrada de algum jeito e treinar o modelo para recuperar o original. O **T5** troca trechos inteiros por marcadores e pede para o modelo gerar os trechos faltantes. Em imagens, o **MAE** (masked autoencoder) esconde 75% dos pedaços de uma imagem e reconstrói o resto. Os modelos de difusão ([Capítulo 6](#cap-06)) levam essa ideia ao extremo: adicionam ruído e aprendem a removê-lo.

### Aprendizado contrastivo

Em vez de reconstruir, o modelo aprende a dizer **o que combina com o quê**. Cria-se pares positivos (duas versões da mesma coisa) e negativos (coisas diferentes), e treina-se o modelo para aproximar os positivos e afastar os negativos no espaço de representações.

```text
 espaço de embeddings (2D, ilustrativo)

     foto de cachorro ●──● "um cachorro correndo"   positivos:
                                                     ficam perto
                 ✕ "um prato de macarrão"           negativos:
                                                     ficam longe
     foto de praia ●──● "areia e mar"
```

Exemplos importantes:

- **SimCLR** (imagens): duas versões alteradas da mesma foto (recorte, cor) são o par positivo.
- **CLIP** (Radford et al., 2021): uma imagem e a legenda dela são o par positivo; as outras legendas do lote são negativos. O resultado é um espaço onde texto e imagem conversam, a base de muita busca multimodal e da geração de imagens a partir de texto.
- **Modelos de embedding para busca**: pergunta e trecho que a responde são o par positivo ([Capítulo 13](#cap-13)).

## 2.3 A perda contrastiva (InfoNCE)

A perda mais usada em aprendizado contrastivo é a **InfoNCE**. Para uma consulta $q$, um positivo $k^+$ e vários negativos:

$$\mathcal{L} = -\log \frac{\exp(\text{sim}(q, k^+)/\tau)}{\sum_{j} \exp(\text{sim}(q, k_j)/\tau)}$$

- $\text{sim}$ é a similaridade, geralmente o cosseno entre os vetores.
- A soma no denominador inclui o positivo e todos os negativos.
- $\tau$ é a **temperatura**: valores baixos deixam o modelo mais exigente com as diferenças.

Leia como: "a probabilidade de escolher o par certo entre todos os candidatos". É uma entropia cruzada em que as classes são os candidatos.

O truque prático são os **negativos do próprio lote** (in-batch negatives): num lote com $B$ pares, cada consulta usa o seu par como positivo e os outros $B-1$ como negativos. A matriz de similaridades $B \times B$ tem os positivos na diagonal:

```python
import torch
import torch.nn.functional as F

def info_nce(consultas, chaves, tau=0.05):
    """consultas, chaves: [B, d]; o par i é o positivo de i."""
    q = F.normalize(consultas, dim=-1)
    k = F.normalize(chaves, dim=-1)
    sim = q @ k.T / tau                  # [B, B]
    alvos = torch.arange(q.shape[0])     # positivos na diagonal
    return F.cross_entropy(sim, alvos)

torch.manual_seed(0)
B, d = 32, 64
consultas = torch.randn(B, d)
alinhadas = consultas + 0.1 * torch.randn(B, d)  # pares parecidos
aleatorias = torch.randn(B, d)                   # pares sem relação
perda_boa = info_nce(consultas, alinhadas).item()
perda_ruim = info_nce(consultas, aleatorias).item()
print(f"pares alinhados: {perda_boa:.3f}   "
      f"pares aleatórios: {perda_ruim:.3f}   "
      f"chute: {torch.log(torch.tensor(B * 1.0)):.3f}")
assert perda_boa < 0.1 < perda_ruim
```

Com pares sem relação, a perda fica perto de $\ln B$ (o chute) ou acima; com pares alinhados, perto de zero. Treinar é ajustar o codificador para que os pares reais fiquem como o segundo caso.

::: dica
**Dica:** lotes maiores dão mais negativos por consulta e costumam produzir embeddings melhores. É por isso que o treino de modelos como o CLIP usa lotes de dezenas de milhares de pares.
:::

## 2.4 Por que funciona tão bem

1. **Os dados são praticamente infinitos.** Rotular à mão custa caro e não escala. Texto, imagens e áudio sem rótulo existem em quantidade enorme.
2. **A tarefa é difícil o bastante.** Para prever bem o próximo token num texto de química, o modelo precisa de alguma noção de química. A dificuldade força representações ricas.
3. **As representações transferem.** O que se aprende para a tarefa de pretexto serve para tarefas que ninguém previu: classificar sentimentos, traduzir, responder perguntas, buscar documentos.

## 2.5 Limites

- **O modelo aprende o que está nos dados, inclusive vieses e erros.** Não há uma pessoa decidindo o que é certo.
- **Correlação, não causa.** O modelo aprende o que costuma aparecer junto. Isso pode parecer compreensão e às vezes não é.
- **Colapso (no contrastivo).** Sem negativos ou outros cuidados, o modelo pode "trapacear" mapeando tudo para o mesmo vetor: todos os pares ficam iguais, a perda de aproximar positivos zera e nada foi aprendido. Os negativos (ou técnicas específicas para evitar isso) são essenciais.
- **Não ensina o comportamento desejado.** Um modelo autossupervisionado sabe muito, mas não sabe o que você quer que ele faça. Isso vem do ajuste com dados supervisionados e preferências ([Capítulo 4](#cap-04)).

## Erros comuns

- **Confundir autossupervisionado com não supervisionado.** No autossupervisionado há um gabarito; ele só não foi escrito por uma pessoa.
- **Achar que a tarefa de pretexto é o objetivo final.** Ninguém quer um modelo que só preenche lacunas; o valor está nas representações aprendidas.
- **Usar um encoder mascarado para gerar texto.** Modelos estilo BERT são ótimos para entender e representar; para gerar, use modelos autorregressivos.
- **Treinar embeddings contrastivos com negativos fáceis demais.** Se os negativos são óbvios (um texto de culinária contra um de física), o modelo não aprende distinções finas. Negativos difíceis (parecidos, mas errados) ensinam mais.

## Por que importa

Quase todo modelo moderno começa assim: LLMs (próximo token), modelos de embedding usados em busca e RAG (contrastivo), modelos de visão e de imagem a partir de texto (CLIP, difusão). Entender as tarefas de pretexto explica por que cada tipo de modelo é bom no que é bom, e ajuda a escolher o modelo certo: um encoder de embeddings para busca, um decoder autorregressivo para gerar.

## Teste-se

1. Qual a diferença entre aprendizado não supervisionado e autossupervisionado?
2. No BERT, por que nem todos os tokens escolhidos viram `[MASK]`?
3. Por que um modelo como o BERT gera texto mal, enquanto um GPT gera bem?
4. Num lote de 256 pares de pergunta e trecho, quantos negativos cada pergunta tem com negativos do próprio lote?
5. O que é o colapso de representações, e como os negativos o evitam?
6. Qual tipo de tarefa de pretexto produziu o CLIP, e para que ele serve?

::: respostas
1. No não supervisionado não existe gabarito (ex.: agrupar dados). No autossupervisionado existe um gabarito, mas ele é construído a partir dos próprios dados (a palavra escondida, o próximo token, o par correspondente).
2. Porque `[MASK]` nunca aparece no uso real. Trocar parte por tokens aleatórios e manter parte igual obriga o modelo a representar bem todos os tokens, não só os mascarados.
3. O BERT aprende a preencher lacunas usando os dois lados do contexto, o que não corresponde ao processo de gerar da esquerda para a direita. O GPT foi treinado exatamente para prever o próximo token, que é o passo de geração.
4. 255: os outros pares do lote.
5. É quando o modelo mapeia tudo para (quase) o mesmo vetor, o que satisfaz "aproximar os positivos" sem aprender nada. Os negativos obrigam o modelo a manter coisas diferentes afastadas.
6. Contrastiva entre imagens e suas legendas. Serve para medir a semelhança entre texto e imagem: busca de imagens por texto, classificação sem treino específico, e como componente de geradores de imagem.
:::

## Flashcards

::: flashcards
- **O que é aprendizado autossupervisionado?** Treinar com rótulos construídos a partir dos próprios dados (lacunas, próximo token, pares correspondentes), sem rotulagem humana.
- **O que é uma tarefa de pretexto?** Uma tarefa cuja resposta está nos dados, usada para forçar o modelo a aprender representações úteis.
- **Qual a tarefa de pretexto dos LLMs?** Prever o próximo token a partir dos anteriores.
- **Como funciona a modelagem mascarada do BERT?** 15% dos tokens são escolhidos; 80% viram [MASK], 10% um token aleatório, 10% ficam iguais; o modelo prevê os originais.
- **O que é aprendizado contrastivo?** Aproximar pares positivos e afastar negativos no espaço de embeddings.
- **O que é a perda InfoNCE?** Entropia cruzada sobre similaridades: a probabilidade de escolher o positivo entre todos os candidatos, com temperatura τ.
- **O que são negativos do próprio lote?** Usar os outros B−1 pares do lote como negativos de cada consulta.
- **O que é o CLIP?** Modelo treinado contrastivamente com imagens e legendas, que coloca texto e imagem no mesmo espaço.
- **O que é colapso de representações?** Quando o modelo mapeia tudo para o mesmo vetor; evitado com negativos ou técnicas específicas.
- **Encoder estilo BERT ou decoder estilo GPT para busca semântica?** Em geral, um encoder de embeddings treinado contrastivamente.
:::

## Resumo do capítulo

- Autossupervisionado: o gabarito vem dos próprios dados; escala porque dispensa rotulagem humana.
- Tarefas de pretexto: próximo token (LLMs), lacunas (BERT), corrupção e reconstrução (T5, MAE, difusão), contrastivo (SimCLR, CLIP, embeddings).
- InfoNCE: entropia cruzada sobre similaridades, com negativos do próprio lote e temperatura.
- Funciona por causa do volume de dados, da dificuldade da tarefa e da transferência das representações.
- Limites: vieses dos dados, correlação sem causa, colapso no contrastivo, e não ensina o comportamento desejado.
