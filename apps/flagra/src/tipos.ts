export type Comentario = { autor: string; texto: string; ha: number; curtidas: number };

export type Post = {
  id: string;
  autor: string;
  verificado?: boolean;
  /** Minutos desde a postagem. */
  ha: number;
  manchete: string;
  legenda: string;
  hashtags: string[];
  local: string;
  curtidas: number;
  comentarios: number;
  compartilhamentos: number;
  /** Vídeo ou foto. Sem mídia, o post mostra a "cena" (gradiente + emoji) do seed. */
  midia?: { url: string; tipo: "video" | "imagem" };
  cena?: { emoji: string; cores: [string, string, string] };
  seguindo?: boolean;
  meu?: boolean;
};
