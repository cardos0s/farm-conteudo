# Fábrica de conteúdo

Posta Reels e carrosséis no Instagram nos horários certos, todos os dias. Também sabe produzir o conteúdo sozinho com o Claude, mas essa parte está desligada: hoje o conteúdo vem pronto.

> **Agora: só o Rebanho, com conteúdo pronto.** Cockpit e Focca continuam configurados, mas pausados (`ativa: false`). A produção automática com o Claude está desligada no `deploy/crontab.txt`.

## Postar o seu conteúdo pronto

### Horários (todo dia, inclusive fim de semana)

| 12:00 | 19:00 |
|---|---|
| 🎬 Reel | 🖼 Carrossel |

Um de cada por dia: a conta está começando e cresce de forma orgânica. Para mudar, edite `HORARIOS` em `src/core/agenda.ts` (uma lista para cada formato; mais horários na lista = mais posts por dia).

### Onde colocar os arquivos

```
entrada/rebanho/
├── reels/
│   ├── 01-pasto-na-seca.mp4      o vídeo (MP4 ou MOV)
│   ├── 01-pasto-na-seca.txt      a legenda, com o mesmo nome do vídeo
│   ├── 02-pesagem.mp4
│   └── 02-pesagem.txt
└── carrosseis/
    └── 01-chuva-da-semana/       uma pasta por carrossel
        ├── 1.jpg                 de 2 a 20 imagens (JPG, PNG ou WebP), na ordem do nome
        ├── 2.jpg
        ├── 3.jpg
        └── legenda.txt
```

- **A ordem de postagem segue o número no começo do nome**: 01, 02, 03... (o 2 vem antes do 10).
- **A cada minuto** o bot olha a pasta. Cada item novo entra no próximo horário livre do formato dele e sai da pasta de entrada. No Telegram chega a confirmação com o dia e a hora, e um botão **❌ Cancelar post**.
- Pode carregar vários dias ou semanas de uma vez: 35 Reels enchem os Reels dos próximos 35 dias.
- Ele espera o arquivo ficar 2 minutos sem mudar antes de pegar, para não postar um vídeo que ainda está sendo copiado.
- No horário, publica e avisa no Telegram com o link do post.

### O que o Instagram recusa (e a fábrica separa antes)

O que não passar vai para `entrada/rebanho/com-problema/`, junto com um arquivo `.problema.txt` explicando o motivo, e você recebe um aviso no Telegram. Corrija e coloque de volta na pasta certa.

- Carrossel com menos de 2 ou mais de 20 imagens.
- Imagem fora da proporção que o Instagram aceita, de 4:5 (1080×1350, retrato) a 1,91:1 (paisagem). Imagem de Stories (9:16) não serve para carrossel.
- Legenda com mais de 2.200 caracteres ou mais de 30 hashtags.

PNG e WebP são convertidos para JPEG automaticamente (a API do Instagram só aceita JPEG). Reel sem `.txt` vai sem legenda, e o aviso no Telegram destaca isso.

### Acompanhar e cancelar

- `/status` no bot: o que já foi ao ar nos últimos 7 dias e os próximos 10 posts.
- **❌ Cancelar post** na mensagem de confirmação tira o post da agenda e libera o horário. O horário vago não é preenchido de novo: os seguintes não andam para a frente.
- `/publicar`: confere a pasta e publica agora o que já passou do horário.
- Sem Telegram: `npm run status` mostra a agenda e `tail -f dados/publicar.log`, o que o robô fez.
- **Um post falhou** (o registro ou o `npm run status` mostram "com erro")? Corrija a causa (token, permissão) e rode `npm run tentar-de-novo`: os posts com erro saem na próxima rodada, sem mudar o dia dos outros.

### O que precisa estar configurado

