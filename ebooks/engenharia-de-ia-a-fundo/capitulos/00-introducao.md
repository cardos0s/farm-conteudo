# Introdução {#introducao}

Toda semana aparece um termo novo em IA. RLHF, LoRA, busca híbrida, MCP, reranking, decodificação com restrições. Cada um parece um assunto separado, e a sensação é de que, quando você aprende um, surgem outros cinco.

A boa notícia é que esses conceitos não são independentes. Eles são peças da mesma máquina. Um modelo de linguagem é **treinado** (pré-treino, aprendizado autossupervisionado, RLHF, LoRA), depois **executado** (inferência, quantização, janela de contexto, saídas estruturadas), depois **alimentado com conhecimento** (aprendizado em contexto, chunking, busca, reranking, fundamentação) e, por fim, **conectado ao mundo** (MCP). Quando você enxerga a máquina inteira, cada termo novo vira só uma peça a mais num lugar que você já conhece.

Este livro explica 17 dessas peças a fundo. Não para você decorar definições, mas para entender **como cada uma funciona por dentro**, o que dá errado com ela, e como ela se conecta com as outras.

## A máquina inteira

O caminho de uma pergunta num aplicativo de IA moderno passa por quase todos os conceitos do livro:

```text
 ANTES (offline)                         treino do modelo
 ───────────────                         ────────────────
 documentos ─▶ chunking (12)             pré-treino (1) com
           ─▶ embeddings ─▶ índice       aprendizado autossu-
              vetorial (13) + índice     pervisionado (2)
              lexical (14)                     │
                                         ajuste com RLHF (4),
                                         LoRA (5)
                                               │
 NA HORA (online)                              ▼
 ────────────────                        ┌───────────┐
 pergunta ─▶ busca híbrida (14) ─▶       │  MODELO   │
             reranking (15) ─▶           │ (quantiz.,│
             trechos relevantes          │  8)       │
                      │                  └─────┬─────┘
                      ▼                        │
             montagem do contexto:             │
             instruções + exemplos (11)        │
             + trechos + histórico             │
             (cabe na janela? 9) ─────────────▶│
                                               ▼
                         inferência (7): prefill + decode,
                         um token por vez (3), com
                         restrições de formato (10)
                                               │
              ferramentas externas via MCP (17)│
                                               ▼
                         resposta fundamentada, com fontes
                         verificáveis (16)
```

Os números entre parênteses são os capítulos. Os modelos de difusão ([Capítulo 6](#cap-06)) são o ramo da família que gera imagens, áudio e vídeo; eles aparecem na Parte I porque são uma forma diferente de aprender e gerar.

## As quatro partes

| Parte | Pergunta | Capítulos |
|---|---|---|
| I. Como os modelos aprendem | De onde vêm as habilidades do modelo? | 1 Pré-treino · 2 Aprendizado autossupervisionado · 3 Geração autorregressiva · 4 RLHF · 5 PEFT e LoRA · 6 Modelos de difusão |
| II. Como os modelos rodam | O que acontece quando você chama o modelo? | 7 Inferência · 8 Quantização · 9 Janela de contexto · 10 Saídas estruturadas |
| III. Como os modelos usam conhecimento | Como fazer o modelo responder com base nos seus dados? | 11 Aprendizado em contexto · 12 Chunking · 13 Busca vetorial · 14 Busca híbrida · 15 Reranking · 16 Alucinação e fundamentação |
| IV. Como os modelos se conectam | Como o modelo usa ferramentas e sistemas externos? | 17 Model Context Protocol |

A ordem não é a da newsletter que inspirou a lista ([veja a correspondência no Apêndice C](#apendice-c)). Ela segue a ordem em que as peças se apoiam umas nas outras: não dá para entender RLHF sem saber o que é pré-treino, nem reranking sem saber o que é busca vetorial.

## Como cada capítulo funciona

Todos os capítulos têm a mesma estrutura, pensada para estudo:

1. **Em uma frase**: a definição mais curta possível. Se você só lembrar disso, já é um começo.
2. **A explicação**: do zero ao detalhe, com analogias, diagramas, números reais e código.
3. **Erros comuns**: os equívocos mais frequentes, de quem estuda e de quem constrói sistemas.
4. **Por que importa**: onde o conceito aparece na prática.
5. **Teste-se**: perguntas para você responder antes de olhar as respostas.
6. **Flashcards**: cartões de pergunta e resposta para revisão espaçada.
7. **Resumo do capítulo**.

Ao longo do texto, você vai encontrar caixas de destaque:

::: analogia
**Analogia:** uma comparação do dia a dia para fixar a intuição.
:::

::: conta
**Fazendo a conta:** contas com números reais. Refaça com lápis; é a melhor forma de fixar a ordem de grandeza das coisas.
:::

::: dica
**Dica:** um atalho, uma boa prática ou uma forma de explicar o assunto para outra pessoa.
:::

::: atencao
**Cuidado:** um erro conceitual frequente.
:::

## Como estudar com este livro

Ler uma vez não basta para guardar 17 conceitos. Três hábitos fazem a diferença:

- **Responda o "Teste-se" antes de olhar as respostas.** O esforço de lembrar é o que fixa o conteúdo. Errar e corrigir ensina mais do que reler.
- **Use os flashcards com repetição espaçada.** Todos os cartões do livro estão no arquivo `engenharia-de-ia-a-fundo-flashcards.txt`, pronto para importar no Anki (Arquivo → Importar). Cada cartão vem etiquetado com o capítulo. Dez minutos por dia rendem mais que uma maratona no fim de semana.
- **Rode o código.** Todo bloco de Python que não está marcado como ilustrativo foi executado. Mude um parâmetro e veja o que acontece: diminua a temperatura, aumente o número de clusters do índice, troque o tamanho do chunk.

O [Apêndice B](#apendice-b) traz um plano de estudo de três semanas.

## Para quem é

Para quem programa e quer entender o que está por trás das ferramentas de IA que usa ou constrói. Não é preciso saber matemática além do ensino médio: quando aparece uma fórmula, cada símbolo é explicado, e há sempre uma versão em palavras e uma versão em código. Ajuda saber um pouco de Python.

Se você já leu *Engenharia de Inferência*, o outro livro desta coleção, vai reconhecer alguns temas (inferência, quantização, saídas estruturadas). Aqui eles aparecem pelo lado de quem **usa** e **constrói aplicações**, não pelo lado de quem otimiza GPUs.

## De onde vem a lista

Os 17 conceitos seguem a Parte 2 da série *"64 AI Engineering Concepts, Clearly Explained"*, de Neo Kim, publicada na newsletter [System Design One](https://newsletter.systemdesign.one/p/advanced-ai-concepts-explained) (conceitos 18 a 34). As explicações, exemplos, contas, códigos, testes e flashcards deste livro são originais e vão bem além do formato curto da newsletter.

Vamos começar pelo começo: como um modelo aprende alguma coisa antes de você falar com ele.
