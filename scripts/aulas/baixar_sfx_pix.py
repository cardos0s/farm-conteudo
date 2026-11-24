#!/usr/bin/env python3
"""Baixa os efeitos sonoros do Reel do Pix do pacote SFX Kit (github.com/wyzowl/sfx-kit, licença CC0).

Para cada efeito usado no vídeo, baixa o WAV, confere o sha256 publicado no pacote e grava em
public/aulas/pix/sfx/<chave>.wav (fora do git). Também gera remotion/aulas/pix/sfx.json com a
duração e o ponto de sincronia de cada som (o instante do som que deve cair no momento da tela),
usado por remotion/aulas/pix/Sons.tsx.

Uso: python3 scripts/aulas/baixar_sfx_pix.py
"""
import hashlib
import json
import os
import urllib.request

BASE = "https://raw.githubusercontent.com/wyzowl/sfx-kit/HEAD/"
RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DEST = os.path.join(RAIZ, "public", "aulas", "pix", "sfx")
MAPA = os.path.join(RAIZ, "remotion", "aulas", "pix", "sfx.json")

# chave usada no vídeo -> nome do som no SFX Kit
ESCOLHA = {
    "whoosh_suave": "Whoosh, slow and soft",
    "whoosh_forte": "Whoosh, medium and hard",
    "whoosh_entrada": "Whoosh, slow and hard",
    "whoosh_troca": "Whoosh, medium and soft",
    "whoosh_rapido": "Whoosh, fast and medium",
    "zip_forte": "Zip in, hard",
    "zip_medio": "Zip in, medium",
    "zip_sai": "Zip out, hard",
    "swish": "Swish, hard",
    "tambor": "Cinematic drum hit, big",
    "tambor_enorme": "Cinematic drum hit, massive",
    "brilho": "Shimmer, medium, sparkle",
    "riser_1s": "Riser, 1 s, strong",
    "reverso": "Reverse whoosh, medium and strong",
    "boom": "Boom hit, strong",
    "boom_medio": "Boom hit, medium",
    "boom_queda": "Boom drop, strong",
    "baixo_808": "808-style bass, long",
    "tique_rapido": "Fast ticking",
    "relogio": "Clock ticking",
    "desliga": "Power down",
    "murcha": "Failure, deflate",
    "womp": "Failure, wobble",
    "nope": "Failure, knock",
    "cartao": "Card payment tap",
    "caixa": "Cash register",
    "ding_ding": "Success, ding-ding",
    "alarme": "Security breach",
    "negado": "Access denied",
    "pop_grande": "Pop in, large",
    "pop_medio": "Pop in, medium",
    "pop_pequeno": "Pop in, small",
    "bolha_ok": "Success, bubble",
    "lapis": "Pencil writing",
    "caneta": "Pen writing",
    "marcador": "Whiteboard marker writing",
    "digitando": "Typing, quick, medium",
    "digitando_curto": "Typing, steady, short",
    "enter": "Return key, firm",
    "processando": "Process, clear",
    "scan": "Scan, subtle",
    "mensagem": "Message arriving, clear",
    "mensagem_suave": "Message arriving, soft",
    "sucesso": "Success, clear",
    "sucesso_suave": "Success, soft",
    "numero": "Number landing",
    "impacto": "Impact, medium, on a hard surface",
    "assinatura": "Logo sting, minimal, short",
    "assinatura_brilho": "Logo sting, bright, short",
    "enviado": "Message sent, clear",
}


def baixar(url):
    with urllib.request.urlopen(url, timeout=60) as r:
        return r.read()


def main():
    os.makedirs(DEST, exist_ok=True)
    dados = json.loads(baixar(BASE + "sounds.json"))
    sons = dados["sounds"] if isinstance(dados, dict) else dados
    por_nome = {s["name"]: s for s in sons}
    mapa = {}
    for chave, nome in ESCOLHA.items():
        s = por_nome[nome]
        destino = os.path.join(DEST, chave + ".wav")
        conteudo = baixar(BASE + s["file"])
        if hashlib.sha256(conteudo).hexdigest() != s["sha256"]:
            raise SystemExit(f"sha256 não confere: {nome}")
        with open(destino, "wb") as f:
            f.write(conteudo)
        sync = s["sync"]["at"] if isinstance(s["sync"], dict) else float(s["sync"])
        mapa[chave] = {"nome": nome, "duracao": round(float(s["duration"]), 3), "sync": round(float(sync), 3)}
        print("ok:", chave, "<-", nome)
    with open(MAPA, "w", encoding="utf-8") as f:
        json.dump(mapa, f, ensure_ascii=False, indent=2)
        f.write("\n")
    print("mapa:", MAPA)


if __name__ == "__main__":
    main()
