"""Baixa todos os vídeos de uma pasta pública do Google Drive e remove cópias idênticas.

Uso: python3 scripts/aulas/baixar_drive.py <url-da-pasta> <pasta-de-trabalho>
Requer: pip install gdown
Os arquivos ficam em <pasta-de-trabalho>/originais/. Arquivos com o mesmo nome são baixados
pelo ID (o Drive permite nomes repetidos); cópias byte a byte idênticas são descartadas.
"""
import hashlib
import os
import sys

import gdown

url, pasta = sys.argv[1], sys.argv[2]
destino = os.path.join(pasta, "originais")
os.makedirs(destino, exist_ok=True)

itens = gdown.download_folder(url=url, skip_download=True, quiet=True)
vistos = {}
for item in itens:
    base, ext = os.path.splitext(os.path.basename(item.path))
    caminho = os.path.join(destino, f"{base}__{item.id[:6]}{ext}")
    gdown.download(id=item.id, output=caminho, quiet=True, resume=True)
    h = hashlib.md5()
    with open(caminho, "rb") as f:
        for bloco in iter(lambda: f.read(1 << 20), b""):
            h.update(bloco)
    if h.hexdigest() in vistos:
        os.remove(caminho)
        print(f"cópia idêntica descartada: {item.path} ({item.id})")
        continue
    final = os.path.join(destino, base + ext)
    if os.path.exists(final):
        final = caminho  # mesmo nome, conteúdo diferente: mantém o sufixo do ID
    else:
        os.rename(caminho, final)
    vistos[h.hexdigest()] = final
    print(f"ok: {final}")
