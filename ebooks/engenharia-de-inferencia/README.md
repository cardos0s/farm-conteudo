# Engenharia de Inferência: o guia completo para entrevistas

De **Júlia Cardoso** (@juliacardoso.dev). Ebook em português com os 14 temas e as 50 perguntas de entrevista de engenharia de inferência levantadas pelo [AI Engineering Insider](https://aiengineeringinsider.substack.com/p/you-should-never-walk-into-an-inference). Cada pergunta tem resposta em 30 segundos, resposta completa, perguntas de acompanhamento e armadilhas comuns. As respostas são originais desta edição.

## Arquivos prontos

| Formato | Arquivo |
|---|---|
| PDF (7 × 10 pol., 298 páginas, sumário com páginas e marcadores) | `dist/engenharia-de-inferencia.pdf` |
| EPUB 3 (leitores de ebook) | `dist/engenharia-de-inferencia.epub` |
| Página web (um único HTML, tema claro e escuro) | `dist/engenharia-de-inferencia.html` |

## Estrutura

```text
capitulos/      texto em Markdown (Pandoc), um arquivo por capítulo
codigo/         código do livro, executado e testado
livro.yaml      metadados e textos da abertura
capa.html       capa (a arte vem de arte.svg)
dist/           saídas geradas
GUIA-DE-ESTILO.md   regras de escrita e formato dos capítulos
```

O script de build, os estilos e as fontes ficam em `ebooks/_build/`, compartilhados com os outros livros.

## Como gerar de novo

Requisitos: `pandoc` 3, Node com Playwright (Chromium), Python 3 com `pypdf` e `pyyaml`. Na raiz do repositório:

```bash
python ebooks/_build/build.py ebooks/engenharia-de-inferencia
```

Para gerar só um formato, acrescente `pdf`, `epub` ou `web` ao comando.

O PDF é gerado em dois passos: o primeiro descobre a página de cada título (pelos destinos nomeados que o Chromium grava no PDF), o segundo escreve os números no sumário.

## Testar o código do livro

```bash
python codigo/algoritmos.py      # ordenação topológica e serialização de árvores
python codigo/mini_llm.py        # decoder mínimo: geração com cache == sem cache
python codigo/caps_2_6.py        # atenção online, RoPE, máscara com cache, KV cache
```

Os dois últimos precisam de PyTorch (a versão para CPU basta).

## Fontes

Source Serif 4 e IBM Plex Sans Condensed (SIL Open Font License) e um subconjunto da DejaVu Sans Mono (licença livre da Bitstream Vera/DejaVu). Detalhes em `ebooks/_build/fontes/LICENCAS.md`.
