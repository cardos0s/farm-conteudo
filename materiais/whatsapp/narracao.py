"""Prepara a narração dos Reels do WhatsApp: transcreve cada MP3 com tempo por palavra
(faster-whisper), corrige o que a transcrição erra e grava o JSON que o vídeo usa.

    python3 materiais/whatsapp/narracao.py parte1.mp3 parte2.mp3 parte3.mp3

- copia os áudios para public/materiais/whatsapp/narracao/parteN.mp3 (fora do git);
- grava remotion/reels/whatsapp/narracao/parteN.json com a duração e as palavras;
- guarda a transcrição crua em saida/materiais/narracao/ e reaproveita na próxima vez
  (apague o arquivo .cru.json para transcrever de novo).

Requisitos: ffmpeg e `pip install faster-whisper`.
"""

import json
import shutil
import subprocess
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[2]
CRU = RAIZ / "saida/materiais/narracao"
AUDIO = RAIZ / "public/materiais/whatsapp/narracao"
SAIDA = RAIZ / "remotion/reels/whatsapp/narracao"

# Trechos que a transcrição escreve diferente do texto falado (sequência → substituição).
CORRECOES = [
    (["Se,", "numa"], ["Se", "numa"]),
    (["a", "não", "aparecer."], ["a", "aparecer."]),  # tropeço da voz, o texto é "começa a aparecer"
    (["a", "mal", "aparecer."], ["a", "aparecer."]),
    (["R", "$15", ",00,"], ["R$ 15,"]),
    (["R", "$15", ",00."], ["R$ 15."]),
    (["R", "$15,"], ["R$ 15,"]),
    (["fique", "esperando"], ["fica", "esperando"]),
    (["tenha", "um", "cuidado,"], ["tem", "um", "cuidado:"]),
    (["a", "horas"], ["há", "horas"]),
    (["a", "horas,"], ["há", "horas,"]),
    (["System", "design"], ["System", "Design"]),
    (["1024"], ["1.024"]),
]


def duracao(mp3: Path) -> float:
    r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(mp3)], capture_output=True, text=True, check=True)
    return round(float(r.stdout), 3)


def transcrever(mp3: Path) -> list[dict]:
    import numpy as np
    from faster_whisper import WhisperModel

    pcm = subprocess.run(["ffmpeg", "-v", "error", "-i", str(mp3), "-ac", "1", "-ar", "16000", "-f", "f32le", "-"], capture_output=True, check=True).stdout
    modelo = WhisperModel("medium", device="cpu", compute_type="int8")
    segs, _ = modelo.transcribe(np.frombuffer(pcm, dtype=np.float32), language="pt", word_timestamps=True, beam_size=5)
    return [{"w": w.word.strip(), "s": round(w.start, 2), "e": round(w.end, 2)} for s in segs for w in s.words]


def corrigir(palavras: list[dict]) -> list[dict]:
    saida, i = [], 0
    while i < len(palavras):
        for antes, depois in CORRECOES:
            trecho = [p["w"] for p in palavras[i : i + len(antes)]]
            if trecho == antes:
                ini, fim = palavras[i]["s"], palavras[i + len(antes) - 1]["e"]
                passo = (fim - ini) / len(depois)
                saida += [{"w": w, "s": round(ini + k * passo, 2), "e": round(ini + (k + 1) * passo, 2)} for k, w in enumerate(depois)]
                i += len(antes)
                break
        else:
            saida.append(palavras[i])
            i += 1
    return saida


def main(mp3s: list[str]) -> None:
    for pasta in (CRU, AUDIO, SAIDA):
        pasta.mkdir(parents=True, exist_ok=True)
    for n, arq in enumerate(mp3s, 1):
        mp3 = Path(arq)
        destino = AUDIO / f"parte{n}.mp3"
        if mp3.resolve() != destino.resolve():
            shutil.copyfile(mp3, destino)
        cru = CRU / f"parte{n}.cru.json"
        if not cru.exists():
            print(f"transcrevendo parte {n}...")
            cru.write_text(json.dumps(transcrever(destino), ensure_ascii=False))
        palavras = corrigir(json.loads(cru.read_text()))
        dados = {"duracao": duracao(destino), "palavras": palavras}
        (SAIDA / f"parte{n}.json").write_text(json.dumps(dados, ensure_ascii=False))
        print(f"parte {n}: {dados['duracao']:.1f} s, {len(palavras)} palavras")


if __name__ == "__main__":
    main(sys.argv[1:])
