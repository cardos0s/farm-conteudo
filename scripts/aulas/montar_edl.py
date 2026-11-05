"""Monta o EDL (lista de segmentos) a partir das decisões de corte em cortes.json.

Para cada trecho mantido: ajusta as bordas ao ponto mais silencioso da janela snapIn/snapOut,
encurta pausas internas maiores que maxPausa (deixando pausaFinal) e alinha tudo à grade de quadros.
Entradas {"pausa": s, "tom": [clipe, início]} inserem respiros preenchidos com tom de sala.
Uso: python3 scripts/aulas/montar_edl.py <pasta-de-trabalho> <cortes.json> <edl.json>
"""
import json
import sys
import wave

import numpy as np

pasta, arq_cortes, arq_edl = sys.argv[1:4]
cfg = json.load(open(arq_cortes))
FPS, MAXP, KEEP = cfg["fps"], cfg["maxPausa"], cfg["pausaFinal"]
cache = {}


def energia(n):
    if n not in cache:
        w = wave.open(f"{pasta}/audio/IMG_{n}.16k.wav")
        x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768
        fr = np.lib.stride_tricks.sliding_window_view(x, 320)[::80]  # janela 20 ms, passo 5 ms
        db = 20 * np.log10(np.sqrt((fr ** 2).mean(axis=1)) + 1e-9)
        piso, fala = np.percentile(db, 10), np.percentile(db, 90)
        cache[n] = (db, piso + (fala - piso) * 0.30)
    return cache[n]


def vale(n, a, b):
    db, _ = energia(n)
    i0 = int(a / 0.005)
    i1 = max(i0 + 1, int(b / 0.005))
    return (i0 + int(np.argmin(db[i0:i1]))) * 0.005 + 0.01


def silencios(n, a, b):
    db, lim = energia(n)
    q = db < lim
    out, i, fim = [], int(a / 0.005), min(int(b / 0.005), len(q))
    while i < fim:
        if q[i]:
            j = i
            while j < fim and q[j]:
                j += 1
            out.append((i * 0.005 + 0.01, j * 0.005 + 0.01))
            i = j
        else:
            i += 1
    return out


segs = []
for idx, t in enumerate(cfg["trechos"]):
    if "pausa" in t:
        segs.append({"clip": "pausa", "inF": 0, "outF": round(t["pausa"] * FPS), "tomClip": t["tom"][0], "tomIn": t["tom"][1],
                     "fadeOut": t.get("fadeOut", 0.015), "tomDur": t.get("tomDur", t["pausa"]), "nota": t["nota"], "trecho": idx})
        continue
    n = t["clip"]
    a, b = t["in"], min(t["out"], len(energia(n)[0]) * 0.005)
    if "snapIn" in t:
        a = vale(n, *t["snapIn"])
    if "snapOut" in t:
        b = vale(n, *t["snapOut"])
    partes = [[a, b]]
    for s0, s1 in silencios(n, a + 0.05, b - 0.05):
        if s1 - s0 > MAXP:
            c0, c1 = s0 + KEEP * 0.55, s1 - KEEP * 0.45
            if c0 - partes[-1][0] < 0.5 or b - c1 < 0.5:  # evita pedaços minúsculos
                continue
            partes[-1] = [partes[-1][0], c0]
            partes.append([c1, b])
    for k, (x0, x1) in enumerate(partes):
        f0, f1 = round(x0 * FPS), round(x1 * FPS)
        if f1 - f0 >= 6:
            segs.append({"clip": n, "inF": f0, "outF": f1, "nota": t["nota"] if k == 0 else "",
                         "fadeIn": t.get("fadeIn", 0.008) if k == 0 else 0.008, "trecho": idx})
pos = 0
for s in segs:
    s["startF"] = pos
    pos += s["outF"] - s["inF"]
    s["endF"] = pos
json.dump({"fps": FPS, "totalF": pos, "segmentos": segs}, open(arq_edl, "w"), ensure_ascii=False, indent=1)
print(f"{len(segs)} segmentos, {pos / FPS:.1f} s ({pos / FPS / 60:.2f} min)")
