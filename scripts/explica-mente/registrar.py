"""Registra um episódio do Explica, Mente! em remotion/Root.tsx (se ainda não estiver).
Uso: python3 scripts/explica-mente/registrar.py <pasta-do-episodio>"""
import os
import sys

ep = sys.argv[1]
raiz = os.path.join(os.path.dirname(__file__), "..", "..")
caminho = os.path.join(raiz, "remotion/Root.tsx")
s = open(caminho, encoding="utf-8").read()
ident = f"ExplicaMente{ep[0].upper()}{ep[1:]}"
if f'id="{ident}"' in s:
    sys.exit(0)
total = f"TOTAL_{ep.upper()}"
s = s.replace('import { exemplos } from "./exemplos";', f'import {{ {ident}, TOTAL as {total} }} from "./explica-mente/{ep}/Video";\nimport {{ exemplos }} from "./exemplos";', 1)
marca = "    {/* versões em primeira pessoa */}\n"
s = s.replace(marca, marca + f'    <Composition id="{ident}" component={{{ident}}} width={{1080}} height={{1920}} fps={{FPS_EM}} durationInFrames={{{total}}} />\n', 1)
open(caminho, "w", encoding="utf-8").write(s)
print("registrado:", ident)
