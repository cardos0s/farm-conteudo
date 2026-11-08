# Capítulo 11 — Aprendizado em Contexto {#cap-11}

::: frase
**Em uma frase**

Aprendizado em contexto é a capacidade de um modelo de seguir instruções e exemplos que estão no próprio prompt, adaptando o comportamento àquela chamada sem nenhuma mudança nos pesos.
:::

Você cola no prompt três exemplos de mensagens de clientes com a categoria certa ao lado, e o modelo passa a classificar a quarta mensagem no mesmo padrão. Ninguém treinou nada: os pesos são os mesmos de antes. O modelo "aprendeu" a tarefa dentro da chamada, a partir do contexto. Essa capacidade, que apareceu com força quando os modelos ficaram grandes, mudou a forma de construir aplicações: muita coisa que antes exigia treinar um modelo hoje se resolve com um bom prompt.

## 11.1 Zero, um, poucos e muitos exemplos

| Nome | O que vai no prompt | Exemplo |
|---|---|---|
| Zero-shot | só a instrução | "Classifique a mensagem em cobrança, técnico ou outros." |
| One-shot | instrução + 1 exemplo | ... + "Fui cobrado duas vezes → cobrança" |
| Few-shot | instrução + alguns exemplos (2 a ~20) | ... + vários pares mensagem → categoria |
| Many-shot | centenas ou milhares de exemplos | possível com janelas de contexto longas |

```text
 Classifique cada mensagem em: cobranca, tecnico, outros.

 Mensagem: Meu cartão foi cobrado duas vezes.
 Categoria: cobranca

 Mensagem: O aplicativo fecha quando faço login.
 Categoria: tecnico

 Mensagem: Vocês têm loja física em Recife?
 Categoria: outros

 Mensagem: Não consigo baixar a nota fiscal do mês passado.
 Categoria:                                 ◀ o modelo completa
```

O modelo completa com "cobranca" ou "tecnico" (a mensagem é ambígua, e um bom conjunto de exemplos ajudaria a decidir). Os exemplos fazem três coisas ao mesmo tempo: mostram **as categorias** possíveis, o **formato** da resposta (uma palavra, sem explicação) e **como decidir** casos parecidos.

## 11.2 Por que funciona

Não há consenso completo, mas algumas explicações se complementam:

- **Reconhecimento de tarefa.** O pré-treino expôs o modelo a inúmeros textos com padrões de "entrada → saída" (listas, tabelas, exercícios resolvidos). Os exemplos ajudam o modelo a reconhecer **qual** tarefa, dentre as que ele já sabe fazer, está sendo pedida. Experimentos mostraram que, em várias tarefas, até exemplos com rótulos embaralhados ajudam um pouco, porque ainda mostram o formato e o espaço de respostas, o que indica que parte do ganho vem disso e não de "aprender" os rótulos.
- **Mecanismos de cópia e analogia.** Pesquisas de interpretabilidade identificaram, nos transformers, circuitos que procuram padrões anteriores no contexto e continuam a partir deles ("induction heads"): "da última vez que apareceu algo assim, veio isto depois".
- **Escala.** Modelos maiores fazem aprendizado em contexto de forma bem mais robusta, inclusive com regras novas que contradizem o que aprenderam no pré-treino.

Na prática, a lição é: os exemplos funcionam, mas são **sensíveis** a detalhes, e isso precisa ser medido.

## 11.3 O que os exemplos ensinam (inclusive sem querer)

O modelo aprende tudo o que for consistente nos exemplos, inclusive o que você não pretendia ensinar:

- **Atalhos de palavras.** Se todos os exemplos de cobrança contêm a palavra "fatura", o modelo pode passar a classificar como cobrança qualquer mensagem com "fatura", e errar as de cobrança que não a usam.
- **Distribuição de rótulos.** Se 8 de 10 exemplos são "técnico", o modelo tende a responder "técnico" mais vezes.
- **Ordem.** Os últimos exemplos costumam pesar mais; a ordem pode mudar resultados.
- **Formato.** Tamanho das respostas, uso de maiúsculas, pontuação: tudo é imitado.

::: atencao
**Cuidado:** exemplos fáceis e parecidos entre si ensinam pouco. Os exemplos mais úteis são os **difíceis**: casos de fronteira entre categorias, formulações incomuns, mensagens que parecem uma coisa e são outra.
:::

## 11.4 Escolhendo exemplos

