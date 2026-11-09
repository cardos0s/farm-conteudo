# 50 Conceitos de System Design

Ebook de estudo em português: tradução fiel e expansão do artigo
[50 System Design Concepts for Beginners in 90 Minutes](https://designgurus.substack.com/p/50-system-design-concepts-for-beginners)
(Arslan Ahmad, DesignGurus, dezembro de 2025). O título promete 50 conceitos e o artigo traz 51; estão
todos aqui.

## Para ler

| Arquivo | Quando usar |
|---|---|
| [`dist/system-design-50-conceitos.html`](dist/system-design-50-conceitos.html) | No computador ou no celular. Busca no livro inteiro, flashcards com repetição espaçada, simulado com nota por parte, "marcar como estudado", tema claro e escuro. Funciona offline: é um arquivo só. |
| [`dist/system-design-50-conceitos.pdf`](dist/system-design-50-conceitos.pdf) | No tablet ou impresso. Página de 170 × 240 mm, sumário com número de página, marcadores e links entre capítulos. |
| [`dist/system-design-50-conceitos.epub`](dist/system-design-50-conceitos.epub) | No Kindle (pelo "Enviar para o Kindle"), Apple Books, Google Play Livros ou Kobo. |

## O que tem dentro

- **51 capítulos em 6 partes**: princípios de arquitetura, redes e comunicação, bancos de dados,
  confiabilidade, cache e mensageria, observabilidade e segurança.
- **Cada capítulo** traz a tradução fiel do trecho original ("O essencial") e o que o artigo não tinha
  espaço para dizer: como funciona por dentro, analogia, exemplos reais, trade-offs, o que falar na
  entrevista, pegadinhas, notas de atualização e três perguntas de revisão.
- **Diagramas no estilo lousa**, com o mesmo motor (roughjs), a mesma fonte manuscrita (Excalifont) e a
  mesma paleta da lousa das aulas da comunidade.
- **Material de estudo**: plano de 14 dias, cola com os conceitos em uma linha, flashcards, roteiro de
  entrevista, números de referência para estimativas, um estudo de caso completo (encurtador de links),
  glossário e um simulado de 40 questões com gabarito comentado.

## Estrutura

```
conteudo/            o texto, em Markdown (um arquivo por capítulo)
  00-abertura/       sobre o ebook e como estudar
  parte-N-*/         _parte.md (abertura da parte) e os capítulos NN-*.md
  fechamento.md      as lições principais e a "viagem de um clique"
  apendices/         roteiro, números, estudo de caso, glossário e simulado
diagramas/           kit.mjs (o kit de desenho), fontes/*.mjs (um por diagrama) e os SVGs gerados
build/               montagem: checar.py, montar.py, modelo, CSS, JS, pdf.mjs, imagens.mjs, epub.py
dist/                os arquivos para ler
GUIA-DE-ESTILO.md    formato dos capítulos, regras de escrita e API do kit de diagramas
```

## Como montar

Requisitos: Node 20+, Python 3.10+ com `pyyaml jinja2 beautifulsoup4 lxml pypdf pillow`, pandoc e o
Playwright com Chromium (`npm i -g playwright && npx playwright install chromium`). Na raiz do
repositório, depois do `npm install` (que traz o roughjs):

```bash
npm run ebook:system-design
```

O script confere o formato de todos os arquivos (`build/checar.py`), renderiza os diagramas, gera o
HTML, o PDF (em duas passadas, para numerar o sumário) e o EPUB (com uma conferência estrutural de
links, imagens e manifesto).

Para editar só um diagrama e conferir o resultado:

```bash
node ebooks/system-design/diagramas/renderizar.mjs 25-hashing-consistente
node ebooks/system-design/diagramas/previa.mjs /tmp/previa.png 25-hashing-consistente
```

## Créditos

Seleção dos conceitos e explicações originais: Arslan Ahmad, DesignGurus. Esta edição (tradução,
expansão, diagramas e material de estudo) é para estudo pessoal, sem fins comerciais. Fontes: Literata,
Bricolage Grotesque e JetBrains Mono (SIL Open Font License, em `build/fontes/`) e Excalifont
(`public/fontes/`).
