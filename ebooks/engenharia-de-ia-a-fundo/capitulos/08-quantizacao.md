# Capítulo 8 — Quantização {#cap-08}

::: frase
**Em uma frase**

Quantizar é guardar (e às vezes calcular) os números de um modelo com menos bits, como 8 ou 4 em vez de 16: o modelo ocupa menos memória e costuma gerar texto mais rápido, ao custo de uma aproximação que pode afetar a qualidade.
:::

Um modelo de 70 bilhões de parâmetros em 16 bits ocupa 140 GB. Não cabe numa GPU de 80 GB, muito menos num notebook. Em 4 bits, ocupa uns 40 GB. Essa diferença decide se você consegue rodar o modelo, em que hardware, para quantos usuários e a que custo. Quantização é, provavelmente, a otimização de inferência com maior efeito prático, e também a mais fácil de usar mal.

## 8.1 Quanto se economiza

| Modelo | 16 bits | 8 bits | 4 bits | Onde cabe em 4 bits |
|---|---|---|---|---|
| 8B | ~16 GB | ~8 GB | ~4,5 GB | notebook com 16 GB de RAM, GPU de 8 GB |
| 70B | ~140 GB | ~70 GB | ~38 GB | uma GPU de 48–80 GB, Mac com bastante memória |
| 400B | ~800 GB | ~400 GB | ~210 GB | vários GPUs |

