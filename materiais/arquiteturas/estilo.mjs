// CSS do ebook de arquiteturas (A4, impresso pelo Chromium). Mesma identidade do guia do WhatsApp:
// Inter no texto, Excalifont nos detalhes manuscritos, verde-petróleo de acento e amarelo de destaque.

export const css = (fonte) => `
@font-face { font-family: "Excali"; src: url("${fonte}") format("woff2"); }
:root {
  --tinta: #1e1e1e; --suave: #495057; --cinza: #868e96; --linha: #dee2e6;
  --acento: #0b7a6b; --acento-claro: #e6f4f1; --alerta: #c92a2a; --alerta-claro: #fff0f0;
  --amarelo: #fff7d6; --azul: #1971c2; --azul-claro: #e7f1fb;
}
* { box-sizing: border-box; }
html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
body { margin: 0; font-family: "Inter", sans-serif; font-size: 10pt; line-height: 1.55; color: var(--tinta); }
p { margin: 0 0 7pt; orphans: 3; widows: 3; }
.lead { font-size: 12pt; line-height: 1.5; color: var(--suave); }
h2.cap { font-size: 26pt; line-height: 1.1; margin: 0 0 14pt; letter-spacing: -0.025em; break-before: page; break-after: avoid; position: relative; }
h2.cap .num { display: block; font-family: "Excali"; font-size: 15pt; color: var(--acento); font-weight: 400; letter-spacing: 0; margin-bottom: 3pt; }
h2.cap .num .pt { color: var(--cinza); }
h3 { font-size: 13pt; margin: 15pt 0 5pt; break-after: avoid; letter-spacing: -0.01em; }
h4 { font-size: 9.5pt; margin: 10pt 0 4pt; color: var(--acento); text-transform: uppercase; letter-spacing: 0.05em; break-after: avoid; }
ul, ol { margin: 0 0 9pt; padding-left: 17pt; }
li { margin-bottom: 3pt; }
b { font-weight: 650; }
code { font-family: "DejaVu Sans Mono", monospace; font-size: 8.4pt; background: #f1f3f5; padding: 0 3pt; border-radius: 3pt; }
table { width: 100%; border-collapse: collapse; margin: 4pt 0 12pt; font-size: 9pt; break-inside: avoid; }
th { text-align: left; font-weight: 650; border-bottom: 1.5pt solid var(--tinta); padding: 3pt 6pt; vertical-align: bottom; }
td { border-bottom: 0.6pt solid var(--linha); padding: 3.5pt 6pt; vertical-align: top; }
table.compacta { font-size: 8pt; }
/* tabelas longas (mais de 8 linhas) podem quebrar entre linhas; o cabeçalho se repete */
table.longa { break-inside: auto; }
table.longa tr { break-inside: avoid; }
table.longa thead { display: table-header-group; }
table.compacta td, table.compacta th { padding: 2.5pt 4pt; }
figure { margin: 8pt 0 13pt; break-inside: avoid; text-align: center; }
figure svg { width: 100%; height: auto; max-height: 92mm; }
figure.grande svg { max-height: 150mm; }
figure.baixa svg { max-height: 62mm; }
figcaption { font-size: 8.4pt; color: var(--cinza); margin-top: 4pt; }

/* abertura */
.resumo { display: grid; grid-template-columns: 1.15fr 1fr; gap: 0; margin: 0 0 13pt; border: 1.5pt solid var(--tinta); border-radius: 10pt; overflow: hidden; break-inside: avoid; }
.resumo > div { padding: 10pt 13pt; font-size: 10.5pt; line-height: 1.45; }
.resumo .r1 { background: var(--amarelo); font-weight: 600; }
.resumo .r2 { background: #fff; color: var(--suave); border-left: 1.5pt dashed var(--linha); }
.resumo .rot { display: block; font-family: "Excali"; font-size: 12pt; color: var(--acento); font-weight: 400; margin-bottom: 3pt; }

/* caixas */
.caixa { display: block; border-radius: 8pt; padding: 9pt 12pt 9pt 13pt; margin: 9pt 0 11pt; font-size: 9.4pt; break-inside: avoid; border-left: 4pt solid; }
.caixa > b:first-child { display: block; margin-bottom: 2pt; font-size: 9.8pt; }
.caixa p:last-child, .caixa ul:last-child { margin-bottom: 0; }
.dica { background: var(--acento-claro); border-color: var(--acento); }
.dica > b:first-child { color: var(--acento); }
.alerta { background: var(--alerta-claro); border-color: var(--alerta); }
.alerta > b:first-child { color: var(--alerta); }
.alerta > b:first-child::before { content: "⚠  "; }
.pratica { background: var(--azul-claro); border-color: var(--azul); }
.pratica > b:first-child { color: var(--azul); }

/* quando usar */
.quando { display: grid; grid-template-columns: 1fr 1fr; gap: 10pt; margin: 8pt 0 12pt; break-inside: avoid; }
.quando > div { border-radius: 9pt; padding: 8pt 11pt; }
.quando .sim { background: var(--acento-claro); }
.quando .nao { background: var(--alerta-claro); }
.quando h4 { margin-top: 0; }
.quando .nao h4 { color: var(--alerta); }
.quando ul { list-style: none; padding-left: 0; margin: 0; font-size: 9.3pt; }
.quando li { padding-left: 15pt; position: relative; }
.quando .sim li::before { content: "✓"; position: absolute; left: 0; color: var(--acento); font-weight: 800; }
.quando .nao li::before { content: "✗"; position: absolute; left: 0; color: var(--alerta); font-weight: 800; }

/* medidor */
.medidor { border: 1pt solid var(--linha); border-radius: 9pt; padding: 7pt 11pt; margin: 8pt 0 12pt; break-inside: avoid; background: #fcfcfa; }
.medidor .m { display: flex; align-items: center; gap: 10pt; font-size: 9pt; padding: 2pt 0; }
.medidor .mr { width: 46%; color: var(--suave); }
.medidor .mb { display: flex; gap: 3pt; }
.medidor .mb i { display: block; width: 15pt; height: 9pt; border-radius: 2.5pt; background: #e9ecef; border: 0.6pt solid #ced4da; }
.medidor .mb i.on { background: var(--acento); border-color: var(--acento); }
.medidor .md { color: var(--cinza); font-size: 8.4pt; }
.medidor .mt { font-weight: 650; }

/* código e pastas */
.codigo, .pastas { margin: 6pt 0 12pt; break-inside: avoid; border-radius: 8pt; overflow: hidden; }
.codigo .ct, .pastas .ct { font-family: "DejaVu Sans Mono", monospace; font-size: 7.6pt; padding: 4pt 11pt; }
.codigo .ct { background: #2d3339; color: #adb5bd; break-after: avoid; }
/* blocos longos (mais de 20 linhas) podem continuar na página seguinte, sem deixar poucas linhas soltas */
.codigo.longo { break-inside: auto; }
.codigo.longo pre { orphans: 6; widows: 6; }
.codigo pre { background: #1f2428; color: #e9ecef; padding: 9pt 12pt; font-size: 8pt; line-height: 1.5; margin: 0; white-space: pre-wrap; }
.codigo pre code { background: none; padding: 0; font-size: inherit; color: inherit; }
.codigo .c { color: #8b949e; font-style: italic; }
.codigo .s { color: #a5d6a7; }
.codigo .k { color: #ff9e80; }
.codigo .n { color: #90caf9; }
.pastas { border: 1pt solid var(--linha); }
.pastas .ct { background: #f1f3f5; color: var(--suave); }
.pastas pre { margin: 0; padding: 8pt 12pt; font-family: "DejaVu Sans Mono", monospace; font-size: 8pt; line-height: 1.45; background: #fcfcfa; }
.pastas .c { color: var(--cinza); }

/* fechamento */
.combina { margin: 10pt 0; break-inside: avoid; }
.combina ul { list-style: none; padding: 0; margin: 0; columns: 2; column-gap: 14pt; font-size: 9pt; }
.combina li { break-inside: avoid; }
.combina .cn { font-family: "Excali"; color: var(--acento); margin-right: 5pt; }
.lembre { border-top: 2pt solid var(--tinta); margin-top: 12pt; padding-top: 6pt; break-inside: avoid; }
.lembre ol { margin: 0; font-size: 9.6pt; }
ol.passos { counter-reset: p; list-style: none; padding-left: 0; }
ol.passos li { counter-increment: p; position: relative; padding-left: 24pt; margin-bottom: 5pt; }
ol.passos li::before { content: counter(p); position: absolute; left: 0; top: 1pt; width: 16pt; height: 16pt; border-radius: 50%; background: var(--azul); color: #fff; font-size: 8.5pt; font-weight: 700; text-align: center; line-height: 16pt; }
.duas { display: grid; grid-template-columns: 1fr 1fr; gap: 14pt; }
.nova-pagina { break-before: page; }
.nota { font-size: 8.2pt; color: var(--cinza); margin-top: 14pt; border-top: 0.6pt solid var(--linha); padding-top: 5pt; }
.marca { position: absolute; right: 0; top: 0; font-size: 7pt; color: #ffffff; font-family: "DejaVu Sans Mono", monospace; }

/* abertura de parte */
.parte { break-before: page; height: 250mm; display: flex; flex-direction: column; justify-content: center; position: relative; }
.parte .pn { font-family: "Excali"; font-size: 30pt; color: var(--acento); }
.parte h2 { font-size: 40pt; line-height: 1.02; letter-spacing: -0.035em; margin: 4mm 0 6mm; }
.parte p { font-size: 13pt; color: var(--suave); max-width: 135mm; }
.parte ol { margin-top: 8mm; list-style: none; padding: 0; font-size: 11pt; }
.parte ol li { padding: 3pt 0; border-bottom: 0.6pt solid var(--linha); }
.parte ol li span { font-family: "Excali"; color: var(--acento); display: inline-block; width: 22pt; }

/* sumário */
.sumario h2 { font-size: 26pt; margin: 0 0 10pt; }
.sumario .sp-parte { font-family: "Excali"; color: var(--acento); font-size: 13pt; margin: 9pt 0 2pt; }
.sumario ol { list-style: none; padding: 0; margin: 0; }
.sumario li { display: flex; align-items: baseline; gap: 8pt; padding: 2.6pt 0; border-bottom: 0.5pt solid var(--linha); font-size: 9.6pt; margin: 0; }
.sumario .sn { font-family: "Excali"; color: var(--acento); width: 20pt; }
.sumario .st { flex: 1; }
.sumario .spg { color: var(--cinza); font-variant-numeric: tabular-nums; }
.fim { margin-top: 24pt; text-align: center; color: var(--suave); }
.fim .grande { font-family: "Excali"; font-size: 20pt; color: var(--acento); }
`;
