"""Gera a narração dos Reels do Rebanho na ElevenLabs (voz Davi).

Uma fala por cena, com o tempo de cada palavra, para a animação sincronizar com a voz.
Uso: ELEVENLABS_API_KEY=... python3 scripts/rebanho/narrar.py [video] [cena ...]
     video: pesagem (padrão) | confinamento
Saída: public/rebanho/<video>/voz-<n>.mp3 e remotion/rebanho/<video>/voz.json
"""
import base64, json, os, sys, urllib.request
from pathlib import Path

VOZ = "oEsckB1qnZLLgr62fEmR"  # Davi
MODELO = "eleven_multilingual_v2"
ROTEIROS = {
    "pesagem": [
        "Bora pesar o gado sem balança? Vem comigo!",
        "Chuta aí nos comentários: quanto pesa esse aqui? Abro o app do Rebanho, enquadro o boi... e foto! Olha isso: quinhentos e doze quilos! Sem tronco, sem balança, sem estresse pro boi.",
        "Bora pro próximo! Esse aqui... quatrocentos e oitenta. E esse... quinhentos e quarenta!",
        "É assim que a gente acompanha o peso do rebanho. Segue o Rebanho que tem mais!",
    ],
    "confinamento": [
        "Já viu um confinamento por dentro? Vem comigo que eu te mostro!",
        "O gado chega do pasto com uns trezentos e oitenta quilos e é separado em lotes, por peso.",
        "Os primeiros quinze dias são de adaptação: a dieta vai mudando aos poucos, do volumoso pro concentrado.",
        "Todo dia cedo tem a leitura de cocho. Sobrou muito? Diminui o trato. Raspou? Aumenta.",
        "Aí vem o trato, várias vezes por dia: silagem, milho, farelo e núcleo mineral, tudo misturado no vagão. E água limpa à vontade.",
        "E a evolução a gente acompanha no Rebanho. Uma foto por mês... e olha isso: de trezentos e oitenta pra quinhentos e quarenta quilos em cem dias. Um quilo e seiscentos por dia!",
        "É assim que se termina boi no confinamento. Segue o Rebanho que tem mais!",
    ],
}
args = sys.argv[1:]
VIDEO = args.pop(0) if args and args[0] in ROTEIROS else "pesagem"
FALAS = ROTEIROS[VIDEO]
RAIZ = Path(__file__).resolve().parents[2]
AUDIO = RAIZ / f"public/rebanho/{VIDEO}"
JSON = RAIZ / f"remotion/rebanho/{VIDEO}/voz.json"


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
        "voice_settings": {"stability": 0.5, "similarity_boost": 0.9, "style": 0.0, "use_speaker_boost": True, "speed": 1.0},
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
    return {"arquivo": f"rebanho/{VIDEO}/voz-{n + 1}.mp3", "texto": FALAS[n], "duracao": round(al["character_end_times_seconds"][-1], 3), "palavras": palavras(al)}


AUDIO.mkdir(parents=True, exist_ok=True)
JSON.parent.mkdir(parents=True, exist_ok=True)
dados = json.loads(JSON.read_text()) if JSON.exists() else [None] * len(FALAS)
for n in [int(a) - 1 for a in args] or range(len(FALAS)):
    dados[n] = gerar(n)
    print(n + 1, dados[n]["duracao"], "s")
JSON.write_text(json.dumps(dados, ensure_ascii=False, indent=1) + "\n")
