# Capítulo 14 — Busca Híbrida {#cap-14}

::: frase
**Em uma frase**

Busca híbrida combina uma busca por palavras (lexical, como o BM25), que acerta termos exatos, com uma busca por significado (vetorial), que acerta paráfrases, e funde as duas listas de resultados numa só.
:::

O [Capítulo 13](#cap-13) terminou com uma lista de fraquezas da busca vetorial: códigos de erro, números de processo, nomes próprios raros, siglas. Coincidentemente, são os pontos fortes da busca por palavras, a tecnologia dos motores de busca clássicos. E o contrário também vale: a busca por palavras não encontra "encerrar o acordo antes do prazo" quando o documento diz "rescisão antecipada". Usar as duas juntas é uma das melhorias mais confiáveis que se pode fazer num sistema de RAG.

## 14.1 Cada busca acerta um tipo de pergunta

| Pergunta | Busca por palavras | Busca vetorial |
|---|---|---|
| "erro E-4012 no checkout" | ✔ acha o código exato | ✘ pode trazer outros erros de checkout |
| "processo 0012345-67.2024" | ✔ | ✘ números viram "parecidos" |
| "como encerrar o acordo antes do prazo" | ✘ o documento diz "rescisão antecipada" | ✔ entende a paráfrase |
| "política de home office" (documento diz "trabalho remoto") | ✘ | ✔ |
| "ProjetoÁguia" (nome interno) | ✔ | depende: o modelo nunca viu o nome |

## 14.2 BM25: a busca por palavras bem feita

O **BM25** (de "Best Matching", uma família de fórmulas de ranqueamento das décadas de 1990) ainda é a referência de busca lexical. Para uma consulta com termos $q_1, \ldots, q_n$ e um documento $D$:

$$\text{score}(D, Q) = \sum_{i} \text{IDF}(q_i) \cdot \frac{f(q_i, D)\,(k_1 + 1)}{f(q_i, D) + k_1\left(1 - b + b \frac{|D|}{\text{média}}\right)}$$

$$\text{IDF}(q) = \ln\left(\frac{N - n(q) + 0{,}5}{n(q) + 0{,}5} + 1\right)$$

Parece complicado, mas são três intuições:

1. **Termos raros valem mais** (IDF). "rescisão" aparece em poucos documentos e diz muito; "de" aparece em todos e não diz nada. $N$ é o total de documentos; $n(q)$, quantos contêm o termo.
2. **Repetir ajuda, mas satura** ($k_1$). Um documento com "multa" 3 vezes é mais relevante que com 1 vez, mas 30 vezes não é dez vezes melhor que 3. Valores típicos: $k_1$ entre 1,2 e 2.
3. **Documentos longos são penalizados** ($b$, tipicamente 0,75). Um documento enorme contém muitas palavras por acaso; $|D|$ é o tamanho dele e "média" é o tamanho médio.

```python
import math
import re
import unicodedata
from collections import Counter

VAZIAS = {"a", "o", "as", "os", "de", "do", "da", "dos", "das", "e",
          "em", "no", "na", "um", "uma", "como", "que", "por", "para",
          "com", "ao", "se", "quando", "esta"}

def termos(texto):
    """Minúsculas, sem acentos, sem palavras vazias; mantém códigos
    com hífen (como E-4012) inteiros."""
    t = unicodedata.normalize("NFD", texto.lower())
    t = "".join(c for c in t if unicodedata.category(c) != "Mn")
    return [p for p in re.findall(r"[a-z0-9]+(?:-[a-z0-9]+)*", t)
            if p not in VAZIAS]

class BM25:
    def __init__(self, documentos, k1=1.5, b=0.75):
        self.docs = [Counter(termos(d)) for d in documentos]
        self.tamanhos = [sum(c.values()) for c in self.docs]
        self.media = sum(self.tamanhos) / len(self.docs)
        self.k1, self.b = k1, b
        n_docs = len(self.docs)
        contagem = Counter(t for c in self.docs for t in c)
        self.idf = {t: math.log((n_docs - n + 0.5) / (n + 0.5) + 1)
                    for t, n in contagem.items()}

    def score(self, consulta, i):
        doc, tam = self.docs[i], self.tamanhos[i]
        total = 0.0
        for t in termos(consulta):
            f = doc.get(t, 0)
            if f == 0:
                continue
            norm = self.k1 * (1 - self.b + self.b * tam / self.media)
            total += self.idf[t] * f * (self.k1 + 1) / (f + norm)
        return total

    def busca(self, consulta, k=5):
        notas = [(self.score(consulta, i), i)
                 for i in range(len(self.docs))]
        return [i for s, i in sorted(notas, reverse=True)[:k] if s > 0]
```

Uma base de exemplo, com documentos de suporte:

```python
docs = [
    "Erro E-4012 no checkout: o pagamento é recusado quando o CEP "
    "está vazio. Preencha o CEP e tente de novo.",
    "Erro E-4010 no checkout: tempo esgotado ao falar com o banco.",
    "Rescisão antecipada do contrato: aviso prévio de 30 dias e "
    "multa proporcional ao período restante.",
    "Trabalho remoto: a política permite até três dias por semana "
    "fora do escritório, com aprovação do gestor.",
    "Checkout lento: limpe o cache do navegador e tente de novo.",
    "Multa por atraso no pagamento: 2% ao mês sobre o valor.",
]
bm25 = BM25(docs)
print(bm25.busca("erro E-4012 no checkout"))
print(bm25.busca("como encerrar o acordo antes do prazo"))
assert bm25.busca("erro E-4012 no checkout")[0] == 0
```

O BM25 acerta o código de erro de primeira (o termo "e-4012" é raro e decisivo). Para a paráfrase, ele não devolve nada: nenhuma das palavras que importam ("encerrar", "acordo", "antes", "prazo") aparece na cláusula de rescisão. Repare que as palavras vazias foram removidas; sem isso, "o" e "do" fariam qualquer documento curto parecer relevante.

## 14.3 Fundindo as listas: Reciprocal Rank Fusion

As duas buscas devolvem notas em escalas incomparáveis: o BM25 pode dar 12,7 a um documento e o cosseno dá 0,83 a outro. Somar as notas diretamente não faz sentido. A forma mais usada de juntar listas é a **RRF** (reciprocal rank fusion, Cormack, Clarke e Büttcher, 2009), que usa só as **posições**:

$$\text{RRF}(d) = \sum_{\text{listas}} \frac{1}{k + \text{posição}(d)}$$

com $k$ tipicamente 60 e a posição começando em 1. Um documento bem colocado em qualquer lista ganha pontos; um documento bem colocado nas duas ganha mais.

::: conta
**Fazendo a conta:** com $k = 60$.

- Documento A: 1º no BM25, ausente na vetorial: $1/61 \approx 0{,}0164$.
- Documento B: 3º no BM25 e 2º na vetorial: $1/63 + 1/62 \approx 0{,}0159 + 0{,}0161 = 0{,}0320$.
- B fica na frente de A: aparecer bem nas duas listas vale mais do que ser o primeiro em uma só.
:::

```python
def rrf(listas, k=60):
    """listas: rankings (listas de ids, melhor primeiro)."""
    notas = Counter()
    for ranking in listas:
        for posicao, doc in enumerate(ranking, start=1):
            notas[doc] += 1 / (k + posicao)
    return [doc for doc, _ in notas.most_common()]

# a busca vetorial, para estas consultas, devolveria (ilustrativo):
vetorial = {
    "erro E-4012 no checkout": [4, 0, 1, 5],
    "como encerrar o acordo antes do prazo": [2, 5, 3],
}
for consulta, denso in vetorial.items():
    lexical = bm25.busca(consulta)
    fundido = rrf([lexical, denso])
    print(f"{consulta!r}\n  BM25: {lexical}  vetorial: {denso}  "
          f"híbrido: {fundido[:3]}")

assert rrf([bm25.busca("erro E-4012 no checkout"),
            vetorial["erro E-4012 no checkout"]])[0] == 0
assert rrf([bm25.busca("como encerrar o acordo antes do prazo"),
            vetorial["como encerrar o acordo antes do prazo"]])[0] == 2
```

Nos dois casos, o documento certo fica em primeiro na lista fundida, embora cada busca, sozinha, falhasse numa das perguntas: a vetorial colocou o texto genérico sobre "checkout lento" na frente do E-4012 (o significado é parecido, o código não), e o BM25 não achou nada sobre a rescisão.

### Fusão por notas normalizadas

A alternativa à RRF é normalizar as notas de cada lista (por exemplo, para o intervalo de 0 a 1) e fazer uma média ponderada: $\alpha \cdot \text{vetorial} + (1-\alpha) \cdot \text{lexical}$. Permite dar mais peso a uma das buscas, mas é sensível à distribuição das notas (uma lista com notas todas parecidas fica "achatada" na normalização). A RRF é mais robusta e não exige ajuste; a média ponderada pode render mais quando há dados para calibrar $\alpha$.

## 14.4 O pipeline completo

```text
                ┌──────────┐ top 50
           ┌───▶│ BM25     │────────┐
 consulta ─┤    └──────────┘        ▼
           │    ┌──────────┐    ┌───────┐ top 50 ┌───────────┐
           └───▶│ vetorial │───▶│ fusão │───────▶│ reranking │
                └──────────┘    │ (RRF) │        │ (Cap. 15) │
                top 50          └───────┘        └─────┬─────┘
                                                       ▼
                                        top 5 ─▶ contexto do LLM
```

As duas buscas rodam em paralelo, então a latência total é a da mais lenta mais a fusão (desprezível). Os bancos de busca populares (Elasticsearch, OpenSearch e vários bancos vetoriais) já oferecem busca híbrida com RRF.

## 14.5 Busca esparsa aprendida

Uma terceira família fica entre as duas: modelos como o **SPLADE** usam uma rede neural para produzir vetores **esparsos** sobre o vocabulário, em que cada documento recebe pesos nas suas palavras **e** em palavras relacionadas que não aparecem nele (a "expansão" aprendida). Funciona com índices invertidos, como o BM25, mas entende parte das paráfrases. Pode substituir ou complementar o BM25 na busca híbrida.

## 14.6 Português na busca lexical

A busca por palavras depende de como o texto vira termos:

- **Acentos e maiúsculas**: normalizar ("Rescisão" e "rescisao" devem casar), como o código acima faz.
- **Flexões**: "rescindir", "rescisão", "rescindido". Um **stemmer** para português (como o RSLP) reduz palavras a radicais e aumenta o recall, às vezes à custa de precisão.
- **Palavras vazias**: "de", "o", "que". O IDF já reduz o peso delas; removê-las economiza índice.
- **Códigos**: preserve hífens e pontos em códigos ("E-4012", "0012345-67.2024"), ou eles se partem em pedaços sem sentido.

::: analogia
**Analogia:** são dois bibliotecários. Um conhece o catálogo de cor e acha qualquer livro pelo título ou código exato, mas não entende "aquele livro sobre como sair de um contrato". O outro entende assuntos, mas se confunde com códigos parecidos. Você pergunta aos dois e junta as listas, dando mais crédito aos livros que os dois mencionaram.
:::

## Erros comuns

- **Somar notas de buscas diferentes sem normalizar.** Escalas diferentes fazem uma busca dominar a outra por acaso.
- **Usar só a busca vetorial** num domínio cheio de códigos, nomes e números.
- **Tokenizar mal** para a busca lexical: acentos, códigos quebrados, flexões.
- **Não avaliar por tipo de pergunta.** A busca híbrida pode ganhar na média e perder num tipo específico; separe as métricas (códigos, paráfrases, perguntas longas).
- **Achar que a fusão substitui o reranking.** A fusão junta candidatos; quem ordena com precisão é o reranker ([Capítulo 15](#cap-15)).

## Por que importa

A busca híbrida corrige os pontos cegos de cada abordagem com pouco custo e pouca complexidade. Em sistemas reais, com documentos cheios de códigos, nomes e termos técnicos, ela costuma ser uma das melhorias de recall mais baratas e confiáveis.

## Teste-se

1. Dê um exemplo de pergunta em que a busca lexical ganha e outro em que a vetorial ganha.
2. Quais as três intuições por trás do BM25?
3. Por que um termo que aparece em todos os documentos tem IDF baixo?
4. Calcule a nota RRF ($k=60$) de um documento que ficou em 1º numa lista e em 10º na outra.
5. Por que não somar diretamente as notas do BM25 e do cosseno?
6. O que a busca esparsa aprendida (como o SPLADE) adiciona ao BM25?
7. Que cuidados de tokenização a busca lexical precisa em português?

::: respostas
1. Lexical: "erro E-4012" (código exato). Vetorial: "como encerrar o acordo antes do prazo" quando o documento diz "rescisão antecipada".
2. Termos raros valem mais (IDF); repetir ajuda mas satura ($k_1$); documentos longos são penalizados ($b$).
3. Porque ele não distingue documentos: se aparece em todos, saber que um documento o contém não diz nada sobre relevância.
4. $1/61 + 1/70 \approx 0{,}0164 + 0{,}0143 = 0{,}0307$.
5. Porque estão em escalas diferentes e com distribuições diferentes; a soma ficaria dominada pela busca de notas maiores, sem relação com relevância.
6. Pesos aprendidos e expansão para termos relacionados que não aparecem no documento, permitindo casar parte das paráfrases com índices invertidos.
7. Normalizar acentos e maiúsculas, tratar flexões (stemming), lidar com palavras vazias e preservar códigos com hífens e pontos.
:::

## Flashcards

::: flashcards
- **O que é busca híbrida?** Combinar busca lexical (palavras) e vetorial (significado) e fundir os resultados.
- **Em que a busca lexical é melhor?** Termos exatos: códigos, números, nomes raros, siglas.
- **Em que a busca vetorial é melhor?** Paráfrases e sinônimos.
- **Quais as intuições do BM25?** Termos raros valem mais (IDF), frequência satura (k1), documentos longos são penalizados (b).
- **Qual a fórmula do IDF no BM25?** $\ln((N - n + 0{,}5)/(n + 0{,}5) + 1)$.
- **O que é RRF?** Reciprocal Rank Fusion: soma de 1/(k + posição) em cada lista, com k ≈ 60.
- **Por que a RRF usa posições e não notas?** Porque notas de buscas diferentes têm escalas incomparáveis.
- **O que é busca esparsa aprendida (SPLADE)?** Vetores esparsos sobre o vocabulário com pesos e expansões aprendidos por uma rede.
- **Qual a ordem típica do pipeline de busca?** BM25 e vetorial em paralelo → fusão → reranking → contexto.
- **Que cuidados a busca lexical precisa em português?** Acentos, flexões (stemming), palavras vazias, códigos.
:::

## Resumo do capítulo

- Busca lexical acerta termos exatos; vetorial acerta paráfrases; juntas cobrem os pontos cegos uma da outra.
- BM25: IDF, saturação da frequência e normalização pelo tamanho.
- RRF funde listas pelas posições ($1/(k + \text{posição})$, $k \approx 60$), sem calibrar escalas; média ponderada é a alternativa calibrável.
- Pipeline: as duas buscas em paralelo, fusão, depois reranking.
- Busca esparsa aprendida (SPLADE) é um meio-termo com expansão de termos.
- Em português, a tokenização da busca lexical (acentos, flexões, códigos) faz diferença.
