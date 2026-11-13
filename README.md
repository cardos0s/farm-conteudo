# Fábrica de conteúdo

Um motor só que produz conteúdo todos os dias para três apps, cada um com a própria marca:

| Vertical | App | Newsletter | Elemento visual |
|---|---|---|---|
| Automobilismo e F1 | **Cockpit** | Box Box (terça) | zebra de pista correndo na base |
| Pecuária e agro | **Rebanho** | Porteira (segunda) | cerca que se estende pela tela |
| Estudos (vestibular, ENEM, concursos, faculdade) | **Focca** | Foco Total (domingo) | anel de Pomodoro que fecha até o fim do vídeo |

O conteúdo nas redes leva o público para a newsletter gratuita, e a newsletter apresenta o app para quem já confia na marca.

## Como funciona o dia

```
07:00  coleta ─▶ editor ─▶ redator ─▶ revisor ─▶ render (Remotion) ─▶ Telegram
                                         │
                       reprovou? reescreve 1 vez; reprovou de novo? descarta e avisa
```

1. **Coleta**: notícias dos feeds RSS de cada nicho (últimas 48 h, sem repetir o que já virou vídeo) e dados de APIs abertas:
   - Cockpit: classificação, último resultado e próxima corrida pela [API Jolpica](https://api.jolpi.ca/ergast/) (sucessora da Ergast).
   - Rebanho: chuva e temperatura dos próximos 7 dias nas praças pecuárias pelo [Open-Meteo](https://open-meteo.com).
   - Focca: contagem regressiva das provas cadastradas em `verticais/focca.ts`.
2. **Editor** (Claude) escolhe as pautas do dia, evitando temas das últimas duas semanas.
3. **Redator** (Claude) escreve o roteiro em cenas, a legenda e o bloco da newsletter, usando só fatos do material.
4. **Revisor** (Claude) confere cada número, nome e data contra o material de origem e as regras da marca.
5. **Render**: o Remotion transforma o roteiro em um Reel vertical 1080×1920 com a identidade da marca.
6. **Aprovação**: os vídeos chegam no seu Telegram com **✅ Aprovar** e **❌ Rejeitar**.
7. **Publicação**: o que você aprovar vai para o Instagram do app no próximo horário livre (9h, 12h, 15h, 18h ou 21h).

Uma vez por semana, cada vertical monta a newsletter com o que foi aprovado na semana, com o app apresentado no final. Ela também passa pelo Telegram antes de sair pelo Beehiiv.

Qualquer erro chega como alerta no Telegram. Uma vertical com problema não para as outras.

### Cenas disponíveis nos vídeos

`abertura` · `noticia` (card com fonte) · `grafico` (barras animadas) · `ranking` · `contagem` (número grande de dias) · `encerramento` (chamada para o app). O Cockpit usa só tipografia, gráficos e dados, sem imagem ou vídeo oficial da F1.

## Primeiros passos

Requisitos: Node 20 ou mais novo.

```bash
npm install
```

```bash
npm run estudio
```

Abre o editor do Remotion com o vídeo de exemplo do Focca. Os exemplos das três marcas ficam em `remotion/exemplos.ts`; para ver outra marca no estúdio, troque `exemplos.focca` por `exemplos.cockpit` ou `exemplos.rebanho` em `remotion/Root.tsx`.

```bash
npm run render:exemplo
```

Renderiza os três exemplos em `saida/exemplos/`.

### Configuração

```bash
cp .env.example .env
```

Preencha o `.env`. O que cada parte precisa:

| O quê | Onde conseguir |
|---|---|
| `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com) |
| `TELEGRAM_BOT_TOKEN` | crie um bot com o **@BotFather** |
| `TELEGRAM_CHAT_ID` | mande uma mensagem para o **@userinfobot** |
| `S3_*` | um bucket público (Cloudflare R2 é o mais barato). O Instagram baixa o vídeo dessa URL |
| `IG_<APP>_USER_ID` e `IG_<APP>_TOKEN` | conta profissional do Instagram ligada a uma página do Facebook, com um app na Meta for Developers e permissão `instagram_content_publish`. Use um token de longa duração |
| `BEEHIIV_API_KEY` e `BEEHIIV_<APP>_PUB_ID` | Beehiiv → Settings → API |

Depois revise os `TODO` em `verticais/`: descrição e link de cada app e o @ de cada perfil.

```bash
npm run checar
```

Mostra o que está configurado e testa cada feed RSS.

Nada é obrigatório para começar: sem Instagram, o bot avisa na hora de postar para você publicar manualmente; sem Beehiiv, ele manda o HTML pronto da newsletter para colar no editor.

### Teste manual

```bash
npm run diario focca
```

```bash
npm run bot
```

Aprove o vídeo no Telegram. No bot, `/status` mostra o que está pendente, agendado e publicado.

```bash
npm run newsletter focca -- --agora
```

## Deixar rodando sozinho

Num servidor pequeno com pelo menos 2 GB de RAM (nos testes, cada vídeo levou menos de 1 minuto para renderizar):

1. Copie o projeto para `/opt/fabrica-conteudo`, rode `npm install` e preencha o `.env`.
2. Instale o serviço do bot, que fica ouvindo o Telegram e publica no horário:
   ```bash
   sudo cp deploy/fabrica-bot.service /etc/systemd/system/ && sudo systemctl enable --now fabrica-bot
   ```
3. Adicione as linhas de `deploy/crontab.txt` com `crontab -e`.

Se o Remotion não conseguir baixar o navegador dele no servidor, instale o Chromium e aponte `REMOTION_CHROME` para o executável.

## Ajustes comuns

- **Volume**: `volume.videosPorDia` em cada arquivo de `verticais/`. Comece com 1 e aumente quando a qualidade estiver boa.
- **Dia da newsletter**: `volume.diaNewsletter` (0 = domingo).
- **Horários de publicação**: `HORARIOS_PADRAO` em `src/core/agenda.ts`.
- **Tom e regras**: `tom` e `regras` em cada vertical entram nos prompts do redator e do revisor.
- **Fontes**: lista `fontes.rss`. Rode `npm run checar` depois de mudar. Alguns portais (Globo, Motorsport.com) bloquearam o leitor nos testes; se no seu servidor eles responderem, dá para adicionar.
- **Provas do Focca**: `fontes.provas`. Coloque só datas confirmadas em edital.
- **Nova vertical**: crie `verticais/<nome>.ts` com a mesma estrutura e adicione em `verticais/index.ts`.
- **Modelo do Claude**: `CLAUDE_MODEL` no `.env` (padrão `claude-opus-5-5`). Se o modelo recusar um pedido por política, a API refaz a chamada automaticamente num modelo de reserva.

## Aulas da comunidade (vídeos com lousa)

Além dos Reels automáticos, o projeto monta aulas gravadas no celular: junta os clipes, corta tropeços e pausas, trata a voz e desenha uma lousa no estilo Excalidraw sincronizada com a fala.

```bash
npm run render:aula
```

Renderiza a **Aula 1: Complexidade de algoritmos** (1920×1080) em `saida/aulas/complexidade/`. O passo a passo completo (baixar do Drive, converter o HDR do iPhone, transcrever, cortar, renderizar) está em `scripts/aulas/README.md`; os componentes da lousa ficam em `remotion/lousa/`.

## Explica, Mente! (animação 3D)

Vídeos curtos em desenho 3D que mostram situações reais de clínica, para divulgar o app de clínicas (1080×1920). Há dois episódios:

| Nome | O que é | Duração |
|---|---|---|
| `tenis` | historinha da Lia e da terapeuta, com falas | 40 s |
| `tarefa` | explicação direta, só narração: "o que calçar um tênis tem a ver com terapia ocupacional?" | 38 s |

```bash
npm run render:explica -- tarefa
```

Renderiza em `saida/explica-mente/explica-mente-<nome>.mp4`. Sem locução o vídeo sai mudo, só com as legendas. Para a voz:

```bash
npx tsx scripts/explica-mente/gerar_voz.ts tarefa
```

```bash
npx tsx scripts/explica-mente/montar_locucao.ts tarefa
```

Se a narração já estiver gravada num arquivo só (por exemplo, exportada do site do ElevenLabs), basta `python3 scripts/explica-mente/alinhar_narracao.py narracao.mp3`: ele acha cada frase no áudio e ajusta as cenas e legendas a ela (precisa de `pip install faster-whisper numpy`).

Para gerar a voz por aqui: o primeiro comando gera um mp3 por fala no ElevenLabs (precisa de `ELEVENLABS_API_KEY`; aceita o id da voz e a velocidade como argumentos) em `saida/explica-mente/<nome>/vozes/`. Se preferir gravar, salve ali os seus áudios (`01.mp3`, `02.mp3`, ... na ordem do roteiro). O segundo tira os silêncios, junta tudo em `locucao.wav` e, no episódio `tarefa`, grava em `tempos.json` o tempo real de cada fala: as cenas e as legendas se ajustam à voz no render seguinte.

- **Falas, narração e tempos**: `remotion/explica-mente/roteiro.ts` (tenis) e `remotion/explica-mente/tarefa/roteiro.ts` (tarefa). As legendas e as bocas dos personagens seguem essa lista; ao gravar a locução, ajuste `de` e `ate` de cada fala.
- **Movimentos e câmeras**: `coreografia.ts` de cada episódio.
- **Personagens, tênis e sala**: `Boneco.tsx`, `Tenis.tsx` e `Cenario.tsx`, feitos de formas simples do Three.js (sem modelos externos).
- **Marca na tela final**: `Final` em `Legendas.tsx`. A marca de lá é provisória; troque pela logo oficial.
- **Conferir quadros sem renderizar tudo**: `scripts/explica-mente/folha.sh saida/folha.jpg 6 0 60 130 300` monta uma folha de contato com os quadros pedidos.

O render usa WebGL por software (`swangle`), então funciona em servidor sem placa de vídeo. Numa máquina com GPU, `REMOTION_GL=angle` deixa mais rápido.

## Estrutura

```
verticais/          uma configuração por app (fontes, tom, regras, cores, volume)
remotion/           templates de vídeo: cenas, elemento de cada marca, fontes
remotion/lousa/     lousa no estilo Excalidraw (formas à mão, texto manuscrito, canvas infinito)
remotion/aulas/     aulas da comunidade (cenas, cortes e EDL de cada aula)
remotion/explica-mente/  animação 3D do Explica, Mente! (personagens, cenário, coreografia, legendas)
scripts/aulas/      pipeline das aulas: Drive, HDR→SDR, transcrição, cortes, voz, rosto
src/coleta/         RSS e APIs de dados
src/agentes/        editor, redator, revisor e editor da newsletter (Claude)
src/video/          render do Reel
src/publicacao/     Telegram, Instagram, Beehiiv e upload do vídeo
src/fabrica.ts      o fluxo: produzir, aprovar, agendar, publicar
src/cli/            comandos do npm
deploy/             cron e serviço do bot
test/               testes (npm test)
```

O estado fica em `dados/` (um JSON por peça) e os vídeos em `saida/`. As duas pastas ficam fora do git.

## Próximos passos

- Narração por voz (TTS) nos vídeos.
- Publicação no TikTok e no LinkedIn.
- Loop de métricas: ler alcance e cliques de cada peça para o editor aprender quais temas trazem usuários para cada app.
