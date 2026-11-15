const compacto = new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 });
export const numero = (n: number) => compacto.format(n);

export function tempo(min: number) {
  if (min < 1) return "agora";
  if (min < 60) return `${min} min`;
  if (min < 60 * 24) return `${Math.floor(min / 60)} h`;
  return `${Math.floor(min / (60 * 24))} d`;
}

/** Cor de avatar estável a partir do @. */
export function corDe(nome: string) {
  let h = 0;
  for (const c of nome) h = (h * 31 + c.charCodeAt(0)) % 360;
  return `hsl(${h} 80% 55%)`;
}

/** Reduz uma foto (ou um quadro do vídeo) para JPEG de até `lado` px, em base64, para mandar à IA. */
export async function quadroDe(arquivo: File, lado = 768): Promise<string> {
  const url = URL.createObjectURL(arquivo);
  try {
    let fonte: CanvasImageSource;
    let w: number;
    let h: number;
    if (arquivo.type.startsWith("video")) {
      const v = document.createElement("video");
      v.muted = true;
      v.playsInline = true;
      v.preload = "auto";
      v.src = url;
      await new Promise<void>((ok, erro) => {
        v.onloadedmetadata = () => {
          v.currentTime = Math.min(1, (v.duration || 2) / 2);
        };
        v.onseeked = () => ok();
        v.onerror = () => erro(new Error("Não deu para ler o vídeo"));
      });
      fonte = v;
      w = v.videoWidth;
      h = v.videoHeight;
    } else {
      const img = new Image();
      img.src = url;
      await img.decode();
      fonte = img;
      w = img.naturalWidth;
      h = img.naturalHeight;
    }
    const k = Math.min(1, lado / Math.max(w, h));
    const c = document.createElement("canvas");
    c.width = Math.round(w * k);
    c.height = Math.round(h * k);
    c.getContext("2d")!.drawImage(fonte, 0, 0, c.width, c.height);
    return c.toDataURL("image/jpeg", 0.82).split(",")[1];
  } finally {
    URL.revokeObjectURL(url);
  }
}
