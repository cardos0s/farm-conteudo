"""Alinha a voz gravada (ElevenLabs ou microfone) com o texto da aula e gera os tempos da lousa.

    pip install faster-whisper numpy
    python3 scripts/aulas/alinhar.py remotion/aulas/llm-juiz/narracao audios/01.mp3 audios/02.mp3 ...
    npm run render:aula -- llm-juiz

Os áudios (um por seção do roteiro-elevenlabs.md, em ordem) são juntos com um respiro entre eles,
normalizados (~-16 LUFS) e salvos em saida/aulas/<aula>/voz.wav. O Whisper transcreve com o tempo
de cada palavra, e cada fala de falas.json é localizada na transcrição (tolerando pequenas diferenças
de texto). O resultado substitui narracao/tempos.json: a lousa passa a seguir a voz real.
"""

import argparse
import difflib
import json
import re
import subprocess
import tempfile
import unicodedata
from pathlib import Path

import numpy as np

TAXA = 16000


def normalizar(s: str) -> list[str]:
    s = unicodedata.normalize("NFD", s.lower())
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9% ]", " ", s).split()


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("pasta", type=Path, help="pasta narracao/ da aula (com falas.json)")
    ap.add_argument("audios", type=Path, nargs="+")
    ap.add_argument("--saida", type=Path, help="áudio final (padrão: saida/aulas/<aula>/voz.wav)")
    ap.add_argument("--intervalo", type=float, default=1.0,
                    help="silêncio entre um arquivo e outro; com um arquivo por seção, vale a pausa da seção, se houver")
    ap.add_argument("--inicio", type=float, default=1.4, help="segundos de silêncio antes da primeira fala")
    ap.add_argument("--final", type=float, default=4.0, help="segundos depois da última fala (visão geral final)")
    ap.add_argument("--modelo", default="small", help="modelo do Whisper (small, medium, large-v3)")
    a = ap.parse_args()

    from faster_whisper import WhisperModel

    cfg = json.loads((a.pasta / "falas.json").read_text(encoding="utf-8"))
    secoes = cfg["secoes"]
    if len(a.audios) == len(secoes):
        # um arquivo por seção: depois de cada um, a pausa da seção (o respiro das visões gerais da lousa)
        intervalos = [s.get("pausa", a.intervalo) for s in secoes]
    else:
        print(f"aviso: {len(a.audios)} arquivos para {len(secoes)} seções; usando {a.intervalo} s entre eles")
        intervalos = [a.intervalo] * len(a.audios)
    aula = a.pasta.parent.name
    saida = a.saida or Path("saida/aulas") / aula / "voz.wav"
    saida.parent.mkdir(parents=True, exist_ok=True)

    # 1. junta os arquivos com silêncio entre eles e normaliza o volume
    with tempfile.TemporaryDirectory() as tmp:
        lista = Path(tmp) / "lista.txt"

        def silencio(seg: float, nome: str) -> Path:
            arq = Path(tmp) / f"{nome}.wav"
            subprocess.run(["ffmpeg", "-v", "error", "-f", "lavfi", "-i", "anullsrc=r=48000:cl=mono", "-t", str(seg), "-c:a", "pcm_s16le", str(arq)], check=True)
            return arq

        partes = [silencio(a.inicio, "inicio")]
        for i, audio in enumerate(a.audios):
            wav = Path(tmp) / f"p{i}.wav"
            subprocess.run(["ffmpeg", "-v", "error", "-i", str(audio), "-ar", "48000", "-ac", "1", "-c:a", "pcm_s16le", str(wav)], check=True)
            partes.append(wav)
            if i < len(a.audios) - 1:
                partes.append(silencio(intervalos[i], f"s{i}"))
        lista.write_text("".join(f"file '{p}'\n" for p in partes))
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(lista),
                        "-af", "loudnorm=I=-16:TP=-1.5:LRA=11", "-ar", "48000", "-ac", "1", str(saida)], check=True)

    bruto = subprocess.run(["ffmpeg", "-v", "error", "-i", str(saida), "-ac", "1", "-ar", str(TAXA), "-f", "s16le", "-"], capture_output=True, check=True).stdout
    audio = np.frombuffer(bruto, np.int16).astype(np.float32) / 32768
    duracao = len(audio) / TAXA

    # 2. transcreve com o tempo de cada palavra
    print(f"transcrevendo {duracao / 60:.1f} min com o Whisper {a.modelo}...")
    modelo = WhisperModel(a.modelo, device="cpu", compute_type="int8")
    segmentos, _ = modelo.transcribe(audio, language="pt", word_timestamps=True)
    ouvidas: list[tuple[str, float, float]] = []
    for seg in segmentos:
        for w in seg.words:
            for tok in normalizar(w.word):
                ouvidas.append((tok, w.start, w.end))

    # 3. localiza cada fala na transcrição
    falas = [f for s in secoes for f in s["falas"]]
    escritas: list[tuple[str, int]] = []  # (palavra, índice da fala)
    for k, f in enumerate(falas):
        escritas += [(tok, k) for tok in normalizar(f["texto"])]
    casar = difflib.SequenceMatcher(None, [w for w, _ in escritas], [w for w, _, _ in ouvidas], autojunk=False)
    par = {}
    for bloco in casar.get_matching_blocks():
        for d in range(bloco.size):
            par[bloco.a + d] = bloco.b + d

    tempos, sem_par = {}, []
    for k, f in enumerate(falas):
        idx = [i for i, (_, kk) in enumerate(escritas) if kk == k]
        casadas = [(i, par[i]) for i in idx if i in par]
        if not casadas:
            sem_par.append(f["id"])
            continue
        de, ate = ouvidas[casadas[0][1]][1], ouvidas[casadas[-1][1]][2]
        palavras = [[escritas[i][0], round(ouvidas[j][1], 3)] for i, j in casadas]
        tempos[f["id"]] = {"de": round(de, 3), "ate": round(ate, 3), "texto": f["texto"], "palavras": palavras}

    # falas que o Whisper não achou: ficam entre as vizinhas, proporcionais ao tamanho
    for k, f in enumerate(falas):
        if f["id"] in tempos:
            continue
        antes = next((tempos[falas[j]["id"]]["ate"] for j in range(k - 1, -1, -1) if falas[j]["id"] in tempos), a.inicio)
        depois = next((tempos[falas[j]["id"]]["de"] for j in range(k + 1, len(falas)) if falas[j]["id"] in tempos), duracao)
        tempos[f["id"]] = {"de": round(antes + 0.2, 3), "ate": round(max(antes + 0.4, depois - 0.2), 3), "texto": f["texto"]}

    ordenado = {f["id"]: tempos[f["id"]] for f in falas}
    (a.pasta / "tempos.json").write_text(
        json.dumps({"origem": f"alinhado com {', '.join(p.name for p in a.audios)}", "total": round(duracao + a.final, 3), "falas": ordenado},
                   ensure_ascii=False, indent=1) + "\n",
        encoding="utf-8",
    )
    print(f"ok: {len(falas) - len(sem_par)}/{len(falas)} falas alinhadas, voz em {saida}")
    if sem_par:
        print("não encontradas no áudio (posição estimada): " + ", ".join(sem_par))


if __name__ == "__main__":
    main()
