"""Prepara a intro gravada (vídeo da Julia no iPhone) para o Reel do WhatsApp.

    python3 materiais/whatsapp/intro.py IMG_3366.mov --parte 1 --inicio 0.5 --fim 3.9 --mao 3.5 3.87

- converte o HDR (HLG) do iPhone para SDR mantendo a resolução original (2160x3840, 30 fps);
- recorta a Julia do fundo quadro a quadro com o RobustVideoMatting (ONNX, modelo ResNet50),
  para os números, textos e desenhos entrarem ATRÁS dela;
- grava em public/materiais/whatsapp/intro/parteN/ (fora do git):
  fundo.mp4 (o vídeo SDR do trecho), frente/NNNN.webp (a Julia com transparência) e voz.wav
  (a fala dela até a mão, com o volume igualado ao da narração);
- transcreve a fala (faster-whisper) e grava remotion/reels/whatsapp/intro/parteN.json com os
  tempos: trecho usado, gesto da mão (a transição) e palavras para a legenda.

Requisitos: ffmpeg com zscale, numpy, Pillow, onnxruntime, faster-whisper. O modelo é baixado na
primeira vez para saida/modelos/ (~107 MB).
"""

import argparse
import json
import subprocess
import urllib.request
from pathlib import Path

import numpy as np

RAIZ = Path(__file__).resolve().parents[2]
MODELO_URL = "https://github.com/PeterL1n/RobustVideoMatting/releases/download/v1.0.0/rvm_resnet50_fp32.onnx"
MODELO = RAIZ / "saida/modelos/rvm_resnet50_fp32.onnx"
W, H, FPS = 2160, 3840, 30  # resolução nativa do iPhone (4K vertical): o Reel é renderizado em 4K
# HLG -> SDR: "mobius" com branco de referência de 203 nits fica mais perto de como o iPhone mostra o vídeo
# (o "hable" com 100 nits escurecia e deixava a pele laranja)
TM = "zscale=t=linear:npl=203,format=gbrpf32le,zscale=p=bt709,tonemap=tonemap=mobius:param=0.3:desat=0,zscale=t=bt709:m=bt709:r=tv,format=yuv420p"


def sdr(mov: Path, destino: Path) -> None:
    subprocess.run(
        ["ffmpeg", "-v", "error", "-y", "-i", str(mov), "-map", "0:v:0", "-an", "-vf", f"fps={FPS},scale={W}:{H}:flags=lanczos,{TM}",
         "-c:v", "libx264", "-preset", "medium", "-crf", "10", "-pix_fmt", "yuv420p",
         "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709", str(destino)],
        check=True,
    )


def quadros(video: Path, ate: float):
    """Gera os quadros RGB (uint8) do início até `ate` segundos."""
    proc = subprocess.Popen(["ffmpeg", "-v", "error", "-i", str(video), "-t", f"{ate}", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], stdout=subprocess.PIPE)
    tam = W * H * 3
    while True:
        buf = proc.stdout.read(tam)
        if len(buf) < tam:
            break
        yield np.frombuffer(buf, dtype=np.uint8).reshape(H, W, 3)
    proc.wait()


