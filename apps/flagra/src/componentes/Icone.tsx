import React from "react";

const P: Record<string, React.ReactNode> = {
  coracao: <path d="M12 21s-7.5-4.6-9.6-9.3C.9 8.2 3 4.5 6.6 4.5c2.1 0 3.5 1.1 4.4 2.5.9-1.4 2.3-2.5 4.4-2.5 3.6 0 5.7 3.7 4.2 7.2C19.5 16.4 12 21 12 21z" />,
  balao: <path d="M4 3.5h16A1.5 1.5 0 0 1 21.5 5v10.5A1.5 1.5 0 0 1 20 17h-8.5L6 21.5V17H4a1.5 1.5 0 0 1-1.5-1.5V5A1.5 1.5 0 0 1 4 3.5z" />,
  enviar: <path d="M21 3 3 10.5l7 2.5 2.5 7L21 3zM10 13l5-5" fill="none" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />,
  salvar: <path d="M6 3h12v18l-6-4.5L6 21z" />,
  casa: <path d="M3 11 12 3l9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />,
  lupa: <><circle cx="11" cy="11" r="6.5" fill="none" strokeWidth={2.2} /><path d="m16 16 4.5 4.5" strokeWidth={2.4} strokeLinecap="round" /></>,
  sino: <path d="M12 3a6 6 0 0 1 6 6v4l2 3H4l2-3V9a6 6 0 0 1 6-6zm-2.5 15h5a2.5 2.5 0 0 1-5 0z" />,
  pessoa: <><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7z" /></>,
  mais: <path d="M12 5v14M5 12h14" strokeWidth={2.6} strokeLinecap="round" />,
  pino: <path d="M12 2a7 7 0 0 1 7 7c0 5-7 13-7 13S5 14 5 9a7 7 0 0 1 7-7zm0 4.5A2.5 2.5 0 1 0 12 11.5 2.5 2.5 0 0 0 12 6.5z" fillRule="evenodd" />,
  nota: <path d="M9 18V6l11-2v12M9 18a3 3 0 1 1-3-3 3 3 0 0 1 3 3zm11-2a3 3 0 1 1-3-3 3 3 0 0 1 3 3z" fill="none" strokeWidth={2} />,
  fechar: <path d="M6 6l12 12M18 6 6 18" strokeWidth={2.4} strokeLinecap="round" />,
  brilho: <path d="M12 2l1.8 5.4L19 9l-5.2 1.6L12 16l-1.8-5.4L5 9l5.2-1.6zM19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9z" />,
  verificado: <path d="M12 1.5l2.6 1.9 3.2-.1 1 3 2.6 1.9-1 3.1 1 3.1-2.6 1.9-1 3-3.2-.1L12 22.5l-2.6-1.9-3.2.1-1-3L2.6 15.8l1-3.1-1-3.1 2.6-1.9 1-3 3.2.1zM7.5 12.2l3 3 6-6" fillRule="evenodd" />,
  som: <path d="M4 9h4l5-4v14l-5-4H4zM16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" strokeWidth={2} strokeLinecap="round" />,
  mudo: <path d="M4 9h4l5-4v14l-5-4H4zM16.5 9.5l5 5M21.5 9.5l-5 5" fill="none" strokeWidth={2} strokeLinecap="round" />,
  camera: <><path d="M4 7h3l2-2.5h6L17 7h3a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1z" /><circle cx="12" cy="13" r="3.6" fill="#000" /></>,
};

export function Icone({ nome, tam = 26, cor = "currentColor", className }: { nome: string; tam?: number; cor?: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={tam} height={tam} fill={cor} stroke={cor} strokeWidth={0} className={className} aria-hidden>
      {P[nome]}
    </svg>
  );
}
