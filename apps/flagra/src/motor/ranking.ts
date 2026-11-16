import type { Post } from "./tipos";

// Como o feed decide a ordem. É uma versão didática do que os apps grandes fazem:
// cada post candidato ganha uma nota, e o feed mostra do maior para o menor.
//
//   nota = afinidade × interesse × engajamento × frescor
//
// - afinidade: o quanto você interage com quem postou (seguir conta, curtir e comentar contam mais)
// - interesse: o quanto você reage aos temas do post (jacaré, neon, praia...)
// - engajamento: o quanto o post está bombando com todo mundo (comentário e repost valem mais que curtida)
// - frescor: post novo vale mais; a nota cai pela metade a cada 12 horas

export type Sinais = {
  seguindo: Record<string, boolean>;
  afinidade: Record<string, number>;
  interesse: Record<string, number>;
};

export type Nota = {
  total: number;
  afinidade: number;
  interesse: number;
  engajamento: number;
  frescor: number;
  motivos: string[];
};

/** Peso de cada tipo de interação no engajamento. */
export const PESOS = { curtida: 1, comentario: 2, salvo: 2, repost: 3 } as const;

const MEIA_VIDA_H = 12;

export function pontuar(post: Post, sinais: Sinais, agora = Date.now(), via?: string): Nota {
  const motivos: string[] = [];

  // Afinidade: seguir dá a base; cada interação sua com o autor soma. Via repost, conta quem repostou.
  const pessoa = via ?? post.autor;
  const segue = !!sinais.seguindo[pessoa];
  // Repost chega "de segunda mão": vale 75% da afinidade com quem repostou.
  const afinidade = Math.min(2.5, (segue ? 1 : 0.35) + (sinais.afinidade[pessoa] ?? 0) * 0.15) * (via ? 0.75 : 1);
  if (via) motivos.push(`@${via} repostou`);
  else if (segue) motivos.push(`você segue @${post.autor}`);
  else motivos.push("sugestão: você não segue");
  if ((sinais.afinidade[pessoa] ?? 0) > 0) motivos.push(`você já interagiu ${sinais.afinidade[pessoa]}× com @${pessoa}`);

  // Interesse: soma do seu peso em cada tema do post.
  const pesoTemas = post.tags.reduce((s, t) => s + (sinais.interesse[t] ?? 0), 0);
  const interesse = Math.min(3, 1 + pesoTemas * 0.12);
  const favorito = [...post.tags].sort((a, b) => (sinais.interesse[b] ?? 0) - (sinais.interesse[a] ?? 0))[0];
  if (favorito && (sinais.interesse[favorito] ?? 0) > 0) motivos.push(`você reage a #${favorito}`);

  // Engajamento: interações ponderadas, em escala logarítmica (1 mil e 1 milhão não podem ter distância de 1000×).
  const interacoes = post.curtidas * PESOS.curtida + post.comentarios * PESOS.comentario + post.salvos * PESOS.salvo + post.reposts * PESOS.repost;
  const engajamento = 0.3 + Math.log10(1 + interacoes) / 7;
  if (interacoes > 100_000) motivos.push("está bombando");

  // Frescor: decaimento exponencial.
  const horas = Math.max(0, (agora - post.criadoEm) / 3_600_000);
  const frescor = Math.pow(0.5, horas / MEIA_VIDA_H);
  if (horas < 1) motivos.push("postado agora há pouco");

  return { total: afinidade * interesse * engajamento * frescor, afinidade, interesse, engajamento, frescor, motivos };
}

/** Reels: aqui o sinal mais forte é o tempo assistido, não quem você segue. */
export function pontuarReel(post: Post, sinais: Sinais, assistido: Record<string, number>, agora = Date.now()): Nota {
  const base = pontuar(post, sinais, agora);
  const jaViu = assistido[post.id] ?? 0;
  // Reel que você já viu inteiro desce; o resto é descoberta: afinidade pesa menos que nos posts.
  const repeticao = jaViu > 6 ? 0.4 : 1;
  const afinidade = 0.6 + base.afinidade * 0.4;
  return { ...base, afinidade, total: afinidade * base.interesse * base.engajamento * Math.sqrt(base.frescor) * repeticao };
}
