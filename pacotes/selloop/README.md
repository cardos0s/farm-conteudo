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

## Cenários da demo

- **Dia** (vídeos 1 e 2): terça, 10/11/2026, 10:32. Caixa com as quatro equipes, campanhas dos últimos 30 dias.
- **Noite** (vídeo 3, `cenario: "noite"` em `cenaDemo`): a mesma terça, 23:47. Quatro conversas nos três
  canais, todas com a Lia atendendo; o áudio do Fábio tem transcrição; o funil de vendas e a agenda trazem
  a oportunidade e a visita que a Lia criou. Na cena, `demo.chegar`, `demo.transferir` e `demo.reconectar`
  fazem as mensagens, a transferência e a nota interna aparecerem ao vivo.

O celular do vídeo 3 (o cliente mandando o áudio e ouvindo a resposta da Lia) é desenhado no Remotion
(`remotion/selloop/Celular.tsx` e `remotion/selloop/v3/Noite.tsx`), com os mesmos áudios da locução.
