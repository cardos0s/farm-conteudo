# Pack de vídeos Selloop

Três vídeos gravados por dentro da Selloop (app.selloop.com.br), com a **Nova Rota Distribuidora**,
uma empresa fictícia. A interface é a real; os dados vêm de um servidor de demonstração que roda no
próprio navegador (`demo/servidor.mjs`), então nada chega ao backend da Selloop nem a contatos reais.

| Vídeo | Composição (Remotion) | Cenas | Locução |
| --- | --- | --- | --- |
| 1 · Ambiente de atendimento | `SelloopAtendimento` | `cenas/v1-*.mjs` | `locucao/v1-atendimento.json` |
| 2 · Disparador de campanhas | `SelloopCampanhas` | `cenas/v2-*.mjs` | `locucao/v2-campanhas.json` |
| 3 · Agente inteligente 24 h | `SelloopAgente` | `cenas/v3-*.mjs` | `locucao/v3-agente.json` |

## Como produzir

1. **Gravar as telas** (Chromium em 2x, 60 fps; cada cena grava `tela.mp4` e `eventos.json` com cliques e marcas):
   ```bash
   node scripts/telas/gravar.mjs pacotes/selloop/cenas/v1-a-caixa.mjs --saida public/selloop/telas
   ```
   Para conferir uma tela da demo sem gravar: `node pacotes/selloop/demo/ver.mjs /atendimento print.png`.
2. **Locução** (ElevenLabs, precisa de `ELEVENLABS_API_KEY`; só gera de novo a fala que mudou):
   ```bash
   python3 scripts/telas/locucao.py pacotes/selloop/locucao/v1-atendimento.json public/selloop/locucao/v1
   ```
3. **Trilha** (gerada por código, não fica no git):
   ```bash
   python3 scripts/telas/trilha.py public/selloop/sons/trilha.wav 110
   ```
4. **Montar e renderizar**: a edição de cada vídeo (`remotion/selloop/v1/Atendimento.tsx` etc.) é guiada
   pela locução: cada trecho de tela ajusta a velocidade para caber na sua fala, e os cortes saem das
   marcas gravadas nas cenas. Trechos seguidos da mesma gravação emendam sem transição.
   ```bash
   npx remotion render remotion/index.ts SelloopAtendimento saida/selloop/v1-atendimento.mp4 --browser-executable=/opt/pw-browsers/chromium --crf=18
   ```
   Quadros soltos para conferir: `node scripts/telas/quadros.mjs SelloopAtendimento /tmp/quadros 5 30 60`.
5. **Masterizar o áudio** (-16 LUFS, pico -1,5 dBTP, vídeo copiado):
   ```bash
   scripts/telas/masterizar.sh saida/selloop/v1-atendimento.mp4 saida/selloop/selloop-01-ambiente-de-atendimento.mp4
   ```

As gravações (`public/selloop/telas/**/*.mp4`), a trilha e os vídeos finais (`saida/`) ficam fora do git.

## Versão vertical (Reels e Stories)

Os mesmos três vídeos em 1080×1920, com a voz da Raquel (ElevenLabs) e mais movimento: a tela fica numa
janela no meio do quadro, a câmera acompanha cada clique, e os elementos importantes (uma mensagem, um
cartão, um botão) saltam para fora da janela, com título animado e legenda palavra por palavra.

| Reel | Composição | Edição | Locução |
| --- | --- | --- | --- |
| 1 · Ambiente de atendimento | `SelloopReelAtendimento` | `remotion/selloop/reel/R1Atendimento.tsx` | `locucao/reels-1-atendimento.json` → `r1` |
| 2 · Disparador de campanhas | `SelloopReelCampanhas` | `remotion/selloop/reel/R2Campanhas.tsx` | `locucao/reels-2-campanhas.json` → `r2` |
| 3 · Agente inteligente 24 h | `SelloopReelAgente` | `remotion/selloop/reel/R3Agente.tsx` | `locucao/reels-3-agente.json` → `r3` |

