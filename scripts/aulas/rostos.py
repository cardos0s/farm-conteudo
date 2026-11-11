"""Rastreia o rosto em cada clipe 1440p (detector YuNet do OpenCV) para o recorte automático da câmera.

A cada 0,5 s guarda o centro e o tamanho do rosto; falhas são interpoladas e a trilha é suavizada
(gaussiana de ~1,2 s) para o recorte acompanhar a pessoa sem tremer.
Uso: python3 scripts/aulas/rostos.py <pasta-de-trabalho> <rostos.json>
Requer: pip install opencv-python-headless numpy
"""
import glob
import json
import os
import subprocess
import sys
import urllib.request

import cv2
import numpy as np

pasta, saida = sys.argv[1], sys.argv[2]
modelo = os.path.join(pasta, "yunet.onnx")
if not os.path.exists(modelo):
    urllib.request.urlretrieve("https://huggingface.co/opencv/face_detection_yunet/resolve/main/face_detection_yunet_2023mar.onnx", modelo)
W, H = 640, 360
det = cv2.FaceDetectorYN.create(modelo, "", (W, H), score_threshold=0.6)
trilhas = {}
# ROSTOS_PASTA / ROSTOS_LARGURA: subpasta e largura dos vídeos (padrão: 1440p, 2560 px)
SUBPASTA = os.environ.get("ROSTOS_PASTA", "1440p")
LARGURA_FONTE = float(os.environ.get("ROSTOS_LARGURA", "2560"))
for caminho in sorted(glob.glob(os.path.join(pasta, SUBPASTA, "*.mov"))):
    nome = os.path.basename(caminho).split(".")[0].replace("IMG_", "")
    proc = subprocess.Popen(["ffmpeg", "-v", "error", "-i", caminho, "-vf", f"fps=2,scale={W}:{H}", "-f", "rawvideo", "-pix_fmt", "bgr24", "-"],
                            stdout=subprocess.PIPE)
    linhas = []
    while True:
        buf = proc.stdout.read(W * H * 3)
        if len(buf) < W * H * 3:
            break
        _, faces = det.detect(np.frombuffer(buf, np.uint8).reshape(H, W, 3))
        if faces is not None and len(faces):
            x, y, w, h = max(faces, key=lambda f: f[2] * f[3])[:4]
            e = LARGURA_FONTE / W
            linhas.append([(x + w / 2) * e, (y + h / 2) * e, max(w, h) * e])
        else:
            linhas.append([np.nan] * 3)
    v = np.array(linhas, float)
    t = np.arange(len(v)) / 2
    ok = ~np.isnan(v[:, 0])
    nucleo = np.exp(-0.5 * (np.arange(-7, 8) / 2.4) ** 2)
    nucleo /= nucleo.sum()
    cols = []
    for k in range(3):
        col = np.interp(t, t[ok], v[ok, k])
        cols.append(np.convolve(np.pad(col, 7, mode="edge"), nucleo, mode="valid"))
    trilhas[nome] = [[round(float(a), 1), int(b), int(c), int(d)] for a, b, c, d in zip(t, *cols)]
    print(f"{nome}: rosto em {ok.mean() * 100:.0f}% dos quadros")
json.dump(trilhas, open(saida, "w"), separators=(",", ":"))
