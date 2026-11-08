"""Monta o arquivo final de uma parte com intro gravada em HDR (HLG), com os pixels originais do iPhone.

    python3 materiais/whatsapp/hdr.py --parte 1

Por que: o vídeo da Julia é HDR (Dolby Vision 8.4 / HLG). Qualquer conversão para SDR muda a cor em
relação ao que o iPhone mostra. Aqui nada do vídeo dela é convertido: os gráficos (SDR) é que são
levados para HLG, com o branco no branco de referência do HLG (sinal 0,75 = 203 nits, BT.2408).

Entradas (geradas pelo npm run render:reels-whatsapp e pelo intro.py):
- saida/materiais/reels/.camadas/parteN-semIntro.mp4   o Reel com todo o áudio, sem a imagem da intro
- saida/materiais/reels/.camadas/parteN-introAtras.mov gráficos atrás dela (ProRes 4444, transparente)
- saida/materiais/reels/.camadas/parteN-introFrente.mov legenda, barra, rótulo e @ (transparente)
- saida/materiais/reels/.camadas/parteN-mascara.mov    branco onde a intro aparece na passagem da mão
- o vídeo original (campo "original" de remotion/reels/whatsapp/intro/parteN.json) e o recorte dela
  (public/materiais/whatsapp/intro/parteN/frente/*.webp, só o canal alfa é usado)

Composição da intro, toda em YUV 4:4:4 16 bits HLG/BT.2020:
  original -> + gráficos de trás -> + ela (pixels originais, pelo alfa do recorte) -> + frente
  e, de 0 até o fim da intro, a máscara mistura a intro com o Reel (passagem da mão).
Saída: saida/materiais/reels/system-design-whatsapp-parteN.mp4 em HEVC 10 bits HLG (hvc1), com o
áudio normalizado (-14 LUFS, pico -1 dBFS).
"""

import argparse
import json
import subprocess
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[2]
CAMADAS = RAIZ / "saida/materiais/reels/.camadas"

# SDR (BT.709) -> HLG (BT.2020), branco SDR no branco de referência do HLG
SDR_PARA_HLG = "zscale=tin=bt709:pin=bt709:min=bt709:rin=tv:t=arib-std-b67:p=bt2020:m=bt2020nc:r=tv:npl=203,format=yuv444p16le"
AUDIO = "loudnorm=I=-14:TP=-1.5:LRA=11,alimiter=limit=0.89:attack=5:release=60:level=false"


def duracao(arq: Path) -> float:
    r = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=duration", "-of", "csv=p=0", str(arq)], capture_output=True, text=True, check=True)
    return float(r.stdout)


def tres_planos(origem: str, nome: str) -> str:
    """Um canal (alfa/máscara) em cinza 16 bits repetido nos 3 planos, para o maskedmerge.
    `origem` é a cadeia de filtros que produz o canal; o resultado sai em [nome]."""
    return (
        f"{origem},format=gray16le,split=3[{nome}1][{nome}2][{nome}3];"
        f"[{nome}1][{nome}2][{nome}3]mergeplanes=0x001020:yuv444p16le[{nome}]"
    )


