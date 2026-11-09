import "@fontsource/poppins/400.css";
import "@fontsource/poppins/500.css";
import "@fontsource/poppins/600.css";
import "@fontsource/poppins/700.css";
import { continueRender, delayRender, staticFile } from "remotion";

// Identidade da Selloop nos vídeos do pack: cores do site e da plataforma, fonte e arquivos de marca.

export const FPS = 60;
export const W = 1920;
export const H = 1080;

export const cor = {
  /** Gradiente do site (--gradient-primary): de #00042d a #00adff. */
  noite: "#00042d",
  ciano: "#00adff",
  /** Cabeçalho e barra lateral da plataforma. */
  marinho: "#0f1660",
  /** Azul de destaque da plataforma (cartões e botões). */
  royal: "#2849db",
  azul: "#3b82f6",
  celeste: "#0ea5e9",
  verde: "#10b981",
  fundoApp: "#f7f8fb",
  tinta: "#081123",
  suave: "#90a1b9",
  branco: "#ffffff",
};

export const gradienteMarca = `linear-gradient(135deg, ${cor.noite} 0%, ${cor.ciano} 100%)`;
export const fonte = "'Poppins', 'Inter', 'Helvetica Neue', Arial, sans-serif";

export const marca = {
  logo: staticFile("selloop/marca/selloop-logo.png"),
  logoBranco: staticFile("selloop/marca/selloop-logo-branco.png"),
  icone: staticFile("selloop/marca/selloop-icone.png"),
};

/** Logos oficiais da Meta (pacotes da Brand Resource Center), usadas sem alteração. */
export const canais = {
  whatsapp: { src: staticFile("selloop/logos/whatsapp.svg"), nome: "WhatsApp" },
  instagram: { src: staticFile("selloop/logos/instagram.png"), nome: "Instagram" },
  messenger: { src: staticFile("selloop/logos/messenger.svg"), nome: "Messenger" },
} as const;
export type Canal = keyof typeof canais;

const espera = delayRender("Carregando a Poppins");
Promise.all(["400 1em Poppins", "500 1em Poppins", "600 1em Poppins", "700 1em Poppins"].map((f) => document.fonts.load(f, "Aáçõ1")))
  .catch((e) => console.error("Falha ao carregar a Poppins", e))
  .finally(() => continueRender(espera));
