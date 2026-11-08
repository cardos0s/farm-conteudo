# Capítulo 5 — Fine-tuning Eficiente: PEFT e LoRA {#cap-05}

::: frase
**Em uma frase**

PEFT (parameter-efficient fine-tuning) é adaptar um modelo treinando só uma fração pequena de parâmetros; a técnica mais usada, LoRA, congela os pesos originais e aprende, para algumas matrizes, uma correção de posto baixo formada por duas matrizes finas.
:::

Você tem um modelo de 8 bilhões de parâmetros e quer que ele escreva no estilo do seu time de suporte, ou que classifique tickets nas categorias da sua empresa. Ajustar todos os 8 bilhões de pesos (o **fine-tuning completo**) funciona, mas é caro: exige muita memória de GPU para os gradientes e o otimizador, e gera uma cópia inteira do modelo, de 16 GB, para cada adaptação. Se você tiver 50 clientes, cada um com seu ajuste, são 50 cópias.

O PEFT resolve isso. Com LoRA, você treina uns poucos milhões de parâmetros, guarda um arquivo de dezenas de megabytes por adaptação, e serve todas elas sobre o mesmo modelo base.

## 5.1 Quanto custa o fine-tuning completo

Treinar exige guardar muito mais do que os pesos:

::: conta
**Fazendo a conta: memória para o fine-tuning completo de um modelo de 8B** (treino em precisão mista com o otimizador Adam, valores aproximados):

| Item | Bytes por parâmetro | Total para 8B |
|---|---|---|
| Pesos em BF16 | 2 | 16 GB |
| Gradientes em BF16 | 2 | 16 GB |
| Cópia mestre dos pesos em FP32 | 4 | 32 GB |
| Adam: duas médias em FP32 | 8 | 64 GB |
| **Total (sem ativações)** | **16** | **~128 GB** |

Mais do que uma GPU de 80 GB, antes mesmo de contar as ativações. Com LoRA, os gradientes e os estados do otimizador existem só para os parâmetros treinados, que são uma fração mínima.
:::

## 5.2 A ideia do LoRA

O **LoRA** (low-rank adaptation, Hu et al., 2021) parte de uma observação: a **mudança** que o fine-tuning faz numa matriz de pesos tende a ter "poucas direções importantes". Em vez de aprender uma matriz de mudança $\Delta W$ completa, do mesmo tamanho de $W$, aprende-se uma versão de **posto baixo**:

$$W' = W + \Delta W = W + \frac{\alpha}{r} B A$$

- $W$: a matriz original, de tamanho $d_{saida} \times d_{entrada}$, **congelada**.
- $A$: matriz $r \times d_{entrada}$, treinável.
- $B$: matriz $d_{saida} \times r$, treinável.
- $r$: o **posto** (rank), pequeno: 8, 16, 64.
- $\alpha$: um fator de escala; $\alpha / r$ controla o tamanho do ajuste.

```text
 x ─┬──────────▶ [ W  (congelada) ] ─────────────┐
    │              d_saída × d_entrada           ▼
    │                                           (+) ─▶ y
    └─▶ [ A ] ─▶ (r números) ─▶ [ B ] ─▶ ×α/r ──┘
         r × d_entrada            d_saída × r
         (treinável)              (treinável, começa em ZERO)
```

Dois detalhes de inicialização importam:

- $A$ começa com valores aleatórios pequenos; $B$ começa **zerada**. Assim, no início, $BA = 0$ e o modelo adaptado é **exatamente** o original. O treino parte do modelo que funciona, sem perturbá-lo.
- Só $A$ e $B$ recebem gradientes.

::: conta
**Fazendo a conta: quantos parâmetros o LoRA treina.** Uma matriz de 4.096 × 4.096 (como a projeção Q de um modelo de 8B), com $r = 16$:

- Original: 4.096 × 4.096 = **16,8 milhões** de parâmetros.
- LoRA: $A$ (16 × 4.096) + $B$ (4.096 × 16) = 131.072 = **0,13 milhão**.
- Fração: **0,78%**.