Os valores de 4 bits incluem uma sobra para as escalas (seção 8.3) e são aproximados. Lembre também que, além dos pesos, é preciso memória para o KV cache ([Capítulo 7](#cap-07)), que cresce com o contexto.

## 8.2 Os formatos

Um número de ponto flutuante tem **sinal**, **expoente** (que define a faixa, o quão grande ou pequeno o número pode ser) e **mantissa** (que define a precisão). Um inteiro tem passos iguais.

| Formato | Bits | Característica | Uso típico |
|---|---|---|---|
| FP32 | 32 | faixa e precisão altas | treino (cópias mestre), referência |
| BF16 | 16 | faixa do FP32, menos precisão | treino e inferência padrão |
| FP16 | 16 | mais precisão, faixa curta (máx. 65.504) | inferência |
| FP8 | 8 | ponto flutuante de 8 bits | inferência em GPUs recentes |
| INT8 | 8 | 256 níveis igualmente espaçados | pesos e ativações |
| INT4 / FP4 | 4 | 16 níveis | pesos (e, em hardware novo, ativações) |

Com 4 bits, cada peso só pode assumir **16 valores diferentes**. Parece pouco, e é. O que faz isso funcionar são as escalas.

## 8.3 Como se quantiza

A forma mais comum é a quantização **linear simétrica**: escolhe-se uma escala $s$ e cada valor vira um inteiro:

$$q = \text{round}\left(\frac{x}{s}\right), \qquad s = \frac{\max|x|}{q_{max}}, \qquad \hat{x} = s \cdot q$$

Para INT8, $q_{max} = 127$; para INT4, $q_{max} = 7$. O valor recuperado $\hat{x}$ é uma aproximação de $x$.

O problema aparece com **outliers**. Se um único valor do grupo for muito maior que os outros, a escala fica grande e os valores pequenos viram zero. A solução é usar **uma escala para cada grupo pequeno** de valores (por exemplo, a cada 32, 64 ou 128 pesos), em vez de uma para o tensor inteiro: um outlier só estraga o grupo dele.

```python
import torch

def quantiza(x, bits, grupo=None):
    """Quantização simétrica; devolve a versão dequantizada."""
    qmax = 2 ** (bits - 1) - 1
    original = x.shape
    if grupo:                                  # uma escala por grupo
        x = x.reshape(-1, grupo)
        escala = x.abs().amax(dim=1, keepdim=True) / qmax
    else:                                      # uma escala p/ tudo
        escala = x.abs().max() / qmax
    q = torch.clamp(torch.round(x / escala), -qmax, qmax)
    return (q * escala).reshape(original)

torch.manual_seed(0)
pesos = torch.randn(4096) * 0.02     # pesos típicos: pequenos
pesos[123] = 1.0                     # um outlier

for bits in (8, 4):
    for grupo in (None, 64):
        erro = (quantiza(pesos, bits, grupo) - pesos).abs().mean()
        nome = "tensor inteiro" if grupo is None else f"grupos de {grupo}"
        print(f"INT{bits}, {nome:15s}: erro médio {erro:.5f}")

e_tensor = (quantiza(pesos, 4) - pesos).abs().mean()
e_grupo = (quantiza(pesos, 4, 64) - pesos).abs().mean()
assert e_grupo < e_tensor / 5
```

Com uma escala só, o outlier de 1,0 faz a escala do INT4 ser 1/7 ≈ 0,14, e quase todos os pesos (da ordem de 0,02) viram zero. Com grupos de 64, só o grupo do outlier sofre.

O preço dos grupos: cada grupo guarda sua escala. Com grupos de 64 e escalas de 16 bits, são 16 bits extras a cada 64 pesos, ou 0,25 bit por peso. Por isso um "4 bits" real ocupa um pouco mais de 4 bits por peso.

::: analogia
**Analogia:** é como reduzir a paleta de cores de uma imagem para 16 cores. Se você escolher uma paleta única para a imagem inteira e ela tiver um ponto de cor muito forte, a paleta se espalha para cobrir esse ponto e o resto fica borrado. Se cada pequeno pedaço da imagem tiver a sua paleta de 16 cores, o resultado fica muito mais fiel, ao custo de guardar várias paletas.
:::

## 8.4 O efeito numa camada inteira

O que importa não é o erro em cada peso, mas o erro na **saída** da camada. O exemplo abaixo quantiza os pesos de uma camada linear e mede o quanto a saída muda:

```python
torch.manual_seed(1)
W = torch.randn(1024, 1024) * 0.02
x = torch.randn(32, 1024)
y = x @ W.T

for bits, grupo in ((8, 128), (4, 128), (4, 32), (3, 32)):
    Wq = quantiza(W.flatten(), bits, grupo).reshape(W.shape)
    erro = ((x @ Wq.T) - y).norm() / y.norm()
    print(f"{bits} bits, grupos de {grupo:3d}: "
          f"erro relativo na saída {erro:.1%}")

erro8 = ((x @ quantiza(W.flatten(), 8, 128).reshape(W.shape).T) - y)
erro4 = ((x @ quantiza(W.flatten(), 4, 128).reshape(W.shape).T) - y)
assert erro8.norm() < erro4.norm() / 5
```

Em 8 bits, o erro na saída é muito pequeno; em 4 bits, maior; em 3 bits, maior ainda. Grupos menores ajudam. Num modelo real, o efeito acumula ao longo de dezenas de camadas, e é por isso que métodos mais cuidadosos que o arredondamento simples fazem diferença em 4 bits ou menos.

## 8.5 O que se quantiza

- **Só os pesos** (W4A16, W8A16: pesos em 4 ou 8 bits, cálculos em 16 bits): o mais comum para rodar modelos localmente e em servidores com poucos usuários. Os pesos são convertidos de volta para 16 bits dentro do cálculo.
- **Pesos e ativações** (W8A8 em INT8 ou FP8): permite usar unidades de cálculo de baixa precisão da GPU, acelerando também o processamento do prompt. Popular em servidores com GPUs recentes.
- **O KV cache** em 8 bits (ou menos): dobra o número de tokens de contexto que cabem na mesma memória.

## 8.6 Os métodos e o ecossistema

**Quantização pós-treino (PTQ)**: quantiza um modelo pronto, sem treinar de novo, às vezes usando algumas centenas de exemplos para calibrar. Os métodos mais conhecidos:

- **Arredondamento simples** (RTN): suficiente em 8 bits.
- **GPTQ**: quantiza os pesos coluna a coluna e ajusta os restantes para compensar o erro introduzido.
- **AWQ**: identifica os pesos mais importantes (os que multiplicam ativações grandes) e os protege com escalas antes de quantizar.

**Treino com quantização** (QAT, QAD): ajusta o modelo sabendo que ele será quantizado; recupera mais qualidade em precisões muito baixas, mas exige treino.

Na prática, você raramente quantiza um modelo do zero: baixa uma versão já quantizada. Os formatos que mais aparecem:

| Formato / ferramenta | Onde se usa | Observação |
|---|---|---|
| GGUF (llama.cpp, Ollama, LM Studio) | computador pessoal, CPU e GPU | nomes como Q4_K_M, Q5_K_M, Q8_0 indicam bits e variante |
| GPTQ, AWQ | servidores (vLLM e outros) | pesos em 4 bits |
| FP8 | servidores com GPUs recentes | perda de qualidade costuma ser muito pequena |
| bitsandbytes (NF4) | fine-tuning com QLoRA ([Capítulo 5](#cap-05)) | prático, nem sempre o mais rápido para servir |

::: dica
**Dica:** para rodar localmente, as variantes de 4 bits "médias" (como Q4_K_M no GGUF) costumam ser um bom equilíbrio entre tamanho e qualidade, e 5 ou 6 bits quando sobra memória. Abaixo de 4 bits, a qualidade costuma cair de forma visível.
:::

## 8.7 Quantizar deixa mais rápido?

Depende do regime e do hardware:

- **Gerando texto com poucos usuários** (decode, limitado pela memória): sim, bastante. Menos bytes para ler por token significa mais tokens por segundo. É o caso de quem roda um modelo localmente.
- **Processando prompts longos ou com muitos usuários ao mesmo tempo** (limitado pelo cálculo): só acelera se o hardware tiver unidades de cálculo para o formato (por exemplo, FP8 em GPUs recentes). Pesos em 4 bits que precisam ser convertidos para 16 bits antes de cada cálculo podem até ficar mais lentos nesse regime.
- **Sem kernels otimizados** para o formato na sua plataforma: pode ficar mais lento do que em 16 bits.

Teste no seu hardware, com a sua carga.

## 8.8 Medindo a qualidade

Quantização é uma troca, e a perda precisa ser medida:

1. **Perplexidade** num conjunto de textos: um primeiro sinal rápido, mas insuficiente.
2. **As tarefas que importam para você**: as perguntas reais do seu produto, com avaliação de acerto.
3. **Pontos sensíveis**: raciocínio de vários passos, matemática, código, contextos longos, e idiomas menos representados nos dados, que costumam sofrer mais que o inglês.
4. **Comparação lado a lado** de respostas do modelo original e do quantizado.

## Erros comuns

- **Achar que um modelo menor em bits é sempre mais rápido e igual em qualidade.** A velocidade depende do hardware e dos kernels; a qualidade, do método e do modelo.
- **Avaliar só com perplexidade** ou só com perguntas fáceis.
- **Comparar um modelo grande muito quantizado com um menor em 16 bits sem medir.** Às vezes o grande em 4 bits ganha; às vezes, em 2 ou 3 bits, perde.
- **Esquecer o KV cache** ao calcular se o modelo cabe na memória.
- **Quantizar o modelo e esquecer as ativações com outliers**, em esquemas que quantizam ativações: elas costumam ter canais com valores muito maiores, e precisam de técnicas específicas.

## Por que importa

Quantização decide onde um modelo pode rodar e quanto custa rodá-lo: um modelo de 70B num computador pessoal, mais usuários por GPU num servidor, contexto maior na mesma memória. É a primeira otimização a considerar ao hospedar modelos abertos, e uma das decisões em que medir a qualidade faz mais diferença.

## Teste-se

1. Quanto ocupa um modelo de 13B em 16, 8 e 4 bits (só os pesos, aproximadamente)?
2. Quantize em INT8 simétrico o valor 0,5, num grupo cujo maior valor absoluto é 2,0. Qual o inteiro e o valor recuperado?
3. Por que usar uma escala por grupo em vez de uma por tensor?
4. Quanto espaço extra custam escalas de 16 bits com grupos de 128 pesos?
5. Por que a quantização dos pesos acelera muito a geração com um usuário, mas pode não acelerar o processamento de prompts longos?
6. O que significa W4A16?
7. Cite três formas de medir a perda de qualidade de um modelo quantizado.

::: respostas
1. ~26 GB, ~13 GB e ~6,5–7 GB (um pouco mais que 6,5 por causa das escalas).
2. $s = 2{,}0 / 127 \approx 0{,}01575$; $q = \text{round}(0{,}5 / 0{,}01575) = \text{round}(31{,}75) = 32$; recuperado $= 32 \times 0{,}01575 \approx 0{,}504$.
3. Para que um outlier só prejudique o próprio grupo; com uma escala única, ele aumenta a escala de todos e zera os valores pequenos.
4. 16 bits a cada 128 pesos = 0,125 bit por peso.
5. A geração com poucos usuários é limitada pela leitura dos pesos: menos bytes, mais velocidade. Prompts longos são limitados pelo cálculo, que continua em 16 bits (e ainda há o custo de converter os pesos), a menos que o hardware calcule no formato baixo.
6. Pesos em 4 bits, ativações (e cálculos) em 16 bits.
7. Perplexidade; avaliações nas tarefas reais do produto; testes de pontos sensíveis (raciocínio, código, contexto longo, idiomas); comparação lado a lado de respostas.
:::

## Flashcards

::: flashcards
- **O que é quantização?** Representar pesos, ativações ou KV cache com menos bits, usando escalas.
- **Qual a fórmula da quantização simétrica?** $q = \text{round}(x/s)$ com $s = \max|x|/q_{max}$; recupera-se $\hat x = s\,q$.
- **Quantos valores um peso em 4 bits pode assumir?** 16.
- **Por que outliers atrapalham a quantização?** Aumentam a escala do grupo, e os valores pequenos viram zero.
- **O que é quantização por grupo?** Uma escala para cada grupo pequeno de pesos (ex.: 64 ou 128).
- **Quanto ocupa um modelo de 70B em 4 bits?** Cerca de 35–40 GB.
- **Quando a quantização de pesos acelera bastante?** Na geração com poucos usuários, limitada pela memória.
- **O que é GGUF?** O formato de arquivo do llama.cpp para modelos quantizados (ex.: Q4_K_M), usado em ferramentas locais.
- **O que fazem GPTQ e AWQ?** Quantização pós-treino de pesos que reduz o erro (compensação de erro; proteção de pesos importantes).
- **Por que perplexidade não basta para avaliar quantização?** Pode esconder perdas em raciocínio, código, contexto longo e idiomas menos representados.
:::

## Resumo do capítulo

- Quantizar reduz a memória (16 → 8 → 4 bits) e costuma acelerar a geração; é uma troca com a qualidade.
- Quantização linear: inteiro = valor ÷ escala; escalas por grupo contêm o estrago dos outliers.
- Em 8 bits a perda costuma ser pequena; em 4 bits depende do método; abaixo disso cai rápido.
- Pesos, ativações e KV cache podem ser quantizados; cada escolha tem efeitos diferentes.
- Métodos: RTN, GPTQ, AWQ, FP8, QAT; formatos práticos: GGUF, GPTQ/AWQ, FP8, NF4.
- Velocidade depende do regime e do hardware; qualidade precisa ser medida nas tarefas reais.
