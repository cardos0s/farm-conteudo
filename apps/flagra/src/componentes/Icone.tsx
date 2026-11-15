import React from "react";

// Ícones em traço (outline), no padrão visual dos apps de foto. Desenhados aqui, sem biblioteca.
const L = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

const P: Record<string, React.ReactNode> = {
  coracao: <path {...L} d="M12 20.5s-8-4.9-8-11A4.5 4.5 0 0 1 12 6.8a4.5 4.5 0 0 1 8 2.7c0 6.1-8 11-8 11z" />,
  coracaoCheio: <path fill="currentColor" d="M12 20.5s-8-4.9-8-11A4.5 4.5 0 0 1 12 6.8a4.5 4.5 0 0 1 8 2.7c0 6.1-8 11-8 11z" />,
  comentario: <path {...L} d="M20.6 16.6A9 9 0 1 0 17 20l3.9 1-1-3.9a9 9 0 0 0 .7-.5z" />,
  repost: (
    <g {...L}>
      <path d="M17 2.5l3 3-3 3" />
      <path d="M4 11.5v-1a5 5 0 0 1 5-5h11" />
      <path d="M7 21.5l-3-3 3-3" />
      <path d="M20 12.5v1a5 5 0 0 1-5 5H4" />
    </g>
  ),
  enviar: (
    <g {...L}>
      <path d="M21.5 3 10 14" />
      <path d="M21.5 3 15 21l-5-7-7-5z" />
    </g>
  ),
  salvar: <path {...L} d="M19 21l-7-5.5L5 21V4a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1z" />,
  salvarCheio: <path fill="currentColor" stroke="currentColor" strokeWidth={2} strokeLinejoin="round" d="M19 21l-7-5.5L5 21V4a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1z" />,
  casa: <path {...L} d="M3.5 10.5 12 3l8.5 7.5V20a1 1 0 0 1-1 1H15v-6H9v6H4.5a1 1 0 0 1-1-1z" />,
  casaCheia: <path fill="currentColor" d="M3.5 10.5 12 3l8.5 7.5V20a1 1 0 0 1-1 1H15v-6H9v6H4.5a1 1 0 0 1-1-1z" />,
  lupa: (
    <g {...L}>
      <circle cx="10.5" cy="10.5" r="7" />
      <path d="M16 16l5 5" />
    </g>
  ),
  mais: (
    <g {...L}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <path d="M12 8v8M8 12h8" />
    </g>
  ),
  reels: (
    <g {...L}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <path d="M3 8.5h18M9 3l3 5.5M15 3l3 5.5" />
      <path d="M10 12v5l4.5-2.5z" fill="currentColor" />
    </g>
  ),
  pontos: (
    <g fill="currentColor">
      <circle cx="5" cy="12" r="1.6" />
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="19" cy="12" r="1.6" />
    </g>
  ),
  fechar: <path {...L} d="M5 5l14 14M19 5 5 19" />,
  voltar: <path {...L} d="M15 4l-8 8 8 8" />,
  camera: (
    <g {...L}>
      <path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" />
      <circle cx="12" cy="13.5" r="3.5" />
    </g>
  ),
  verificado: (
    <g>
      <path fill="#0095f6" d="M12 1.6l2.5 1.8 3.1-.1 1 2.9 2.5 1.9-1 3 1 3-2.5 1.8-1 3-3.1-.1L12 22.4l-2.5-1.8-3.1.1-1-2.9-2.5-1.9 1-3-1-3 2.5-1.8 1-3 3.1.1z" />
      <path d="M8 12.2l2.7 2.7L16.2 9.4" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </g>
  ),
  musica: <path {...L} d="M9 18V5l11-2v13M9 18a3 3 0 1 1-3-3 3 3 0 0 1 3 3zm11-2a3 3 0 1 1-3-3 3 3 0 0 1 3 3z" />,
  link: <path {...L} d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" />,
  raiox: (
    <g {...L}>
      <path d="M4 7V5a1 1 0 0 1 1-1h2M17 4h2a1 1 0 0 1 1 1v2M20 17v2a1 1 0 0 1-1 1h-2M7 20H5a1 1 0 0 1-1-1v-2" />
      <path d="M12 7v10M9 9.5h6M8.5 12.5h7M9.5 15.5h5" />
    </g>
  ),
  som: <path {...L} d="M4 9h4l5-4v14l-5-4H4zM16.5 8.5a5 5 0 0 1 0 7" />,
  mudo: <path {...L} d="M4 9h4l5-4v14l-5-4H4zM16.5 9.5l5 5M21.5 9.5l-5 5" />,
  grade: (
    <g {...L}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M9 3v18M15 3v18M3 9h18M3 15h18" />
    </g>
  ),
  pino: <path {...L} d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21zM12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z" />,
  brilho: <path fill="currentColor" d="M12 2l1.8 5.4L19 9l-5.2 1.6L12 16l-1.8-5.4L5 9l5.2-1.6zM19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9z" />,
  atualizar: <path {...L} d="M20 12a8 8 0 1 1-2.3-5.7M20 4v5h-5" />,
};

export function Icone({ nome, tam = 24, className, style }: { nome: string; tam?: number; className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 24 24" width={tam} height={tam} className={className} style={style} aria-hidden>
      {P[nome]}
    </svg>
  );
}
