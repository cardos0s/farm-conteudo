"""Parte A da aula: o juiz.

O juiz recebe o baseline (os checks), a conversa original e o resumo, e devolve, para cada
check, as evidências, o raciocínio e um SIM/NÃO. Ele não dá nota: a nota é calculada depois,
em Python (score.py), a partir dessas respostas.
"""

from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Literal

import anthropic
from pydantic import BaseModel

AQUI = Path(__file__).parent
MODELO_JUIZ = os.environ.get("JUIZ_MODEL", "claude-opus-5-5")


# O formato da resposta. O SDK transforma estas classes num JSON Schema e a API garante que a
# resposta segue o schema. A ordem dos campos é proposital: evidência, raciocínio e só então o veredito.
class Evidencia(BaseModel):
    source: Literal["conversa", "resumo"]
    quote: str


class ResultadoCheck(BaseModel):
    check_id: str
    evidence: list[Evidencia]
    reasoning: str
    passed: bool


class Veredito(BaseModel):
    results: list[ResultadoCheck]


def checks_do_juiz(baseline: dict) -> list[dict]:
    """Só os checks que precisam de julgamento. Os de código (verified_by = codigo) o Python resolve sozinho."""
    return [c for c in baseline["checks"] if c["verified_by"] == "juiz"]


def montar_prompt(baseline: dict, conversa: str, resumo: str) -> str:
    checks = [
        {"id": c["id"], "description": c["description"], "pass_condition": c["pass_condition"]}
        for c in checks_do_juiz(baseline)
    ]
    modelo = (AQUI / "prompts" / "juiz.md").read_text(encoding="utf-8")
    return (
        modelo.replace("{checks}", json.dumps(checks, ensure_ascii=False, indent=2))
        .replace("{conversa}", conversa.strip())
        .replace("{resumo}", resumo.strip())
    )


def julgar(baseline: dict, conversa: str, resumo: str) -> tuple[Veredito, str]:
    """Uma avaliação, em estado limpo: cada chamada é uma conversa nova, sem histórico.

    Devolve o veredito e o modelo que respondeu (pode ser o de reserva, se o principal recusar).
    """
    cliente = anthropic.Anthropic()
    resposta = cliente.beta.messages.parse(
        model=MODELO_JUIZ,
        max_tokens=16000,
        # Rede de segurança: se o modelo recusar o pedido por política, a API refaz no modelo de reserva.
        betas=["server-side-fallback-2026-07-01"],
        fallbacks="default",
        output_config={"effort": "high"},
        messages=[{"role": "user", "content": montar_prompt(baseline, conversa, resumo)}],
        output_format=Veredito,
    )
    if resposta.stop_reason == "refusal":
        raise RuntimeError("O juiz recusou o pedido")
    if resposta.stop_reason == "max_tokens":
        raise RuntimeError("A resposta do juiz foi cortada (max_tokens)")
    if resposta.parsed_output is None:
        raise RuntimeError("A resposta do juiz veio fora do formato")
    return resposta.parsed_output, resposta.model
