#!/usr/bin/env python3
"""Lê um PDF gerado pelo Chromium e imprime, em JSON, a página (começando em 1) de cada âncora.

    python3 paginas.py livro.pdf            -> {"cap-01": 9, "parte-1": 8, ...}
    python3 paginas.py livro.pdf --metadados final.pdf   # grava título/autor e abre com os marcadores

O Chromium cria um destino nomeado para cada elemento com id que recebe link; o sumário linka
todos os capítulos, então todos aparecem aqui.
"""
import json
import sys

from pypdf import PdfReader, PdfWriter
from pypdf.generic import NameObject


def paginas(caminho: str) -> dict:
    leitor = PdfReader(caminho)
    saida = {}
    for nome, destino in leitor.named_destinations.items():
        try:
            saida[str(nome).lstrip("/")] = leitor.get_destination_page_number(destino) + 1
        except Exception:
            continue
    return saida


def metadados(caminho: str):
    escritor = PdfWriter(clone_from=caminho)
    escritor.add_metadata(
        {
            "/Title": "50 Conceitos de System Design",
            "/Author": "Arslan Ahmad (original, DesignGurus); edição de estudo em português",
            "/Subject": "Tradução e expansão de '50 System Design Concepts for Beginners in 90 Minutes'",
            "/Keywords": "system design, arquitetura de software, sistemas distribuídos, entrevista",
        }
    )
    escritor._root_object[NameObject("/PageMode")] = NameObject("/UseOutlines")
    with open(caminho, "wb") as f:
        escritor.write(f)


if __name__ == "__main__":
    if len(sys.argv) >= 3 and sys.argv[2] == "--metadados":
        metadados(sys.argv[1])
    else:
        print(json.dumps(paginas(sys.argv[1])))
