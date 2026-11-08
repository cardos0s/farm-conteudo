# Capítulo 13 — Busca Vetorial e Vizinhos Mais Próximos Aproximados {#cap-13}

::: frase
**Em uma frase**

Busca vetorial é encontrar os itens cujos vetores (embeddings) estão mais próximos do vetor da consulta; os métodos de vizinhos mais próximos aproximados (ANN) aceitam perder, de vez em quando, um dos verdadeiros mais próximos em troca de buscas muito mais rápidas em bases enormes.
:::

Uma busca por palavras-chave encontra "rescisão de contrato" quando o documento contém "rescisão" e "contrato". Mas não encontra "como encerrar o acordo antes do prazo", que significa quase o mesmo com palavras diferentes. A busca vetorial resolve isso comparando **significados**, representados como vetores de números. É o coração da maior parte dos sistemas de RAG, de recomendação e de busca semântica.

## 13.1 Embeddings

Um **modelo de embedding** transforma um texto (ou uma imagem, um áudio) num vetor de algumas centenas ou milhares de números. Ele é treinado, normalmente de forma contrastiva ([Capítulo 2](#cap-02)), para que textos de significado parecido fiquem **próximos** nesse espaço, e textos diferentes fiquem longe.

```text
 espaço de embeddings (ilustrativo, 2 de centenas de dimensões)

   "encerrar o acordo antes do prazo" ●
                                       ● "rescisão antecipada do contrato"
   "multa por cancelamento"     ●

                                          ● "receita de bolo de cenoura"
                                       ● "como fazer bolo fofo"
```

Regras práticas:

- **Use o mesmo modelo** para os documentos e para as consultas. Vetores de modelos diferentes não são comparáveis.
- Alguns modelos pedem **prefixos ou instruções** diferentes para consultas e documentos (algo como "consulta: ..." e "documento: ..."). Siga a documentação do modelo.
- **Trocar de modelo exige reindexar** tudo.

## 13.2 Medindo proximidade

As medidas mais comuns:

- **Cosseno**: o ângulo entre os vetores, $\cos(a, b) = \frac{a \cdot b}{\|a\|\|b\|}$, de −1 a 1.
- **Produto escalar**: $a \cdot b$.
- **Distância euclidiana**: $\|a - b\|$.

Se os vetores forem **normalizados** (comprimento 1), as três dão a mesma ordenação: o cosseno vira o produto escalar, e a distância euclidiana fica $\sqrt{2 - 2\cos}$. Por isso é comum normalizar tudo e usar o produto escalar, que é o mais rápido de calcular.

## 13.3 Busca exata

A forma mais simples: comparar a consulta com **todos** os vetores e pegar os $k$ maiores. Isso é uma multiplicação de matriz por vetor.

::: conta
**Fazendo a conta:** 1 milhão de vetores de 768 dimensões em 32 bits.

- Memória: $10^6 \times 768 \times 4$ bytes ≈ **3,1 GB**.
- Cálculo por consulta: 768 milhões de multiplicações e somas, uma leitura completa dos 3,1 GB. Numa CPU ou GPU com uma boa biblioteca de álgebra linear, dezenas de milissegundos ou menos.
- Para 100 milhões de vetores: 310 GB e 100 vezes mais trabalho por consulta. Aqui a busca exata deixa de ser viável para respostas rápidas.
:::

Para bases de até algumas centenas de milhares (ou poucos milhões) de vetores, a busca exata costuma bastar e tem uma grande vantagem: nunca erra.

## 13.4 Vizinhos aproximados (ANN)

Os métodos **ANN** (approximate nearest neighbors) organizam os vetores num índice para examinar só uma fração deles a cada consulta. As famílias principais:

**IVF (índice invertido de clusters).** Agrupa os vetores com k-means em, digamos, 1.000 grupos. Na busca, compara a consulta com os 1.000 centros e examina só os vetores dos `nprobe` grupos mais próximos.

```text
 IVF: a consulta (★) só visita os grupos mais próximos

   ┌───────────┐ ┌───────────┐ ┌───────────┐
   │ ●  ●   ●  │ │  ●   ●    │ │  ●  ●     │
   │   ● ★ ●   │ │ ●     ●   │ │     ●   ● │   nprobe = 2:
   │  ●    ●   │ │   ●  ●    │ │  ●    ●   │   visita só os 2
   └───────────┘ └───────────┘ └───────────┘   grupos mais perto
     visitado ✔    visitado ✔    ignorado      e pode perder um
                                               vizinho na borda
```

**HNSW (grafo hierárquico de mundo pequeno).** Cada vetor é ligado aos seus vizinhos num grafo com várias camadas (a de cima com poucos nós e ligações longas, a de baixo com todos e ligações curtas). A busca começa no topo e vai "descendo e se aproximando", como mudar de estrada para avenida e de avenida para rua. Muito rápido e com ótimo recall; consome memória extra para as ligações.

**PQ (quantização de produto).** Comprime cada vetor: divide em pedaços (por exemplo, 64 pedaços de 12 dimensões) e substitui cada pedaço pelo índice do "protótipo" mais parecido de uma pequena tabela. Um vetor de 3 KB vira 64 bytes. As distâncias são calculadas de forma aproximada direto nos códigos. Costuma ser combinado com IVF (IVF-PQ).

**Outros**: índices em disco (como o DiskANN) para bases maiores que a memória; LSH (hash sensível à localidade), mais antigo.

### Medindo a qualidade: recall@k

A métrica padrão de um índice ANN é o **recall@k**: de cada $k$ vizinhos verdadeiros (da busca exata), quantos o índice encontrou. Todo índice tem botões que trocam recall por velocidade: `nprobe` no IVF, `efSearch` no HNSW.

## 13.5 Um índice IVF do zero

O código abaixo cria uma base de 20 mil vetores "temáticos" (pontos espalhados em torno de 200 assuntos, imitando embeddings), constrói um IVF com k-means e mede recall e trabalho para vários valores de `nprobe`:

```python
import numpy as np

rng = np.random.default_rng(0)
N, d, n_temas = 20_000, 64, 200
temas = rng.normal(size=(n_temas, d))

def amostra(n):
    x = temas[rng.integers(0, n_temas, n)] \
        + 1.3 * rng.normal(size=(n, d))
    return x / np.linalg.norm(x, axis=1, keepdims=True)

base, consultas = amostra(N), amostra(200)

def busca_exata(q, k=10):
    s = base @ q                          # produto escalar = cosseno
    melhores = np.argpartition(-s, k)[:k]
    return melhores[np.argsort(-s[melhores])]

def kmeans(x, k, iteracoes=10):
    centros = x[rng.choice(len(x), k, replace=False)].copy()
    for _ in range(iteracoes):
        grupo = np.argmax(x @ centros.T, axis=1)
        for j in range(k):
            membros = x[grupo == j]
            if len(membros):
                centros[j] = membros.mean(axis=0)
        centros /= np.linalg.norm(centros, axis=1, keepdims=True)
    return centros, np.argmax(x @ centros.T, axis=1)

centros, grupo = kmeans(base, 128)
listas = [np.flatnonzero(grupo == j) for j in range(128)]

def busca_ivf(q, k=10, nprobe=4):
    perto = np.argsort(-(centros @ q))[:nprobe]
    candidatos = np.concatenate([listas[j] for j in perto])
    s = base[candidatos] @ q
    return candidatos[np.argsort(-s)[:k]], len(candidatos)
```

```python
verdade = [set(busca_exata(q)) for q in consultas]
resultados = {}
for nprobe in (1, 2, 4, 8, 16, 128):
    recall, examinados = [], []
    for q, v in zip(consultas, verdade):
        achados, n = busca_ivf(q, nprobe=nprobe)
        recall.append(len(v & set(achados)) / 10)
        examinados.append(n / N)
    resultados[nprobe] = np.mean(recall)
    print(f"nprobe={nprobe:3d}: recall@10 = {np.mean(recall):.2f}, "
          f"examina {np.mean(examinados):5.1%} da base")

assert resultados[128] == 1.0               # todos os grupos = exata
assert resultados[16] > resultados[1]
assert all(resultados[a] <= resultados[b] + 1e-9
           for a, b in [(1, 2), (2, 4), (4, 8), (8, 16)])
```

Com `nprobe=1`, a busca examina menos de 1% da base e já acerta a maior parte dos vizinhos; aumentando `nprobe`, o recall sobe e o trabalho também. Com todos os 128 grupos, o IVF vira a busca exata. Escolher `nprobe` é escolher um ponto nessa curva.

## 13.6 Memória

::: conta
**Fazendo a conta:** 10 milhões de vetores de 768 dimensões.

| Representação | Bytes por vetor | Total |
|---|---|---|
| float32 | 3.072 | ~31 GB |
| float16 | 1.536 | ~15 GB |
| int8 (quantização escalar) | 768 | ~7,7 GB |
| PQ com 64 códigos de 1 byte | 64 | ~640 MB |
| binária (1 bit por dimensão) | 96 | ~960 MB |

O HNSW guarda, além dos vetores, as ligações do grafo: com 16 a 32 vizinhos por nó, mais algumas centenas de bytes por vetor. Comprimir os vetores é a forma de caber na memória, com algum custo de recall, frequentemente recuperado buscando mais candidatos com a versão comprimida e reordenando os melhores com os vetores completos.
:::

## 13.7 Filtros

Quase toda busca real tem filtros: "só documentos do cliente X", "só depois de 2024", "só do departamento jurídico". Combinar filtros com ANN é mais difícil do que parece:

- **Filtrar depois** (buscar os 10 mais próximos e descartar os que não passam no filtro): se o filtro for restritivo, sobram poucos ou nenhum resultado.
- **Filtrar antes** (buscar só entre os que passam no filtro): com IVF ou HNSW, a estrutura do índice foi construída para a base inteira e pode ficar ineficiente.
- Soluções: índices separados por partição (um por cliente, por exemplo), bancos que integram o filtro na travessia do índice, ou pedir mais candidatos antes de filtrar.

## 13.8 Onde rodar

- **Bibliotecas**: FAISS é a referência para índices em memória (IVF, HNSW, PQ e combinações).
- **Extensões de bancos existentes**: pgvector no PostgreSQL, e buscas vetoriais em Elasticsearch, OpenSearch e outros. Ótimas quando você já tem os dados lá e quer filtros e transações.
- **Bancos vetoriais dedicados**: Milvus, Qdrant, Weaviate e serviços gerenciados. Úteis em escala grande, com recursos de filtro, replicação e atualização.

Para começar, uma tabela com uma coluna vetorial e busca exata costuma ser suficiente; os índices ANN entram quando a base ou a latência pedirem.

## 13.9 O que a busca vetorial faz mal

Embeddings capturam o **sentido geral**, e por isso tropeçam em:

- **Termos exatos**: códigos de produto, números de processo, nomes próprios raros, siglas internas.
- **Negação e detalhes**: "contratos **sem** multa" e "contratos com multa" podem ficar próximos.
- **Domínios muito específicos**, quando o modelo de embedding não conhece o vocabulário.

Por isso, sistemas de produção costumam combinar busca vetorial com busca por palavras ([Capítulo 14](#cap-14)) e reordenar os resultados com um modelo mais preciso ([Capítulo 15](#cap-15)).

::: analogia
**Analogia:** imagine uma cidade onde cada documento mora num endereço, e documentos parecidos moram perto. A busca exata bate na porta de todas as casas da cidade. O IVF primeiro descobre os bairros mais próximos e só bate nas portas desses bairros: muito mais rápido, mas um vizinho que mora logo do outro lado da divisa entre bairros pode ser esquecido.
:::

## Erros comuns

- **Escolher a configuração mais rápida sem medir o recall.** Uma busca rápida que perde o documento relevante não serve.
- **Misturar embeddings de modelos diferentes** no mesmo índice, ou consultar com um modelo e indexar com outro.
- **Usar ANN em bases pequenas**, onde a busca exata é rápida e nunca erra.
- **Ignorar os filtros** até a produção e descobrir que a busca filtrada devolve poucos resultados.
- **Confiar só na busca vetorial** para códigos, nomes e números.
- **Esquecer de normalizar** os vetores ao usar produto escalar como cosseno.

## Por que importa

A busca vetorial é o que permite encontrar informação pelo significado, a base dos sistemas de RAG, das recomendações e das buscas semânticas. Saber como os índices funcionam permite escolher entre busca exata e aproximada, configurar o trade-off entre recall, velocidade e memória, e entender por que alguns resultados "óbvios" não aparecem.

## Teste-se

1. O que um modelo de embedding faz, e por que documentos e consultas precisam usar o mesmo modelo?
2. Por que, com vetores normalizados, o cosseno e o produto escalar dão a mesma ordenação?
3. Quanta memória ocupam 2 milhões de vetores de 1.024 dimensões em float32?
4. Explique como o IVF reduz o trabalho de uma busca e o que o `nprobe` controla.
5. O que é recall@10?
6. Por que filtrar depois da busca ANN pode devolver poucos resultados?
7. Cite dois tipos de consulta em que a busca vetorial costuma falhar.

::: respostas
1. Transforma um texto num vetor em que significados parecidos ficam próximos. Cada modelo cria seu próprio espaço; vetores de modelos diferentes não são comparáveis.
2. Porque o cosseno é o produto escalar dividido pelos comprimentos; se os comprimentos são 1, os dois são iguais.
3. $2 \times 10^6 \times 1.024 \times 4$ bytes ≈ 8,2 GB.
4. Agrupa os vetores (k-means) e, na busca, examina só os vetores dos `nprobe` grupos cujos centros estão mais próximos da consulta. Mais `nprobe`: mais recall e mais trabalho.
5. A fração dos 10 vizinhos verdadeiros (da busca exata) que o índice encontrou.
6. Porque os 10 mais próximos foram escolhidos sem olhar o filtro; se poucos passam, a lista final fica pequena ou vazia, mesmo havendo documentos relevantes que passariam.
7. Termos exatos (códigos, números, nomes raros) e negações ou detalhes finos.
:::

## Flashcards

::: flashcards
- **O que é busca vetorial?** Encontrar os itens cujos embeddings estão mais próximos do embedding da consulta.
- **O que é um embedding?** Um vetor que representa o significado de um texto (ou imagem), com significados parecidos próximos.
- **Cosseno, produto escalar e distância com vetores normalizados?** Dão a mesma ordenação.
- **O que é ANN?** Vizinhos mais próximos aproximados: examinar só parte da base, aceitando perder alguns vizinhos.
- **Como funciona o IVF?** Agrupa os vetores em clusters e busca só nos nprobe clusters mais próximos da consulta.
- **Como funciona o HNSW?** Um grafo em camadas de vizinhos; a busca desce das ligações longas para as curtas.
- **O que é PQ (quantização de produto)?** Comprimir vetores em códigos curtos por pedaços, com distâncias aproximadas.
- **O que é recall@k?** Fração dos k vizinhos verdadeiros que o índice aproximado encontrou.
- **Quando a busca exata basta?** Em bases de até centenas de milhares ou poucos milhões de vetores, com latência aceitável.
- **Onde a busca vetorial falha?** Termos exatos, números, nomes raros, negações; combine com busca lexical.
:::

## Resumo do capítulo

- Embeddings colocam significados parecidos perto; consulta e documentos com o mesmo modelo.
- Com vetores normalizados, cosseno = produto escalar; busca exata é uma multiplicação de matriz por vetor.
- ANN troca um pouco de recall por muita velocidade: IVF (clusters + nprobe), HNSW (grafo), PQ (compressão), índices em disco.
- Recall@k é a métrica; cada índice tem botões de recall × velocidade.
- Memória decide o desenho em escala: float32, int8, PQ, binário.
- Filtros são difíceis com ANN; e a busca vetorial falha em termos exatos, o que leva à busca híbrida.
