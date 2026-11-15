# Flagra (demo)

App de demonstração para o vídeo **"E se esse feed do GTA 6 fosse um app de verdade?"**.
É uma rede social de fotos e reels, no formato que todo mundo conhece (feed, stories, curtida,
comentário, repost, Reels), com um **Raio-X** que mostra o que cada toque faz por trás.

> Marca, nome e telas são próprios. O app não usa nome, logo, arte nem tela do jogo nem de
> nenhuma rede social existente; o GTA 6 aparece só no vídeo, como referência.

## Rodar

```bash
cd apps/flagra
npm install
npm run dev
```

Abre em `http://localhost:5173`. No computador o app aparece dentro de um celular (bom para gravar a tela);
no celular, na mesma rede, abra o endereço "Network" que o Vite mostra.

Para a "Legenda com IA" na tela de publicar, preencha `ANTHROPIC_API_KEY` no `.env` da raiz do repositório
(ou num `.env` em `apps/flagra/`). Sem a chave, o resto funciona.

Para recomeçar do zero: Raio-X → Seus sinais → **Zerar tudo**.

## Demo guiada: Duda e Rafa

Abra `http://localhost:5173/?demo` (ou Raio-X → Seus sinais → **Demo guiada**). Um cartão embaixo conduz
12 passos com o casal da demo, e cada passo mostra o que aconteceu "por trás". Avance com **Próximo**
(ou seta para a direita / espaço no computador), no seu ritmo de narração:

| # | Passo | O que acontece na tela |
|---|---|---|
| 1 | Conheça a Duda e o Rafa | o app volta ao estado inicial: você segue o Rafa, não segue a Duda |
| 2 | Stories | abre o 1º story da Duda (texto na foto) |
| 3 | Enquete | 2º story, voto em "Key West", porcentagens aparecem |
| 4 | Anel cinza | último story; fecha e a fileira rola até o anel dela, agora cinza e no fim da fila |
| 5 | Repost | Raio-X liga e o post da Duda aparece com "rafa.na.estrada repostou" e a nota aberta |
| 6 | Seguir | você passa a seguir a Duda |
| 7 | Curtida | coração do toque duplo na foto, contador +1 |
| 8 | Comentários | thread da Duda e do Rafa discutindo; você responde |
| 9 | Repostar | você reposta o post |
| 10 | Reels | abre o reel do Rafa e ele "bomba": curtidas, comentários e reposts subindo, nota junto |
| 11 | O feed se reorganiza | volta ao Início, recalcula: os posts da Duda vão para o topo |
| 12 | Fim | Raio-X ligado para explorar livre |

Duda e Rafa são personagens originais desta demo (avatares ilustrados em `public/midia/avatar-*.svg`).

## O que tem

| Tela | O que dá para mostrar |
|---|---|
| Início | stories (anel colorido = não visto), feed com curtida (toque duplo na foto), comentário, repost, enviar e salvar; posts que chegam por repost ("fulano repostou") |
| Comentários | respostas em thread, curtida em comentário, reações rápidas com emoji |
| Compartilhar | enviar para amigos, repostar, copiar link |
| Reels | vídeo vertical em tela cheia, toque duplo curte, toque simples pausa; o tempo assistido vira sinal |
| Explorar | grade ordenada pelo seu interesse nos temas, com busca |
| Perfil | posts, reels, reposts e salvos (os dois últimos só no seu) |
| Notificações | depois de publicar, as curtidas e um comentário chegam em poucos segundos |
| **Raio-X** (botão no topo) | nota de cada post (por que ele está naquela posição) e, a cada toque, os passos que o servidor faria |

## Como funciona (o que o Raio-X explica)

Tudo que importa para o vídeo está em `src/motor/`:

- **`tipos.ts`**: o modelo de dados. Cada tipo é uma tabela num app real: usuários, posts, comentários
  (com `respostaDe` para as threads), curtidas, reposts, stories, notificações.
- **`loja.tsx`**: as ações. Cada uma faz o que o back-end faria e registra os passos:
  - **curtida**: grava (você, post) com chave única → contador +1 → notifica o autor → sinal para o ranking
  - **comentário**: grava o texto (e a quem responde) → contador → notifica autor do post e do comentário → pesa 2×
  - **repost**: grava só a referência (o post não é copiado) → aparece no seu perfil → entra no feed dos seus
    seguidores com "voce repostou", mesmo de quem não segue o autor → pesa 3×
  - **salvar**: só você vê, ninguém é notificado, mas pesa 2× no ranking
  - **seguir**: muda a afinidade base do autor de 0,35 para 1
  - **reel assistido**: o app manda o tempo assistido; passar de 50% ou 90% soma interesse no tema
  - **publicar**: fan-out para os seguidores, e as primeiras reações decidem o alcance
- **`ranking.ts`**: a ordem do feed.
  `nota = afinidade × interesse × engajamento × frescor`
  - afinidade: seguir + quantas vezes você interagiu com a pessoa (via repost, vale 75%)
  - interesse: seu peso nos temas (#jacare, #capivara...) que cada interação soma
  - engajamento: curtidas + 2×comentários + 2×salvos + 3×reposts, em escala logarítmica
  - frescor: cai pela metade a cada 12 h
  - Reels usam outra conta: o tempo assistido pesa mais e quem você segue pesa menos.

O feed **não reordena enquanto você rola**: a nova ordem vale quando você toca em Início de novo
(ou no logo), como nos apps de verdade. No Raio-X dá para ver a nota mudar na hora e a posição só depois.

Os dados ficam no navegador (`localStorage` e IndexedDB para os arquivos que você publica). Num app real,
seria um banco (ex.: Postgres) + storage de arquivos + uma fila para o fan-out e as notificações.

## Fotos e vídeos

As fotos são Creative Commons (Flickr, via Openverse); autor e licença de cada uma estão em
`src/motor/creditos.json` e no app, em Perfil → **Créditos das fotos**. Os reels são essas fotos
animadas (zoom e pan) com ffmpeg. Pessoas e histórias são fictícias.

Para usar clipes de verdade, coloque o vídeo vertical em `public/midia/` e troque `midia.url` do reel em
`src/motor/dados.ts`.
