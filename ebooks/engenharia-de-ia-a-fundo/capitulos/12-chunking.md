# Capítulo 12 — Chunking e Segmentação de Documentos {#cap-12}

::: frase
**Em uma frase**

Chunking é dividir documentos em pedaços menores (chunks) que serão indexados e buscados um a um; o tamanho, os pontos de corte e o contexto que cada pedaço carrega decidem se a busca vai encontrar a informação certa.
:::

Para responder com base nos seus documentos, um sistema de busca com IA (o famoso RAG, *retrieval-augmented generation*) quase nunca coloca documentos inteiros no contexto do modelo. Ele divide os documentos em pedaços, transforma cada pedaço em algo pesquisável, e na hora da pergunta busca os pedaços mais relevantes ([Capítulos 13 a 15](#cap-13)). O chunking é a primeira etapa desse caminho, e um erro aqui não tem conserto depois: se a resposta foi cortada ao meio, ou se o pedaço perdeu o contexto que dava sentido a ele, nenhuma busca vai salvá-lo.

```text
 PIPELINE DE RAG (indexação, feita antes)
 documentos ─▶ extração de texto ─▶ CHUNKING ─▶ embeddings
            (PDF, HTML, ...)                     e índice lexical
                                                     │
 NA HORA DA PERGUNTA                                 ▼
 pergunta ─▶ busca (13, 14) ─▶ reranking (15) ─▶ trechos no
                                                contexto ─▶
                                                resposta (16)
```

## 12.1 Por que dividir

- **Embeddings resumem.** Um embedding ([Capítulo 13](#cap-13)) representa um texto inteiro num único vetor. Quanto mais longo e variado o texto, mais "diluído" fica o vetor, e pior ele representa cada assunto específico dentro dele.
- **Precisão da busca.** Buscar pedaços pequenos permite trazer exatamente o parágrafo que responde, não um documento de 40 páginas.
- **Orçamento de contexto.** O espaço no prompt é limitado e caro ([Capítulo 9](#cap-09)); trechos focados cabem mais e distraem menos.
- **Limites dos modelos de embedding**, que aceitam um número máximo de tokens por entrada.

## 12.2 O dilema do tamanho

| Pedaços pequenos (ex.: 1 a 3 frases) | Pedaços grandes (ex.: várias páginas) |
|---|---|
| embedding focado, busca precisa | embedding diluído, busca imprecisa |
| perdem o contexto ao redor | carregam o contexto |
| a resposta pode ficar dividida entre pedaços | a resposta costuma caber inteira |
| mais pedaços para indexar | menos pedaços, mas cada um gasta mais tokens |

Não existe um tamanho universal. Algumas centenas de tokens, com alguma sobreposição entre pedaços vizinhos, costuma ser um bom ponto de partida para textos corridos; o tamanho certo depende do tipo de documento e do tipo de pergunta, e deve ser escolhido medindo (seção 12.6).

## 12.3 Estratégias de corte

**Tamanho fixo com sobreposição.** Cortar a cada N tokens, repetindo os últimos M tokens do pedaço anterior no começo do seguinte. Simples e previsível, mas corta frases e parágrafos ao meio.

**Recursivo por separadores.** Tentar cortar primeiro nos separadores mais "fortes" (fim de parágrafo); se o pedaço ainda for grande, nos mais fracos (fim de linha, fim de frase, espaço). Respeita a estrutura natural do texto. É a estratégia padrão em muitas bibliotecas.

**Pela estrutura do documento.** Usar os títulos de um Markdown ou HTML, as seções de um contrato, as funções e classes de um código-fonte, os slides de uma apresentação. Cada pedaço vira uma unidade com sentido próprio.

**Semântico.** Calcular embeddings de frases consecutivas e cortar onde a similaridade entre vizinhas cai (onde o assunto muda). Mais caro, útil para textos longos sem estrutura.

```text
 texto:  [intro intro intro][prazo prazo prazo prazo][multa multa]
 fixo:   [intro intro intro pra][zo prazo prazo pra][zo multa mul]
                                   ▲ cortes no meio do assunto
 estrut.:[intro intro intro][prazo prazo prazo prazo][multa multa]
                                   ▲ cortes nas fronteiras
```

## 12.4 O problema do pedaço sem contexto

O maior problema prático do chunking não é o tamanho: é o pedaço que perde o contexto.

```text
 Contrato de prestação de serviços — Empresa Alfa
 ...
 Cláusula 7 — Rescisão
   ... O prazo para aviso prévio é de 30 dias. ...
```

O pedaço "O prazo para aviso prévio é de 30 dias" sozinho não diz **de qual contrato**, nem que é sobre **rescisão**. Se a pergunta for "qual o prazo de aviso prévio no contrato com a Alfa?", a busca pode nem encontrar esse pedaço, e se encontrar, o modelo não sabe se ele vale para a Alfa ou para outro dos 200 contratos.

Soluções, da mais simples à mais elaborada:

1. **Metadados**: guardar com cada pedaço o documento, a seção, a data, o autor. Permitem filtrar ("só contratos da Alfa") e citar a fonte.
2. **Cabeçalho de contexto**: escrever no começo de cada pedaço o caminho dele: "Contrato Empresa Alfa > Cláusula 7 — Rescisão: O prazo...". O cabeçalho entra no embedding e no índice lexical.
3. **Contexto gerado por modelo** (uma técnica que a Anthropic chamou de *contextual retrieval*, 2024): um LLM lê o documento e escreve, para cada pedaço, uma ou duas frases situando-o no documento; esse texto é anexado ao pedaço antes de indexar. Mais caro na indexação (uma chamada por pedaço, barateada por cache de prompt do documento), mas reduz bastante as falhas de busca.
4. **Pai e filho** (small-to-big): indexar pedaços pequenos para a busca ser precisa, mas devolver ao modelo o pedaço "pai" maior (a seção inteira) que contém o pequeno encontrado.
5. **Janela de frases**: buscar frases individuais e devolver a frase com algumas vizinhas de cada lado.

## 12.5 Um chunker recursivo que respeita títulos

O código abaixo divide um documento Markdown por seções (guardando o caminho de títulos como contexto), depois divide cada seção recursivamente por separadores, com sobreposição entre pedaços vizinhos. Usa caracteres como medida para ficar simples; em produção, meça em tokens.

```python
import re

def divide_recursivo(texto, maximo,
                     seps=("\n\n", "\n", ". ", " ")):
    """Corta no separador mais forte possível, sem passar de maximo."""
    if len(texto) <= maximo:
        return [texto]
    if not seps:                           # último recurso: cortar
        return [texto[i:i + maximo]
                for i in range(0, len(texto), maximo)]
    sep, resto = seps[0], seps[1:]
    partes = texto.split(sep)
    if len(partes) == 1:                   # separador não aparece
        return divide_recursivo(texto, maximo, resto)
    pedacos, atual = [], ""
    for parte in partes:
        candidato = parte if not atual else atual + sep + parte
        if len(candidato) <= maximo:
            atual = candidato
            continue
        if atual:
            pedacos.append(atual)
        if len(parte) > maximo:            # parte grande: desce
            pedacos.extend(divide_recursivo(parte, maximo, resto))
            atual = ""
        else:
            atual = parte
    if atual:
        pedacos.append(atual)
    return pedacos

def com_sobreposicao(pedacos, n_chars):
    """Repete o fim (em palavras inteiras) do pedaço anterior."""
    saida = []
    for i, p in enumerate(pedacos):
        if i == 0 or n_chars == 0:
            saida.append(p)
            continue
        cauda = pedacos[i - 1][-n_chars:]
        cauda = cauda.split(" ", 1)[-1]    # começa numa palavra inteira
        saida.append(cauda + " " + p)
    return saida

def secoes_markdown(texto):
    """Gera (caminho_de_titulos, corpo) para cada seção."""
    caminho, corpo = [], []
    for linha in texto.splitlines():
        m = re.match(r"^(#{1,6})\s+(.*)", linha)
        if m:
            if "".join(corpo).strip():
                yield list(caminho), "\n".join(corpo).strip()
            nivel = len(m.group(1))
            caminho = caminho[:nivel - 1] + [m.group(2).strip()]
            corpo = []
        else:
            corpo.append(linha)
    if "".join(corpo).strip():
        yield list(caminho), "\n".join(corpo).strip()

def chunks_de_documento(texto, fonte, maximo=300, sobreposicao=60):
    saida = []
    for caminho, corpo in secoes_markdown(texto):
        pedacos = com_sobreposicao(divide_recursivo(corpo, maximo),
                                   sobreposicao)
        for i, p in enumerate(pedacos):
            cabecalho = " > ".join([fonte] + caminho)
            saida.append({"fonte": fonte, "secao": caminho,
                          "ordem": i, "texto": p,
                          "texto_indexado": f"{cabecalho}: {p}"})
    return saida
```

Testando com um contrato de exemplo:

```python
contrato = """# Contrato de serviços — Empresa Alfa

## Cláusula 1 — Objeto
A contratada prestará serviços de suporte técnico ao sistema de
vendas da contratante, em horário comercial, de segunda a sexta.

## Cláusula 7 — Rescisão
Qualquer das partes pode rescindir este contrato. O prazo para aviso
prévio é de 30 dias. Durante o aviso prévio, os serviços continuam
sendo prestados normalmente e cobrados de forma proporcional.

A rescisão sem aviso prévio implica multa de duas mensalidades,
exceto em caso de descumprimento comprovado por qualquer das partes.
"""
chunks = chunks_de_documento(contrato, "Contrato Alfa", maximo=160,
                             sobreposicao=40)
for c in chunks:
    print(f"[{' > '.join(c['secao'])} #{c['ordem']}]")
    print("   ", c["texto_indexado"][:100], "...")

aviso = [c for c in chunks if "30 dias" in c["texto"]]
assert aviso and "Rescisão" in aviso[0]["texto_indexado"]
assert all(len(c["texto"]) <= 160 + 40 + 1 for c in chunks)
palavras = set(re.findall(r"\w+", contrato)) - {"Contrato",
                                               "serviços"}
cobertas = set(re.findall(r"\w+", " ".join(c["texto_indexado"]
                                           for c in chunks)))
assert palavras <= cobertas               # nada se perdeu
```

O pedaço com "30 dias" agora carrega "Contrato Alfa > Contrato de serviços — Empresa Alfa > Cláusula 7 — Rescisão" no texto indexado: a busca por "aviso prévio do contrato com a Alfa" encontra esse pedaço, e o modelo sabe de onde ele veio.

## 12.6 Casos especiais

- **Tabelas**: não separe linhas do cabeçalho. Um pedaço com "| 2024 | 1.250 |" sem os nomes das colunas não significa nada. Repita o cabeçalho em cada pedaço, ou converta cada linha em texto ("Ano: 2024; Receita: 1.250").
- **Código-fonte**: corte por função, classe ou método (usando a estrutura da linguagem), incluindo assinatura e comentários.
- **PDFs**: a extração de texto é muitas vezes o maior problema: colunas misturadas, cabeçalhos e rodapés repetidos, tabelas que viram texto embaralhado. Vale inspecionar a extração antes de ajustar o chunking.
- **Conversas e e-mails**: cortar por mensagem ou por fio, mantendo quem disse e quando.

## 12.7 Como saber se o chunking está bom

1. **Olhe os pedaços.** Abra uma amostra e leia: cada pedaço faz sentido sozinho? Há respostas cortadas ao meio?
2. **Monte um conjunto de perguntas** com a resposta conhecida (o trecho que responde).
3. **Meça a busca** para cada estratégia de chunking: em quantas perguntas o trecho certo aparece entre os primeiros resultados (recall@k, [Capítulo 13](#cap-13))?
4. **Meça a resposta final**: além de achar o trecho, o modelo respondeu certo?

::: analogia
**Analogia:** chunking é como transformar um livro em fichas de estudo. Fichas pequenas demais ("30 dias") não dizem nada sozinhas; fichas grandes demais (um capítulo inteiro) não ajudam a achar a informação. Uma boa ficha tem um assunto, um título que diz de onde veio, e o suficiente para ser entendida sem o livro do lado.
:::

## Erros comuns

- **Cortar no tamanho fixo e nunca olhar os pedaços.** Frases e tabelas cortadas ao meio passam despercebidas.
- **Pedaços sem contexto**: sem título, documento ou seção, a busca falha e o modelo confunde fontes.
- **Separar linhas de tabela do cabeçalho.**
- **Escolher o tamanho sem medir.** O tamanho ideal depende dos documentos e das perguntas.
- **Ignorar a extração de texto** e culpar o chunking por problemas que vieram do PDF.
- **Não guardar metadados**, perdendo a capacidade de filtrar e citar a fonte.

## Por que importa

Em sistemas de RAG, boa parte das respostas erradas vem de a informação certa não ter sido recuperada, e o chunking é a primeira causa disso. É uma etapa barata de melhorar (não envolve treinar modelos) e com efeito grande na qualidade final. Também determina custos: quantos pedaços indexar, quantos tokens cada pedaço gasta no contexto.

## Teste-se

1. Por que não indexar cada documento inteiro como um único embedding?
2. Quais as vantagens e desvantagens de pedaços pequenos?
3. Como funciona o chunking recursivo por separadores?
4. O que é sobreposição entre pedaços, e para que serve?
5. Descreva o problema do "pedaço sem contexto" e três soluções.
6. O que é a estratégia pai e filho (small-to-big)?
7. Como você compararia duas estratégias de chunking de forma objetiva?

::: respostas
1. Porque um único vetor para um documento longo e variado fica diluído e representa mal cada assunto específico; a busca perde precisão, e trazer o documento inteiro gasta muito contexto.
2. Vantagens: embeddings focados e busca precisa. Desvantagens: perdem o contexto ao redor, a resposta pode ficar dividida, e há mais pedaços para indexar.
3. Tenta cortar primeiro pelos separadores mais fortes (parágrafos); se um pedaço ainda passa do limite, tenta separadores mais fracos (linhas, frases, palavras), e só em último caso corta no meio.
4. Repetir o final de um pedaço no começo do seguinte, para que uma informação na fronteira apareça inteira em pelo menos um deles.
5. Um pedaço como "o prazo é de 30 dias" não diz de qual documento ou seção é. Soluções: metadados, cabeçalho com o caminho de títulos, contexto gerado por modelo, pai e filho, janela de frases.
6. Buscar com pedaços pequenos (precisos) e entregar ao modelo o pedaço maior que os contém (com contexto).
7. Com um conjunto de perguntas de resposta conhecida, medindo o recall@k da busca e a qualidade da resposta final para cada estratégia.
:::

## Flashcards

::: flashcards
- **O que é chunking?** Dividir documentos em pedaços que serão indexados e buscados individualmente.
- **Por que dividir documentos para RAG?** Embeddings focados, busca precisa, menos tokens no contexto e limites dos modelos de embedding.
- **Qual o dilema do tamanho do chunk?** Pequenos são precisos mas perdem contexto; grandes têm contexto mas buscam mal e gastam tokens.
- **O que é chunking recursivo?** Cortar pelos separadores mais fortes primeiro (parágrafo, linha, frase, palavra) até caber no limite.
- **Para que serve a sobreposição entre chunks?** Garantir que informação na fronteira apareça inteira em algum pedaço.
- **O que é o cabeçalho de contexto?** Prefixar cada pedaço com documento e caminho de seções antes de indexar.
- **O que é contextual retrieval?** Usar um LLM para escrever uma descrição situando cada pedaço no documento, anexada antes de indexar.
- **O que é small-to-big (pai e filho)?** Buscar com pedaços pequenos e entregar o pedaço maior que os contém.
- **Como dividir tabelas?** Sem separar as linhas do cabeçalho; repita o cabeçalho ou converta linhas em texto.
- **Como avaliar uma estratégia de chunking?** Recall@k da busca e qualidade da resposta num conjunto de perguntas com resposta conhecida.
:::

## Resumo do capítulo

- Chunking define a unidade de busca do RAG; erros aqui não se corrigem depois.
- Tamanho é um dilema entre precisão e contexto; comece com algumas centenas de tokens e meça.
- Estratégias: fixa com sobreposição, recursiva por separadores, por estrutura, semântica.
- O pedaço sem contexto é o problema central: metadados, cabeçalhos, contexto gerado por modelo, pai e filho, janela de frases.
- Tabelas, código, PDFs e conversas pedem cuidados próprios.
- Avalie lendo os pedaços e medindo recall@k e a resposta final.
