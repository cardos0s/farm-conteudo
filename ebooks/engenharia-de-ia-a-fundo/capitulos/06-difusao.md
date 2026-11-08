# Capítulo 6 — Modelos de Difusão {#cap-06}

::: frase
**Em uma frase**

Um modelo de difusão aprende a remover ruído: no treino, imagens (ou outros dados) recebem quantidades crescentes de ruído e o modelo aprende a estimar esse ruído; para gerar, ele parte de ruído puro e o remove aos poucos, em muitos passos, até sobrar uma imagem nova.
:::

Os LLMs geram um token de cada vez, da esquerda para a direita ([Capítulo 3](#cap-03)). Os geradores de imagem, vídeo e áudio mais conhecidos funcionam de outro jeito: geram **tudo ao mesmo tempo**, começando de um borrão aleatório e refinando a imagem inteira a cada passo. É como uma fotografia sendo revelada. Esses são os **modelos de difusão**, e a ideia por trás deles é surpreendentemente simples.

## 6.1 A intuição: estragar é fácil, consertar se aprende

Pegar uma foto e adicionar ruído aos poucos é trivial: a cada passo, some um pouco de chiado aleatório. Depois de muitos passos, a foto vira ruído puro, sem nenhum traço da original. Esse é o **processo de ida** (forward), e ele não tem nada para aprender.

O truque é treinar uma rede neural para fazer o caminho de volta: olhar uma imagem com algum ruído e estimar qual é o ruído, para removê-lo. Se a rede consegue fazer isso em qualquer nível de ruído, dá para começar do ruído puro e chegar a uma imagem, removendo um pouco de ruído por passo.

```text
 IDA (fixo, sem aprendizado): adicionar ruído
 x₀ (foto) ──▶ x₁ ──▶ x₂ ──▶ ... ──▶ x_T (ruído puro)
  ▓▓▓▓          ▓▒▓▒      ▒░▒░             ░ ░ ░

 VOLTA (aprendida): remover ruído, um passo de cada vez
 x_T (ruído) ──▶ ... ──▶ x₂ ──▶ x₁ ──▶ x₀ (imagem NOVA)
   ░ ░ ░              ▒░▒░    ▓▒▓▒     ▓▓▓▓
              cada seta: a rede estima o ruído
              e uma parte dele é removida
```

Como o ponto de partida é ruído aleatório, cada geração produz uma imagem diferente. A rede não guarda imagens: ela aprende **como são as imagens** em geral, o suficiente para saber o que é ruído e o que é conteúdo.

## 6.2 O processo de ida, com fórmula

Define-se um cronograma de ruído $\beta_1, \ldots, \beta_T$ (pequeno no começo, maior no fim) e $\bar\alpha_t = \prod_{s=1}^{t}(1 - \beta_s)$. Uma propriedade conveniente: dá para pular direto para qualquer passo $t$, sem simular os anteriores:

$$x_t = \sqrt{\bar\alpha_t}\, x_0 + \sqrt{1 - \bar\alpha_t}\, \varepsilon, \qquad \varepsilon \sim \mathcal{N}(0, I)$$

- $x_0$: o dado original (a imagem).
- $\varepsilon$: ruído gaussiano.
- $\sqrt{\bar\alpha_t}$: quanto do original sobra no passo $t$; cai de ~1 para ~0.
- $\sqrt{1 - \bar\alpha_t}$: quanto é ruído; sobe de ~0 para ~1.

É uma **mistura**: no começo, quase só imagem; no fim, quase só ruído.

## 6.3 O treino

O treino é simples e estável, uma das razões do sucesso desses modelos (a formulação popular é o DDPM, de Ho et al., 2020):

```text
 repetir:
   1. pegue um exemplo x₀ dos dados
   2. sorteie um passo t entre 1 e T
   3. sorteie um ruído ε
   4. monte x_t = √ᾱ_t · x₀ + √(1 − ᾱ_t) · ε
   5. a rede recebe (x_t, t) e tenta prever ε
   6. perda = ‖ ε − ε_previsto ‖²   (erro quadrático)
```

Não há gerador contra discriminador, nem nada instável: é regressão. A rede aprende a responder "qual ruído foi adicionado aqui, sabendo que estamos no passo $t$?".

## 6.4 Gerando

Para gerar, parte-se de $x_T$ aleatório e aplica-se, para $t = T, \ldots, 1$:

$$x_{t-1} = \frac{1}{\sqrt{1-\beta_t}}\left(x_t - \frac{\beta_t}{\sqrt{1 - \bar\alpha_t}}\,\varepsilon_\theta(x_t, t)\right) + \sqrt{\beta_t}\, z$$

onde $\varepsilon_\theta$ é a previsão da rede e $z$ é um pouco de ruído novo (exceto no último passo). Em palavras: remova a parte do ruído que a rede estimou e adicione um pouquinho de aleatoriedade para manter a diversidade.

### Um modelo de difusão completo em 2D

Para enxergar o processo inteiro, o código abaixo treina um modelo de difusão em dados de duas dimensões: pontos espalhados em torno de três centros. O "modelo" é uma rede pequena que recebe o ponto com ruído e o passo, e prevê o ruído. A ideia é exatamente a mesma de um gerador de imagens; só muda o tamanho dos dados e da rede.

```python
import math
import torch
import torch.nn as nn

torch.manual_seed(0)
T = 100                                      # passos de ruído
betas = torch.linspace(1e-4, 0.1, T)         # cronograma
alfas = 1 - betas
alfa_barra = torch.cumprod(alfas, dim=0)
print("fração de sinal √ᾱ_t:  t=1: "
      f"{alfa_barra[0].sqrt():.3f}  t=50: {alfa_barra[49].sqrt():.3f}"
      f"  t=100: {alfa_barra[-1].sqrt():.3f}")

centros = torch.tensor([[-2.0, 0.0], [2.0, 0.0], [0.0, 2.5]])

def dados(n):
    i = torch.randint(0, 3, (n,))
    return centros[i] + 0.15 * torch.randn(n, 2)

def com_ruido(x0, t, eps):
    ab = alfa_barra[t].unsqueeze(-1)
    return ab.sqrt() * x0 + (1 - ab).sqrt() * eps

class PrevisorDeRuido(nn.Module):
    def __init__(self, h=128):
        super().__init__()
        self.rede = nn.Sequential(
            nn.Linear(4, h), nn.SiLU(),
            nn.Linear(h, h), nn.SiLU(),
            nn.Linear(h, h), nn.SiLU(),
            nn.Linear(h, 2))

    def forward(self, x, t):
        # o passo entra como seno e cosseno (noção de "quando")
        ang = t.float().unsqueeze(-1) / T * math.pi
        return self.rede(torch.cat([x, ang.sin(), ang.cos()], -1))
```

O treino segue exatamente o roteiro da seção 6.3:

```python
modelo = PrevisorDeRuido()
otim = torch.optim.Adam(modelo.parameters(), lr=2e-3)
for passo in range(3000):
    x0 = dados(512)
    t = torch.randint(0, T, (512,))
    eps = torch.randn_like(x0)
    perda = ((modelo(com_ruido(x0, t, eps), t) - eps) ** 2).mean()
    otim.zero_grad()
    perda.backward()
    otim.step()
print(f"perda final: {perda.item():.3f}")
```

E a geração, partindo de ruído puro:

```python
@torch.no_grad()
def gerar(n):
    x = torch.randn(n, 2)                    # ruído puro
    for t in reversed(range(T)):
        eps = modelo(x, torch.full((n,), t))
        x = (x - betas[t] / (1 - alfa_barra[t]).sqrt() * eps) \
            / alfas[t].sqrt()
        if t > 0:
            x = x + betas[t].sqrt() * torch.randn_like(x)
    return x

def distancia_ao_centro(x):
    return torch.cdist(x, centros).min(dim=1).values

novos = gerar(2000)
ruido = torch.randn(2000, 2)
perto = (distancia_ao_centro(novos) < 0.5).float().mean().item()
grupos = torch.cdist(novos, centros).argmin(dim=1).bincount()
print(f"distância média ao centro mais próximo: "
      f"gerados {distancia_ao_centro(novos).mean():.2f}, "
      f"ruído {distancia_ao_centro(ruido).mean():.2f}")
print(f"{perto:.0%} dos pontos gerados caem perto de um centro; "
      f"por grupo: {grupos.tolist()}")
assert perto > 0.9 and grupos.min() > 400
```

Os pontos gerados caem perto dos três centros e se dividem entre os grupos, embora cada um tenha começado como ruído aleatório. O modelo aprendeu a **distribuição** dos dados: onde eles costumam estar, e em que proporção.

## 6.5 Menos passos

Gerar com centenas ou mil passos é lento: cada passo é uma passada completa pela rede. Várias técnicas reduzem isso:

- **DDIM** (Song et al., 2020): uma forma determinística de percorrer o caminho de volta pulando passos; dezenas de passos em vez de mil.
- **Amostradores melhores**: métodos numéricos para equações diferenciais que chegam a boas imagens com 20 a 50 passos.
- **Destilação**: treinar um modelo "aluno" que faz em 1 a 4 passos o que o original faz em dezenas.
- **Flow matching** e **rectified flow** (Lipman et al., 2022; Liu et al., 2022): uma formulação aparentada que aprende caminhos mais "retos" entre ruído e dado, mais fáceis de percorrer com poucos passos. Vários geradores recentes usam essa família.

## 6.6 Condicionando: do texto à imagem

Um modelo que gera imagens aleatórias tem pouco uso. O que se quer é "gere um gato astronauta". O **condicionamento** passa uma informação extra à rede, em todo passo: o texto, codificado por um modelo de texto (como o codificador do CLIP do [Capítulo 2](#cap-02) ou um T5), entra na rede por **atenção cruzada** (cross-attention). A rede passa a prever "o ruído, sabendo que a imagem deveria ser um gato astronauta".

### Classifier-free guidance

Na prática, só condicionar produz imagens que seguem o texto de forma fraca. A **orientação sem classificador** (classifier-free guidance, Ho e Salimans, 2022) treina a mesma rede às vezes com o texto e às vezes sem (texto vazio), e na geração combina as duas previsões:

$$\hat\varepsilon = \varepsilon_\theta(x_t, \varnothing) + w \cdot \big(\varepsilon_\theta(x_t, \text{texto}) - \varepsilon_\theta(x_t, \varnothing)\big)$$

O termo entre parênteses é "a direção que o texto acrescenta". Com $w > 1$, o modelo vai **além** dessa direção. Valores típicos ficam entre ~3 e ~10.

| $w$ | Resultado |
|---|---|
| 1 | só condicionado; segue o texto de forma fraca |
| moderado | segue bem o texto, imagens nítidas |
| alto demais | cores saturadas, menos variedade, artefatos |

O custo: duas passadas por passo (com e sem texto), a menos que o modelo seja destilado para dispensar isso.

## 6.7 Difusão latente

Uma imagem de 512 × 512 pixels com 3 canais tem 786 mil números. Fazer centenas de passos de rede nesse espaço é caro. A **difusão latente** (Rombach et al., 2022, a base do Stable Diffusion) primeiro comprime a imagem com um **autoencoder** (VAE) para um espaço latente menor, faz a difusão lá, e no fim decodifica o resultado para pixels.

::: conta
**Fazendo a conta:** uma imagem 512 × 512 × 3 = 786.432 valores. Um latente típico de 64 × 64 × 4 = 16.384 valores: **48 vezes menos**. Cada passo de difusão trabalha com 48 vezes menos dados, e o decodificador roda uma vez só, no fim.
:::

```text
 texto ─▶ codificador de texto ──┐
                                 ▼ (atenção cruzada)
 ruído no ESPAÇO LATENTE ─▶ [rede de difusão] ×N passos
 (64×64×4)                         │
                                   ▼
                       latente limpo ─▶ decodificador
                                        do VAE ─▶ imagem
                                                  512×512×3
```

## 6.8 As redes por trás

- **U-Net**: a arquitetura dos primeiros modelos; uma rede convolucional que reduz e depois amplia a imagem, com atalhos entre os níveis.
- **Transformers de difusão (DiT)** (Peebles e Xie, 2023): a imagem latente é dividida em pedaços (patches) tratados como tokens por um transformer. Escala melhor com mais cálculo, e virou o padrão em vários modelos de imagem e vídeo.

## 6.9 Difusão vs geração autorregressiva

| | Autorregressivo (LLMs) | Difusão |
|---|---|---|
| Como gera | um token por vez, da esquerda para a direita | tudo de uma vez, refinando em passos |
| Passos | um por token (centenas a milhares) | dezenas (ou poucos, com destilação) |
| Paralelismo dentro da amostra | não | sim, todos os pixels/latentes juntos |
| Onde domina | texto, código | imagem, vídeo, áudio |
| Perda de treino | entropia cruzada do próximo token | erro quadrático do ruído |

As fronteiras estão se misturando: há modelos de linguagem por difusão, que geram e refinam vários tokens em paralelo, e modelos de imagem autorregressivos, que geram imagens como sequências de tokens.

::: analogia
**Analogia:** pense num restaurador de fotos antigas que aprendeu, depois de restaurar milhões de fotos em todos os níveis de desgaste, a reconhecer o que é desgaste e o que é a foto. Entregue a ele uma folha só com manchas, peça "uma praia ao pôr do sol", e ele vai "restaurando" passo a passo uma foto que nunca existiu.
:::

## 6.10 Além de imagens

A mesma ideia funciona para qualquer dado contínuo: **vídeo** (difusão em latentes de espaço e tempo), **áudio e música**, **movimento** para animação e robótica, e até **moléculas e proteínas**, onde o modelo gera estruturas em 3D.

## Erros comuns

- **Achar que o modelo cola pedaços de imagens do treino.** Ele aprende a distribuição dos dados. Memorização acontece em casos específicos (imagens muito repetidas no treino), mas não é o mecanismo de geração.
- **Achar que mais passos sempre melhora.** A partir de certo ponto, mais passos só custam tempo; com bons amostradores, 20 a 50 passos bastam.
- **Subir a guidance para "obedecer mais" sem limite.** Guidance alta demais satura cores e reduz a variedade.
- **Confundir difusão com GANs.** GANs treinam um gerador contra um discriminador; difusão treina uma regressão de ruído, mais estável.
- **Esquecer o custo da guidance.** Classifier-free guidance dobra as passadas por passo.

## Por que importa

Os modelos de difusão (e os de flow matching, da mesma família) estão por trás da maior parte da geração de imagens, vídeos e áudio. Entender o mecanismo explica os parâmetros que você encontra nessas ferramentas (passos, guidance, semente, amostrador), os trade-offs de custo e latência, e por que a geração de mídia é tão diferente da geração de texto.

## Teste-se

1. Descreva em palavras o processo de ida e o processo de volta.
2. Na fórmula $x_t = \sqrt{\bar\alpha_t}x_0 + \sqrt{1-\bar\alpha_t}\varepsilon$, o que acontece com $x_t$ quando $\bar\alpha_t$ se aproxima de 0?
3. O que a rede aprende a prever no treino, e qual é a perda?
4. Por que cada geração produz uma imagem diferente?
5. Escreva a fórmula da classifier-free guidance e explique o efeito de $w$ alto demais.
6. Por que a difusão latente é mais barata? Quantas vezes menos valores tem um latente 64×64×4 em relação a uma imagem 512×512×3?
7. Cite uma diferença fundamental entre difusão e geração autorregressiva.

::: respostas
1. Na ida, adiciona-se ruído aos poucos até o dado virar ruído puro (fixo, sem aprendizado). Na volta, uma rede estima o ruído em cada nível e o remove passo a passo, partindo de ruído puro até um dado novo.
2. O termo do dado desaparece e $x_t$ vira (quase) só ruído gaussiano.
3. O ruído $\varepsilon$ que foi adicionado, dado $x_t$ e $t$; a perda é o erro quadrático entre o ruído verdadeiro e o previsto.
4. Porque a geração parte de um ruído aleatório diferente (e adiciona aleatoriedade nos passos); fixar a semente reproduz a imagem.
5. $\hat\varepsilon = \varepsilon(x_t, \varnothing) + w(\varepsilon(x_t, \text{texto}) - \varepsilon(x_t, \varnothing))$. Com $w$ alto demais, as imagens ficam saturadas, com menos variedade e artefatos.
6. Porque a difusão roda num espaço comprimido, com muito menos valores por passo; 786.432 / 16.384 = 48 vezes menos.
7. A autorregressiva gera um token por vez em sequência; a difusão gera todos os elementos juntos e os refina em vários passos.
:::

## Flashcards

::: flashcards
- **O que é um modelo de difusão?** Um gerador que aprende a remover ruído e cria dados partindo de ruído puro, em vários passos.
- **O que é o processo de ida (forward)?** Adicionar ruído gaussiano aos poucos até o dado virar ruído; fixo, sem aprendizado.
- **Qual a fórmula para pular direto ao passo t?** $x_t = \sqrt{\bar\alpha_t}x_0 + \sqrt{1-\bar\alpha_t}\varepsilon$.
- **Qual a perda de treino de um DDPM?** Erro quadrático entre o ruído adicionado e o ruído previsto pela rede.
- **Como reduzir o número de passos de geração?** DDIM, amostradores melhores, destilação, flow matching.
- **O que é classifier-free guidance?** Combinar previsões com e sem condição: ε̂ = ε_vazio + w(ε_texto − ε_vazio).
- **O que é difusão latente?** Fazer a difusão no espaço comprimido de um autoencoder (VAE) e decodificar para pixels no fim.
- **Como o texto entra num modelo de difusão?** Codificado por um modelo de texto e injetado na rede por atenção cruzada.
- **O que é um DiT?** Um transformer de difusão: o latente vira patches tratados como tokens.
- **Difusão vs autorregressivo?** Difusão gera tudo junto refinando em passos; autorregressivo gera um token por vez.
:::

## Resumo do capítulo

- Difusão: estragar com ruído é fixo; consertar se aprende. Gerar é remover ruído a partir de ruído puro.
- Ida: $x_t = \sqrt{\bar\alpha_t}x_0 + \sqrt{1-\bar\alpha_t}\varepsilon$. Treino: prever $\varepsilon$ com erro quadrático; simples e estável.
- Geração: dezenas a centenas de passos; DDIM, amostradores, destilação e flow matching reduzem os passos.
- Condicionamento por atenção cruzada; classifier-free guidance com peso $w$ controla a aderência ao texto.
- Difusão latente comprime a imagem (48× menos valores) e torna o processo viável; DiT trouxe transformers para a difusão.
- Domina imagem, vídeo e áudio; o autorregressivo domina texto, com as fronteiras se misturando.
