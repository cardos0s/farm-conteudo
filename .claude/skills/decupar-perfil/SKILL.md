---
name: decupar-perfil
description: Decupa os últimos 30 a 40 vídeos de um perfil de referência (Instagram, TikTok ou uma pasta de MP4) e transforma o formato de edição em um guia de estilo (estilos/<id>/estilo.json + guia.md) que o roteirista e o render de UGC da fábrica seguem. Use quando pedirem para estudar, decupar ou copiar o formato/edição de um perfil, ou para criar ou atualizar um estilo de vídeo UGC.
---

# Decupar um perfil de referência

O objetivo é entender **a técnica** do formato (ritmo, cortes, câmera, legenda, headline, efeitos sonoros, cor, estrutura do roteiro) com detalhe suficiente para a fábrica reproduzir o formato com a personagem de IA da marca. Não é copiar a pessoa: frases, bordões, rosto, voz e identidade da criadora não entram no guia.

Resultado: `estilos/<id>/estilo.json` (validado pelo `EstiloSchema` de `src/ugc/formato.ts`) e `estilos/<id>/guia.md`. Depois é só apontar `ugc.estilo` da vertical para `<id>`.

## 1. Pegar os vídeos

Pergunte o perfil e um `<id>` curto para o estilo (ex.: `selfie-rapido`). Os vídeos ficam em `estilos/<id>/videos/`, que está no `.gitignore`: servem só para análise e nunca são republicados.

Se `yt-dlp` não estiver instalado: `pip install -U yt-dlp`.

```bash
yt-dlp -I 1:40 --cookies-from-browser chrome \
  -o "estilos/<id>/videos/%(upload_date)s-%(id)s.%(ext)s" \
  "https://www.instagram.com/<perfil>/reels/"
```

O Instagram costuma exigir login. Se o comando acima falhar:
- peça à pessoa um arquivo com os links dos reels (um por linha) e rode `yt-dlp --cookies-from-browser chrome -a links.txt -o ...`; ou
- peça para ela baixar os vídeos e colocar na pasta.

Em sessão na nuvem não há navegador com login: use `--cookies cookies.txt` (exportado pela pessoa) ou os vídeos enviados por ela. Mire em 30 a 40 vídeos recentes; com menos de 15 a análise fica fraca, avise.

## 2. Decupagem técnica (automática)

```bash
npm run decupar -- estilos/<id>/videos <id>
```

Para cada vídeo, em `estilos/<id>/decupagem/<video>/`:
- `decupagem.json`: duração, cortes, tomadas (início/fim), cortes por minuto, silêncios, volume (LUFS), cores dominantes, brilho e saturação e, com `ELEVENLABS_API_KEY`, a transcrição com palavras por minuto, a fala dos 3 primeiros segundos e o que é dito em cada tomada.
- `folha-N.jpg`: um quadro do meio de cada tomada, em ordem (6 por linha). O quadro N da folha é a tomada N do JSON.
- `gancho.jpg`: 6 quadros dos primeiros 3 segundos (0 a 2,5 s).

E `estilos/<id>/decupagem/resumo.json` com as medianas de todos os vídeos.

## 3. Leitura visual (você)

Abra **todas** as `folha-*.jpg` e `gancho.jpg` com a ferramenta Read e cruze com o `decupagem.json` de cada vídeo. Para cada vídeo, registre em `estilos/<id>/decupagem/analise.md` uma linha por vídeo e, para os 5 mais vistos ou mais representativos, uma tabela tomada a tomada:

| Tomada | Tempo | Enquadramento e câmera | O que está na tela (texto, imagem, print) | Fala | Edição (zoom, corte, SFX, transição) |

O que observar em cada vídeo:
- **Câmera**: como posiciona e segura (selfie com braço, apoiada, alguém filmando), altura, distância, se anda, se troca de cenário, luz, ambiente.
- **Gancho**: o que acontece no primeiro quadro e nos 3 primeiros segundos (fala, texto, movimento, imagem).
- **Texto na tela**: headline (quando entra, quanto tempo fica, posição, fonte, cor, caixa), legenda falada (palavra a palavra ou frase, quantas palavras por vez, cor de destaque, contorno, posição), e quando **não** coloca texto.
- **Imagens e prints**: quando entram, em que formato (tela cheia, sobre o rosto, picture-in-picture), quanto tempo.
- **Edição**: duração das tomadas, se corta respiros, zoom/punch-in (quando e quanto), transições, animações de texto.
- **Áudio**: efeitos sonoros (tipo e momento: entrada de texto, troca de tomada, revelação), música (estilo e volume em relação à fala), silêncios. Os momentos de corte do JSON ajudam a localizar SFX; se tiver dúvida sobre um som específico, extraia o trecho com `ffmpeg -ss <t> -t 1.5 -i video.mp4 trecho.wav` e descreva pelo contexto.
- **Roteiro**: estrutura (gancho → ... → CTA), tamanho das frases, registro de fala, tipo de CTA.
- **Cor**: gradação (quente/fria, contraste, saturação) a partir das cores dominantes e das folhas.

## 4. Síntese

Escreva `estilos/<id>/guia.md`: o formato explicado para um editor humano, com o que é regra (aparece em 70%+ dos vídeos), o que é variação, e o que ela evita. Cite números do `resumo.json`.

Escreva `estilos/<id>/estilo.json` seguindo `EstiloSchema` (use `estilos/exemplo/estilo.json` como modelo). Pontos de atenção:
- `ritmo`, `duracaoSeg`: venham do `resumo.json`, não de impressão.
- `legendas.fonte` e `headline.fonte`: só `Poppins`, `Inter`, `Archivo Black` ou `Roboto Slab` (as fontes que o render tem). Escolha a mais parecida.
- `sfx[].descricao`: descrição em inglês do som, curta e concreta (vira prompt do gerador de efeitos do ElevenLabs). `nome` em minúsculas com hífen.
- `cor.filtroCss`: filtro CSS que aproxima a gradação (ex.: `contrast(1.08) saturate(0.9) sepia(0.08)`).
- `gancho.padroes`, `estrutura`, `fala`: descreva o **padrão**, sem reproduzir frases da criadora.
- `evitar`: o que ela nunca faz.

Valide:

```bash
npm run decupar -- --validar <id>
```

## 5. Entregar

Mostre à pessoa um resumo do formato (5 a 8 linhas) e diga como usar: em `verticais/<vertical>.ts`, `ugc.estilo: "<id>"`, e depois `npm run ugc <vertical> -- --briefing "..." --so-roteiro` para ver o primeiro roteiro antes de gastar com vídeo.
