# Capítulo 10 — Saídas Estruturadas e Decodificação com Restrições {#cap-10}

::: frase
**Em uma frase**

Saídas estruturadas são respostas que seguem um formato definido, como um JSON com campos e tipos fixos; a decodificação com restrições garante esse formato bloqueando, a cada passo da geração, os tokens que quebrariam as regras.
:::

Um texto corrido é ótimo para pessoas e péssimo para programas. Se o seu sistema precisa pegar a categoria, a prioridade e o número do pedido de um ticket de suporte, um parágrafo bonito não serve: você precisa de campos que o código consiga ler sem adivinhar. Este capítulo explica como garantir que o modelo responda no formato certo, como isso funciona por dentro, e por que formato certo não é o mesmo que conteúdo certo.

## 10.1 Do pedido educado à garantia

Existem níveis de garantia, do mais fraco ao mais forte:

| Abordagem | Como | Garantia |
|---|---|---|
| Pedir no prompt | "Responda só com JSON no formato..." | nenhuma: às vezes vem texto antes, chaves erradas, JSON quebrado |
| Exemplos no prompt | mostrar 2 ou 3 respostas no formato ([Capítulo 11](#cap-11)) | melhora muito, ainda sem garantia |
| Modo JSON | a API garante JSON **válido** | sintaxe garantida; campos e tipos não |
| Saída estruturada com esquema | você fornece um esquema (ex.: JSON Schema) | sintaxe, campos, tipos e valores permitidos garantidos |
| Chamada de ferramentas | o modelo devolve nome da ferramenta + argumentos no esquema dela | idem, com a ferramenta sendo executada pelo seu código |

Um esquema para o exemplo do ticket:

```json
{
  "type": "object",
  "properties": {
    "categoria": {"enum": ["cobranca", "tecnico", "outros"]},
    "prioridade": {"type": "integer", "minimum": 1, "maximum": 3},
    "pedido": {"type": ["string", "null"]}
  },
  "required": ["categoria", "prioridade", "pedido"],
  "additionalProperties": false
}
```

## 10.2 Como a restrição funciona por dentro

Lembre o laço de geração ([Capítulo 3](#cap-03)): a cada passo, o modelo dá uma probabilidade para cada token do vocabulário, e um token é escolhido. A decodificação com restrições entra **entre** o cálculo e a escolha:

```text
 contexto até aqui:  {"categoria": "
        │
        ▼
 modelo ─▶ logits para ~128 mil tokens
        │
        ▼
 MÁSCARA: quais tokens mantêm a saída válida?
   "cobranca", "tec", "outros", "cob" ...   → permitidos
   "olá", "}", "123", " ", ...              → logit = −∞
        │
        ▼
 escolha (greedy ou sorteio) entre os permitidos
```

A gramática (o esquema, uma expressão regular) é convertida num **autômato**: uma máquina de estados que sabe, em cada ponto da saída, o que pode vir a seguir. Para JSON aninhado, usa-se um autômato com pilha (equivalente a uma gramática livre de contexto). A cada token escolhido, o autômato avança de estado.

O modelo nunca "vê" a máscara: ele só tem as opções inválidas removidas. Se a opção que ele mais queria era inválida, ele fica com a melhor das válidas.

### Um decodificador com restrições de brinquedo

O exemplo abaixo usa um "modelo" que sorteia logits aleatórios (o pior modelo possível) e um vocabulário pequeno. As saídas válidas são todas as combinações de categoria e prioridade. Sem restrição, o modelo aleatório produz lixo; com restrição, **toda** saída é JSON válido e respeita o esquema:

```python
import json
import random

VOCAB = ['{"', 'categoria', '": "', 'cobranca', 'tecnico', 'outros',
         '", "', 'prioridade', '": ', '1', '2', '3', '}',
         'cob', 'ranca', 'tec', 'nico', 'olá', ' ', '"', ':', ',']
VALIDAS = {f'{{"categoria": "{c}", "prioridade": {p}}}'
           for c in ("cobranca", "tecnico", "outros")
           for p in (1, 2, 3)}

def permitidos(prefixo):
    """Tokens que mantêm o texto como prefixo de alguma saída válida."""
    return [i for i, tok in enumerate(VOCAB)
            if any(v.startswith(prefixo + tok) for v in VALIDAS)]

def gera(rng, restrito, max_passos=25):
    saida = ""
    for _ in range(max_passos):
        if saida in VALIDAS:
            break
        logits = [rng.gauss(0, 1) for _ in VOCAB]   # "modelo" ruim
        candidatos = (permitidos(saida) if restrito
                      else range(len(VOCAB)))
        saida += VOCAB[max(candidatos, key=lambda i: logits[i])]
    return saida

rng = random.Random(0)
print("sem restrição:", gera(rng, restrito=False)[:60])
for _ in range(3):
    print("com restrição:", gera(rng, restrito=True))

saidas = [gera(random.Random(s), restrito=True) for s in range(300)]
assert all(json.loads(s)["prioridade"] in (1, 2, 3) for s in saidas)
assert {json.loads(s)["categoria"] for s in saidas} == \
    {"cobranca", "tecnico", "outros"}
```

Repare que "tecnico" pode sair como um token só ou como "tec" + "nico": a máscara trabalha com os **textos dos tokens**, não com letras. Isso é um dos detalhes difíceis em implementações reais (seção 10.3).

## 10.3 Os detalhes difíceis

- **Tokens que atravessam fronteiras.** Um único token pode conter `",` (fecha uma string e já inicia a vírgula). A máscara precisa considerar o que cada token inteiro faz com o autômato.
- **Desempenho.** Checar 128 mil tokens a cada passo, ingenuamente, é lento. Bibliotecas especializadas (como Outlines, XGrammar e as implementações dos provedores) pré-calculam as máscaras por estado do autômato e calculam o resto na CPU enquanto a GPU calcula o próximo passo.
- **Partes fixas.** Quando só existe uma continuação possível (o texto `", "prioridade": `), ela pode ser anexada de uma vez, sem gastar passos do modelo.
- **Esquemas complexos.** Recursão profunda, padrões de texto elaborados e combinações de condições podem não ser suportados por todos os provedores, ou ser lentos.

## 10.4 Formato pode atrapalhar o conteúdo

Restringir a saída muda o comportamento do modelo, e nem sempre para melhor:

- **Sem espaço para pensar.** Se o esquema exige a resposta final como primeiro campo, o modelo precisa decidir de imediato, sem nenhum raciocínio escrito antes. Em tarefas difíceis, isso pode reduzir o acerto. Duas saídas: incluir um campo de raciocínio **antes** da resposta no esquema, ou deixar o modelo raciocinar livremente numa etapa e formatar numa segunda.
- **A ordem dos campos importa.** Como a geração é da esquerda para a direita, um campo pode condicionar os seguintes. Coloque primeiro o que ajuda a decidir o resto (por exemplo, extrair o texto relevante antes de classificar).
- **Nomes e valores claros.** Um enum `["A", "B", "C"]` é pior que `["cobranca", "tecnico", "outros"]`: o modelo usa o significado das palavras para escolher.
- **Forçar um campo obrigatório quando a informação não existe** leva o modelo a inventar. Se o pedido pode não ter número, o campo precisa aceitar `null`.

## 10.5 Validar depois, sempre

A restrição garante a forma. O seu código ainda precisa verificar o **conteúdo** e tratar os casos em que algo não veio como esperado: a API recusou o pedido, a resposta foi cortada pelo limite de tokens, o modelo devolveu um valor válido no formato mas incoerente.

```python
def valida_ticket(texto, texto_original):
    """Devolve (dados, problemas)."""
    try:
        dados = json.loads(texto)
    except json.JSONDecodeError as erro:
        return None, [f"JSON inválido: {erro.msg}"]
    problemas = []
    if dados.get("categoria") not in {"cobranca", "tecnico", "outros"}:
        problemas.append("categoria fora da lista")
    if dados.get("prioridade") not in {1, 2, 3}:
        problemas.append("prioridade fora de 1 a 3")
    pedido = dados.get("pedido")
    if pedido is not None and pedido not in texto_original:
        problemas.append("número de pedido não aparece no ticket")
    return dados, problemas

ticket = "Fui cobrado duas vezes no pedido 88231."
bom = '{"categoria": "cobranca", "prioridade": 2, "pedido": "88231"}'
inventado = '{"categoria": "cobranca", "prioridade": 2, ' \
            '"pedido": "99999"}'
cortado = '{"categoria": "cobranca", "priori'
print(valida_ticket(bom, ticket))
print(valida_ticket(inventado, ticket))
print(valida_ticket(cortado, ticket))
assert valida_ticket(bom, ticket)[1] == []
assert valida_ticket(inventado, ticket)[1]
assert valida_ticket(cortado, ticket)[0] is None
```

O segundo caso é o mais perigoso: formato perfeito, número inventado. Só uma verificação de conteúdo pega isso. Para os problemas detectados, as respostas típicas são: tentar de novo (com a mensagem de erro no contexto), cair para uma revisão humana, ou devolver um erro claro.

## 10.6 Chamada de ferramentas

A chamada de ferramentas (function calling, tool use) é uma saída estruturada com um propósito: o modelo escolhe uma ferramenta e preenche os argumentos segundo o esquema dela; o **seu código** executa a ferramenta e devolve o resultado ao contexto; o modelo continua a partir dele.

```text
 usuário: "Qual o status do pedido 88231?"
    │
    ▼
 modelo ─▶ {"ferramenta": "consultar_pedido",
            "argumentos": {"numero": "88231"}}
    │
    ▼ (seu código executa)
 resultado: {"status": "enviado", "previsao": "12/11"}
    │ volta para o contexto
    ▼
 modelo ─▶ "Seu pedido foi enviado e deve chegar em 12/11."
```

É a base dos agentes e do MCP ([Capítulo 17](#cap-17)), que padroniza como as ferramentas são descritas e chamadas.

::: analogia
**Analogia:** um formulário com campos fixos e menus de opções. O formulário garante que a informação vai para o lugar certo e que só opções permitidas são escolhidas. Ele não garante que a opção escolhida é a correta.
:::

## Erros comuns

- **Confundir formato correto com informação correta.** Um JSON perfeito pode ter a categoria errada ou um número inventado.
- **Pedir JSON só no prompt em produção** e quebrar quando o modelo adiciona "Aqui está:" antes.
- **Não tratar recusas, respostas cortadas e campos ausentes.**
- **Exigir campos que podem não existir**, sem permitir `null`, e induzir invenção.
- **Colocar a resposta antes do raciocínio** em tarefas difíceis.
- **Usar enums com rótulos obscuros** em vez de palavras com significado.

## Por que importa

Saídas estruturadas transformam um modelo de linguagem num componente de software: extrair dados de documentos, classificar, preencher formulários, chamar APIs, orquestrar agentes. Elas resolvem o problema do **formato**, e é exatamente por isso que a verificação do **conteúdo** continua sendo sua responsabilidade.

## Teste-se

1. Qual a diferença entre o modo JSON e uma saída estruturada com esquema?
2. Descreva o que acontece em cada passo da decodificação com restrições.
3. Por que a máscara precisa considerar o texto inteiro de cada token, e não letra por letra?
4. Por que forçar a resposta como primeiro campo pode piorar o acerto?
5. Um campo "pedido" é obrigatório e do tipo string, mas muitos tickets não têm número de pedido. O que tende a acontecer e como corrigir?
6. Cite três verificações que seu código ainda precisa fazer com uma saída estruturada.
7. Em que a chamada de ferramentas difere de uma saída estruturada comum?

::: respostas
1. O modo JSON garante só que a saída é JSON válido; com esquema, também são garantidos os campos, os tipos e os valores permitidos.
2. O modelo calcula os logits; uma máscara, derivada do estado atual do autômato da gramática, coloca −∞ nos tokens que tornariam a saída inválida; um token é escolhido entre os permitidos; o autômato avança.
3. Porque os tokens são pedaços de texto de tamanhos variados; um token pode fechar uma string e abrir outra estrutura, e o efeito do token inteiro sobre a gramática é o que decide se ele é válido.
4. Porque o modelo precisa decidir antes de escrever qualquer raciocínio; na geração autorregressiva, o raciocínio escrito antes ajuda a decidir.
5. O modelo tende a inventar um número para preencher o campo. Permitir `null` (tipo `["string", "null"]`) e instruir a usar `null` quando não houver.
6. Por exemplo: se os valores fazem sentido (o número aparece no texto original?), se a resposta não foi cortada ou recusada, e se os valores estão coerentes entre si (prioridade compatível com a categoria, datas válidas).
7. Ela tem um propósito de ação: o modelo escolhe uma ferramenta e argumentos, o código executa e devolve o resultado ao contexto, e o modelo continua com base nele.
:::

## Flashcards

::: flashcards
- **O que é uma saída estruturada?** Uma resposta que segue um formato definido, como JSON com campos, tipos e valores permitidos.
- **O que é decodificação com restrições?** Mascarar, a cada passo, os tokens que tornariam a saída inválida segundo uma gramática.
- **Como a gramática é usada na decodificação?** Convertida num autômato que, em cada estado, define os tokens permitidos.
- **Modo JSON vs esquema?** O modo JSON garante sintaxe; o esquema garante também campos, tipos e valores.
- **Formato certo garante conteúdo certo?** Não; valores podem estar errados ou inventados.
- **Por que a ordem dos campos importa?** A geração é da esquerda para a direita; campos anteriores condicionam os seguintes.
- **Como evitar invenção em campos que podem não existir?** Permitir null e instruir quando usá-lo.
- **O que é chamada de ferramentas?** O modelo devolve nome de ferramenta e argumentos num esquema; o código executa e devolve o resultado.
- **O que fazer com uma saída que falha na validação?** Tentar de novo com o erro no contexto, encaminhar para revisão ou devolver erro claro.
- **Por que deixar um campo de raciocínio antes da resposta?** Para o modelo raciocinar antes de decidir, em tarefas difíceis.
:::

## Resumo do capítulo

- Do mais fraco ao mais forte: pedir no prompt, exemplos, modo JSON, esquema, chamada de ferramentas.
- A decodificação com restrições aplica uma máscara de tokens derivada de um autômato da gramática, a cada passo.
- Dificuldades reais: tokens que atravessam fronteiras, desempenho das máscaras, esquemas complexos.
- O formato pode atrapalhar o conteúdo: dê espaço para raciocinar, ordene os campos, use nomes claros, permita null.
- Valide sempre o conteúdo e trate recusas e respostas cortadas.
- Chamada de ferramentas é saída estruturada com ação, base dos agentes e do MCP.
