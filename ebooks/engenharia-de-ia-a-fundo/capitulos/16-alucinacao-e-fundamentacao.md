# Capítulo 16 — Alucinação, Factualidade e Respostas Fundamentadas {#cap-16}

::: frase
**Em uma frase**

Alucinação é quando o modelo apresenta como verdadeiro algo falso ou sem apoio; factualidade é estar correto em relação ao mundo; fundamentação é estar apoiado em fontes fornecidas e verificáveis. Uma resposta pode ser fundamentada e errada (a fonte está desatualizada) ou certa e sem fundamento (acertou de memória, sem prova).
:::

Você pergunta a um assistente sobre uma lei e recebe uma resposta confiante, bem escrita, com três citações. Uma das citações não existe. Outra existe, mas não diz o que a resposta afirma. A aparência de pesquisa não diz nada sobre a qualidade da pesquisa. Esse é o problema mais conhecido dos modelos de linguagem, e também o mais mal compreendido: alucinação não é um defeito ocasional, é uma consequência direta de como os modelos funcionam. Este capítulo fecha a Parte III juntando tudo: a busca serve para dar evidências ao modelo, e a fundamentação é a disciplina de usar e verificar essas evidências.

## 16.1 Três conceitos diferentes

| Conceito | Pergunta | Exemplo de falha |
|---|---|---|
| **Factualidade** | A afirmação é verdadeira no mundo? | "A capital da Austrália é Sydney." |
| **Fundamentação** (groundedness, faithfulness) | A afirmação está apoiada nas fontes fornecidas? | A fonte diz 30 dias; a resposta diz 60. |
| **Alucinação** | O modelo apresentou como verdade algo falso ou sem apoio? | Inventar uma citação, um número, uma referência. |

Os dois primeiros são independentes:

```text
                      apoiada nas fontes?
                       SIM            NÃO
                  ┌──────────────┬──────────────┐
 verdadeira  SIM  │ o ideal      │ acertou de   │
 no mundo?        │              │ memória, sem │
                  │              │ prova        │
                  ├──────────────┼──────────────┤
             NÃO  │ fonte errada │ alucinação   │
                  │ ou desatuali-│ "clássica"   │
                  │ zada         │              │
                  └──────────────┴──────────────┘
```

Separar esses casos ajuda a achar a causa: um erro do quadrante "fonte errada" se resolve melhorando os documentos, não o modelo.

## 16.2 Por que os modelos alucinam

