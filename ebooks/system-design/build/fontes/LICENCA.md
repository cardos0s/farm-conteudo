# Fontes do ebook

Subconjunto latino (woff2) baixado do Google Fonts e embutido no HTML e no PDF:

- **Literata** (`literata-latin.woff2`, `literata-italico-latin.woff2`): texto corrido. TypeTogether para o Google.
- **Bricolage Grotesque** (`bricolage-grotesque-latin.woff2`): títulos. Mathieu Triay.
- **JetBrains Mono** (`jetbrains-mono-latin.woff2`): rótulos e código. JetBrains.

As três são distribuídas sob a SIL Open Font License 1.1 (https://openfontlicense.org), que permite usar,
embutir e redistribuir as fontes junto com outros trabalhos, desde que não sejam vendidas sozinhas.

`estaticas/` traz instâncias estáticas (woff) das mesmas famílias, servidas pelo Google Fonts, usadas só no
PDF: o Chromium embute fontes variáveis como Type 3, uma cópia por combinação de eixos, o que deixava o
arquivo três vezes maior. A Bricolage estática está na largura 87,5% (semicondensada).
