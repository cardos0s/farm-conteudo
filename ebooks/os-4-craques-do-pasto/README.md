# Os 4 Craques do Pasto

E-book do Rebanho sobre os quatro grupos de capim mais usados nas pastagens brasileiras: **Braquiária, Panicum, Tifton e Capim-elefante**. O tom é lúdico (cada capim é um craque de futebol, com posição e camisa, e a vaca Mimosa comenta o jogo), e os números de manejo vêm de publicações da Embrapa.

| Arquivo | O que é |
|---|---|
| `index.html` | O e-book, fonte única. Abre em qualquer navegador; na tela, o quiz e o caça-palavras são interativos. |
| `os-4-craques-do-pasto.pdf` | Versão para baixar, imprimir ou mandar para a lista (A4, 28 páginas). |

## Páginas

| Páginas | Conteúdo |
|---|---|
| 1–3 | Capa, apresentação e sumário em forma de campo de futebol |
| 4–6 | Aquecimento: partes do capim, jeitos de crescer, MS, PB, digestibilidade, UA e hectare |
| 7–9 | Braquiária: ficha, cultivares, régua do pastejo contínuo, cigarrinha e síndrome da morte do Marandu |
| 10–12 | Panicum: ficha, as seis cultivares, pastejo rotacionado e conta dos piquetes |
| 13–15 | Tifton: ficha, origem, plantio por mudas e feno passo a passo |
| 16–18 | Capim-elefante: ficha, capineira, silagem e pastejo, idade de corte da BRS Capiaçu |
| 19 | A régua do pasto: alturas de manejo de 15 cultivares |
| 20 | Tira-teima: os quatro lado a lado |
| 21 | Qual craque escalar? Quatro perguntas para escolher o capim |
| 22 | Formação do pasto em 6 jogadas e a conta do valor cultural (VC) |
| 23 | 7 erros que degradam o pasto e 4 boas práticas |
| 24–25 | Quiz, caça-palavras e gabarito |
| 26 | Dicionário do pasto |
| 27–28 | Apito final, fontes e contracapa |

## Como editar

Edite o texto direto no `index.html`. Cada página é uma `<section class="page">`, com o número no rodapé (`folio__n`); se mudar a ordem, atualize também o sumário (página 3).

- **Ilustrações dos capins:** desenhadas pelo script no fim do arquivo, a partir dos atributos `data-capim` (tipo, posição, altura, largura e semente do desenho).
- **Régua do pasto (página 19):** cada faixa usa `--de` e `--ate` no estilo da linha, em centímetros.
- **Notas das fichas:** `data-n` de 1 a 5 em cada `.pips`.

Cada página tem tamanho fixo de A4. Depois de editar, gere o PDF de novo: o script avisa se algum conteúdo passou da página.

## Como gerar o PDF

```bash
npm i --no-save playwright && npx playwright install chromium
```

```bash
node scripts/ebook/gerar-pdf.mjs ebooks/os-4-craques-do-pasto
```

Sem instalar nada: abra o `index.html` no Chrome, vá em Imprimir → Salvar como PDF, com papel A4, margens "Nenhuma" e "Gráficos de plano de fundo" marcado.

## Identidade

Linha verde do design system Rebanho: Nunito nos títulos, Inter no texto, Pasto Noturno (`#013D2F`), Branco Campo (`#F3F6E3`) e Verde Rebanho (`#058149`). O Verde Ganho (`#4DDF35`) aparece só sobre fundo escuro. As fontes vêm do Google Fonts.

## Fontes dos números

Listadas na página 27: Embrapa Gado de Corte (régua de manejo, 2017, e documento do Marandu, 1984), Embrapa Gado de Leite (BRS Capiaçu e BRS Kurumi), Embrapa Rondônia, Embrapa Amazônia Oriental, Embrapa Amazônia Ocidental e USDA-ARS (Tifton 85). As alturas de pastejo do Tifton são faixas citadas em pesquisas, porque não há uma régua oficial única para ele.
