"""Gera a narração dos Reels do Rebanho na ElevenLabs (voz Davi).

Uma fala por cena, com o tempo de cada palavra, para a animação sincronizar com a voz.
Uso: ELEVENLABS_API_KEY=... python3 scripts/rebanho/narrar.py [video] [cena ...]
     video: pesagem (padrão) | confinamento | rotacionado | arroba | fases | seca
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
    "rotacionado": [
        "Sabe por que o pasto rotacionado engorda mais boi na mesma área? Vem comigo que eu te mostro!",
        "No pasto contínuo o gado escolhe o que come. Rapa o capim novo, larga o velho, e o pasto vai falhando.",
        "No rotacionado a área é dividida em piquetes, com cerca elétrica. O gado pasta um piquete de cada vez, enquanto os outros descansam.",
        "O segredo é a altura do capim. No marandu, o gado entra com uns trinta centímetros e sai com quinze. Nunca rapa até o chão.",
        "É essa folha que sobra que faz o capim rebrotar rápido. Aí o piquete descansa uns trinta dias nas águas, e mais tempo na seca.",
        "Cada piquete precisa de água e sal por perto. Pode ser uma praça de alimentação no meio, com acesso de todos os piquetes.",
        "Com capim sempre no ponto, a lotação sobe. De uma unidade animal por hectare no contínuo, um rotacionado bem manejado e adubado pode passar de três.",
        "No Rebanho eu marco em que piquete o lote está, quantos dias faltam pra trocar, e acompanho o peso. É assim que o pasto vira arroba. Segue o Rebanho que tem mais!",
    ],
    "arroba": [
        "Você sabe quantas arrobas tem esse boi? A conta é simples, mas muita gente erra. Vem comigo!",
        "Primeiro: a arroba do boi gordo são quinze quilos de carcaça, não de peso vivo.",
        "Carcaça é o que sobra depois do abate, sem couro, cabeça, patas e vísceras. A parte do peso vivo que vira carcaça se chama rendimento.",
        "No nelore bem acabado, o rendimento fica em torno de cinquenta e quatro por cento. Varia com a raça, o acabamento e o tempo de jejum.",
        "Então olha a conta. Esse boi pesa quinhentos e quarenta quilos. Vezes cinquenta e quatro por cento, dá duzentos e noventa e dois quilos de carcaça.",
        "Dividindo por quinze: dezenove arrobas e meia.",
        "Tem um atalho de curral: dividir o peso vivo por trinta. Dá dezoito arrobas. Mas ele considera só cinquenta por cento de rendimento, então boi bom sempre rende mais que o atalho.",
        "No Rebanho, a foto dá o peso e o app já mostra as arrobas do lote, com o rendimento que você escolher. Segue o Rebanho que tem mais!",
    ],
    "fases": [
        "Do bezerro ao boi gordo são três fases, e cada uma tem um peso pra bater. Vem comigo que eu te mostro!",
        "A primeira é a cria. O bezerro nasce com uns trinta e cinco quilos e fica ao pé da vaca, mamando e aprendendo a pastar.",
        "Com sete a oito meses vem a desmama. A meta é chegar nela com uns duzentos quilos.",
        "Depois começa a recria. É a fase em que o animal cresce: faz osso, músculo e carcaça, quase sempre no pasto, com suplemento.",
        "É a fase mais longa e a que mais atrasa o boi. Garrote que passa fome na seca demora muito mais pra ficar pronto.",
        "Com uns trezentos e oitenta quilos ele entra na engorda, no pasto ou no confinamento. Agora o objetivo é ganhar peso rápido e fazer acabamento de gordura.",
        "E sai com uns quinhentos e quarenta quilos, pronto pro abate. Num sistema bem conduzido, isso acontece antes dos trinta meses.",
        "No Rebanho eu acompanho o peso em cada fase e vejo na hora quem está atrasado. Segue o Rebanho que tem mais!",
    ],
    "seca": [
        "Por que o boi emagrece na seca, mesmo com pasto na frente dele? Vem comigo que eu te explico!",
        "Nas águas o capim é verde, tem proteína e energia, e o boi ganha peso só no pasto com sal mineral.",
        "Na seca o capim seca e a proteína despenca. Sem proteína, o rúmen não consegue digerir a fibra, e o boi come menos.",
        "O resultado é o boi sanfona: ganha nas águas, perde na seca, e demora um ano a mais pra ficar pronto.",
        "A saída é o proteinado no cocho. Ele dá a proteína que falta, e o boi volta a aproveitar o capim seco.",
        "A conta é mais ou menos um grama por quilo de peso vivo. Um boi de quatrocentos quilos come uns quatrocentos gramas por dia.",
        "Mas atenção: o cocho tem que ser coberto, ter espaço pra todo mundo, e precisa ter capim seco sobrando no pasto. Suplemento não substitui pasto.",
        "Com isso, em vez de perder, o boi segura o peso e ainda ganha um pouco. No Rebanho eu comparo o ganho das águas com o da seca e vejo se o suplemento está pagando. Segue o Rebanho que tem mais!",
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