def recortar(video: Path, pasta: Path, inicio: float, fim: float) -> dict:
    import onnxruntime as ort
    from PIL import Image

    if not MODELO.exists():
        MODELO.parent.mkdir(parents=True, exist_ok=True)
        print("baixando o modelo de recorte...")
        urllib.request.urlretrieve(MODELO_URL, MODELO)
    sess = ort.InferenceSession(str(MODELO), providers=["CPUExecutionProvider"])
    rec = [np.zeros((1, 1, 1, 1), np.float32)] * 4
    ratio = np.array([0.125], np.float32)  # recomendado para 4K
    pasta.mkdir(parents=True, exist_ok=True)
    caixas = []
    i0, i1 = round(inicio * FPS), round(fim * FPS)
    # roda desde o quadro 0 para o estado recorrente do modelo já estar estável no trecho usado
    for i, rgb in enumerate(quadros(video, fim + 0.05)):
        src = (rgb.astype(np.float32) / 255).transpose(2, 0, 1)[None]
        _, pha, *rec = sess.run(None, {"src": src, "r1i": rec[0], "r2i": rec[1], "r3i": rec[2], "r4i": rec[3], "downsample_ratio": ratio})
        if i < i0 or i >= i1:
            continue
        a = np.clip(pha[0, 0], 0, 1)
        a = np.where(a < 0.03, 0, a)  # limpa o véu quase transparente do fundo
        rgba = np.dstack([rgb, (a * 255).astype(np.uint8)])
        Image.fromarray(rgba, "RGBA").save(pasta / f"{i - i0:04d}.webp", quality=95, method=4)  # alfa sem perda
        ys, xs = np.nonzero(a > 0.5)
        caixas.append([int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())] if len(xs) else None)
    print(f"{len(caixas)} quadros recortados")
    return {"quadros": len(caixas), "caixas": caixas}


def loudness(wav_args: list[str]) -> float:
    r = subprocess.run(["ffmpeg", "-hide_banner", *wav_args, "-af", "ebur128", "-f", "null", "-"], capture_output=True, text=True)
    linhas = [l for l in r.stderr.splitlines() if l.strip().startswith("I:")]
    return float(linhas[-1].split()[1])


def voz(mov: Path, destino: Path, inicio: float, ate: float, referencia: Path) -> float:
    """Fala da Julia de `inicio` até `ate` (antes da batida da mão no microfone), no volume da narração."""
    alvo = loudness(["-i", str(referencia)])
    atual = loudness(["-ss", f"{inicio}", "-t", f"{ate - inicio}", "-i", str(mov)])
    ganho = alvo - atual
    dur = ate - inicio
    subprocess.run(
        ["ffmpeg", "-v", "error", "-y", "-ss", f"{inicio}", "-t", f"{dur}", "-i", str(mov), "-ac", "2", "-ar", "48000",
         "-af", f"highpass=f=80,volume={ganho:.2f}dB,afade=t=in:d=0.04,afade=t=out:st={dur - 0.15:.3f}:d=0.15", str(destino)],
        check=True,
    )
    print(f"voz: {atual:.1f} LUFS -> {alvo:.1f} LUFS ({ganho:+.1f} dB)")
    return ganho


