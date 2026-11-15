// O modelo de dados de uma rede social de fotos e vídeos curtos.
// Num app real, cada tipo abaixo é uma tabela no banco.

export type Usuario = {
  id: string;
  nome: string;
  avatar?: string;
  verificado?: boolean;
  bio?: string;
  seguidores: number;
  seguindo: number;
};

export type Post = {
  id: string;
  autor: string;
  /** "post" aparece no feed; "reel" aparece na aba Reels (vídeo vertical em tela cheia). */
  tipo: "post" | "reel";
  midia: { tipo: "foto" | "video"; url: string; /** largura ÷ altura */ proporcao?: number };
  legenda: string;
  /** Temas do post. O ranking usa para medir o seu interesse. */
  tags: string[];
  local?: string;
  criadoEm: number;
  // Contadores "desnormalizados": o banco guarda o número pronto para não contar linha por linha a cada abertura.
  curtidas: number;
  comentarios: number;
  reposts: number;
  salvos: number;
  visualizacoes: number;
  audio?: string;
  meu?: boolean;
};

export type Comentario = {
  id: string;
  postId: string;
  autor: string;
  texto: string;
  criadoEm: number;
  curtidas: number;
  /** Resposta a outro comentário (thread de um nível, como nos apps grandes). */
  respostaDe?: string;
};

export type Repost = { postId: string; por: string; em: number };

export type Story = { id: string; autor: string; midia: string; criadoEm: number };

export type Notificacao = { id: string; de: string; tipo: "curtida" | "comentario" | "seguir" | "repost"; postId?: string; texto?: string; em: number };

/** Um registro do que aconteceu "por trás" de cada toque. É o que o Raio-X mostra. */
export type Evento = {
  id: string;
  em: number;
  icone: string;
  titulo: string;
  passos: string[];
};
