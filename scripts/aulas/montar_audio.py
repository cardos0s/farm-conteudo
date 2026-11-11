"""Monta a trilha de voz do vídeo final a partir do EDL e trata o áudio.

1. Corta cada segmento com precisão de amostra (microfades de 8 ms nas emendas, sem estalos) e
   preenche os respiros com tom de sala.
2. Trata a voz: mono, passa-alta 80 Hz, redução de ruído leve, compressão suave, ganho fixo e limitador,
   chegando a ~-16 LUFS (padrão para vídeo na internet) sem normalização dinâmica.
Uso: python3 scripts/aulas/montar_audio.py <pasta-de-trabalho> <edl.json> <voz.wav>
"""
import json
import os
import subprocess
import sys

pasta, arq_edl, saida = sys.argv[1:4]
edl = json.load(open(arq_edl))
FPS = edl["fps"]
segs = edl["segmentos"]
clips = sorted({s["clip"] for s in segs if s["clip"] != "pausa"} | {s["tomClip"] for s in segs if s["clip"] == "pausa"})
idx = {c: i for i, c in enumerate(clips)}
usos = {c: sum(1 for s in segs if s["clip"] == c or s.get("tomClip") == c) for c in clips}

args = ["ffmpeg", "-v", "error", "-y"]
for c in clips:
    args += ["-i", os.path.join(pasta, "originais", f"IMG_{c}.MOV")]
grafo = []
for c in clips:
    saidas = "".join(f"[{c}_{k}]" for k in range(usos[c]))
    grafo.append(f"[{idx[c]}:a:0]aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo,asplit={usos[c]}{saidas}"
                 if usos[c] > 1 else f"[{idx[c]}:a:0]aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo[{c}_0]")
contagem = {c: 0 for c in clips}
rotulos = []
for i, s in enumerate(segs):
    d = (s["outF"] - s["inF"]) / FPS
    if s["clip"] == "pausa":
        c = s["tomClip"]
        dt = min(d, s.get("tomDur", d))
        fo = s.get("fadeOut", 0.015)
        filtro = f"atrim=start={s['tomIn']:.6f}:end={s['tomIn'] + dt:.6f},asetpts=PTS-STARTPTS,afade=t=in:st=0:d=0.015,afade=t=out:st={dt - fo:.6f}:d={fo:.3f}"
    else:
        c = s["clip"]
        a = s["inF"] / FPS
        filtro = f"atrim=start={a:.6f}:end={a + d:.6f},asetpts=PTS-STARTPTS,afade=t=in:st=0:d={s.get('fadeIn', 0.008):.3f},afade=t=out:st={d - 0.008:.6f}:d=0.008"
    k = contagem[c]
    contagem[c] += 1
    grafo.append(f"[{c}_{k}]{filtro},apad=whole_dur={d:.6f}[s{i}]")
    rotulos.append(f"[s{i}]")
grafo.append("".join(rotulos) + f"concat=n={len(rotulos)}:v=0:a=1[out]")
bruta = saida.replace(".wav", "-bruta.wav")
subprocess.run(args + ["-filter_complex", ";".join(grafo), "-map", "[out]", "-c:a", "pcm_s24le", bruta], check=True)

CADEIA = ("pan=mono|c0=0.5*c0+0.5*c1,highpass=f=80,afftdn=nr=10:nf=-48:tn=1,"
          "acompressor=threshold=-24dB:ratio=2.5:attack=8:release=140:makeup=3dB")
ALVO = -16.0  # LUFS


def loudness(arquivo, filtro):
    saida_ffmpeg = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", arquivo, "-af", f"{filtro},ebur128" if filtro else "ebur128", "-f", "null", "-"],
                                  capture_output=True, text=True).stderr
    linhas = [l.strip() for l in saida_ffmpeg.splitlines() if l.strip().startswith(("I:", "LRA:"))]
    return float(linhas[-2].split()[1]), " ".join(linhas[-2:])


# ganho fixo calculado para cada gravação (sem normalização dinâmica, que "bombeia" a voz)
medido, _ = loudness(bruta, CADEIA)
ganho = ALVO - medido + 0.2  # o limitador tira ~0,2 LU
VOZ = f"{CADEIA},volume={ganho:.2f}dB,alimiter=limit=0.79:attack=4:release=80:level=false"
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", bruta, "-af", VOZ, "-ac", "2", "-ar", "48000", "-c:a", "pcm_s24le", saida], check=True)
_, resumo = loudness(saida, None)
print(f"ok: {saida} | ganho {ganho:+.1f} dB | {resumo}")
