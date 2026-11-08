# Capítulo 15 — Reranking {#cap-15}

::: frase
**Em uma frase**

Reranking é uma segunda etapa da busca: um modelo mais preciso e mais caro relê a consulta junto com cada um dos candidatos trazidos pela primeira busca e os reordena por relevância, para que os melhores trechos fiquem no topo.
:::

A busca vetorial e a busca por palavras ([Capítulos 13](#cap-13) e [14](#cap-14)) são feitas para serem **rápidas** em bases enormes. Para isso, fazem uma simplificação: comparam a consulta com cada documento de forma superficial (um produto de vetores calculados separadamente, ou uma contagem de palavras). Essa simplificação deixa passar nuances: o documento fala de multa, mas de outra multa; fala do produto certo, mas da versão errada. O reranking corrige isso, gastando mais cálculo só com os poucos candidatos que importam.

## 15.1 Busca em dois estágios

```text
 base com milhões de trechos
        │
        ▼  ESTÁGIO 1: RECALL (rápido, barato, grosseiro)
 busca vetorial + BM25 + fusão ─▶ top 50 a 200 candidatos
        │
        ▼  ESTÁGIO 2: PRECISÃO (lento, caro, cuidadoso)
 reranker lê (consulta, candidato) um a um ─▶ notas
        │
        ▼
 top 3 a 10 ─▶ contexto do LLM
```

A divisão de trabalho é o ponto: o estágio 1 garante que a resposta **está** entre os candidatos (alto recall); o estágio 2 garante que ela **fica no topo** (alta precisão). Um reranker não consegue recuperar um documento que o estágio 1 não trouxe.

## 15.2 Bi-encoder e cross-encoder

A diferença entre os dois estágios está em **quando a consulta e o documento se encontram**:

```text
 BI-ENCODER (busca vetorial)          CROSS-ENCODER (reranker)

 consulta ─▶ [codificador] ─▶ vetor   "[consulta] [SEP] [documento]"
                               │                  │
                               ● produto          ▼
                               │ escalar     [transformer lê
 documento ─▶ [codificador] ─▶ vetor          os dois juntos,
          (calculado antes,                   com atenção entre
           guardado no índice)                todas as palavras]
                                                  │
                                                  ▼
                                          nota de relevância
```

- No **bi-encoder**, consulta e documento são codificados **separadamente**. Os vetores dos documentos são calculados uma vez e guardados; na busca, só a consulta é codificada. Rápido, mas o modelo nunca vê os dois textos juntos.
- No **cross-encoder**, consulta e documento entram **juntos** no modelo, e a atenção relaciona cada palavra da consulta com cada palavra do documento. Muito mais preciso, mas nada pode ser pré-calculado: é uma passada do modelo por par (consulta, candidato).

::: conta
**Fazendo a conta:** por que não usar o cross-encoder direto na base inteira?

- Base com 1 milhão de trechos: 1 milhão de passadas do modelo **por consulta**. Mesmo a 1 ms por par em lote, são 1.000 segundos.
- Reranking de 50 candidatos: 50 pares de, digamos, 30 + 300 tokens = 16.500 tokens. Num modelo de reranking de algumas centenas de milhões de parâmetros numa GPU, isso cabe num único lote e leva da ordem de dezenas de milissegundos.
:::

## 15.3 O que o reranker enxerga que a busca não enxerga

Consulta: **"multa por cancelamento antes de 12 meses"**

| Candidato | Busca vetorial | Reranker |
|---|---|---|
| "Multa por atraso no pagamento: 2% ao mês." | alta (fala de multa) | baixa: é outra multa |
| "Cancelamento após 12 meses é isento de multa." | alta (palavras e assunto parecidos) | média: é a condição oposta |
| "Rescisão nos primeiros 12 meses implica multa de duas mensalidades." | média (palavras diferentes) | alta: responde a pergunta |

O reranker capta relações que exigem ler os dois textos juntos: qual multa, qual condição, "antes" versus "depois", negações, a entidade certa.

## 15.4 Tipos de reranker

- **Cross-encoders**: modelos do tipo encoder (como os da família BERT, [Capítulo 2](#cap-02)) treinados com pares (consulta, trecho relevante/irrelevante). O padrão de mercado, inclusive em APIs de reranking.
- **Interação tardia** (late interaction, como o ColBERT): guarda um vetor **por token** de cada documento e, na busca, compara cada token da consulta com o token mais parecido do documento (operação MaxSim). Mais preciso que o bi-encoder, mais barato que o cross-encoder, mas o índice é bem maior.
- **LLMs como rerankers**: pedir a um LLM que dê uma nota a cada candidato (pontual), que compare pares, ou que ordene uma lista inteira (listwise). Podem ser muito bons, entendem instruções ("priorize documentos mais recentes"), mas são os mais caros e lentos.

```{.python .ilustrativo}
# reranking com um cross-encoder (biblioteca sentence-transformers)
from sentence_transformers import CrossEncoder

modelo = CrossEncoder("nome-de-um-modelo-de-reranking")
consulta = "multa por cancelamento antes de 12 meses"
candidatos = [...]                    # vindos da busca híbrida
notas = modelo.predict([(consulta, c) for c in candidatos])
reordenados = [c for _, c in sorted(zip(notas, candidatos),
                                    reverse=True)]
```

## 15.5 Medindo: MRR e nDCG

Para avaliar reranking (e busca em geral), usam-se métricas que valorizam acertos **no topo** da lista:

- **MRR** (mean reciprocal rank): para cada consulta, $1/\text{posição}$ do primeiro resultado relevante; média sobre as consultas. Se o primeiro relevante está em 1º, vale 1; em 2º, 0,5; em 4º, 0,25.
- **nDCG@k** (normalized discounted cumulative gain): soma os ganhos dos relevantes, com desconto pela posição, e divide pelo melhor valor possível:

$$\text{DCG@}k = \sum_{i=1}^{k} \frac{2^{rel_i} - 1}{\log_2(i + 1)}, \qquad \text{nDCG@}k = \frac{\text{DCG@}k}{\text{DCG@}k \text{ ideal}}$$

  onde $rel_i$ é o grau de relevância do resultado na posição $i$ (0 ou 1, ou uma escala como 0 a 3).

```python
import math

def mrr(listas_de_relevancia):
    """Cada item: lista de 0/1 na ordem devolvida pela busca."""
    total = 0.0
    for rel in listas_de_relevancia:
        posicao = next((i for i, r in enumerate(rel, 1) if r), None)
        total += 1 / posicao if posicao else 0.0
    return total / len(listas_de_relevancia)

def ndcg(rel, k=10):
    def dcg(valores):
        return sum((2 ** r - 1) / math.log2(i + 1)
                   for i, r in enumerate(valores[:k], start=1))
    ideal = dcg(sorted(rel, reverse=True))
    return dcg(rel) / ideal if ideal else 0.0

antes = [[0, 1, 0, 1], [0, 0, 1, 0], [1, 0, 0, 0]]   # 3 consultas
depois = [[1, 1, 0, 0], [1, 0, 0, 0], [1, 0, 0, 0]]  # após rerank
print(f"MRR antes: {mrr(antes):.3f}   depois: {mrr(depois):.3f}")
print(f"nDCG da 1ª consulta antes: {ndcg(antes[0]):.3f}   "
      f"depois: {ndcg(depois[0]):.3f}")
assert abs(mrr(antes) - (1/2 + 1/3 + 1) / 3) < 1e-9
assert abs(ndcg([0, 1, 0, 1])
           - (1 / math.log2(3) + 1 / math.log2(5))
           / (1 + 1 / math.log2(3))) < 1e-9
assert ndcg(depois[0]) == 1.0
```

## 15.6 O reranking dentro do pipeline

```python
def busca_com_reranking(consulta, buscar, dar_nota, n_candidatos=50,
                        n_final=5, nota_minima=None):
    """buscar(consulta, n) -> candidatos (estágio 1)
    dar_nota(consulta, candidatos) -> notas (estágio 2)"""
    candidatos = buscar(consulta, n_candidatos)
    if not candidatos:
        return []
    notas = dar_nota(consulta, candidatos)
    ordenados = sorted(zip(notas, candidatos), reverse=True)
    if nota_minima is not None:
        ordenados = [(n, c) for n, c in ordenados if n >= nota_minima]
    return [c for _, c in ordenados[:n_final]]

# exemplo com funções simples no lugar dos modelos
base = ["multa por atraso no pagamento",
        "cancelamento após 12 meses é isento de multa",
        "rescisão nos primeiros 12 meses implica multa"]
buscar = lambda q, n: base[:n]
def nota_de_brinquedo(q, cands):     # um reranker de verdade é
    chave = {"rescisao", "primeiros", "antes"}   # um modelo treinado
    return [len(chave & set(c.replace("ã", "a").split()))
            for c in cands]

topo = busca_com_reranking("multa por cancelamento antes de 12 meses",
                           buscar, nota_de_brinquedo, n_final=1,
                           nota_minima=1)
print(topo)
assert topo == ["rescisão nos primeiros 12 meses implica multa"]
```

Dois parâmetros merecem atenção:

- **Quantos candidatos** reranquear: poucos demais e a resposta pode ter ficado de fora; muitos demais e o reranking fica caro. De 50 a 200 é comum.
- **Nota mínima**: descartar candidatos com nota baixa evita encher o contexto de trechos irrelevantes. Se **nenhum** passa, é um sinal forte de que a base não tem a resposta, e o sistema pode dizer isso em vez de inventar ([Capítulo 16](#cap-16)).

::: analogia
**Analogia:** é como a triagem de currículos para uma vaga. Primeiro, um filtro rápido por palavras-chave e requisitos separa 50 candidatos entre 5.000 (estágio 1). Depois, alguém lê esses 50 com cuidado, comparando cada um com a descrição da vaga, e escolhe os 5 para entrevista (estágio 2). Ninguém leria os 5.000 com cuidado, e o filtro rápido sozinho escolheria mal os 5 finais.
:::

## Erros comuns

- **Esperar que o reranker conserte uma busca que não trouxe o documento.** Ele só reordena o que recebeu; meça o recall do estágio 1 separadamente.
- **Reranquear poucos candidatos** (5 ou 10) e perder o ganho; ou candidatos demais e estourar a latência.
- **Colocar no contexto todos os candidatos reranqueados**, inclusive os irrelevantes, em vez de cortar por posição e nota.
- **Usar um reranker treinado em outro idioma ou domínio** sem avaliar.
- **Avaliar só a resposta final**: meça também recall do estágio 1 e MRR/nDCG do estágio 2, para saber onde está o problema.

## Por que importa

O reranking costuma ser a forma mais direta de melhorar a **precisão** de um sistema de busca ou RAG: os trechos certos sobem para o topo, menos trechos irrelevantes ocupam o contexto, e o modelo final responde melhor e mais barato. Saber separar recall (estágio 1) de precisão (estágio 2) é também a melhor forma de depurar um sistema de busca.

## Teste-se

1. Por que dividir a busca em dois estágios?
2. Qual a diferença fundamental entre bi-encoder e cross-encoder?
3. Por que não dá para usar um cross-encoder na base inteira?
4. Dê um exemplo de nuance que um reranker capta e a busca vetorial não.
5. Calcule o MRR de duas consultas cujo primeiro relevante está em 1º e em 4º.
6. O que a nota mínima do reranker permite fazer além de cortar ruído?
7. O que é interação tardia (ColBERT)?

::: respostas
1. Porque o método preciso é caro demais para a base inteira, e o rápido é impreciso para o ordenamento final. O estágio 1 garante recall barato; o estágio 2 garante precisão só nos candidatos.
2. O bi-encoder codifica consulta e documento separadamente (vetores pré-calculados); o cross-encoder lê os dois juntos, com atenção entre todas as palavras, e devolve uma nota.
3. Porque seria uma passada do modelo para cada documento da base, por consulta; nada pode ser pré-calculado.
4. Distinguir a multa por atraso da multa por cancelamento; "antes de 12 meses" versus "após 12 meses"; negações.
5. (1/1 + 1/4) / 2 = 0,625.
6. Detectar que nenhum candidato é relevante, e responder que a base não tem a informação em vez de inventar.
7. Guardar um vetor por token de cada documento e comparar cada token da consulta com o token mais parecido do documento (MaxSim); fica entre bi-encoder e cross-encoder em precisão e custo.
:::

## Flashcards

::: flashcards
- **O que é reranking?** Reordenar os candidatos da busca com um modelo mais preciso que lê consulta e candidato juntos.
- **Quais os dois estágios da busca?** Recall (rápido, muitos candidatos) e precisão (reranking dos melhores).
- **O que é um bi-encoder?** Codifica consulta e documento separadamente; vetores dos documentos pré-calculados.
- **O que é um cross-encoder?** Lê consulta e documento juntos e devolve uma nota de relevância; não pré-calcula nada.
- **O reranker recupera documentos que a busca não trouxe?** Não; ele só reordena os candidatos recebidos.
- **O que é MRR?** Média de 1/posição do primeiro resultado relevante.
- **O que é nDCG@k?** Ganho acumulado com desconto logarítmico pela posição, dividido pelo ideal.
- **O que é ColBERT (interação tardia)?** Vetores por token e similaridade MaxSim entre tokens da consulta e do documento.
- **Quantos candidatos reranquear?** Tipicamente de 50 a 200, mantendo de 3 a 10 no final.
- **Para que serve a nota mínima do reranker?** Cortar ruído e detectar quando a base não tem a resposta.
:::

## Resumo do capítulo

- Busca em dois estágios: recall rápido (vetorial, BM25, fusão) e precisão cuidadosa (reranking).
- Bi-encoder: vetores separados e pré-calculados; cross-encoder: leitura conjunta, mais preciso, sem pré-cálculo.
- Rerankers: cross-encoders, interação tardia (ColBERT), LLMs.
- Métricas que valorizam o topo: MRR e nDCG@k.
- Parâmetros: quantos candidatos reranquear, quantos manter, nota mínima (inclusive para abster-se).
- O reranker não recupera o que o estágio 1 perdeu: meça cada estágio.
