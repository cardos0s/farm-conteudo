# Capítulo 9 — Janela de Contexto e Contexto Longo {#cap-09}

::: frase
**Em uma frase**

A janela de contexto é o número máximo de tokens que o modelo processa numa chamada, somando instruções, histórico, documentos, resultados de ferramentas e a própria resposta; modelos de contexto longo aceitam centenas de milhares de tokens, mas caber na janela não garante que o modelo use bem cada detalhe.
:::

O modelo não tem memória entre chamadas. Tudo o que ele "sabe" sobre a sua conversa, o seu documento ou a sua tarefa precisa estar no contexto daquela chamada. A janela de contexto é o tamanho da mesa em que você espalha esse material. Este capítulo trata de três perguntas práticas: o que ocupa a janela, por que contextos longos são caros e difíceis, e como decidir o que colocar nela.

## 9.1 O que ocupa a janela

```text
 janela de contexto (ex.: 128 mil tokens)
 ┌──────────────────────────────────────────────────────────┐
 │ instruções do sistema            ~1–3 mil                │
 │ definições de ferramentas        ~0,5–5 mil              │
 │ exemplos (few-shot)              ~0,5–3 mil              │
 │ documentos / trechos recuperados ~0–100 mil              │
 │ histórico da conversa            cresce a cada turno     │
 │ resultados de ferramentas        podem ser enormes       │
 ├──────────────────────────────────────────────────────────┤
 │ RESERVA PARA A RESPOSTA          o que você permitir     │
 └──────────────────────────────────────────────────────────┘
   entrada + saída ≤ janela
```

Dois detalhes que pegam muita gente:

- **A resposta também ocupa a janela.** Se a janela é de 128 mil e você mandou 127 mil de entrada, sobram mil para a resposta. Muitas APIs também têm um limite separado de tokens de saída, menor que a janela.
- **Tudo é medido em tokens, não em palavras.** Um token é um pedaço de palavra. Em inglês, uma palavra dá em média um pouco mais de um token; em português costuma dar mais, porque os tokenizadores foram treinados com mais texto em inglês. A mesma frase em português pode gastar de 20% a 50% mais tokens.

```{.python .ilustrativo}
# contando tokens de verdade com um tokenizador (ex.: tiktoken)
import tiktoken

enc = tiktoken.get_encoding("cl100k_base")
for texto in ("The model reads the whole contract.",
              "O modelo lê o contrato inteiro."):
    print(len(enc.encode(texto)), "tokens:", texto)
```

## 9.2 Montando o contexto dentro de um orçamento

Toda aplicação conversacional precisa decidir o que entra quando o material não cabe. Uma política simples e muito usada: manter sempre as instruções, reservar espaço para a resposta, e encaixar o máximo do histórico **mais recente**, resumindo ou descartando o mais antigo.

```python
def conta_tokens(texto):
    """Estimativa grosseira: ~4 caracteres por token.
    Em produção, use o tokenizador do modelo."""
    return max(1, len(texto) // 4)

def monta_contexto(sistema, historico, pergunta, janela,
                   reserva_resposta, resumo_antigo=None):
    """Devolve as mensagens que cabem no orçamento.
    historico: lista de (papel, texto), do mais antigo ao recente."""
    orcamento = janela - reserva_resposta
    fixo = [("sistema", sistema), ("usuario", pergunta)]
    gasto = sum(conta_tokens(t) for _, t in fixo)
    if gasto > orcamento:
        raise ValueError("instruções + pergunta não cabem")
    escolhidas = []
    for papel, texto in reversed(historico):     # do mais recente
        custo = conta_tokens(texto)
        if gasto + custo > orcamento:
            break
        escolhidas.append((papel, texto))
        gasto += custo
    escolhidas.reverse()
    cortou = len(escolhidas) < len(historico)
    if cortou and resumo_antigo:
        custo = conta_tokens(resumo_antigo)
        if gasto + custo <= orcamento:
            escolhidas.insert(0, ("sistema",
                                  "Resumo do início: " + resumo_antigo))
            gasto += custo
    return [fixo[0]] + escolhidas + [fixo[1]], gasto

historico = [("usuario", "x" * 400), ("assistente", "y" * 400)] * 10
msgs, gasto = monta_contexto("Você é um assistente." * 5, historico,
                             "E agora?", janela=1_200,
                             reserva_resposta=300,
                             resumo_antigo="falamos de contratos")
print(f"{len(msgs)} mensagens, {gasto} tokens de entrada")
assert gasto <= 1_200 - 300
assert msgs[-1] == ("usuario", "E agora?")
assert msgs[0][0] == "sistema" and "Resumo" in msgs[1][1]
```

