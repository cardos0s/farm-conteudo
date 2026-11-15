# Flagra (demo)

App de demonstração para o vídeo **"E se esse feed do GTA 6 fosse um app de verdade?"**.
É um feed vertical de flagras da vida real (bicho onde não devia, perseguição de carrinho de golfe…)
em que a IA escreve a manchete de tabloide de cada post.

> Marca, nome, telas e conteúdo são próprios. O app não usa nome, logo, arte nem tela do jogo;
> o GTA 6 aparece só no vídeo, como referência ao hype.

## Rodar

```bash
cd apps/flagra
npm install
npm run dev
```

Abre em `http://localhost:5173`. No computador o app aparece dentro de um celular (bom para gravar a tela);
no celular, na mesma rede, abra o endereço "Network" que o Vite mostra e use "Adicionar à tela de início".

Para a legenda com IA funcionar, preencha `ANTHROPIC_API_KEY` no `.env` da raiz do repositório
(o mesmo da fábrica) ou num `.env` dentro de `apps/flagra/`. Sem a chave, o resto do app funciona
e o botão avisa que a IA está desligada.

## O que tem

| Tela | O que faz |
|---|---|
| Feed | rolagem que encaixa um post por vez; vídeo toca só quando está na tela; toque duplo curte (coração no ponto do toque); toque simples pausa |
| Ações | curtir, comentar (folha de comentários), salvar, compartilhar (menu nativo do celular ou copia o link), som liga/desliga |
| Abas | Seguindo · Pra você · Perto |
| Novo flagra (+) | grava ou escolhe vídeo/foto, conta o que aconteceu, e a IA escreve manchete, legenda e hashtags; tudo editável antes de postar |

## Como funciona (para explicar no vídeo)

```
celular ──(descrição + 1 quadro da mídia, JPEG 768px)──▶ /api/legenda ──▶ Claude ──▶ { manchete, legenda, hashtags }
   │
   └─ post salvo no IndexedDB do aparelho (a mídia fica como arquivo, sobrevive a recarregar)
```

- **Front-end**: React + Vite, sem biblioteca de UI. `src/componentes/PostCard.tsx` é o post em tela cheia,
  `Criar.tsx` a tela de novo flagra, `Comentarios.tsx` a folha de comentários.
- **Quadro do vídeo**: antes de mandar para a IA, o navegador pega um quadro do vídeo (ou reduz a foto)
  num `<canvas>` (`quadroDe` em `src/util.ts`). Só esse JPEG pequeno sai do aparelho.
- **IA**: `server/legenda.ts` chama o Claude com saída estruturada (schema Zod), então a resposta já vem
  como `{ manchete, legenda, hashtags }`, sem precisar interpretar texto. O tom e os limites
  (não inventar nomes nem números, nada cruel) ficam no prompt de sistema.
- **Servidor**: a rota `/api/legenda` roda dentro do próprio Vite (`vite.config.ts`), então a chave
  nunca vai para o navegador. Para publicar de verdade, a mesma função vira uma serverless function.
- **Posts de exemplo**: `src/dados.ts`. Sem mídia, o post mostra uma "gravação" estilizada (gradiente,
  emoji, REC e mira de câmera).

## Trocar as cenas por clipes

Coloque o vídeo vertical em `public/clipes/` e preencha `midia` no post em `src/dados.ts`:

```ts
midia: { url: "/clipes/jacare.mp4", tipo: "video" },
```

Os clipes ficam fora do git (só a pasta vai para o repositório).