Para um conjunto pequeno e fixo de exemplos, cubra a variedade: todas as categorias, formulações diferentes, casos de fronteira, e não deixe uma categoria dominar. Quando há muitos exemplos rotulados disponíveis (centenas ou milhares), uma técnica eficaz é **escolher os exemplos por similaridade** com a entrada atual: os mais parecidos com a mensagem nova tendem a ser os mais informativos. Isso é uma pequena busca ([Capítulo 13](#cap-13)) a serviço do prompt.

O código abaixo implementa a ideia com uma similaridade simples por palavras (em produção, use embeddings), garantindo também que os exemplos escolhidos cubram categorias diferentes:

```python
import re
from collections import Counter

def palavras(texto):
    return Counter(re.findall(r"\w+", texto.lower()))

def similaridade(a, b):
    """Cosseno entre contagens de palavras."""
    pa, pb = palavras(a), palavras(b)
    comum = sum(pa[p] * pb[p] for p in pa)
    norma = (sum(v * v for v in pa.values()) ** 0.5
             * sum(v * v for v in pb.values()) ** 0.5)
    return comum / norma if norma else 0.0

def escolhe_exemplos(entrada, banco, k=3, max_por_rotulo=1):
    ordenados = sorted(banco, key=lambda ex: similaridade(entrada,
                                                          ex[0]),
                       reverse=True)
    escolhidos, por_rotulo = [], Counter()
    for texto, rotulo in ordenados:
        if por_rotulo[rotulo] < max_por_rotulo:
            escolhidos.append((texto, rotulo))
            por_rotulo[rotulo] += 1
        if len(escolhidos) == k:
            break
    return escolhidos

def monta_prompt(entrada, exemplos):
    linhas = ["Classifique cada mensagem em: cobranca, tecnico, "
              "outros.", ""]
    for texto, rotulo in exemplos:
        linhas += [f"Mensagem: {texto}", f"Categoria: {rotulo}", ""]
    linhas += [f"Mensagem: {entrada}", "Categoria:"]
    return "\n".join(linhas)

banco = [
    ("Meu cartão foi cobrado duas vezes", "cobranca"),
    ("Quero o reembolso da assinatura", "cobranca"),
    ("A nota fiscal veio com valor errado", "cobranca"),
    ("O aplicativo fecha quando faço login", "tecnico"),
    ("Não consigo baixar o arquivo do relatório", "tecnico"),
    ("Vocês têm loja física em Recife?", "outros"),
    ("Qual o horário de atendimento?", "outros"),
]
entrada = "Não consigo baixar a nota fiscal do mês passado"
exemplos = escolhe_exemplos(entrada, banco)
print(monta_prompt(entrada, exemplos))
assert {r for _, r in exemplos} == {"cobranca", "tecnico", "outros"}
assert exemplos[0][0] in ("A nota fiscal veio com valor errado",
                          "Não consigo baixar o arquivo do relatório")
```

Para essa mensagem ambígua, os exemplos escolhidos incluem justamente os dois casos de fronteira (nota fiscal → cobrança; baixar arquivo → técnico), que são os que ajudam o modelo a decidir.

## 11.5 Instruções, exemplos e raciocínio

O contexto também pode ensinar **como pensar**, não só o que responder:

- **Instruções claras** valem muito: o objetivo, o público, o formato, o que fazer quando não souber. Em modelos treinados para seguir instruções ([Capítulo 4](#cap-04)), uma instrução bem escrita frequentemente dispensa exemplos.
- **Exemplos com raciocínio** (chain-of-thought): mostrar exemplos em que a resposta vem depois de um raciocínio passo a passo leva o modelo a raciocinar antes de responder, o que melhora tarefas de vários passos. Modelos de "raciocínio" já fazem isso por conta própria.
- **Formato dos dados**: delimitar claramente o que é instrução, o que é exemplo e o que é a entrada (com marcações, títulos ou tags) reduz confusões.

## 11.6 Aprendizado em contexto, fine-tuning ou busca?

| | Em contexto | Fine-tuning ([Cap. 5](#cap-05)) | Busca ([Cap. 13](#cap-13)) |
|---|---|---|---|
| Velocidade para testar | minutos | horas a dias | horas |
| Muda os pesos | não | sim | não |
| Custo por chamada | tokens dos exemplos em toda chamada | nenhum extra | tokens dos trechos |
| Bom para | formato, tarefa, estilo, poucas regras | muitos exemplos, formato rígido, latência e custo | conhecimento, fatos, documentos |
| Ruim para | muitos exemplos (custo, contexto) | fatos que mudam | comportamento, estilo |

Um caminho comum: começar com instruções e alguns exemplos (rápido, barato de testar), medir, e só ir para fine-tuning quando o prompt fica grande demais, o custo por chamada pesa, ou a qualidade não chega.

::: analogia
**Analogia:** é como preencher um formulário depois de ver um modelo já preenchido. Você aplica o padrão na hora, sem fazer um curso. Mas, se o modelo preenchido tiver um vício (sempre escrever a data num formato estranho), você vai copiar o vício também.
:::

## Erros comuns

- **Exemplos só dos casos óbvios.** Ensinam pouco e criam atalhos. Inclua casos difíceis e variados.
- **Rótulos desequilibrados** nos exemplos, enviesando as respostas.
- **Achar que o modelo "lembra" dos exemplos em chamadas futuras.** Sem os exemplos no contexto, eles não existem para o modelo.
- **Não testar com um conjunto separado.** Avaliar o prompt nos próprios exemplos do prompt não diz nada.
- **Mudar vários elementos do prompt de uma vez** e não saber qual mudança ajudou.
- **Usar dezenas de exemplos fixos quando instruções claras bastariam**, pagando tokens a mais em toda chamada.

## Por que importa

O aprendizado em contexto é a forma mais rápida de adaptar um modelo a uma tarefa: permite prototipar em minutos, testar categorias e formatos antes de investir em treino, e personalizar o comportamento por cliente ou por situação, escolhendo exemplos diferentes a cada chamada. Entender seus pontos fracos (sensibilidade, atalhos, custo por chamada) é o que separa um prompt que funciona na demonstração de um que funciona em produção.

## Teste-se

1. O que é aprendizado em contexto, e o que ele **não** muda no modelo?
2. Diferencie zero-shot, few-shot e many-shot.
3. Que três coisas um bom conjunto de exemplos mostra ao modelo?
4. Por que exemplos em que todo caso de cobrança contém "fatura" podem prejudicar o modelo?
5. Como a escolha de exemplos por similaridade ajuda?
6. Quando faz sentido sair do aprendizado em contexto e ir para fine-tuning?
7. Por que exemplos com raciocínio podem melhorar tarefas de vários passos?

::: respostas
1. É seguir instruções e exemplos que estão no prompt para fazer uma tarefa; não muda os pesos, e nada persiste para chamadas futuras sem os exemplos.
2. Zero-shot: só instrução. Few-shot: instrução e alguns exemplos. Many-shot: centenas ou milhares de exemplos, possível com contextos longos.
3. As respostas possíveis (as categorias), o formato da resposta e como decidir casos parecidos.
4. Porque o modelo pode aprender o atalho "fatura → cobrança", errando mensagens de cobrança sem essa palavra e mensagens com "fatura" que são de outra categoria.
5. Os exemplos mais parecidos com a entrada atual tendem a ser os mais informativos, inclusive casos de fronteira relevantes.
6. Quando o prompt fica grande demais, o custo por chamada pesa, a latência importa, há muitos exemplos disponíveis, ou a qualidade não atinge o necessário com prompts.
7. Porque levam o modelo a escrever passos intermediários antes da resposta, e, na geração autorregressiva, esses passos escritos ajudam a chegar à resposta certa.
:::

## Flashcards

::: flashcards
- **O que é aprendizado em contexto?** Seguir instruções e exemplos do prompt para fazer uma tarefa, sem mudar os pesos.
- **O que é few-shot?** Incluir alguns exemplos de entrada e saída no prompt.
- **O que os exemplos mostram ao modelo?** As respostas possíveis, o formato e como decidir.
- **Que atalhos os exemplos podem ensinar sem querer?** Palavras-chave, distribuição de rótulos, ordem e formato.
- **Quais exemplos ensinam mais?** Casos difíceis, variados e de fronteira.
- **O que é escolha de exemplos por similaridade?** Buscar, num banco rotulado, os exemplos mais parecidos com a entrada atual.
- **O que é chain-of-thought em exemplos?** Exemplos em que a resposta vem depois de um raciocínio passo a passo.
- **O modelo lembra os exemplos de chamadas anteriores?** Não; só existe o que está no contexto da chamada.
- **Em contexto ou fine-tuning?** Em contexto para testar rápido e poucas regras; fine-tuning para muitos exemplos, custo e latência.
- **Em contexto ou busca?** Em contexto ensina tarefa e formato; busca traz conhecimento e fatos.
:::

## Resumo do capítulo

- Aprendizado em contexto: o modelo segue instruções e exemplos do prompt, sem mudar pesos e sem memória entre chamadas.
- Zero, one, few e many-shot; os exemplos mostram respostas possíveis, formato e critério.
- Funciona por reconhecimento de tarefa, circuitos de cópia e analogia, e cresce com a escala; é sensível a detalhes.
- Exemplos ensinam também o que não se quer: atalhos, viés de rótulos, ordem, formato. Prefira casos difíceis e variados.
- Escolher exemplos por similaridade é eficaz quando há muitos rotulados.
- Comece com instruções e exemplos; vá para fine-tuning ou busca conforme custo, volume e tipo de necessidade.