No `.env` (passo a passo em [Como pegar cada credencial](#como-pegar-cada-credencial)):

- **Só Reels**: basta `IG_REBANHO_TOKEN`. O vídeo vai direto do computador para o Instagram, sem nada externo.
- **Carrosséis**: também o bucket público (`S3_*`). A API do Instagram só aceita imagens por link público, sem upload direto. Sem bucket, os carrosséis vão para `com-problema/` com essa explicação.
- **Telegram** (opcional): confirmações, alertas e botão de cancelar.

O servidor precisa estar no fuso de Brasília (`TZ=America/Sao_Paulo`, já definido no serviço do bot), senão os horários saem deslocados.

---

## Produção automática com o Claude (desligada)

A fábrica também consegue coletar notícias, escrever, revisar e renderizar Reels e carrosséis sozinha, para os três apps:

| Vertical | App | Newsletter | Elemento visual |
|---|---|---|---|
| Automobilismo e F1 | **Cockpit** | Box Box (terça) | zebra de pista correndo na base |
| Pecuária e agro | **Rebanho** | Porteira (segunda) | cerca que se estende pela tela |
| Estudos (vestibular, ENEM, concursos, faculdade) | **Focca** | Foco Total (domingo) | anel de Pomodoro que fecha até o fim do vídeo |

O conteúdo nas redes leva o público para a newsletter gratuita, e a newsletter apresenta o app para quem já confia na marca.

### Como funciona o dia

```
06:00  coleta ─▶ editor ─▶ redator ─▶ revisor ─▶ render (Remotion) ─▶ Telegram ─▶ agenda ─▶ Instagram
                    │                    │
                    │      reprovou? reescreve 1 vez; reprovou de novo? descarta e avisa
                    └─ escolhe as pautas de Reel e de carrossel de cada app
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

As peças aprovadas entram nos mesmos horários do conteúdo pronto (a agenda é uma só). O volume por app fica em `volume.reelsPorDia` e `volume.carrosseisPorDia`; para ligar, tire o `#` da linha do `npm run diario` no `deploy/crontab.txt`.

**A fila se equilibra sozinha.** A produção das 06:00 desconta o que já está na fila: se a meta é 3 Reels e 2 já estão agendados, ela produz só 1. O que ninguém aprovar em 20 horas expira, porque a produção seguinte já traz pautas mais novas. Assim a agenda nunca escorrega para dias cada vez mais longe.

**Cancelar um post agendado**: toque no ❌ da própria peça no Telegram, mesmo depois de aprovada. O horário fica livre.

Uma vez por semana, cada vertical monta a newsletter com o que foi aprovado na semana, com o app apresentado no final. Ela também passa pelo Telegram antes de sair pelo Beehiiv.

Qualquer erro chega como alerta no Telegram. Uma vertical com problema não para as outras.

#### Cenas disponíveis nos vídeos

`abertura` · `noticia` (card com fonte) · `grafico` (barras animadas) · `ranking` · `contagem` (número grande de dias) · `encerramento` (chamada para o app). O Cockpit usa só tipografia, gráficos e dados, sem imagem ou vídeo oficial da F1.

#### Slides disponíveis nos carrosséis

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

Preencha o `.env`. Para postar Reels do Rebanho, só o token do Instagram é obrigatório. O bucket público só é preciso para carrosséis, e o Telegram é opcional. O resto (Claude, Beehiiv, Cockpit, Focca) pode ficar vazio.

#### Como pegar cada credencial

**1. Token do Instagram → `IG_REBANHO_TOKEN`**

O caminho é a **API do Instagram com login unificado**, que é o que a Meta recomenda. Ele não precisa de página do Facebook, e o token pode **nunca vencer**. Antes, a conta do Rebanho precisa ser **profissional** (no app do Instagram: Configurações → Tipo de conta e ferramentas → Mudar para conta profissional; empresa ou criador de conteúdo, tanto faz).

1. Em [developers.facebook.com](https://developers.facebook.com), **Meus apps → Criar app**, com o caso de uso **"Gerenciar mensagens e conteúdo no Instagram"**. O app precisa pertencer a um **portfólio empresarial**: sem isso, a opção do passo 2 não aparece.
2. No app: **Casos de uso → Gerenciar mensagens e conteúdo no Instagram → Personalizar → API setup with Unified login**.
3. Em **Configure seu app**, clique em **Criar nova configuração** e depois em **Usar esta configuração**. Confira na prévia que **Expiração** está como **Nunca** e que a permissão `instagram_content_publish` está na lista. A URL de redirecionamento só serve para quando outras pessoas conectam contas ao app. Se o painel exigir uma para continuar, qualquer endereço HTTPS seu serve.
4. Em **Gerar tokens de acesso**, clique em **Adicionar conta** e convide o Instagram do Rebanho como **testador do Instagram**.
5. Aceite o convite no **Instagram pelo navegador** (instagram.com): **Configurações → Permissões do site → Apps e sites → Convites de testador**. A conta aparece na tabela do painel depois de aceita.
6. Clique em **Gerar token** ao lado da conta, faça o login e autorize. **Copie o token na hora: ele aparece uma vez só.** Cole em `IG_REBANHO_TOKEN`.

O ID da conta é descoberto pelo token (`IG_REBANHO_USER_ID` pode ficar vazio, a não ser que o token dê acesso a mais de uma conta). Para publicar na sua própria conta, o app pode continuar **não publicado** e não precisa da revisão da Meta: o acesso padrão basta para quem tem função no app.

O token para de funcionar se o app for removido do portfólio ou se a conta do Instagram mudar de portfólio. Nesse caso chega um alerta no Telegram quando um post falhar; é só gerar outro no mesmo lugar.

> **Se o app e a conta do Instagram estão em portfólios empresariais diferentes**, o login unificado não acha a conta (`npm run diagnostico` mostra a lista de contas vazia). Foi o caso do Rebanho. O que funcionou foi o **login do Facebook com token de Página**: a conta ligada a uma Página do Facebook; um token de usuário de longa duração do app com `instagram_basic`, `instagram_content_publish`, `pages_show_list` e `pages_read_engagement` (e `ads_management` + `ads_read` se a Página estiver num portfólio); e, a partir dele, o token da Página em `me/accounts`, que não vence. No `.env`: `IG_GRAPH_HOST=graph.facebook.com`, `IG_REBANHO_USER_ID` com o número da conta e `IG_REBANHO_TOKEN` com o token da Página. O `npm run checar` testa a permissão de publicar criando um rascunho que nunca vai ao ar.
>
> Outros caminhos também funcionam: **login do Instagram** (`IG_GRAPH_HOST=graph.instagram.com`, token de 60 dias que o bot renova sozinho a cada 7) e **login do Facebook**, que é legado (`graph.facebook.com` com `IG_REBANHO_USER_ID` e a conta ligada a uma página).

**2. Bucket público → `S3_*` (só para carrosséis)**

Os Reels vão direto do computador (upload retomável do login unificado). Já as imagens a API do Instagram só aceita por link público: o servidor da Meta baixa cada imagem. O Cloudflare R2 é o mais barato para isso (não cobra pela saída).

1. Crie uma conta em [dash.cloudflare.com](https://dash.cloudflare.com) e abra **R2**. Ativar o R2 pede um cartão, mas o uso de um perfil fica dentro da cota gratuita.
2. **Criar bucket**, com o nome `fabrica-conteudo` → `S3_BUCKET`.
3. No bucket, em **Configurações → Acesso público**, ative o **domínio r2.dev**. O endereço que aparecer (`https://pub-....r2.dev`) vai em `S3_PUBLIC_URL`.
4. Volte ao R2 e abra **Gerenciar tokens de API → Criar token de API**, com permissão **Leitura e gravação de objeto**. Ele mostra uma vez só o **ID da chave de acesso** → `S3_ACCESS_KEY_ID` e a **chave de acesso secreta** → `S3_SECRET_ACCESS_KEY`.
5. O **ID da conta** aparece na página do R2. Ele entra em `S3_ENDPOINT=https://<id-da-conta>.r2.cloudflarestorage.com`.

**3. Bot do Telegram → `TELEGRAM_*`**

1. No Telegram, abra o **@BotFather**, mande `/newbot` e escolha um nome. Ele responde com o token → `TELEGRAM_BOT_TOKEN`.
2. Abra o **@userinfobot** e mande qualquer mensagem. O número em "Id" → `TELEGRAM_CHAT_ID`.
3. Abra o seu bot novo e toque em **Começar**, senão ele não consegue mandar mensagem para você.

**Para a produção automática (desligada hoje)**

| O quê | Onde conseguir |
|---|---|
| `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com) |
| `BEEHIIV_API_KEY` e `BEEHIIV_<APP>_PUB_ID` | Beehiiv → Settings → API |

```bash
npm run checar
```

Testa de verdade o que é preciso para postar: busca a conta do Instagram pelo token (se aparecer o @ do Rebanho, o token está certo) e envia um arquivo de teste ao bucket, conferindo se o link público abre. O Telegram aparece como opcional. Com `npm run checar -- --tudo`, confere também o Claude, o Beehiiv e os feeds RSS da produção automática.

Nada é obrigatório para começar: sem Instagram, o bot avisa na hora de postar para você publicar manualmente; sem Beehiiv, ele manda o HTML pronto da newsletter para colar no editor.

### Teste manual do conteúdo pronto

Coloque um Reel com a legenda em `entrada/rebanho/reels/` e rode o bot:

```bash
npm run bot
```

Em até 3 minutos chega no Telegram a confirmação com o horário. `/status` mostra a agenda.

### Teste manual da produção automática

```bash
npm run diario
```

Sem nomes, roda os apps ativos (hoje, só o Rebanho). Para rodar um app pausado só para testar, passe o nome: `npm run diario focca`. Aprove os Reels e carrosséis no Telegram (um a um ou com `/aprovar_tudo`).

```bash
npm run newsletter rebanho -- --agora
```

## Deixar rodando sozinho no Mac

Sem servidor e sem Telegram: o próprio Mac roda o robô a cada minuto, mesmo com o Terminal fechado, e ele volta sozinho quando o Mac reinicia.

```bash
bash deploy/mac/instalar.sh
```

- **Agenda**: `npm run status` mostra o que já foi ao ar e os próximos posts.
- **Registro**: `tail -f dados/publicar.log` mostra o que ele fez (agendou, publicou, erros). Ele só escreve quando algo acontece.
- **Parar**: `bash deploy/mac/desinstalar.sh`. A agenda e os arquivos continuam onde estão.
- **O Mac precisa estar acordado nos horários.** Com ele dormindo ou desligado, nada sai; um post atrasado sai assim que o Mac acordar. Para não dormir na tomada: Ajustes do Sistema → Bateria (ou Economia de Energia) → Opções → "Impedir repouso automático no adaptador quando a tela estiver desligada".
- Deixe o projeto fora de Documentos, Mesa e Downloads (por exemplo, em `~/farm-conteudo`): o macOS costuma bloquear robôs nessas pastas.

## Deixar rodando sozinho num servidor

Num servidor pequeno com pelo menos 2 GB de RAM (nos testes, cada vídeo levou menos de 1 minuto para renderizar e cada carrossel, poucos segundos):

1. Copie o projeto para `/opt/fabrica-conteudo`, rode `npm install` e preencha o `.env`.
2. Escolha um dos dois jeitos de deixar o robô rodando (nunca os dois juntos):
   - **Com Telegram** (confirmações, alertas, botão de cancelar e `/status`): instale o serviço do bot, que confere a pasta `entrada/` a cada minuto e publica no horário.
     ```bash
     sudo cp deploy/fabrica-bot.service /etc/systemd/system/ && sudo systemctl enable --now fabrica-bot
     ```
   - **Sem Telegram**: adicione com `crontab -e` a linha do `npm run publicar` que está em `deploy/crontab.txt`. Ela faz o mesmo a cada minuto; avisos e erros ficam em `dados/publicar.log`.
3. A produção automática com o Claude continua desligada; para ligar, veja `deploy/crontab.txt`.
4. Para colocar os arquivos na pasta `entrada/` do servidor, use o que for mais prático: `scp`/SFTP (FileZilla), ou uma pasta sincronizada do Google Drive ou Dropbox apontada para `entrada/` (com `rclone`, por exemplo).

Se o Remotion não conseguir baixar o navegador dele no servidor, instale o Chromium e aponte `REMOTION_CHROME` para o executável.

## Ajustes comuns

- **Ligar ou pausar um app**: `ativa: true` ou `false` no arquivo dele em `verticais/`. O bot só lê a pasta de entrada dos ativos e o cron só produz para eles; um pausado continua rodando se você pedir pelo nome. Ao ligar, preencha o `IG_<APP>_*` dele no `.env`.
- **Volume da produção automática**: `volume.reelsPorDia` e `volume.carrosseisPorDia` em cada arquivo de `verticais/`. Cada peça custa de 2 a 4 chamadas ao Claude (redator, revisor e, se reprovar, reescrita e nova revisão). Deixe o volume igual ao número de horários do formato em `HORARIOS`.
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
src/entrada.ts      conteúdo pronto: lê entrada/, valida, converte imagens e agenda
src/fabrica.ts      o fluxo: produzir, aprovar, agendar, publicar
src/cli/            comandos do npm
deploy/             cron e serviço do bot
test/               testes (npm test)
```

O estado fica em `dados/` (um JSON por peça), os vídeos e imagens em `saida/` (o conteúdo pronto já agendado vai para `saida/importados/`) e a pasta de entrada em `entrada/`. As três ficam fora do git.

## Próximos passos

- Narração por voz (TTS) nos vídeos.
- Publicação no TikTok: os Reels viram vídeos e os carrosséis viram posts de foto pela Content Posting API (o app precisa passar pela auditoria do TikTok para publicar como público). Depois, LinkedIn.
- Loop de métricas: ler alcance e cliques de cada peça para o editor aprender quais temas trazem usuários para cada app.
