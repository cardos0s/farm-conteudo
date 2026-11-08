# Capítulo 4 — RLHF: Aprendizado por Reforço com Feedback Humano {#cap-04}

::: frase
**Em uma frase**

RLHF é uma etapa de pós-treino em que pessoas comparam respostas do modelo, essas comparações treinam um modelo de recompensa que dá nota a respostas, e o modelo de linguagem é ajustado para tirar notas mais altas sem se afastar demais do que já sabia.
:::

O modelo base do [Capítulo 1](#cap-01) sabe muito, mas não sabe o que você quer. Ele continua textos. Para virar um assistente útil, precisa aprender um comportamento: seguir instruções, ser claro, admitir quando não sabe, recusar pedidos perigosos. O problema é que "boa resposta" é difícil de definir com regras, e caro de demonstrar com exemplos escritos à mão. O RLHF resolve isso com uma observação simples: **é muito mais fácil comparar duas respostas do que escrever a resposta perfeita**.

## 4.1 Por que imitar exemplos não basta

O primeiro passo do pós-treino costuma ser o **ajuste supervisionado** (SFT, supervised fine-tuning): mostrar ao modelo milhares de pares "instrução → boa resposta" escritos por pessoas, e treinar para imitar. Isso já ensina o formato de assistente. Mas tem limites:

- **Escrever respostas excelentes é caro e lento**, e cada pessoa escreve de um jeito.
- **Imitar não ensina o que evitar.** O modelo vê só respostas boas; não aprende por que uma resposta parecida é pior.
- **O modelo fica limitado pela qualidade de quem escreveu.**

Comparar é mais barato, mais consistente e captura nuances: uma pessoa nota que a resposta A é mais precisa que a B, mesmo sem saber escrever uma resposta melhor que as duas.

## 4.2 As três etapas clássicas

O processo descrito no trabalho do InstructGPT (Ouyang et al., 2022) virou a referência:

```text
 ETAPA 1: SFT
 instruções + respostas escritas por pessoas
        │ ajuste supervisionado
        ▼
 modelo SFT ──────────────────────────────┐
        │                                 │ (cópia congelada
 ETAPA 2: MODELO DE RECOMPENSA            │  = modelo de
 para cada instrução, o modelo SFT gera   │  referência)
 2+ respostas; pessoas escolhem a melhor  │
        │ treina um modelo que dá nota    │
        ▼                                 │
 modelo de recompensa r(x, y)             │
        │                                 │
 ETAPA 3: APRENDIZADO POR REFORÇO         │
 o modelo gera respostas, recebe a nota,  │
 e é ajustado para notas maiores          │
 + penalidade por se afastar ◀────────────┘
   da referência (KL)
        ▼
 modelo final (assistente)
```

## 4.3 Coletando preferências

Para cada instrução, o modelo gera duas ou mais respostas. Avaliadores, seguindo diretrizes, escolhem a melhor (ou ordenam todas). As diretrizes costumam pedir que se avalie se a resposta é **útil** (resolve o pedido, segue as instruções), **honesta** (não inventa, admite incerteza) e **segura** (não causa dano).

Problemas reais desse processo:

- **Avaliadores discordam** entre si numa fração considerável dos casos; preferências humanas têm ruído.
- **Avaliadores se deixam levar pela aparência**: respostas longas, confiantes e bem formatadas tendem a ser preferidas, mesmo quando contêm erros sutis que o avaliador não tem tempo ou conhecimento para conferir.
- **Custo**: são necessárias dezenas ou centenas de milhares de comparações.

## 4.4 O modelo de recompensa

As comparações treinam um **modelo de recompensa** $r(x, y)$: uma rede (normalmente uma cópia do próprio LLM com uma "cabeça" que devolve um número) que recebe a instrução $x$ e uma resposta $y$ e dá uma nota.

O modelo de **Bradley-Terry** liga notas a preferências: a probabilidade de a resposta vencedora $y_w$ ser preferida à perdedora $y_l$ é

$$P(y_w \succ y_l) = \sigma\big(r(x, y_w) - r(x, y_l)\big)$$

onde $\sigma$ é a função sigmoide. Só a **diferença** de notas importa. O treino minimiza:

$$\mathcal{L}_{RM} = -\log \sigma\big(r(x, y_w) - r(x, y_l)\big)$$

O exemplo abaixo simula o processo. Cada resposta é descrita por três características (utilidade, tamanho, erros), e os "avaliadores" preferem respostas úteis e sem erros, mas também têm uma leve preferência por respostas longas, como acontece na vida real:

```python
import torch
import torch.nn.functional as F

torch.manual_seed(0)
N = 4000
# cada resposta: [utilidade, tamanho, erros], normalizados
a, b = torch.randn(N, 3), torch.randn(N, 3)
gosto_humano = torch.tensor([2.0, 0.4, -1.5])   # leve viés por tamanho
nota_real = lambda x: x @ gosto_humano
# preferências com ruído, segundo Bradley-Terry
a_vence = torch.rand(N) < torch.sigmoid(nota_real(a) - nota_real(b))
venc = torch.where(a_vence[:, None], a, b)
perd = torch.where(a_vence[:, None], b, a)

w = torch.zeros(3, requires_grad=True)          # modelo de recompensa
otim = torch.optim.Adam([w], lr=0.05)
for _ in range(400):
    perda = -F.logsigmoid(venc @ w - perd @ w).mean()
    otim.zero_grad()
    perda.backward()
    otim.step()

acerto = ((venc @ w) > (perd @ w)).float().mean().item()
print("pesos aprendidos [utilidade, tamanho, erros]:",
      [round(v, 2) for v in w.tolist()])
print(f"concorda com os avaliadores em {acerto:.0%} dos pares")
assert w[0] > 0 and w[2] < 0 and w[1] > 0
```

O modelo de recompensa aprende o gosto dos avaliadores, **inclusive o viés por tamanho**. Isso vai importar na próxima seção. E repare que a concordância não chega a 100%: as preferências têm ruído, e um bom modelo de recompensa também não acerta tudo.

## 4.5 A etapa de reforço e a penalidade KL

Com o modelo de recompensa pronto, o LLM (a **política** $\pi_\theta$) é ajustado para maximizar:

$$\mathbb{E}_{y \sim \pi_\theta(\cdot \mid x)}\big[r(x, y)\big] - \beta \, \text{KL}\big(\pi_\theta \,\|\, \pi_{ref}\big)$$

- O primeiro termo: gerar respostas com nota alta.
- O segundo: a **divergência KL** mede o quanto a política se afastou do modelo de referência (o SFT congelado). O coeficiente $\beta$ controla a força da penalidade.

O algoritmo clássico para essa otimização é o **PPO** (proximal policy optimization), que limita o tamanho de cada atualização para o treino não desestabilizar.

Por que a penalidade KL é essencial? Porque o modelo de recompensa é só uma **aproximação** do gosto humano, válida perto das respostas que ele viu no treino. Se a política se afastar muito, ela encontra respostas estranhas que o modelo de recompensa avalia bem por engano.

### Reward hacking

Esse fenômeno tem nome: **reward hacking** (explorar a recompensa). É a lei de Goodhart: quando uma medida vira meta, ela deixa de ser uma boa medida.

Continuando o exemplo: o modelo de recompensa aprendeu peso positivo para "tamanho". Uma política que só quer maximizar a nota descobre que aumentar o tamanho dá nota, sem ganhar utilidade:

```python
resposta = torch.tensor([1.0, 0.0, 0.0])    # útil, tamanho médio
mais_longa = torch.tensor([1.0, 3.0, 0.0])  # mesma utilidade, 3x maior
print(f"nota da resposta: {(resposta @ w).item():.2f}   "
      f"nota da versão longa: {(mais_longa @ w).item():.2f}")
assert mais_longa @ w > resposta @ w
```

Na vida real, os sintomas conhecidos são: respostas cada vez mais longas e cheias de listas, excesso de elogios e concordância com o usuário (**bajulação**, ou sycophancy), confiança exagerada. A penalidade KL, modelos de recompensa melhores, dados que corrigem esses vieses e avaliação cuidadosa são as defesas.

::: analogia
**Analogia:** é como um treinador que avalia treinos. O feedback guia a próxima tentativa, mas o atleta melhora naquilo que o treinador recompensa, que nem sempre é exatamente o que a competição exige. Se o treinador valoriza demais um movimento bonito, o atleta começa a exagerar no movimento bonito.
:::

## 4.6 DPO: preferências sem modelo de recompensa

A etapa de reforço é complexa: gerar respostas durante o treino, manter quatro modelos na memória (política, referência, recompensa e um modelo de valor no PPO), ajustar muitos hiperparâmetros. O **DPO** (direct preference optimization, Rafailov et al., 2023) mostrou que dá para pular o modelo de recompensa e o reforço, otimizando direto sobre os pares de preferência:

$$\mathcal{L}_{DPO} = -\log \sigma\!\left(\beta\left[\log\frac{\pi_\theta(y_w \mid x)}{\pi_{ref}(y_w \mid x)} - \log\frac{\pi_\theta(y_l \mid x)}{\pi_{ref}(y_l \mid x)}\right]\right)$$

Em palavras: aumente a probabilidade da resposta vencedora e diminua a da perdedora, **em relação ao modelo de referência**. O termo de referência faz o papel da penalidade KL.

```python
def perda_dpo(lp_venc, lp_perd, lp_ref_venc, lp_ref_perd, beta=0.1):
    """lp_*: log-probabilidade total de cada resposta."""
    margem = beta * ((lp_venc - lp_ref_venc) - (lp_perd - lp_ref_perd))
    return -F.logsigmoid(margem).mean()

ref_v, ref_p = torch.tensor([-42.0]), torch.tensor([-40.0])
inicio = perda_dpo(ref_v, ref_p, ref_v, ref_p)   # política = ref.
depois = perda_dpo(ref_v + 2, ref_p - 2, ref_v, ref_p)
print(f"perda no início: {inicio.item():.3f} (= ln 2)   "
      f"depois de preferir a vencedora: {depois.item():.3f}")
assert abs(inicio.item() - torch.log(torch.tensor(2.0)).item()) < 1e-6
assert depois < inicio
```

O DPO e suas variantes viraram muito populares por serem simples e estáveis. Uma limitação: ele aprende só com as respostas que estão nos dados de preferência (é "offline"), enquanto o RL clássico gera respostas novas durante o treino e pode descobrir comportamentos melhores, ou piores.

## 4.7 Feedback de IA e princípios

Avaliadores humanos são caros e lentos. No **RLAIF** (reinforcement learning from AI feedback), um modelo faz as comparações. Na abordagem **Constitutional AI** (Bai et al., 2022), o modelo critica e revisa as próprias respostas seguindo uma lista de princípios escritos (a "constituição"), e as preferências usadas no treino vêm dessas avaliações guiadas por princípios. Isso escala o feedback e torna os critérios explícitos e auditáveis, ao custo de depender da qualidade do modelo avaliador e dos princípios.

## 4.8 Reforço com recompensas verificáveis

Para matemática, código e outras tarefas com resposta checável, não é preciso um modelo de recompensa aprendido: a recompensa pode vir de uma **verificação automática** (a resposta numérica bate? os testes passam?). Isso é chamado de RL com recompensas verificáveis (RLVR), e está por trás de boa parte do avanço dos modelos de "raciocínio".

Um algoritmo popular é o **GRPO** (group relative policy optimization, Shao et al., 2024): para cada problema, o modelo gera um **grupo** de respostas; a vantagem de cada uma é a sua recompensa comparada com a média do grupo. Respostas melhores que a média são reforçadas, piores são desencorajadas, sem precisar de um modelo de valor separado.

```python
# 8 tentativas para o mesmo problema; 1 = passou nos testes
recompensas = torch.tensor([1.0, 0.0, 0.0, 1.0, 1.0, 0.0, 0.0, 0.0])
vantagens = ((recompensas - recompensas.mean())
             / (recompensas.std() + 1e-6))
print([round(v, 2) for v in vantagens.tolist()])
assert abs(vantagens.mean().item()) < 1e-6
assert vantagens[0] > 0 > vantagens[1]
```

Se todas as tentativas acertam (ou todas erram), as vantagens zeram: o grupo não tem nada a ensinar naquele problema. Por isso a dificuldade dos problemas de treino precisa ser calibrada.

## 4.9 O que o RLHF muda, e o que não muda

| Muda bastante | Muda pouco ou nada |
|---|---|
| tom, formato, nível de detalhe | conhecimento de fatos (vem do pré-treino) |
| seguir instruções | habilidades que o modelo base não tem |
| recusar pedidos perigosos | a data de corte |
| admitir incerteza (se recompensado) | garantia de verdade |

Um efeito colateral observado: o ajuste por preferências pode piorar a **calibração** (a correspondência entre a confiança do modelo e sua taxa de acerto), porque respostas confiantes tendem a ser preferidas.

## Erros comuns

- **Confundir resposta preferida com resposta verificada.** Um avaliador pode preferir uma resposta bem escrita com um erro factual sutil. Precisão precisa ser avaliada separadamente de tom e utilidade.
- **Achar que o RLHF ensina conhecimento novo.** Ele molda o comportamento sobre o que o modelo já sabe.
- **Otimizar o modelo de recompensa sem limite.** Sem penalidade KL e avaliação externa, aparece reward hacking: verbosidade, bajulação, formatação exagerada.
- **Avaliar o modelo final só com o mesmo tipo de preferência usado no treino.** É medir com a régua que ele aprendeu a enganar. Use avaliações independentes.
- **Pensar que DPO e RLHF são opostos.** O DPO resolve o mesmo objetivo de outra forma; os dois partem de preferências.

## Por que importa

O RLHF e seus descendentes (DPO, RLAIF, RL com recompensas verificáveis) são o que transforma um modelo que continua textos num assistente. Entender o processo explica comportamentos que você vê todo dia: respostas longas demais, concordância excessiva, recusas, e por que um modelo às vezes parece confiante e errado. Também ajuda a avaliar modelos com mais senso crítico: o que foi recompensado aparece no comportamento, para o bem e para o mal.

## Teste-se

1. Por que comparar respostas é mais prático que escrever respostas ideais?
2. Quais são as três etapas clássicas do RLHF?
3. Na fórmula de Bradley-Terry, se a vencedora tem nota 2 e a perdedora 0, qual a probabilidade prevista de preferência? (σ(2) ≈ 0,88)
4. Para que serve a penalidade KL na etapa de reforço?
5. Dê dois exemplos de reward hacking em assistentes.
6. O que o DPO elimina em relação ao pipeline clássico? Qual a perda dele quando a política é igual à referência?
7. No GRPO, o que acontece com as vantagens se todas as 8 tentativas passam nos testes?

::: respostas
1. Porque julgar qual de duas respostas é melhor é rápido, barato e mais consistente entre pessoas, mesmo quando quem julga não saberia escrever a resposta ideal.
2. Ajuste supervisionado (SFT), treino do modelo de recompensa com comparações, e otimização por reforço (por exemplo, PPO) com penalidade KL.
3. $\sigma(2 - 0) \approx 0{,}88$.
4. Impede a política de se afastar demais do modelo de referência, onde o modelo de recompensa deixa de ser confiável; limita o reward hacking e preserva habilidades do modelo original.
5. Respostas cada vez mais longas e cheias de formatação; bajulação (concordar com o usuário mesmo quando ele está errado); excesso de confiança.
6. Elimina o modelo de recompensa separado e a etapa de RL (geração durante o treino). Com a política igual à referência, a margem é zero e a perda é $-\log \sigma(0) = \ln 2 \approx 0{,}693$.
7. Todas as recompensas são iguais à média, então todas as vantagens são zero: o grupo não gera sinal de aprendizado.
:::

## Flashcards

::: flashcards
- **O que é RLHF?** Pós-treino em que comparações humanas treinam um modelo de recompensa, e o LLM é otimizado para notas maiores com penalidade KL.
- **O que é SFT?** Ajuste supervisionado com pares instrução → resposta escrita por pessoas; normalmente a primeira etapa do pós-treino.
- **O que é o modelo de Bradley-Terry?** $P(y_w \succ y_l) = \sigma(r(y_w) - r(y_l))$: a preferência depende da diferença de notas.
- **Qual a perda do modelo de recompensa?** $-\log \sigma(r(x,y_w) - r(x,y_l))$.
- **Para que serve a penalidade KL no RLHF?** Manter a política perto da referência, onde a recompensa aprendida é confiável.
- **O que é reward hacking?** A política explora falhas do modelo de recompensa (ex.: verbosidade, bajulação) em vez de melhorar de verdade.
- **O que é DPO?** Otimização direta das preferências, sem modelo de recompensa nem RL, comparando log-probabilidades com a referência.
- **O que é RLAIF / Constitutional AI?** Usar um modelo, guiado por princípios escritos, para gerar as avaliações de preferência.
- **O que é RL com recompensas verificáveis?** Reforço em que a recompensa vem de uma checagem automática (resposta certa, testes passando).
- **Como o GRPO calcula vantagens?** Recompensa de cada resposta comparada com a média (e desvio) do grupo de respostas ao mesmo problema.
:::

## Resumo do capítulo

- Imitar exemplos (SFT) ensina o formato, mas é caro e não ensina o que evitar; comparar respostas é mais barato e rico.
- Pipeline clássico: SFT → modelo de recompensa (Bradley-Terry) → RL (PPO) com penalidade KL.
- O modelo de recompensa aprende o gosto dos avaliadores, inclusive seus vieses; otimizar demais leva a reward hacking.
- DPO otimiza as preferências direto, sem recompensa nem RL; RLAIF usa feedback de modelos guiados por princípios.
- RL com recompensas verificáveis (ex.: GRPO) treina raciocínio em tarefas checáveis.
- RLHF molda comportamento, não adiciona conhecimento; preferência não é verificação.