Políticas mais sofisticadas usam a relevância (buscar no histórico os trechos ligados à pergunta atual, [Capítulo 13](#cap-13)), resumos incrementais, ou uma **memória externa**: notas que o próprio sistema escreve e consulta, em vez de carregar tudo sempre.

## 9.3 Por que contexto longo é caro

Três custos crescem com o tamanho do contexto:

**1. Cálculo da atenção.** No processamento do prompt, cada token compara-se com todos os anteriores: o custo da atenção cresce com o **quadrado** do número de tokens.

::: conta
**Fazendo a conta:** passar de 8 mil para 128 mil tokens multiplica o número de tokens por 16. As partes do modelo que processam cada token separadamente custam 16 vezes mais; a atenção custa até $16^2 = 256$ vezes mais. Em contextos muito longos, a atenção passa a dominar o tempo do prefill.
:::

**2. Memória do KV cache.** Cresce linearmente com o contexto ([Capítulo 7](#cap-07)).

::: conta
**Fazendo a conta:** num modelo de 8B (128 KiB de KV cache por token em 16 bits), um contexto de 128 mil tokens ocupa 131.072 × 128 KiB ≈ **17 GB**, mais que os 16 GB dos próprios pesos. Numa GPU, isso significa menos usuários simultâneos.
:::

**3. Dinheiro e tempo.** Nas APIs, você paga por token de entrada em toda chamada. Um prompt de 200 mil tokens a um preço hipotético de US$ 3 por milhão custa US$ 0,60 **por chamada**. Numa conversa de 20 turnos que reenvia o documento a cada turno, US$ 12, a menos que o cache de prompt ([Capítulo 7](#cap-07)) reaproveite o prefixo. E o tempo até o primeiro token cresce com o tamanho do prompt.

## 9.4 Como os modelos chegam a contextos longos

Um modelo treinado com sequências de 8 mil tokens não sabe, de cara, lidar com 128 mil: as posições além do que ele viu no treino são território desconhecido. Algumas técnicas:

- **Treinar com sequências longas**, geralmente numa etapa no fim do pré-treino, porque treinar tudo em sequências longas seria caro demais.
- **Escalar as posições**: os modelos atuais codificam posições com rotações (RoPE); técnicas como interpolação de posições, escalonamento "NTK" e YaRN reajustam essas rotações para que posições longas pareçam com as que o modelo conhece, e um treino curto em textos longos completa a adaptação.
- **Atenção mais barata**: janelas deslizantes (cada camada olha só os últimos milhares de tokens), atenção esparsa, ou arquiteturas híbridas que misturam camadas de atenção com camadas que não guardam KV cache.

## 9.5 Caber não é o mesmo que usar bem

Modelos de contexto longo aceitam documentos enormes, mas a qualidade com que usam a informação varia:

- **Perdido no meio** ("lost in the middle", Liu et al., 2023): em vários modelos, informações no começo e no fim do contexto são usadas melhor do que as que ficam no meio.
- **Testes de "agulha no palheiro"** (achar uma frase específica escondida num texto longo) são fáceis para os modelos atuais e superestimam a capacidade real. Tarefas que exigem **juntar várias informações espalhadas**, comparar, contar ou raciocinar sobre o documento todo são bem mais difíceis.
- **Distração**: material irrelevante no contexto pode piorar a resposta. Mais contexto não é automaticamente melhor.

```text
 acerto
   │ ●                                           ●
   │   ●                                       ●
   │      ●                                 ●
   │         ●    ●    ●    ●    ●    ●
   │      (padrão "perdido no meio": a posição
   │       da informação importa)
   └──────────────────────────────────────────────▶
     começo         posição no contexto           fim
```

Um teste simples para a sua aplicação: coloque a informação que responde à pergunta em posições diferentes do contexto e meça o acerto.

```python
def casos_de_posicao(fato, pergunta, enchimento, posicoes):
    """Monta contextos com o fato em várias posições relativas.
    enchimento: lista de parágrafos irrelevantes."""
    casos = []
    for p in posicoes:
        i = round(p * len(enchimento))
        texto = enchimento[:i] + [fato] + enchimento[i:]
        casos.append({"posicao": p, "contexto": "\n\n".join(texto),
                      "pergunta": pergunta})
    return casos

enchimento = [f"Parágrafo {i} sobre outro assunto." for i in range(100)]
casos = casos_de_posicao("O código do cofre é 4127.",
                         "Qual é o código do cofre?",
                         enchimento, [0.0, 0.25, 0.5, 0.75, 1.0])
for c in casos:
    linha = c["contexto"].split("\n\n").index("O código do cofre é 4127.")
    print(f"posição {c['posicao']:.2f} → parágrafo {linha}")
assert casos[2]["contexto"].split("\n\n")[50] == \
    "O código do cofre é 4127."
# para cada caso: chame o modelo e confira se a resposta tem "4127"
```

## 9.6 Estratégias

| Estratégia | Quando usar | Cuidado |
|---|---|---|
| Colocar tudo no contexto | documento único e médio, perguntas sobre o todo | custo por chamada; qualidade no meio |
| Busca (RAG, [Capítulos 12 a 16](#cap-12)) | base grande, perguntas pontuais | se a busca erra, o modelo não vê a resposta |
| Resumo / compactação | conversas longas, agentes | perda de detalhes do que foi resumido |
| Mapear e reduzir | resumir ou analisar documentos maiores que a janela | várias chamadas; síntese final pode perder nuances |
| Memória externa (notas) | agentes de longa duração | decidir o que anotar |

Algumas boas práticas de organização, quando o material é longo:

- **Documentos primeiro, pergunta depois**: colocar a instrução e a pergunta no fim do contexto, depois dos documentos, costuma melhorar a resposta em contextos longos.
- **Estrutura e identificadores**: separar documentos com marcações claras (título, fonte, número), para o modelo citar e você verificar.
- **Cortar o que não ajuda**: resultados de ferramentas enormes (um JSON de 50 mil tokens) podem ser filtrados antes de entrar no contexto.

::: analogia
**Analogia:** a janela é uma mesa coberta de papéis de referência. Uma mesa maior cabe mais papéis, mas não garante que você vai notar cada detalhe nem ligar o parágrafo certo de uma página com o da outra. E quanto mais papéis irrelevantes, mais difícil achar o que importa.
:::

## Erros comuns

- **Achar que, se o documento cabe, o modelo vai usá-lo bem.** Teste com perguntas cujas respostas estão em lugares diferentes.
- **Esquecer de reservar espaço para a resposta** e ter respostas cortadas.
- **Contar palavras em vez de tokens**, principalmente em português.
- **Reenviar documentos enormes em toda chamada** sem cache de prompt.
- **Despejar resultados de ferramentas sem filtrar**, enchendo o contexto de ruído.
- **Trocar uma busca bem feita por "contexto longo resolve"** em bases grandes: custa mais e nem sempre acerta mais.

## Por que importa

A janela de contexto limita o que o modelo pode considerar em cada resposta e influencia diretamente custo e latência. Análise de documentos, revisão de código, conversas longas e agentes dependem de decisões sobre o que entra no contexto, em que ordem e em que formato. Boa parte da engenharia de aplicações com LLMs é, no fundo, engenharia de contexto.

## Teste-se

1. Que partes ocupam a janela de contexto numa aplicação com ferramentas?
2. A janela é de 32 mil tokens e você precisa de até 2 mil de resposta. Quanto sobra para a entrada?
3. Por que dobrar o contexto pode mais que dobrar o tempo do prefill?
4. Calcule o KV cache de 64 mil tokens num modelo com 128 KiB por token.
5. O que é o efeito "perdido no meio"?
6. Por que testes de agulha no palheiro superestimam a capacidade de contexto longo?
7. Quando usar busca (RAG) em vez de colocar tudo no contexto?

::: respostas
1. Instruções do sistema, definições de ferramentas, exemplos, documentos, histórico, resultados de ferramentas e a reserva para a resposta.
2. 30 mil tokens.
3. Porque a atenção compara cada token com todos os anteriores, com custo que cresce com o quadrado do número de tokens.
4. 64.000 × 128 KiB ≈ 8,4 GB (65.536 × 131.072 bytes ≈ 8,6 × 10⁹ bytes).
5. Em muitos modelos, informações no começo e no fim do contexto são usadas melhor do que as do meio.
6. Porque achar uma frase específica é fácil; tarefas reais exigem juntar e raciocinar sobre várias informações espalhadas, o que é bem mais difícil.
7. Quando a base é grande (não cabe ou custa caro demais por chamada), as perguntas são pontuais e as respostas estão em trechos localizáveis.
:::

## Flashcards

::: flashcards
- **O que é a janela de contexto?** O máximo de tokens que o modelo processa numa chamada, somando entrada e saída.
- **A resposta ocupa espaço na janela?** Sim; reserve tokens para ela.
- **Por que português gasta mais tokens?** Os tokenizadores foram treinados com mais texto em inglês; palavras em português são quebradas em mais pedaços.
- **Como cresce o custo da atenção com o contexto?** Com o quadrado do número de tokens (no prefill).
- **Como cresce o KV cache com o contexto?** Linearmente: tokens × bytes por token.
- **O que é "lost in the middle"?** A tendência de usar pior informações no meio de contextos longos.
- **Como os modelos estendem o contexto?** Treino com sequências longas e escalonamento das posições (RoPE: interpolação, NTK, YaRN).
- **Onde colocar a pergunta num contexto longo?** Em geral, depois dos documentos, no fim.
- **O que é compactação de contexto?** Resumir partes antigas da conversa para liberar espaço.
- **Contexto longo ou RAG?** Contexto longo para material único e médio; RAG para bases grandes e perguntas pontuais.
:::

## Resumo do capítulo

- A janela soma instruções, ferramentas, exemplos, documentos, histórico, resultados e a resposta; tudo em tokens.
- Montar o contexto é uma política de orçamento: fixo + reserva de resposta + o máximo do que é relevante e recente.
- Contexto longo custa atenção quadrática, KV cache linear, dinheiro por chamada e latência.
- Modelos chegam a contextos longos com treino específico e escalonamento de posições; atenção esparsa e híbridos reduzem o custo.
- Caber não é usar bem: "perdido no meio", distração, tarefas de várias informações; teste por posição.
- Estratégias: tudo no contexto, busca, resumo, mapear e reduzir, memória externa.
