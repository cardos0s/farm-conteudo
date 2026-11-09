# Os 4 capins mais usados no Brasil

Guia prático do Rebanho sobre os quatro grupos de capim que formam a base das pastagens brasileiras: **Braquiária, Panicum, Tifton e Capim-elefante**. Tom de técnico de campo, com ilustrações, gráficos e números de manejo de publicações da Embrapa.

| Arquivo | O que é |
|---|---|
| `index.html` | O e-book, fonte única. Abre em qualquer navegador; na tela, o diagnóstico da página 25 soma as respostas sozinho. |
| `os-4-capins-mais-usados.pdf` | Versão para baixar, imprimir ou mandar para a lista (A4, 28 páginas). |

## Páginas

| Páginas | Conteúdo |
|---|---|
| 1–3 | Capa, apresentação e sumário |
| 4–6 | Fundamentos: partes do capim, formas de crescimento, MS, PB, digestibilidade, UA e hectare |
| 7–9 | Braquiária: ficha técnica, cultivares, régua do pastejo contínuo, cigarrinha e síndrome da morte do Marandu |
| 10–12 | Panicum: ficha técnica, as seis cultivares, pastejo rotacionado e conta dos piquetes |
| 13–15 | Tifton: ficha técnica, origem, plantio por mudas e feno passo a passo |
| 16–18 | Capim-elefante: ficha técnica, capineira, silagem e pastejo, idade de corte da BRS Capiaçu |
| 19 | A régua do pasto: alturas de manejo de 15 cultivares |
| 20 | Comparativo dos quatro capins |
| 21 | Qual capim escolher: quatro perguntas |
| 22 | Formação do pasto em 6 etapas e a conta do valor cultural (VC) |
| 23 | Calendário do pasto (Brasil Central) |
| 24 | 7 erros que degradam o pasto e 4 boas práticas |
| 25 | Diagnóstico do pasto em 10 perguntas |
| 26 | Glossário |
| 27–28 | Resumo, fontes e contracapa |

## Como editar

Edite o texto direto no `index.html`. Cada página é uma `<section class="page">`, com o número no rodapé (`folio__n`); se mudar a ordem, atualize também o sumário (página 3).

- **Ilustrações dos capins:** desenhadas pelo script no fim do arquivo, a partir dos atributos `data-capim` (tipo, posição, altura, largura e semente do desenho). `data-medida` coloca a régua e o selo de medida nas aberturas de capítulo; `data-rotulo` põe o nome do capim na capa.
- **Régua do pasto (página 19):** cada faixa usa `--de` e `--ate` no estilo da linha, em centímetros.
- **Calendário (página 23):** cada barra usa `--i` (mês de início) e `--f` (mês seguinte ao fim), de 1 a 13.
- **Notas das fichas:** `data-n` de 1 a 5 em cada `.pips`.

Cada página tem tamanho fixo de A4. Depois de editar, gere o PDF de novo: o script avisa se algum conteúdo passou da página.

## Como gerar o PDF

```bash
npm i --no-save playwright && npx playwright install chromium
```

```bash
node scripts/ebook/gerar-pdf.mjs ebooks/os-4-capins-mais-usados
```

Sem instalar nada: abra o `index.html` no Chrome, vá em Imprimir → Salvar como PDF, com papel A4, margens "Nenhuma" e "Gráficos de plano de fundo" marcado.

## Identidade

Linha verde do design system Rebanho: Nunito 800 nos títulos, Inter no texto, Pasto Noturno (`#013D2F`), Branco Campo (`#F3F6E3`) e Verde Rebanho (`#058149`). O Verde Ganho (`#4DDF35`) aparece só sobre fundo escuro, nos selos de medida e nos gráficos, como pede o design system. As fontes vêm do Google Fonts.

## Fontes dos números

Listadas na página 27: Embrapa Gado de Corte (régua de manejo, 2017, e documento do Marandu, 1984), Embrapa Gado de Leite (BRS Capiaçu e BRS Kurumi), Embrapa Rondônia, Embrapa Amazônia Oriental, Embrapa Amazônia Ocidental, publicações da Embrapa sobre vedação e cigarrinha, e USDA-ARS (Tifton 85). As alturas de pastejo do Tifton são faixas citadas em pesquisas, porque não há uma régua oficial única para ele.
