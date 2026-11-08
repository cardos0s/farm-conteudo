"""Prepara a narração dos Reels do WhatsApp: transcreve cada MP3 com tempo por palavra
(faster-whisper), corrige o que a transcrição erra e grava o JSON que o vídeo usa.

    python3 materiais/whatsapp/narracao.py parte1.mp3 parte2.mp3 parte3.mp3

- guarda o áudio original e a transcrição crua em saida/materiais/narracao/ (a transcrição é
  reaproveitada enquanto o áudio for o mesmo);
- nas partes listadas em PAUSA_MAX, encurta as pausas longas entre frases (só trechos em silêncio);
- grava o áudio final em public/materiais/whatsapp/narracao/parteN.mp3 (fora do git);
- grava remotion/reels/whatsapp/narracao/parteN.json com a duração e as palavras.

Requisitos: ffmpeg e `pip install faster-whisper`.
"""

import hashlib
import json
import subprocess
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[2]
CRU = RAIZ / "saida/materiais/narracao"
AUDIO = RAIZ / "public/materiais/whatsapp/narracao"
SAIDA = RAIZ / "remotion/reels/whatsapp/narracao"

# Pausa máxima entre palavras (s) por parte. A parte 1 ganha ~2 s para caber a intro gravada
# (vídeo da Julia) sem passar de 2:30.
PAUSA_MAX = {1: 0.38}
SR = 44100

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


def sha(arq: Path) -> str:
    return hashlib.sha256(arq.read_bytes()).hexdigest()[:16]


def decodificar(arq: Path):
    import numpy as np

    pcm = subprocess.run(["ffmpeg", "-v", "error", "-i", str(arq), "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(pcm, dtype=np.float32).copy()


def apertar_pausas(fonte: Path, destino: Path, palavras: list[dict], maximo: float) -> list[dict]:
    """Encurta para `maximo` as pausas entre palavras, cortando só o meio silencioso de cada uma."""
    import numpy as np

    x = decodificar(fonte)
    cortes = []
    for a, b in zip(palavras, palavras[1:]):
        if b["s"] - a["e"] <= maximo:
            continue
        ini, fim = a["e"] + maximo / 2, b["s"] - maximo / 2
        trecho = x[int(ini * SR) : int(fim * SR)]
        if trecho.size == 0 or 20 * np.log10(np.sqrt((trecho**2).mean()) + 1e-9) > -42:
            continue  # tem som ali (palavra mal marcada pela transcrição): não corta
        cortes.append((ini, fim))
    pedacos, pos = [], 0
    rampa = int(0.004 * SR)
    for ini, fim in cortes + [(len(x) / SR, len(x) / SR)]:
        p = x[pos : int(ini * SR)].copy()
        if len(p) > 2 * rampa:  # micro fade nas emendas, para não estalar
            p[:rampa] *= np.linspace(0, 1, rampa) if pos else 1
            p[-rampa:] *= np.linspace(1, 0, rampa)
        pedacos.append(p)
        pos = int(fim * SR)
    y = np.concatenate(pedacos)
    subprocess.run(
        ["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-", "-c:a", "libmp3lame", "-b:a", "192k", str(destino)],
        input=y.astype(np.float32).tobytes(),
        check=True,
    )

    def novo(t: float) -> float:
        return round(t - sum(min(max(0.0, t - i), f - i) for i, f in cortes), 3)

    print(f"  {len(cortes)} pausas encurtadas, {sum(f - i for i, f in cortes):.2f} s a menos")
    return [{**p, "s": novo(p["s"]), "e": novo(p["e"])} for p in palavras]


def main(mp3s: list[str]) -> None:
    for pasta in (CRU, AUDIO, SAIDA):
        pasta.mkdir(parents=True, exist_ok=True)
    for n, arq in enumerate(mp3s, 1):
        mp3 = Path(arq)
        fonte = CRU / f"parte{n}.fonte.mp3"
        destino = AUDIO / f"parte{n}.mp3"
        cru = CRU / f"parte{n}.cru.json"
        if mp3.resolve() == destino.resolve():
            # o arquivo em public/ é a saída (talvez já com pausas encurtadas): usa o original guardado
            if not fonte.exists():
                sys.exit(f"parte {n}: passe o MP3 original; {destino} é gerado por este script")
        elif mp3.resolve() != fonte.resolve():
            fonte.write_bytes(mp3.read_bytes())
        chave = sha(fonte)
        dados_cru = json.loads(cru.read_text()) if cru.exists() else None
        if isinstance(dados_cru, list):  # formato antigo, sem a chave do áudio: não dá para confiar
            dados_cru = None
        if not dados_cru or dados_cru["sha"] != chave:
            print(f"transcrevendo parte {n}...")
            dados_cru = {"sha": chave, "palavras": transcrever(fonte)}
        cru.write_text(json.dumps(dados_cru, ensure_ascii=False))
        palavras = corrigir(dados_cru["palavras"])
        if n in PAUSA_MAX:
            palavras = apertar_pausas(fonte, destino, palavras, PAUSA_MAX[n])
        else:
            destino.write_bytes(fonte.read_bytes())
        dados = {"duracao": duracao(destino), "palavras": palavras}
        (SAIDA / f"parte{n}.json").write_text(json.dumps(dados, ensure_ascii=False))
        print(f"parte {n}: {dados['duracao']:.1f} s, {len(palavras)} palavras")


if __name__ == "__main__":
    main(sys.argv[1:])
