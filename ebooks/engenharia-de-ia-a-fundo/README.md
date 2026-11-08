# Engenharia de IA a Fundo: 17 conceitos explicados para estudar

De **Júlia Cardoso** (@juliacardoso.dev). Material de estudo em português sobre 17 conceitos de engenharia de IA, do pré-treino ao MCP. Cada capítulo tem: resumo em uma frase, explicação do zero ao detalhe (analogias, contas, diagramas e código), erros comuns, por que importa, teste com respostas, flashcards e resumo.

A lista de conceitos segue a Parte 2 da série *"64 AI Engineering Concepts, Clearly Explained"*, de Neo Kim (newsletter [System Design One](https://newsletter.systemdesign.one/p/advanced-ai-concepts-explained)), conceitos 18 a 34. As explicações, exemplos, códigos, testes e flashcards são originais.

## Arquivos prontos

| Formato | Arquivo |
|---|---|
| PDF (7 × 10 pol., sumário com páginas e marcadores) | `dist/engenharia-de-ia-a-fundo.pdf` |
| EPUB 3 | `dist/engenharia-de-ia-a-fundo.epub` |
| Página web (respostas recolhíveis, tema claro e escuro) | `dist/engenharia-de-ia-a-fundo.html` |
| Flashcards para o Anki (170 cartões, etiquetados por capítulo) | `dist/engenharia-de-ia-a-fundo-flashcards.txt` |

Para importar os flashcards: no Anki, **Arquivo → Importar** e escolha o `.txt`. O arquivo já informa o separador (tabulação), que os campos têm HTML e que a terceira coluna é a etiqueta.

## Partes e capítulos

| Parte | Capítulos |
|---|---|
| I. Como os modelos aprendem | 1 Pré-treino · 2 Aprendizado autossupervisionado · 3 Geração autorregressiva · 4 RLHF · 5 PEFT e LoRA · 6 Difusão |
| II. Como os modelos rodam | 7 Inferência · 8 Quantização · 9 Janela de contexto · 10 Saídas estruturadas |
| III. Como os modelos usam conhecimento | 11 Aprendizado em contexto · 12 Chunking · 13 Busca vetorial · 14 Busca híbrida · 15 Reranking · 16 Alucinação e fundamentação |
| IV. Como os modelos se conectam | 17 Model Context Protocol |

## Testar o código do livro

Todo bloco ```` ```python ```` de um capítulo é executado em sequência; os marcados como ilustrativos ficam de fora.

```bash
pip install torch numpy mcp
python codigo/testa_capitulos.py          # todos os capítulos
python codigo/testa_capitulos.py 13       # só o capítulo 13
```

## Gerar de novo

Na raiz do repositório (requisitos: `pandoc` 3, Node com Playwright, Python com `pypdf` e `pyyaml`):

```bash
python ebooks/_build/build.py ebooks/engenharia-de-ia-a-fundo
```

Para um formato só, acrescente `pdf`, `epub`, `web` ou `anki`.
