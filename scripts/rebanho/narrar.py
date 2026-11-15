"""Gera a narração do Reel "pesar o gado sem balança" na ElevenLabs (voz Davi).

Uma fala por cena, com o tempo de cada palavra, para a animação sincronizar com a voz.
Uso: ELEVENLABS_API_KEY=... python3 scripts/rebanho/narrar.py [cena ...]
Saída: public/rebanho/pesagem/voz-<n>.mp3 e remotion/rebanho/pesagem/voz.json
"""
import base64, json, os, sys, urllib.request
from pathlib import Path

VOZ = "oEsckB1qnZLLgr62fEmR"  # Davi
MODELO = "eleven_multilingual_v2"
FALAS = [
    "Bora pesar o gado sem balança? Vem comigo!",
    "Chuta aí nos comentários: quanto pesa esse aqui? Abro o app do Rebanho, enquadro o boi... e foto! Olha isso: quinhentos e doze quilos! Sem tronco, sem balança, sem estresse pro boi.",
    "Bora pro próximo! Esse aqui... quatrocentos e oitenta. E esse... quinhentos e quarenta!",
    "É assim que a gente acompanha o peso do rebanho. Segue o Rebanho que tem mais!",
]
RAIZ = Path(__file__).resolve().parents[2]
AUDIO = RAIZ / "public/rebanho/pesagem"
JSON = RAIZ / "remotion/rebanho/pesagem/voz.json"


def palavras(al):
    """Agrupa o alinhamento por caractere em palavras com início e fim (segundos)."""
    saida, atual = [], None
    for c, i, f in zip(al["characters"], al["character_start_times_seconds"], al["character_end_times_seconds"]):
        if c.isspace():
            if atual: saida.append(atual); atual = None
            continue
        if atual is None: atual = {"p": "", "i": round(i, 3), "f": f}
        atual["p"] += c
        atual["f"] = round(f, 3)
    if atual: saida.append(atual)
    return saida


def gerar(n):
    corpo = {
        "text": FALAS[n],
        "model_id": MODELO,
        "voice_settings": {"stability": 0.4, "similarity_boost": 0.8, "style": 0.35, "use_speaker_boost": True, "speed": 1.08},
        "previous_text": " ".join(FALAS[:n]) or None,
        "next_text": " ".join(FALAS[n + 1:]) or None,
    }
    req = urllib.request.Request(
        f"https://api.elevenlabs.io/v1/text-to-speech/{VOZ}/with-timestamps?output_format=mp3_44100_192",
        data=json.dumps({k: v for k, v in corpo.items() if v is not None}).encode(),
        headers={"xi-api-key": os.environ["ELEVENLABS_API_KEY"], "Content-Type": "application/json"},
    )
    r = json.load(urllib.request.urlopen(req, timeout=120))
    (AUDIO / f"voz-{n + 1}.mp3").write_bytes(base64.b64decode(r["audio_base64"]))
    al = r["alignment"]
    return {"arquivo": f"rebanho/pesagem/voz-{n + 1}.mp3", "texto": FALAS[n], "duracao": round(al["character_end_times_seconds"][-1], 3), "palavras": palavras(al)}


AUDIO.mkdir(parents=True, exist_ok=True)
dados = json.loads(JSON.read_text()) if JSON.exists() else [None] * len(FALAS)
for n in [int(a) - 1 for a in sys.argv[1:]] or range(len(FALAS)):
    dados[n] = gerar(n)
    print(n + 1, dados[n]["duracao"], "s")
JSON.write_text(json.dumps(dados, ensure_ascii=False, indent=1) + "\n")
