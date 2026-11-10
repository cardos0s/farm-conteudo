"""O implementador: o agente que resume conversas comerciais.

É o sistema avaliado. Ele nunca vê o baseline nem o prompt do juiz, e o juiz nunca vê este prompt.

    python agente.py casos/conversa.txt
"""

from __future__ import annotations

import os
import sys
from pathlib import Path

import anthropic

AQUI = Path(__file__).parent
MODELO_AGENTE = os.environ.get("AGENTE_MODEL", "claude-opus-5-5")


def resumir(conversa: str) -> str:
    cliente = anthropic.Anthropic()
    resposta = cliente.beta.messages.create(
        model=MODELO_AGENTE,
        max_tokens=16000,
        betas=["server-side-fallback-2026-07-01"],
        fallbacks="default",
        system=(AQUI / "prompts" / "agente.md").read_text(encoding="utf-8"),
        messages=[{"role": "user", "content": f"<conversa>\n{conversa.strip()}\n</conversa>"}],
    )
    if resposta.stop_reason == "refusal":
        raise RuntimeError("O agente recusou o pedido")
    return "".join(b.text for b in resposta.content if b.type == "text").strip()


if __name__ == "__main__":
    caminho = Path(sys.argv[1]) if len(sys.argv) > 1 else AQUI / "casos" / "conversa.txt"
    print(resumir(caminho.read_text(encoding="utf-8")))