Aplicando LoRA às projeções de atenção e do MLP de todas as camadas de um modelo de 8B com $r=16$, o total fica na casa de **dezenas de milhões** de parâmetros: algo como 0,5% do modelo, e um arquivo de algumas dezenas de MB em BF16.
:::

## 5.3 LoRA em código

```python
import torch
import torch.nn as nn

class LinearLoRA(nn.Module):
    """Camada linear congelada + correção de posto baixo."""

    def __init__(self, base: nn.Linear, r=8, alpha=16):
        super().__init__()
        self.base = base
        for p in self.base.parameters():
            p.requires_grad = False                    # congela W
        self.A = nn.Parameter(torch.randn(r, base.in_features) * 0.01)
        self.B = nn.Parameter(torch.zeros(base.out_features, r))
        self.escala = alpha / r

    def forward(self, x):
        return self.base(x) + (x @ self.A.T @ self.B.T) * self.escala

    def fundir(self) -> nn.Linear:
        """Devolve uma Linear comum com W + (α/r)·B·A."""
        fundida = nn.Linear(self.base.in_features,
                            self.base.out_features,
                            bias=self.base.bias is not None)
        with torch.no_grad():
            fundida.weight.copy_(self.base.weight
                                 + self.escala * self.B @ self.A)
            if self.base.bias is not None:
                fundida.bias.copy_(self.base.bias)
        return fundida

torch.manual_seed(0)
base = nn.Linear(512, 512)
lora = LinearLoRA(base, r=8, alpha=16)
x = torch.randn(4, 512)

# 1) no início, o modelo adaptado é idêntico ao original
assert torch.allclose(lora(x), base(x))

# 2) só A e B são treináveis
treinaveis = sum(p.numel() for p in lora.parameters()
                 if p.requires_grad)
total = sum(p.numel() for p in lora.parameters())
print(f"treináveis: {treinaveis:,} de {total:,} "
      f"({treinaveis / total:.1%})")
assert treinaveis == 8 * 512 * 2
```

Agora um treino de verdade: uma camada precisa aprender uma transformação nova que é, ela mesma, de posto baixo (o caso em que LoRA brilha):

```python
alvo = nn.Linear(512, 512)
with torch.no_grad():                        # alvo = base + ajuste
    alvo.weight.copy_(base.weight            # de posto 4
                      + 0.05 * torch.randn(512, 4)
                      @ torch.randn(4, 512))
    alvo.bias.copy_(base.bias)

otim = torch.optim.Adam([lora.A, lora.B], lr=1e-2)
for passo in range(300):
    x = torch.randn(64, 512)
    perda = ((lora(x) - alvo(x)) ** 2).mean()
    otim.zero_grad()
    perda.backward()
    otim.step()
print(f"erro final: {perda.item():.5f}")
assert perda.item() < 1e-3

# 3) fundir: mesma saída, sem custo extra na inferência
fundida = lora.fundir()
x = torch.randn(8, 512)
assert torch.allclose(fundida(x), lora(x), atol=1e-4)
```

O passo 3 mostra uma vantagem importante: depois do treino, $\frac{\alpha}{r}BA$ pode ser **fundido** em $W$, e a camada volta a ser uma linear comum, sem nenhum custo extra na inferência. Ou o adaptador pode ficar separado, para trocar de adaptação sem trocar o modelo base.

## 5.4 Onde aplicar e como escolher os hiperparâmetros

- **Quais matrizes**: o LoRA original adaptava só as projeções de atenção (Q e V). Na prática atual, aplicar a todas as camadas lineares (Q, K, V, saída, e as três do MLP) costuma dar resultados melhores com o mesmo número total de parâmetros.
- **Posto $r$**: 8 a 64 é o comum. Tarefas simples (estilo, formato) funcionam com posto baixo; tarefas que exigem mais mudança pedem posto maior. Aumentar o posto além do necessário dá pouco ganho.
- **$\alpha$**: frequentemente 1 a 2 vezes $r$. Como a escala é $\alpha/r$, mudar $r$ sem mudar $\alpha$ muda o tamanho efetivo do ajuste; algumas variantes ajustam essa escala para ficar estável em postos diferentes.
- **Taxa de aprendizado**: maior que no fine-tuning completo, porque são poucos parâmetros partindo do zero.

