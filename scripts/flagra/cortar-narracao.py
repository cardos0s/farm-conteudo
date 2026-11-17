# Corta uma narração gravada de uma vez (as 21 falas em sequência) em um arquivo por fala.
# Uso: python3 scripts/flagra/cortar-narracao.py <pasta-de-trabalho> public/flagra/narracao
# A pasta precisa ter narracao/palavras.json (de transcrever-narracao.py), narracao/gta_vi.f32 (16 kHz)
# e narracao/normalizado.wav. Os `inicios` abaixo são os da gravação de 17/11; outra gravação, outros inícios.
import json, subprocess, sys
import numpy as np
S, destino = sys.argv[1], sys.argv[2]
w = json.load(open(f"{S}/narracao/palavras.json"))
# primeira palavra de cada fala (na ordem do roteiro em narracao.ts)
falas = ["01-pergunta","02-abertura","03-mapa","04-postar","05-feed","06-curtida","07-stories","08-reels","09-geral","10-app",
         "11-story","12-enquete","13-anel","14-repost","15-seguir","16-curtida","17-comentarios","18-repostar","19-reels","20-feed","21-fecho"]
inicios = [0.0, 3.66, 8.12, 20.02, 29.98, 43.48, 55.98, 65.04, 74.20, 76.00, 79.46, 82.08, 84.36, 88.04, 91.88, 93.00, 97.80, 101.78, 104.58, 108.58, 112.44]
fim_total = w[-1]["f"]
a = np.fromfile(f"{S}/narracao/gta_vi.f32", dtype=np.float32)  # 16 kHz
sr = 16000
def silencio(t0, t1):
    i0, i1 = int(t0 * sr), int(t1 * sr)
    seg = a[i0:i1]
    jan = int(0.03 * sr)
    if len(seg) <= jan: return (t0 + t1) / 2
    e = np.convolve(seg ** 2, np.ones(jan) / jan, mode="valid")
    return t0 + (int(np.argmin(e)) + jan / 2) / sr
# fronteiras: ponto mais silencioso entre o fim da última palavra da fala anterior e o começo da próxima
cortes = [0.0]
for k in range(1, len(inicios)):
    fim_ant = max(x["f"] for x in w if x["i"] < inicios[k] - 0.01)
    t0 = min(fim_ant, inicios[k]) - 0.15
    t1 = inicios[k] + 0.35
    cortes.append(round(silencio(t0, t1), 3))
cortes.append(fim_total + 0.3)
info = {}
for k, nome in enumerate(falas):
    i, f = cortes[k], cortes[k + 1]
    d = f - i
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-ss", f"{i:.3f}", "-t", f"{d:.3f}", "-i", f"{S}/narracao/normalizado.wav",
                    "-af", f"afade=t=in:d=0.02,afade=t=out:st={max(0, d - 0.06):.3f}:d=0.06", "-codec:a", "libmp3lame", "-b:a", "160k",
                    f"{destino}/{nome}.mp3"], check=True)
    info[nome] = {"de": i, "ate": f, "duracao": round(d, 2)}
    print(f"{nome:16} {i:7.2f} → {f:7.2f}  ({d:5.2f} s)")
json.dump(info, open(f"{destino}/cortes.json", "w"), indent=2)
