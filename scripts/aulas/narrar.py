"""Tempos da lousa para uma aula que ainda não tem voz gravada.

Lê narracao/falas.json (o texto narrado, dividido em seções e falas) e:
  1. sintetiza cada fala com o Piper (voz local) só para medir quanto tempo ela leva;
  2. escreve narracao/tempos.json (início e fim de cada fala), que a lousa usa para sincronizar;
  3. escreve narracao/roteiro-elevenlabs.md, o texto limpo para gravar na ElevenLabs, uma seção por arquivo de áudio.

    pip install piper-tts
    python3 scripts/aulas/narrar.py remotion/aulas/llm-juiz/narracao
    python3 scripts/aulas/narrar.py remotion/aulas/llm-juiz/narracao --previa saida/aulas/llm-juiz/previa.wav

Com --previa, também grava o áudio sintético (para conferir ritmo; não vai para o vídeo).
Quando a voz real existir, rode scripts/aulas/alinhar.py: ele substitui tempos.json pelos tempos reais.
O campo "tts" de uma fala, se existir, é o texto que o Piper lê no lugar de "texto" (ajustes de pronúncia).
"""

import argparse
import json
import subprocess
import tempfile
import urllib.request
import wave
from pathlib import Path

CACHE = Path.home() / ".cache" / "piper"
BASE = "https://huggingface.co/rhasspy/piper-voices/resolve/main"


def baixar_voz(nome: str) -> Path:
    lingua, voz, qualidade = nome.split("-")
    destino = CACHE / f"{nome}.onnx"
    if not destino.exists():
        CACHE.mkdir(parents=True, exist_ok=True)
        pasta = f"{BASE}/{lingua.split('_')[0]}/{lingua}/{voz}/{qualidade}/{nome}"
        for ext in (".onnx", ".onnx.json"):
            print(f"baixando {nome}{ext}")
            urllib.request.urlretrieve(pasta + ext, CACHE / f"{nome}{ext}")
    return destino


def escrever_roteiro(cfg: dict, destino: Path) -> None:
    partes = [
        f"# {cfg.get('titulo', 'Narração')}\n\n",
        "Texto para gravar na ElevenLabs. Gere **um arquivo de áudio por seção**, na ordem (01.mp3, 02.mp3...), e depois rode:\n\n",
        f"```bash\npython3 scripts/aulas/alinhar.py {destino.parent} audios/*.mp3\n```\n\n",
        "Cada linha é uma fala: mantenha as quebras de linha, elas viram pausas naturais. "
        "Pode mudar palavras à vontade; o alinhamento acha cada fala mesmo com pequenas diferenças.\n",
    ]
    for i, secao in enumerate(cfg["secoes"], start=1):
        partes.append(f"\n## {i:02d}. {secao['titulo']}\n\n")
        partes.append("\n".join(f["texto"] for f in secao["falas"]) + "\n")
    destino.write_text("".join(partes), encoding="utf-8")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("pasta", type=Path)
    ap.add_argument("--previa", type=Path, help="grava também o áudio sintético neste arquivo")
    a = ap.parse_args()

    from piper import PiperVoice, SynthesisConfig

    cfg = json.loads((a.pasta / "falas.json").read_text(encoding="utf-8"))
    voz = PiperVoice.load(str(baixar_voz(cfg["voz"])))
    taxa = voz.config.sample_rate
    sintese = SynthesisConfig(length_scale=cfg.get("velocidade", 1.0))

    amostras = bytearray(b"\x00\x00" * round(cfg.get("inicio", 0) * taxa))
    tempos = {}
    with tempfile.TemporaryDirectory() as tmp:
        for secao in cfg["secoes"]:
            for fala in secao["falas"]:
                if fala["id"] in tempos:
                    raise SystemExit(f"id repetido: {fala['id']}")
                arquivo = Path(tmp) / "fala.wav"
                with wave.open(str(arquivo), "wb") as w:
                    voz.synthesize_wav(fala.get("tts", fala["texto"]), w, syn_config=sintese)
                with wave.open(str(arquivo)) as w:
                    dados = w.readframes(w.getnframes())
                de = len(amostras) / 2 / taxa
                amostras += dados
                tempos[fala["id"]] = {"de": round(de, 3), "ate": round(len(amostras) / 2 / taxa, 3), "texto": fala["texto"]}
                amostras += b"\x00\x00" * round(fala.get("pausa", 0.4) * taxa)
            amostras += b"\x00\x00" * round(secao.get("pausa", 0) * taxa)

        if a.previa:
            bruto = Path(tmp) / "bruto.wav"
            with wave.open(str(bruto), "wb") as w:
                w.setnchannels(1)
                w.setsampwidth(2)
                w.setframerate(taxa)
                w.writeframes(bytes(amostras))
            a.previa.parent.mkdir(parents=True, exist_ok=True)
            subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(bruto), "-af", "loudnorm=I=-16:TP=-1.5:LRA=11", "-ar", "48000", str(a.previa)], check=True)

    total = len(amostras) / 2 / taxa
    (a.pasta / "tempos.json").write_text(
        json.dumps({"origem": f"estimado com a voz sintética {cfg['voz']}", "total": round(total, 3), "falas": tempos}, ensure_ascii=False, indent=1) + "\n",
        encoding="utf-8",
    )
    escrever_roteiro(cfg, a.pasta / "roteiro-elevenlabs.md")
    print(f"ok: {len(tempos)} falas, {total / 60:.1f} min")


if __name__ == "__main__":
    main()