def transcrever(mov: Path, inicio: float, ate: float) -> list[dict]:
    from faster_whisper import WhisperModel

    pcm = subprocess.run(["ffmpeg", "-v", "error", "-i", str(mov), "-ac", "1", "-ar", "16000", "-f", "f32le", "-"], capture_output=True, check=True).stdout
    a = np.frombuffer(pcm, dtype=np.float32)
    seg, _ = WhisperModel("medium", device="cpu", compute_type="int8").transcribe(a[: int(ate * 16000)], language="pt", word_timestamps=True, beam_size=5)
    ws = [{"w": w.word.strip(), "s": round(w.start, 2), "e": round(w.end, 2)} for s in seg for w in s.words]
    # O Whisper estica palavras por cima de silêncios (a 1ª até o começo do áudio, e um "o" curto por
    # cima da pausa que vem antes dele). Ajusta as bordas pela energia da fala, em passos de 10 ms:
    # se a palavra começa (ou termina) com mais de 120 ms de silêncio, a borda vai para onde a voz está.
    passo = 160
    n = int(ate * 16000) // passo
    energia = np.array([20 * np.log10(np.sqrt((a[k * passo : (k + 1) * passo] ** 2).mean()) + 1e-9) for k in range(n)])
    # referência robusta (percentil 95, não o máximo: a batida da mão no microfone satura o pico)
    voz = energia > np.percentile(energia, 95) - 15
    # só conta como voz um trecho de pelo menos 40 ms seguidos (ignora estalos e ruído de mão)
    k = 0
    while k < n:
        if voz[k]:
            fim = k
            while fim < n and voz[fim]:
                fim += 1
            if fim - k < 4:
                voz[k:fim] = False
            k = fim
        else:
            k += 1
    for p in ws:
        k0, k1 = int(p["s"] * 100), min(n, int(np.ceil(p["e"] * 100)))
        ativos = np.nonzero(voz[k0:k1])[0]
        if len(ativos) == 0:
            continue
        s0, e0 = (k0 + ativos[0]) / 100, (k0 + ativos[-1] + 1) / 100
        if s0 - p["s"] > 0.12:
            p["s"] = round(float(s0), 2)
        if p["e"] - e0 > 0.12:
            p["e"] = round(float(e0), 2)
    # tempos relativos ao começo do trecho usado
    return [{**p, "s": round(p["s"] - inicio, 2), "e": round(p["e"] - inicio, 2)} for p in ws if p["e"] > inicio]


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("mov", type=Path)
    ap.add_argument("--parte", type=int, default=1)
    ap.add_argument("--inicio", type=float, default=0.5, help="segundo do vídeo original em que a intro começa")
    ap.add_argument("--fim", type=float, default=3.9, help="segundo em que a intro termina (a mão já passou)")
    ap.add_argument("--mao", type=float, nargs=2, default=[3.5, 3.87], metavar=("DE", "ATE"), help="a mão cruzando a tela (transição)")
    ap.add_argument("--voz-ate", type=float, default=3.3, help="corta a voz antes da batida da mão no microfone")
    a = ap.parse_args()

    pub = RAIZ / f"public/materiais/whatsapp/intro/parte{a.parte}"
    trab = RAIZ / "saida/materiais/intro"
    pub.mkdir(parents=True, exist_ok=True)
    trab.mkdir(parents=True, exist_ok=True)
    # cópia do original (HDR): o vídeo final da parte é montado com estes pixels, sem conversão
    original = trab / f"parte{a.parte}-original{a.mov.suffix.lower()}"
    if a.mov.resolve() != original.resolve():
        original.write_bytes(a.mov.read_bytes())
    sdr_mp4 = trab / f"parte{a.parte}-sdr.mp4"
    print("convertendo HDR -> SDR...")
    sdr(a.mov, sdr_mp4)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{a.inicio}", "-t", f"{a.fim - a.inicio}", "-i", str(sdr_mp4), "-c:v", "libx264", "-preset", "slow", "-crf", "12",
                    "-pix_fmt", "yuv420p", "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709",
                    "-movflags", "+faststart", str(pub / "fundo.mp4")], check=True)
    print("recortando a Julia do fundo...")
    rec = recortar(sdr_mp4, pub / "frente", a.inicio, a.fim)
    ganho = voz(a.mov, pub / "voz.wav", a.inicio, a.voz_ate, RAIZ / f"public/materiais/whatsapp/narracao/parte{a.parte}.mp3")
    print("transcrevendo a fala...")
    palavras = transcrever(a.mov, a.inicio, a.voz_ate)
    dados = {
        "fps": FPS,
        "original": str(original.relative_to(RAIZ)),
        "inicioOriginal": a.inicio,
        "duracao": round(a.fim - a.inicio, 3),
        "quadros": rec["quadros"],
        "mao": [round(a.mao[0] - a.inicio, 3), round(a.mao[1] - a.inicio, 3)],
        "vozAte": round(a.voz_ate - a.inicio, 3),
        "ganhoVoz": round(ganho, 2),
        "palavras": palavras,
        "caixas": rec["caixas"],
    }
    destino = RAIZ / f"remotion/reels/whatsapp/intro/parte{a.parte}.json"
    destino.parent.mkdir(parents=True, exist_ok=True)
    destino.write_text(json.dumps(dados, ensure_ascii=False))
    print(f"ok: {destino.relative_to(RAIZ)} ({' '.join(p['w'] for p in palavras)})")


if __name__ == "__main__":
    main()