## 5.5 QLoRA: fine-tuning numa GPU só

O **QLoRA** (Dettmers et al., 2023) juntou LoRA com quantização ([Capítulo 8](#cap-08)):

- O modelo base fica **quantizado em 4 bits** (num formato chamado NF4, desenhado para pesos com distribuição parecida com a normal) e congelado.
- Os adaptadores LoRA ficam em BF16 e são os únicos treinados.
- As constantes de quantização também são quantizadas ("quantização dupla"), e os estados do otimizador podem ir para a memória da CPU em picos ("otimizadores paginados").

::: conta
**Fazendo a conta:** um modelo de 70B em 4 bits ocupa uns 35–40 GB. Com adaptadores LoRA e ativações, o fine-tuning cabe numa única GPU de 80 GB. O fine-tuning completo do mesmo modelo exigiria mais de 1 TB de memória (16 bytes por parâmetro × 70 bilhões).
:::

## 5.6 Outras técnicas de PEFT

| Técnica | O que treina | Observação |
|---|---|---|
| Adapters (Houlsby et al., 2019) | pequenas redes inseridas entre camadas | adiciona latência na inferência |
| Prefix / prompt tuning | vetores "virtuais" no começo da sequência | muito poucos parâmetros; menos expressivo |
| IA³ | vetores que reescalam ativações | ainda menos parâmetros que LoRA |
| LoRA | correção de posto baixo nos pesos | pode ser fundido; o padrão de mercado |
| DoRA | separa magnitude e direção dos pesos, com LoRA na direção | costuma se aproximar mais do fine-tuning completo |

## 5.7 O que o fine-tuning ensina bem, e o que não

O fine-tuning, com LoRA ou completo, é ótimo para:

- **Formato e estilo**: responder sempre em JSON, no tom da marca, em português formal.
- **Tarefas específicas**: classificar, extrair campos, seguir um procedimento.
- **Comportamento**: quando recusar, quando pedir mais informações.

E é ruim para:

- **Ensinar muitos fatos novos.** Poucos exemplos de fine-tuning não "gravam" conhecimento de forma confiável; o modelo pode até ficar mais propenso a inventar. Para conhecimento, use busca e contexto ([Parte III](#cap-11)).
- **Corrigir falta de capacidade.** Um modelo pequeno não vira um modelo grande com LoRA.

::: analogia
**Analogia:** pense num manual da empresa e em suplementos curtos para cada departamento. O manual (o modelo base) não muda. Cada departamento tem um suplemento fino (o adaptador LoRA) que ajusta como o manual é aplicado ali. Trocar de departamento é trocar o suplemento, não reimprimir o manual.
:::

## 5.8 Servindo muitos adaptadores

Como os adaptadores são pequenos e o modelo base é compartilhado, um único servidor pode atender milhares de adaptações diferentes, até misturando requisições de adaptadores diferentes no mesmo lote, com kernels que aplicam o $BA$ certo a cada linha do lote (sistemas como Punica e S-LoRA). Isso torna viável oferecer um modelo personalizado por cliente sem multiplicar o número de GPUs.

## Erros comuns

- **Usar um adaptador com um modelo base diferente.** O adaptador é uma correção para pesos específicos. Mudou a versão do modelo base, o adaptador não vale mais.
- **Esquecer o fator $\alpha/r$** ao fundir ou ao reimplementar, e obter um modelo diferente do treinado.
- **Esperar que o LoRA ensine uma base de conhecimento.** Ele ensina comportamento; para conhecimento, busca.
- **Avaliar só nos exemplos de treino.** Com poucos exemplos, o adaptador decora fácil. Separe exemplos de teste.
- **Aumentar o posto achando que sempre melhora.** Mais posto é mais capacidade de decorar; nem sempre é mais qualidade.
- **Fine-tuning catastrófico**: ajustar demais numa tarefa estreita e piorar o modelo em todo o resto. Misture dados gerais ou limite o treino.

## Por que importa

PEFT tornou o fine-tuning acessível: o que exigia um cluster cabe numa GPU, e o que exigia uma cópia do modelo por cliente cabe em arquivos de megabytes. É o caminho padrão para adaptar modelos abertos a um domínio, um formato ou um estilo, e o que permite oferecer modelos personalizados em escala.

## Teste-se

1. Por que o fine-tuning completo de um modelo de 8B não cabe numa GPU de 80 GB, mesmo os pesos ocupando só 16 GB?
2. Escreva a fórmula do LoRA e diga quais matrizes são treinadas.
3. Por que $B$ começa zerada?
4. Quantos parâmetros treináveis tem um LoRA de posto 8 numa matriz de 4.096 × 1.024?
5. O que significa "fundir" um adaptador, e qual a vantagem?
6. O que o QLoRA adiciona ao LoRA?
7. Sua empresa quer que o modelo saiba os preços atualizados de 5 mil produtos. LoRA é uma boa escolha? Por quê?

::: respostas
1. Porque o treino com Adam em precisão mista precisa de ~16 bytes por parâmetro (pesos, gradientes, cópia mestre e duas médias do otimizador): ~128 GB, sem contar as ativações.
2. $W' = W + \frac{\alpha}{r} B A$; $W$ fica congelada, $A$ e $B$ são treinadas.
3. Para que $BA = 0$ no início e o modelo adaptado comece idêntico ao original; o treino parte de um modelo que funciona.
4. $A$: 8 × 1.024 = 8.192; $B$: 4.096 × 8 = 32.768; total 40.960.
5. Somar $\frac{\alpha}{r}BA$ aos pesos originais, transformando a camada de volta numa linear comum: nenhuma latência extra na inferência.
6. O modelo base quantizado em 4 bits (NF4), quantização dupla das constantes e otimizadores paginados; permite fazer fine-tuning de modelos grandes numa só GPU.
7. Não. Preços são fatos que mudam; LoRA ensina mal fatos e exigiria retreino a cada mudança. Melhor uma busca nos dados de produtos e passar os preços no contexto (ou uma ferramenta que consulte o banco).
:::

## Flashcards

::: flashcards
- **O que é PEFT?** Adaptar um modelo treinando só uma pequena fração de parâmetros (novos ou existentes).
- **Qual a fórmula do LoRA?** $W' = W + \frac{\alpha}{r} B A$, com W congelada e A, B treináveis de posto r.
- **Por que B começa em zero no LoRA?** Para o modelo adaptado começar idêntico ao original.
- **Quantos parâmetros um LoRA de posto r adiciona a uma matriz d×k?** r·(d + k).
- **O que é fundir um adaptador LoRA?** Somar (α/r)·BA aos pesos, eliminando custo extra na inferência.
- **O que é QLoRA?** LoRA sobre um modelo base quantizado em 4 bits (NF4), permitindo fine-tuning de modelos grandes numa GPU.
- **Quanta memória o fine-tuning completo com Adam usa por parâmetro?** Cerca de 16 bytes (sem ativações).
- **Para que o fine-tuning é bom?** Formato, estilo, tarefas específicas e comportamento.
- **Para que o fine-tuning é ruim?** Ensinar muitos fatos novos ou que mudam; para isso, busca e contexto.
- **Um adaptador LoRA funciona em outro modelo base?** Não; ele é uma correção para os pesos daquela versão específica.
:::

## Resumo do capítulo

- Fine-tuning completo com Adam precisa de ~16 bytes por parâmetro e gera uma cópia do modelo por adaptação.
- LoRA congela W e aprende $\frac{\alpha}{r}BA$ de posto baixo; B começa em zero; treina menos de 1% dos parâmetros.
- O adaptador pode ser fundido (zero custo na inferência) ou mantido separado (troca rápida, muitos adaptadores no mesmo servidor).
- QLoRA: base em 4 bits + LoRA = fine-tuning de modelos grandes numa GPU.
- Outras técnicas: adapters, prefix/prompt tuning, IA³, DoRA.
- Fine-tuning ensina formato e comportamento; conhecimento novo vem melhor de busca e contexto.