def camada_transparente(entrada: int, nome: str) -> str:
    """Camada ProRes 4444 do Remotion: cor levada para HLG em [{nome}c] e alfa em [{nome}a]."""
    return (
        f"[{entrada}:v]settb=1/30,setpts=N,format=yuva444p10le,split=2[{nome}s1][{nome}s2];"
        f"[{nome}s1]format=yuv444p10le,{SDR_PARA_HLG}[{nome}c];"
        + tres_planos(f"[{nome}s2]alphaextract", f"{nome}a")
    )


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--parte", type=int, default=1)
    ap.add_argument("--preset", default="medium", help="preset do x265 (fast = mais rápido, arquivo maior)")
    a = ap.parse_args()
    n = a.parte
    # a intro gravada é uma só (parte1.json); as outras partes reaproveitam o mesmo clipe e recorte
    arq_intro = RAIZ / f"remotion/reels/whatsapp/intro/parte{n}.json"
    intro = json.loads((arq_intro if arq_intro.exists() else RAIZ / "remotion/reels/whatsapp/intro/parte1.json").read_text())
    intro.setdefault("pasta", "parte1")
    reel = CAMADAS / f"parte{n}-semIntro.mp4"
    dur = duracao(reel)
    q = intro["quadros"]
    di = q / intro["fps"]
    destino = RAIZ / f"saida/materiais/reels/system-design-whatsapp-parte-{n}.mp4"

    # todas as entradas numeradas quadro a quadro na mesma base (1/fps): sem isso, as bases de tempo
    # diferentes (.mov do iPhone, ProRes, sequência de imagens) faziam o ffmpeg duplicar quadros na emenda
    fps = intro["fps"]
    q0 = f"settb=1/{fps},setpts=N"
    filtro = ";".join(
        [
            # o Reel inteiro em HLG, dividido no fim da intro
            f"[0:v]{q0},{SDR_PARA_HLG},split=2[ra][rb]",
            f"[ra]trim=end_frame={q},{q0}[reelIntro]",
            f"[rb]trim=start_frame={q},{q0}[reelResto]",
            # o vídeo original dela (HLG, sem conversão de cor; só 4:2:0 10 bits -> 4:4:4 16 bits)
            f"[1:v]trim=end_frame={q},{q0},format=yuv444p16le,split=2[fundo][ela]",
            camada_transparente(2, "atras"),
            camada_transparente(3, "frente"),
            # recorte (alfa) e máscara da passagem
            tres_planos(f"[4:v]trim=end_frame={q},{q0},format=yuva420p,alphaextract", "recorte"),
            # a máscara chega com o branco em ~99,6%: ganho leve para fechar em 100% (nada do Reel vaza na intro)
            tres_planos(f"[5:v]trim=end_frame={q},{q0},format=gray16le,lut=c0='clip(val*1.006\\,0\\,65535)'", "passagem"),
            # composição
            "[fundo][atrasc][atrasa]maskedmerge[c1]",
            "[c1][ela][recorte]maskedmerge[c2]",
            "[c2][frentec][frentea]maskedmerge[intro]",
            "[reelIntro][intro][passagem]maskedmerge[abertura]",
            f"[abertura][reelResto]concat=n=2:v=1:a=0,{q0},format=yuv420p10le[v]",
        ]
    )
    cmd = [
        "ffmpeg", "-v", "error", "-stats", "-y",
        "-i", str(reel),
        "-ss", str(intro["inicioOriginal"]), "-t", f"{di + 0.2:.3f}", "-i", str(RAIZ / intro["original"]),
        "-i", str(CAMADAS / f"parte{n}-introAtras.mov"),
        "-i", str(CAMADAS / f"parte{n}-introFrente.mov"),
        "-framerate", str(intro["fps"]), "-i", str(RAIZ / f"public/materiais/whatsapp/intro/{intro.get('pasta', f'parte{n}')}/frente/%04d.webp"),
        "-i", str(CAMADAS / f"parte{n}-mascara.mov"),
        "-filter_complex", filtro,
        "-map", "[v]", "-map", "0:a", "-r", str(fps),
        "-t", f"{dur:.3f}",
        "-c:v", "libx265", "-preset", a.preset, "-crf", "16", "-pix_fmt", "yuv420p10le", "-tag:v", "hvc1",
        "-x265-params", "colorprim=bt2020:transfer=arib-std-b67:colormatrix=bt2020nc:range=limited:log-level=error",
        "-color_primaries", "bt2020", "-color_trc", "arib-std-b67", "-colorspace", "bt2020nc", "-color_range", "tv",
        "-af", AUDIO, "-ar", "48000", "-c:a", "aac", "-b:a", "192k",
        "-movflags", "+faststart+write_colr",
        str(destino),
    ]
    print(f"montando a parte {n} em HDR (HLG): {dur:.1f} s, intro de {q} quadros...")
    subprocess.run(cmd, check=True)
    print(f"ok: {destino.relative_to(RAIZ)}")


if __name__ == "__main__":
    main()
