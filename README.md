# Fábrica de conteúdo

Um motor só que produz conteúdo todos os dias para três apps, cada um com a própria marca. Cada app ativo recebe **5 Reels e 5 carrosséis por dia, todos os dias da semana**, no Instagram.

> **Agora só o Rebanho está ativo.** Cockpit e Focca continuam configurados, mas pausados (`ativa: false`): o cron não produz para eles. Para ligar um deles, veja [Ligar ou pausar um app](#ajustes-comuns).

| Vertical | App | Newsletter | Elemento visual |
|---|---|---|---|
| Automobilismo e F1 | **Cockpit** | Box Box (terça) | zebra de pista correndo na base |
| Pecuária e agro | **Rebanho** | Porteira (segunda) | cerca que se estende pela tela |
| Estudos (vestibular, ENEM, concursos, faculdade) | **Focca** | Foco Total (domingo) | anel de Pomodoro que fecha até o fim do vídeo |

O conteúdo nas redes leva o público para a newsletter gratuita, e a newsletter apresenta o app para quem já confia na marca.

## Como funciona o dia

```
06:00  coleta ─▶ editor ─▶ redator ─▶ revisor ─▶ render (Remotion) ─▶ Telegram ─▶ agenda ─▶ Instagram
                    │                    │
                    │      reprovou? reescreve 1 vez; reprovou de novo? descarta e avisa
                    └─ escolhe 5 pautas de Reel e 5 de carrossel por app
```

1. **Coleta**: notícias dos feeds RSS de cada nicho (últimas 48 h, sem repetir o que já virou vídeo) e dados de APIs abertas:
   - Cockpit: classificação, último resultado e próxima corrida pela [API Jolpica](https://api.jolpi.ca/ergast/) (sucessora da Ergast).
   - Rebanho: chuva e temperatura dos próximos 7 dias nas praças pecuárias pelo [Open-Meteo](https://open-meteo.com).
   - Focca: contagem regressiva das provas cadastradas em `verticais/focca.ts`.
2. **Editor** (Claude) escolhe as pautas do dia e o formato de cada uma: Reel para novidade e gancho forte, carrossel para explicar, comparar e listar (o post que a pessoa salva). Evita temas das últimas duas semanas e, se o material do dia não render pautas boas para completar a meta, entrega menos em vez de repetir assunto.
3. **Redator** (Claude) escreve o roteiro em cenas (Reel) ou os slides (carrossel), a legenda e o bloco da newsletter, usando só fatos do material.
4. **Revisor** (Claude) confere cada número, nome e data contra o material de origem e as regras da marca.
5. **Render**: o Remotion transforma o roteiro em um Reel vertical 1080×1920, ou cada slide em uma imagem 1080×1350 (4:5, o formato que ocupa mais tela no feed), com a identidade da marca. As três marcas produzem em paralelo; o render roda um por vez para caber num servidor pequeno.
6. **Aprovação**: os Reels chegam no seu Telegram como vídeo e os carrosséis como álbum, cada um com **✅ Aprovar** e **❌ Rejeitar**. Para aprovar tudo de uma vez, mande `/aprovar_tudo`.
7. **Publicação**: o que você aprovar vai para o Instagram do app no próximo horário livre do formato dele.

### Agenda do dia (por app)

| Horário | 09:00 | 10:30 | 12:00 | 13:30 | 15:00 | 16:30 | 18:00 | 19:30 | 21:00 | 22:00 |
|---|---|---|---|---|---|---|---|---|---|---|
| Formato | 🎬 Reel | 🖼 Carrossel | 🎬 Reel | 🖼 Carrossel | 🎬 Reel | 🖼 Carrossel | 🎬 Reel | 🖼 Carrossel | 🎬 Reel | 🖼 Carrossel |

São 10 posts por dia em cada conta, bem abaixo do limite de posts por dia da API do Instagram (um carrossel conta como um post só).

**A fila se equilibra sozinha.** A produção das 06:00 desconta o que já está na fila: se ontem você aprovou tarde e 2 Reels ficaram agendados para hoje, a fábrica produz só 3 Reels novos. O que ninguém aprovar em 20 horas expira, porque a produção seguinte já traz pautas mais novas. Assim a agenda nunca escorrega para dias cada vez mais longe.

**Cancelar um post agendado**: toque no ❌ da própria peça no Telegram, mesmo depois de aprovada. O horário fica livre.

Uma vez por semana, cada vertical monta a newsletter com o que foi aprovado na semana, com o app apresentado no final. Ela também passa pelo Telegram antes de sair pelo Beehiiv.

Qualquer erro chega como alerta no Telegram. Uma vertical com problema não para as outras.

### Cenas disponíveis nos vídeos

`abertura` · `noticia` (card com fonte) · `grafico` (barras animadas) · `ranking` · `contagem` (número grande de dias) · `encerramento` (chamada para o app). O Cockpit usa só tipografia, gráficos e dados, sem imagem ou vídeo oficial da F1.

### Slides disponíveis nos carrosséis

`capa` (gancho + "arrasta para o lado") · `texto` · `lista` (3 a 5 itens numerados) · `numero` (um número grande em destaque) · `grafico` · `ranking` · `fechamento` (chamada para o app, na cor da marca). Cada carrossel tem de 5 a 8 slides, com o nome do app e a posição (3/7) no topo. O elemento da marca avança a cada slide: o anel do Pomodoro do Focca vai fechando, a cerca do Rebanho vai se estendendo e a zebra do Cockpit continua de uma imagem para a outra.

## Primeiros passos

Requisitos: Node 20 ou mais novo.

```bash
npm install
```

```bash
npm run estudio
```

Abre o editor do Remotion com o vídeo de exemplo do Focca (composição `Reel`) e a capa do carrossel de exemplo (composição `Slide`). Os exemplos das três marcas ficam em `remotion/exemplos.ts` (`exemplos` para Reels, `exemplosCarrossel` para carrosséis); para ver outra marca no estúdio, troque `focca` por `cockpit` ou `rebanho` em `remotion/Root.tsx`.

```bash
npm run render:exemplo
```

Renderiza os Reels e os carrosséis de exemplo das três marcas em `saida/exemplos/`.

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
| `S3_*` | um bucket público (Cloudflare R2 é o mais barato). O Instagram baixa os vídeos e as imagens dos carrosséis dessa URL |
| `IG_<APP>_USER_ID` e `IG_<APP>_TOKEN` | conta profissional do Instagram ligada a uma página do Facebook, com um app na Meta for Developers e permissão `instagram_content_publish`. Use um token de longa duração |
| `BEEHIIV_API_KEY` e `BEEHIIV_<APP>_PUB_ID` | Beehiiv → Settings → API |

Para começar só com o Rebanho, basta `IG_REBANHO_USER_ID`, `IG_REBANHO_TOKEN` e `BEEHIIV_REBANHO_PUB_ID`; as variáveis do Cockpit e do Focca podem ficar vazias.

Depois revise os `TODO` em `verticais/`: descrição e link de cada app e o @ de cada perfil. **O @ aparece em todo vídeo e todo slide**, então confira o do Rebanho em `verticais/rebanho.ts` antes de publicar.

```bash
npm run checar
```

Mostra o que está configurado e testa cada feed RSS.

Nada é obrigatório para começar: sem Instagram, o bot avisa na hora de postar para você publicar manualmente; sem Beehiiv, ele manda o HTML pronto da newsletter para colar no editor.

### Teste manual

```bash
npm run diario
```

Sem nomes, roda os apps ativos (hoje, só o Rebanho). Para rodar um app pausado só para testar, passe o nome: `npm run diario focca`.

```bash
npm run bot
```

Aprove os Reels e carrosséis no Telegram (um a um ou com `/aprovar_tudo`). No bot, `/status` mostra, por app e formato, o que está esperando, agendado e publicado, mais os próximos 10 posts da agenda.

Para testar com menos peças, baixe `reelsPorDia` e `carrosseisPorDia` da vertical para 1 antes de rodar.

```bash
npm run newsletter rebanho -- --agora
```

## Deixar rodando sozinho

Num servidor pequeno com pelo menos 2 GB de RAM (nos testes, cada vídeo levou menos de 1 minuto para renderizar e cada carrossel, poucos segundos):

1. Copie o projeto para `/opt/fabrica-conteudo`, rode `npm install` e preencha o `.env`.
2. Instale o serviço do bot, que fica ouvindo o Telegram e publica no horário:
   ```bash
   sudo cp deploy/fabrica-bot.service /etc/systemd/system/ && sudo systemctl enable --now fabrica-bot
   ```
3. Adicione as linhas de `deploy/crontab.txt` com `crontab -e`.

Se o Remotion não conseguir baixar o navegador dele no servidor, instale o Chromium e aponte `REMOTION_CHROME` para o executável.

## Ajustes comuns

- **Ligar ou pausar um app**: `ativa: true` ou `false` no arquivo dele em `verticais/`. O cron só roda os ativos; um pausado continua rodando se você pedir pelo nome. Ao ligar, preencha o `IG_<APP>_*` dele no `.env`.
- **Volume**: `volume.reelsPorDia` e `volume.carrosseisPorDia` em cada arquivo de `verticais/` (padrão: 5 e 5). Cada peça custa de 2 a 4 chamadas ao Claude (redator, revisor e, se reprovar, reescrita e nova revisão), então 5 + 5 dá de 20 a 40 chamadas por dia por app ativo. Para mais de 5 de um formato por dia, acrescente horários em `HORARIOS`.
- **Aprovação automática**: `volume.aprovacao: "automatica"` faz o que passou no revisor entrar direto na agenda. No Telegram chega só um aviso com o horário e o botão **❌ Cancelar post**. Ligue só depois de algumas semanas aprovando à mão e confiando na qualidade.
- **Dia da newsletter**: `volume.diaNewsletter` (0 = domingo).
- **Horários de publicação**: `HORARIOS` em `src/core/agenda.ts`, uma lista para Reels e outra para carrosséis.
- **Tom e regras**: `tom` e `regras` em cada vertical entram nos prompts do redator e do revisor.
- **Fontes**: lista `fontes.rss`. Rode `npm run checar` depois de mudar. Alguns portais (Globo, Motorsport.com) bloquearam o leitor nos testes; se no seu servidor eles responderem, dá para adicionar.
- **Provas do Focca**: `fontes.provas`. Coloque só datas confirmadas em edital.
- **Nova vertical**: crie `verticais/<nome>.ts` com a mesma estrutura e adicione em `verticais/index.ts`.
- **Modelo do Claude**: `CLAUDE_MODEL` no `.env` (padrão `claude-opus-5-5`). Se o modelo recusar um pedido por política, a API refaz a chamada automaticamente num modelo de reserva.

## Estrutura

```
verticais/          uma configuração por app (fontes, tom, regras, cores, volume)
remotion/           templates de Reel (cenas) e de carrossel (slides), elemento de cada marca, fontes
src/coleta/         RSS e APIs de dados
src/agentes/        editor, redator, revisor e editor da newsletter (Claude)
src/video/          render do Reel (MP4) e dos slides do carrossel (JPEG)
src/publicacao/     Telegram, Instagram, Beehiiv e upload do vídeo
src/fabrica.ts      o fluxo: produzir, aprovar, agendar, publicar
src/cli/            comandos do npm
deploy/             cron e serviço do bot
test/               testes (npm test)
```

O estado fica em `dados/` (um JSON por peça) e os vídeos e imagens em `saida/`. As duas pastas ficam fora do git.

## Próximos passos

- Narração por voz (TTS) nos vídeos.
- Publicação no TikTok: os Reels viram vídeos e os carrosséis viram posts de foto pela Content Posting API (o app precisa passar pela auditoria do TikTok para publicar como público). Depois, LinkedIn.
- Loop de métricas: ler alcance e cliques de cada peça para o editor aprender quais temas trazem usuários para cada app.
