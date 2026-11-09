"""Gera a locução de um vídeo com a ElevenLabs, com o tempo de cada letra para legenda e animação.

Uso:
    python3 scripts/telas/locucao.py <falas.json> <pasta-saida>

falas.json:
    {
      "modelo": "eleven_v3",
      "vozes": {"narrador": "<voice_id>", "lia": "<voice_id>"},
      "ajustes": {"narrador": {"stability": 0.45, "style": 0.25, "speed": 1.0}},
      "pronuncia": {"Selloop": "Sél-lup"},
      "falas": [{"id": "v1-01", "voz": "narrador", "texto": "Na Selloop, tudo chega no mesmo lugar."}]
    }

`pronuncia` troca palavras só no texto falado; a legenda mostra o texto original.
Para cada fala salva <id>.mp3 e escreve <pasta-saida>/locucao.json com a duração, as palavras e os
trechos de legenda (tempos relativos ao início da fala). Uma fala que não mudou não é gerada de novo.
Precisa de ELEVENLABS_API_KEY no ambiente.
"""

import base64
import hashlib
import json
import os
import re
import sys
import urllib.error
import urllib.request

API = "https://api.elevenlabs.io/v1/text-to-speech/{voz}/with-timestamps?output_format=mp3_44100_128"
MAX_LEGENDA = 58  # caracteres por trecho de legenda


def falar(texto, voz, modelo, ajustes):
    corpo = {"text": texto, "model_id": modelo}
    if ajustes:
        corpo["voice_settings"] = {"similarity_boost": 0.8, "use_speaker_boost": True, **ajustes}
    req = urllib.request.Request(
        API.format(voz=voz),
        data=json.dumps(corpo).encode(),
        method="POST",
        headers={"xi-api-key": os.environ["ELEVENLABS_API_KEY"], "Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(req, timeout=300) as r:
            return json.load(r)
    except urllib.error.HTTPError as e:
        raise SystemExit(f"ElevenLabs recusou a fala ({e.code}): {e.read()[:300]!r}")


def falado_com_mapa(texto, pronuncia):
    """Aplica a pronúncia e devolve o texto falado e, para cada letra do original, o índice no falado."""
    falado, mapa, i = [], [], 0
    padrao = re.compile("|".join(re.escape(k) for k in sorted(pronuncia, key=len, reverse=True))) if pronuncia else None
    while i < len(texto):
        m = padrao.match(texto, i) if padrao else None
        if m:
            troca = pronuncia[m.group(0)]
            for k in range(len(m.group(0))):
                mapa.append(len(falado) + min(k, len(troca) - 1))
            falado.extend(troca)
            i = m.end()
        else:
            mapa.append(len(falado))
            falado.append(texto[i])
            i += 1
    mapa.append(len(falado))
    return "".join(falado), mapa


def trechos(texto):
    """Divide o texto em trechos de legenda: frases, e frases longas na vírgula ou no meio."""
    partes = []
    for m in re.finditer(r"[^.!?…]+[.!?…]*\s*", texto):
        frase = m.group(0)
        ini = m.start()
        while len(frase.strip()) > MAX_LEGENDA:
            corte = max((p.end() for p in re.finditer(r",\s|:\s|\s—\s|\se\s", frase[: MAX_LEGENDA + 1])), default=0)
            if corte < 15:
                corte = frase.rfind(" ", 0, MAX_LEGENDA) + 1
            partes.append((ini, ini + corte))
            ini += corte
            frase = frase[corte:]
        partes.append((ini, ini + len(frase)))
    return [(a, b) for a, b in partes if texto[a:b].strip()]


def principal():
    if len(sys.argv) < 3:
        raise SystemExit(__doc__)
    cfg = json.load(open(sys.argv[1], encoding="utf-8"))
    saida = sys.argv[2]
    os.makedirs(saida, exist_ok=True)
    manifesto_arq = os.path.join(saida, "locucao.json")
    anterior = {f["id"]: f for f in json.load(open(manifesto_arq, encoding="utf-8"))["falas"]} if os.path.exists(manifesto_arq) else {}
    modelo = cfg.get("modelo", "eleven_v3")
    pronuncia = cfg.get("pronuncia", {})
    resultado = []
    for f in cfg["falas"]:
        voz = cfg["vozes"][f["voz"]]
        ajustes = {**cfg.get("ajustes", {}).get(f["voz"], {}), **f.get("ajustes", {})}
        falado, mapa = falado_com_mapa(f["texto"], {**pronuncia, **f.get("pronuncia", {})})
        assinatura = hashlib.sha1(json.dumps([falado, voz, modelo, ajustes], sort_keys=True).encode()).hexdigest()[:12]
        mp3 = os.path.join(saida, f"{f['id']}.mp3")
        if f["id"] in anterior and anterior[f["id"]].get("assinatura") == assinatura and os.path.exists(mp3):
            resultado.append(anterior[f["id"]])
            print(f"= {f['id']} (sem mudança)")
            continue
        d = falar(falado, voz, modelo, ajustes)
        open(mp3, "wb").write(base64.b64decode(d["audio_base64"]))
        al = d["alignment"]
        ini_t, fim_t = al["character_start_times_seconds"], al["character_end_times_seconds"]
        n = len(ini_t)
        t_ini = lambda j: ini_t[min(j, n - 1)]
        t_fim = lambda j: fim_t[min(max(j, 0), n - 1)]
        palavras = [
            {"texto": m.group(0), "de": round(t_ini(mapa[m.start()]), 3), "ate": round(t_fim(mapa[m.end()] - 1), 3)}
            for m in re.finditer(r"\S+", f["texto"])
        ]
        legendas = [
            {"texto": f["texto"][a:b].strip(), "de": round(t_ini(mapa[a]), 3), "ate": round(t_fim(mapa[b] - 1), 3)}
            for a, b in trechos(f["texto"])
        ]
        item = {
            "id": f["id"],
            "voz": f["voz"],
            "texto": f["texto"],
            "arquivo": os.path.basename(mp3),
            "duracao": round(fim_t[-1], 3),
            "palavras": palavras,
            "legendas": legendas,
            "assinatura": assinatura,
        }
        resultado.append(item)
        print(f"+ {f['id']} · {item['duracao']:.1f} s · {len(legendas)} legendas")
    json.dump({"modelo": modelo, "falas": resultado}, open(manifesto_arq, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"Manifesto: {manifesto_arq}")


if __name__ == "__main__":
    principal()
