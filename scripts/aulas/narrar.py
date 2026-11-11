"""Narração provisória com voz sintética (Piper, roda local) para aulas sem gravação.

Sintetiza cada fala de falas.json separadamente, junta com as pausas indicadas, normaliza o volume
(~-16 LUFS, como a voz das aulas gravadas) e escreve:
  - o áudio (WAV), usado no render;
  - tempos.json, com o início e o fim de cada fala no vídeo, que a lousa usa para sincronizar.

    pip install piper-tts
    python3 scripts/aulas/narrar.py remotion/aulas/llm-juiz/narracao saida/aulas/llm-juiz/voz.wav

A voz é baixada uma vez para ~/.cache/piper. Quando a aula for gravada de verdade, troque este
passo pelo pipeline de scripts/aulas/README.md e mantenha os mesmos ids de fala.
"""

import json
import subprocess
import sys
import tempfile
import urllib.request
import wave
from pathlib import Path

from piper import PiperVoice, SynthesisConfig

CACHE = Path.home() / ".cache" / "piper"
BASE = "https://huggingface.co/rhasspy/piper-voices/resolve/main"


def baixar_voz(nome: str) -> Path:
    lingua, regiao_voz = nome.split("-", 1)[0], nome.split("-")
    voz, qualidade = regiao_voz[1], regiao_voz[2]
    destino = CACHE / f"{nome}.onnx"
    if not destino.exists():
        CACHE.mkdir(parents=True, exist_ok=True)
        pasta = f"{BASE}/{lingua.split('_')[0]}/{lingua}/{voz}/{qualidade}/{nome}"
        for ext in (".onnx", ".onnx.json"):
            print(f"baixando {nome}{ext}")
            urllib.request.urlretrieve(pasta + ext, CACHE / f"{nome}{ext}")
    return destino


def main(pasta: Path, saida: Path) -> None:
    cfg = json.loads((pasta / "falas.json").read_text(encoding="utf-8"))
    voz = PiperVoice.load(str(baixar_voz(cfg["voz"])))
    taxa = voz.config.sample_rate
    sintese = SynthesisConfig(length_scale=cfg.get("velocidade", 1.0))

    amostras = bytearray(b"\x00\x00" * round(cfg.get("inicio", 0) * taxa))
    tempos = {}
    with tempfile.TemporaryDirectory() as tmp:
        for fala in cfg["falas"]:
            arquivo = Path(tmp) / f"{fala['id']}.wav"
            with wave.open(str(arquivo), "wb") as w:
                voz.synthesize_wav(fala["texto"], w, syn_config=sintese)
            with wave.open(str(arquivo)) as w:
                dados = w.readframes(w.getnframes())
            de = len(amostras) / 2 / taxa
            amostras += dados
            tempos[fala["id"]] = {"de": round(de, 3), "ate": round(len(amostras) / 2 / taxa, 3), "texto": fala["texto"]}
            amostras += b"\x00\x00" * round(fala.get("pausa", 0.4) * taxa)

        bruto = Path(tmp) / "bruto.wav"
        with wave.open(str(bruto), "wb") as w:
            w.setnchannels(1)
            w.setsampwidth(2)
            w.setframerate(taxa)
            w.writeframes(bytes(amostras))
        saida.parent.mkdir(parents=True, exist_ok=True)
        subprocess.run(
            ["ffmpeg", "-v", "error", "-y", "-i", str(bruto), "-af",
             "highpass=f=70,loudnorm=I=-16:TP=-1.5:LRA=11", "-ar", "48000", "-ac", "1", str(saida)],
            check=True,
        )

    total = len(amostras) / 2 / taxa
    (pasta / "tempos.json").write_text(
        json.dumps({"voz": cfg["voz"], "total": round(total, 3), "falas": tempos}, ensure_ascii=False, indent=1) + "\n",
        encoding="utf-8",
    )
    print(f"ok: {saida} ({total:.1f} s, {len(tempos)} falas)")


if __name__ == "__main__":
    main(Path(sys.argv[1]), Path(sys.argv[2]))