As gravações são as mesmas do formato horizontal (1600×900): uma tela mais estreita quebra o cabeçalho
da plataforma, então quem enquadra é a câmera. O que muda na produção:

1. **Recortes**: nas cenas, `g.recorte(alvo, nome)` marca o elemento que vai saltar. Na gravação isso só
   registra a caixa e o momento em `eventos.json`; a imagem sai em 3x de uma segunda passada, sem gravar:
   ```bash
   node scripts/telas/recortar.mjs pacotes/selloop/cenas/v1-c-recursos.mjs --saida public/selloop/telas
   ```
   Ficam em `public/selloop/telas/<cena>/recortes/<nome>.png` (com as caixas em `recortes.json`).
   Depois de regravar uma cena, rode o recorte dela de novo.
2. **Locução** com a voz da Raquel, em pastas próprias (`r1`, `r2`, `r3`):
   ```bash
   python3 scripts/telas/locucao.py pacotes/selloop/locucao/reels-1-atendimento.json public/selloop/locucao/r1
   ```
   O `locucao.json` gerado traz o tempo de cada palavra (legenda e sincronia dos saltos) e o volume médio
   de cada fala (`nivel`), que a montagem usa para igualar as falas.
3. **Efeitos sonoros** (`salto.wav` e `sino.wav`, gerados por código):
   ```bash
   python3 scripts/telas/efeitos.py public/selloop/sons
   ```
4. **Renderizar e masterizar**, como no horizontal:
   ```bash
   npx remotion render remotion/index.ts SelloopReelAtendimento saida/selloop/r1-atendimento.mp4 --browser-executable=/opt/pw-browsers/chromium --concurrency=3 --crf=17
   ```
   ```bash
   scripts/telas/masterizar.sh saida/selloop/r1-atendimento.mp4 saida/selloop/selloop-reels-01-ambiente-de-atendimento.mp4
   ```

Como a edição vertical é montada (`remotion/selloop/reel/`):

- `base.ts`: as zonas do quadro (marca, título, janela, legenda, dentro da área segura do Reels) e a
  câmera, uma lista de alvos no tempo da gravação que `alvosDaGravacao` tira dos cliques, da digitação e
  dos recortes.
- `montagemReel.ts`: `criarGrupos` monta cada momento a partir da fala (a velocidade da tela se ajusta à
  narração) e `salto(bloco, nome, opções)` agenda um recorte saindo do lugar exato onde está na tela.
- `Reel.tsx`: a composição (fundo, janela, recortes, camadas, títulos, legenda, encerramento e áudio).
- `Recorte.tsx`, `Efeitos.tsx`, `Texto.tsx`, `Palco.tsx`, `Icones.tsx`: as peças de motion design
  (salto com brilho, selos, logos dos canais, confete, estrelas, contador, título e legenda animados).
- `NoiteReel.tsx`: as duas cenas de celular do Reel 3 (o áudio do cliente e a resposta da Lia em áudio).

## Cenários da demo

- **Dia** (vídeos 1 e 2): terça, 10/11/2026, 10:32. Caixa com as quatro equipes, campanhas dos últimos 30 dias.
- **Noite** (vídeo 3, `cenario: "noite"` em `cenaDemo`): a mesma terça, 23:47. Quatro conversas nos três
  canais, todas com a Lia atendendo; o áudio do Fábio tem transcrição; o funil de vendas e a agenda trazem
  a oportunidade e a visita que a Lia criou. Na cena, `demo.chegar`, `demo.transferir` e `demo.reconectar`
  fazem as mensagens, a transferência e a nota interna aparecerem ao vivo.

O celular do vídeo 3 (o cliente mandando o áudio e ouvindo a resposta da Lia) é desenhado no Remotion
(`remotion/selloop/Celular.tsx` e `remotion/selloop/v3/Noite.tsx`), com os mesmos áudios da locução.