- **O objetivo de treino é texto plausível, não verdadeiro** ([Capítulo 1](#cap-01)). Para um fato raro, a continuação mais provável pode ser um fato parecido e errado.
- **Chutar costuma ser recompensado.** Em avaliações que só contam acerto e erro, responder "não sei" vale zero, igual a errar; chutar às vezes acerta. Treinos e avaliações que não valorizam a abstenção empurram os modelos a responder sempre.
- **Lacunas de conhecimento**: data de corte, assuntos pouco presentes nos dados, informações privadas que o modelo nunca viu.
- **Coerência com os próprios erros** ([Capítulo 3](#cap-03)): um detalhe errado no começo da resposta é sustentado até o fim.
- **Bajulação** ([Capítulo 4](#cap-04)): concordar com uma premissa falsa do usuário ("por que a lei X proíbe Y?", quando ela não proíbe).
- **Problemas de contexto**: a busca não trouxe a informação ([Capítulos 12 a 15](#cap-12)), as fontes se contradizem, a informação está "perdida no meio" ([Capítulo 9](#cap-09)), o trecho veio sem contexto.

## 16.3 Como a alucinação aparece num sistema de RAG

```text
 pergunta ─▶ busca ─▶ trechos ─▶ modelo ─▶ resposta
               │          │          │
               ▼          ▼          ▼
     (1) a busca não   (2) os trechos  (3) o modelo lê mal,
         traz a            estão           mistura fontes,
         resposta: o       errados,        generaliza além do
         modelo responde   desatualiza-    que o trecho diz,
         "de memória"      dos ou sem      ou inventa citações
                           contexto
```

Cada ponto de falha tem uma correção diferente: melhorar a busca (recall), melhorar os documentos (curadoria, datas, metadados), ou melhorar a geração e a verificação. Medir onde o erro nasce é o primeiro passo.

## 16.4 Defesas em camadas

Nenhuma técnica elimina alucinações. A estratégia é combinar camadas:

1. **Boas evidências**: busca híbrida e reranking que tragam os trechos certos, com contexto e data.
2. **Instruções claras**: responder **só** com base nas fontes fornecidas; citar a fonte de cada afirmação; dizer explicitamente quando as fontes não bastam.
3. **Citações estruturadas**: pedir, numa saída estruturada ([Capítulo 10](#cap-10)), cada afirmação com o identificador da fonte e o **trecho literal** que a apoia.
4. **Verificação automática das citações**: conferir que a fonte existe e que o trecho citado está mesmo nela.
5. **Verificação do apoio**: um segundo modelo (ou um classificador de inferência textual) julga se o trecho realmente apoia a afirmação.
6. **Abstenção**: se nenhum trecho passou na nota mínima do reranker ([Capítulo 15](#cap-15)), responder que não encontrou, em vez de deixar o modelo improvisar.
7. **Ferramentas para fatos**: calculadora para contas, consulta ao banco de dados para números atuais, em vez da memória do modelo.
8. **Revisão humana** onde o erro custa caro (saúde, jurídico, finanças).

Um modelo de instruções para respostas fundamentadas:

```text
 Responda à pergunta usando SOMENTE as fontes abaixo.
 Para cada afirmação, cite a fonte no formato [S1] e copie,
 entre aspas, o trecho exato que a apoia.
 Se as fontes não forem suficientes para responder, diga
 "Não encontrei essa informação nas fontes disponíveis" e
 explique o que falta. Não use conhecimento externo.

 <fontes>
 [S1] (Contrato Alfa, Cláusula 7, versão de 03/2025) ...
 [S2] (Política de reembolso, atualizada em 01/2026) ...
 </fontes>

 Pergunta: ...
```

## 16.5 Verificando citações

A camada 4 é barata e pega uma parte grande das invenções: citações a fontes que não existem e trechos que não estão na fonte. O código abaixo verifica uma resposta estruturada:

```python
import re
import unicodedata

def normaliza(texto):
    t = unicodedata.normalize("NFD", texto.lower())
    t = "".join(c for c in t if unicodedata.category(c) != "Mn")
    t = re.sub(r"[^\w\s%]", " ", t)
    return re.sub(r"\s+", " ", t).strip()

def verifica_citacoes(afirmacoes, fontes):
    """afirmacoes: lista de dicts com 'texto', 'fonte', 'trecho'.
    Devolve (texto, situação) para cada afirmação."""
    resultado = []
    for a in afirmacoes:
        if not a.get("fonte"):
            situacao = "sem citação"
        elif a["fonte"] not in fontes:
            situacao = "fonte inexistente"
        elif not a.get("trecho"):
            situacao = "citação sem trecho"
        elif normaliza(a["trecho"]) not in normaliza(fontes[a["fonte"]]):
            situacao = "trecho não está na fonte"
        else:
            situacao = "ok"
        resultado.append((a["texto"], situacao))
    return resultado

fontes = {
    "S1": "Cláusula 7 — Rescisão. O prazo para aviso prévio é de 30 "
          "dias. A rescisão sem aviso implica multa de duas "
          "mensalidades.",
    "S2": "O reembolso é feito em até 10 dias úteis após a aprovação.",
}
resposta = [
    {"texto": "O aviso prévio é de 30 dias.", "fonte": "S1",
     "trecho": "o prazo para aviso prévio é de 30 dias"},
    {"texto": "A multa é de três mensalidades.", "fonte": "S1",
     "trecho": "multa de três mensalidades"},
    {"texto": "O contrato foi assinado em 2021.", "fonte": "S9",
     "trecho": "assinado em 2021"},
    {"texto": "O suporte funciona 24 horas.", "fonte": None,
     "trecho": None},
]
for texto, situacao in verifica_citacoes(resposta, fontes):
    print(f"{situacao:26s} {texto}")

situacoes = [s for _, s in verifica_citacoes(resposta, fontes)]
assert situacoes == ["ok", "trecho não está na fonte",
                     "fonte inexistente", "sem citação"]
```

Três das quatro afirmações têm problemas detectáveis sem nenhum modelo extra. Mas repare no limite: um trecho que **existe** na fonte pode mesmo assim **não apoiar** a afirmação ("A rescisão é gratuita" citando "A rescisão sem aviso implica multa..."). Para isso serve a camada 5:

```{.python .ilustrativo}
# verificação de apoio com um modelo juiz (esboço)
pergunta_ao_juiz = f"""Trecho: "{trecho}"
Afirmação: "{afirmacao}"
O trecho, sozinho, apoia completamente a afirmação?
Responda apenas APOIA, CONTRADIZ ou INSUFICIENTE."""
veredito = chamar_modelo(pergunta_ao_juiz, temperatura=0)
```

### Abstenção com base na busca

```python
def decide(notas_reranker, nota_minima=0.5, minimo_de_trechos=1):
    bons = [n for n in notas_reranker if n >= nota_minima]
    if len(bons) >= minimo_de_trechos:
        return "responder com os trechos aprovados"
    return "dizer que não encontrou nas fontes"

print(decide([0.91, 0.62, 0.10]))
print(decide([0.21, 0.15]))
assert decide([0.21, 0.15]).startswith("dizer")
```

A nota mínima precisa ser calibrada com exemplos reais: alta demais, o sistema se recusa a responder perguntas respondíveis; baixa demais, deixa passar trechos irrelevantes.

## 16.6 Medindo

- **Acerto** num conjunto de perguntas com resposta conhecida.
- **Atribuição**: das afirmações, quantas têm citação válida (precisão das citações) e quantas das afirmações que deveriam ter citação têm (cobertura).
- **Abstenção correta**: em perguntas **sem** resposta nas fontes, o sistema admite que não sabe? Inclua essas perguntas no conjunto de testes; sem elas, você recompensa o chute.
- **Juízes automáticos**: modelos avaliando respostas escalam a avaliação, mas também erram; calibre-os com uma amostra revisada por pessoas.
- **Monitoramento em produção**: amostras revisadas, feedback dos usuários, taxa de abstenção ao longo do tempo.

::: analogia
**Analogia:** pense num relatório com notas de rodapé. As notas permitem rastrear as afirmações, mas você ainda precisa conferir que cada nota aponta para uma fonte que existe, e que a fonte diz o que o relatório afirma. Um relatório cheio de notas falsas parece mais confiável do que um sem notas, e é pior.
:::

## Erros comuns

- **Tratar uma citação como checagem de fato.** Confira que a fonte existe e que diz o que foi afirmado.
- **Não dar ao sistema uma saída para "não sei"**, deixando-o preencher lacunas com suposições.
- **Avaliar só com perguntas que têm resposta**, recompensando o chute.
- **Culpar o modelo por erros que vêm dos documentos** (desatualizados, contraditórios) ou da busca (não trouxe o trecho).
- **Baixar a temperatura achando que resolve.** Temperatura baixa reduz variação, não ignorância; um modelo pode alucinar de forma consistente.
- **Confiar em juízes automáticos sem calibrar** com revisão humana.

## Por que importa

A confiança num sistema de IA depende de ele errar pouco e, quando não souber, dizer que não sabe. Separar factualidade, fundamentação e alucinação permite localizar a origem de cada erro: documentos, busca, geração ou verificação. As defesas em camadas, das boas evidências à verificação automática e à abstenção, são o que torna possível usar modelos de linguagem em domínios onde errar custa caro.

## Teste-se

1. Diferencie factualidade de fundamentação, com um exemplo de resposta fundamentada e errada.
2. Por que o objetivo do pré-treino favorece alucinações em fatos raros?
3. Como avaliações que contam só acerto e erro incentivam o chute?
4. Num sistema de RAG, quais são os três pontos em que uma alucinação pode nascer?
5. O que a verificação automática de citações pega, e o que ela não pega?
6. Por que incluir no conjunto de testes perguntas sem resposta nas fontes?
7. Baixar a temperatura elimina alucinações? Por quê?

::: respostas
1. Factualidade é estar certo no mundo; fundamentação é estar apoiado nas fontes fornecidas. Exemplo: a resposta cita corretamente uma política de reembolso de 2023 que já foi substituída: fundamentada e errada.
2. Porque o modelo aprende a produzir texto plausível; para um fato raro, uma continuação plausível e errada pode ter probabilidade alta, e nada no objetivo exige verdade.
3. Porque "não sei" vale o mesmo que um erro (zero), enquanto um chute às vezes acerta; a estratégia que maximiza a nota é sempre responder.
4. Na busca (não trouxe a informação), nos documentos (errados, desatualizados, sem contexto) e na geração (leitura errada, mistura de fontes, citações inventadas).
5. Pega citações sem fonte, fontes inexistentes e trechos que não estão na fonte. Não pega trechos que existem mas não apoiam a afirmação; para isso é preciso verificar o apoio.
6. Para medir se o sistema se abstém corretamente; sem elas, o sistema que sempre chuta parece melhor.
7. Não. A temperatura reduz a variação entre respostas, não a falta de conhecimento; o modelo pode dar a mesma resposta errada com confiança.
:::

## Flashcards

::: flashcards
- **O que é alucinação?** Conteúdo gerado e apresentado como verdadeiro, mas falso ou sem apoio.
- **O que é factualidade?** Estar correto em relação ao mundo.
- **O que é fundamentação (groundedness)?** Estar apoiado nas fontes fornecidas e verificáveis.
- **Uma resposta fundamentada pode estar errada?** Sim, se a fonte estiver errada ou desatualizada.
- **Por que os modelos alucinam?** Objetivo de texto plausível, chute recompensado, lacunas, coerência com erros, bajulação e problemas de contexto.
- **Onde a alucinação nasce num RAG?** Na busca, nos documentos ou na geração.
- **O que a verificação de citações confere?** Que a fonte existe e que o trecho citado está nela.
- **O que é verificação de apoio?** Julgar, com outro modelo ou classificador, se o trecho realmente sustenta a afirmação.
- **O que é abstenção no RAG?** Responder que não encontrou quando nenhum trecho passa na nota mínima.
- **Temperatura baixa resolve alucinação?** Não; reduz variação, não ignorância.
:::

## Resumo do capítulo

- Factualidade (verdade no mundo), fundamentação (apoio nas fontes) e alucinação (falso ou sem apoio apresentado como verdade) são coisas diferentes.
- Causas: objetivo de texto plausível, incentivo ao chute, lacunas, coerência com erros, bajulação, problemas de busca e contexto.
- Em RAG, o erro nasce na busca, nos documentos ou na geração; meça onde.
- Defesas em camadas: boas evidências, instruções, citações estruturadas, verificação de citações e de apoio, abstenção, ferramentas, revisão humana.
- Avalie acerto, atribuição e abstenção correta, com perguntas sem resposta no conjunto.
