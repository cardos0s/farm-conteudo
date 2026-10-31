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

## Vídeos UGC com personagem de IA

Além dos Reels de motion graphics, a fábrica faz vídeos no formato UGC: uma personagem fictícia fala para a câmera do celular apresentando o app, com legenda palavra a palavra, headline, zoom e efeitos sonoros, seguindo o formato de um perfil de referência.

```
briefing ─▶ roteirista ─▶ revisor ─▶ voz (ElevenLabs) ─▶ quadro da personagem (OpenRouter)
        ─▶ vídeo (Kling 3 pelo OpenRouter) ─▶ sincronia labial (fal) ─▶ render (Remotion) ─▶ Telegram
```

### 1. O formato: skill `decupar-perfil`

No Claude Code, peça algo como *"decupa os últimos 40 vídeos do perfil @fulana e cria o estilo `selfie-rapido`"*. A skill (`.claude/skills/decupar-perfil/`) baixa os vídeos, roda `npm run decupar` (cortes, tomadas, folhas de contato, gancho, ritmo de fala, silêncios, volume, cores) e o Claude lê as folhas quadro a quadro para escrever `estilos/<id>/estilo.json` e `estilos/<id>/guia.md`. Do perfil vem só a técnica de edição; os vídeos baixados não vão para o git.

`estilos/exemplo/` é um ponto de partida genérico para testar antes de decupar.

### 2. A personagem

1. Copie `personas/exemplo/` para `personas/<id>/` e descreva a aparência em `persona.json`. Ela precisa ser fictícia (`"ficticia": true`): não use rosto nem voz de pessoa real sem autorização.
2. `npm run persona <id>` gera as 3 folhas de personagem (frente/perfil, expressões, gravando com o celular). Se preferir, gere no ChatGPT e salve como `folha-1.png`, `folha-2.png`... e liste em `folha`.
3. Escolha uma voz na Voice Library ou crie uma no Voice Design do ElevenLabs e coloque o ID em `voz.vozId`.

### 3. A vertical

Em `verticais/<app>.ts`, preencha `ugc`: a persona, o estilo, os prints do app (`telas`, em `ativos/<app>/`) e os `fatos` verificados que a personagem pode citar. O revisor reprova qualquer número, resultado ou depoimento que não esteja nos fatos, e a personagem não conta experiência pessoal como se fosse real.

### 4. Gerar

```bash
npm run ugc focca -- --briefing "Mostrar como o Focca monta o cronograma a partir do edital" --so-roteiro
```

Manda só o roteiro revisado (sem gastar com voz e vídeo). Se gostar:

```bash
npm run ugc focca -- --continuar <id-que-veio-na-mensagem>
```

Sem `--so-roteiro`, faz tudo de uma vez. Para briefings longos, use `--briefing-arquivo briefings/x.md`. Tudo que já foi gerado fica em `saida/ugc/<id>/` e não é pago de novo ao continuar. O vídeo chega no Telegram com Aprovar/Rejeitar e segue a mesma fila de publicação dos Reels.

A legenda e o canto do vídeo levam "Personagem criada com IA".

Custos de referência: Kling 3 Standard a partir de US$ 0,126 por segundo gerado; um vídeo de 35 s com 8 blocos fica em torno de US$ 5 a 8 de vídeo, mais voz, imagens e sincronia labial. Comece com `--so-roteiro`.

Para conferir legenda, headline e zoom sem chamar nenhuma API: `npm run render:exemplo-ugc`.

## Ajustes comuns

- **Volume**: `volume.videosPorDia` em cada arquivo de `verticais/`. Comece com 1 e aumente quando a qualidade estiver boa.
- **Dia da newsletter**: `volume.diaNewsletter` (0 = domingo).
- **Horários de publicação**: `HORARIOS_PADRAO` em `src/core/agenda.ts`.
- **Tom e regras**: `tom` e `regras` em cada vertical entram nos prompts do redator e do revisor.
- **Fontes**: lista `fontes.rss`. Rode `npm run checar` depois de mudar. Alguns portais (Globo, Motorsport.com) bloquearam o leitor nos testes; se no seu servidor eles responderem, dá para adicionar.
- **Provas do Focca**: `fontes.provas`. Coloque só datas confirmadas em edital.
- **Nova vertical**: crie `verticais/<nome>.ts` com a mesma estrutura e adicione em `verticais/index.ts`.
- **Modelo do Claude**: `CLAUDE_MODEL` no `.env` (padrão `claude-opus-5-5`). Se o modelo recusar um pedido por política, a API refaz a chamada automaticamente num modelo de reserva.

## Estrutura

```
verticais/          uma configuração por app (fontes, tom, regras, cores, volume)
remotion/           templates de vídeo: cenas, elemento de cada marca, fontes
src/coleta/         RSS e APIs de dados
src/agentes/        editor, redator, revisor e editor da newsletter (Claude)
src/ugc/            vídeos UGC: formato, roteirista/revisor, voz, imagem, vídeo, lipsync
personas/           personagens fictícias (persona.json + folhas)
estilos/            guias de estilo decupados de perfis de referência
.claude/skills/     skill decupar-perfil
src/video/          render do Reel
src/publicacao/     Telegram, Instagram, Beehiiv e upload do vídeo
src/fabrica.ts      o fluxo: produzir, aprovar, agendar, publicar
src/cli/            comandos do npm
deploy/             cron e serviço do bot
test/               testes (npm test)
```

O estado fica em `dados/` (um JSON por peça) e os vídeos em `saida/`. As duas pastas ficam fora do git.

## Próximos passos

- Publicação no TikTok e no LinkedIn.
- Loop de métricas: ler alcance e cliques de cada peça para o editor aprender quais temas trazem usuários para cada app.
