"""Parte B da aula: não confiar na palavra do juiz.

1. Cada trecho citado como evidência precisa existir, de verdade, no texto de onde diz ter vindo.
2. Um check só pode passar se tiver evidência válida de cada fonte exigida pelo baseline.
3. Check sem resposta do juiz conta como reprovado.

Atenção: isto prova que o trecho EXISTE, não que ele SUSTENTA a conclusão. Essa segunda parte
continua sendo julgamento (do juiz e de quem revisa o relatório).
"""

from __future__ import annotations

import re
import unicodedata

PALAVRAS_MINIMAS = 3  # "sim" ou "R$ 890" sozinhos não provam nada
DA = {"conversa": "da conversa", "resumo": "do resumo"}

_ASPAS = re.compile(r"[\"“”'‘’«»]")
_ESPACOS = re.compile(r"\s+")


def normalizar(texto: str) -> str:
    """Ignora diferenças que não mudam o sentido: maiúsculas, aspas, espaços e pontuação nas pontas."""
    t = unicodedata.normalize("NFC", texto).casefold()
    t = _ASPAS.sub("", t)
    t = _ESPACOS.sub(" ", t)
    return t.strip(" .,;:!?…-")


def localizar(trecho: str, texto: str) -> int | None:
    """Linha (contando de 1) em que o trecho começa, ou None se ele não estiver no texto."""
    alvo = normalizar(trecho)
    if len(alvo.split()) < PALAVRAS_MINIMAS:
        return None
    linhas = texto.splitlines()
    for n, linha in enumerate(linhas, start=1):
        if alvo in normalizar(linha):
            return n
    # Trecho que atravessa linhas: a última linha a partir da qual ele ainda aparece é onde começa.
    inicio = None
    for n in range(1, len(linhas) + 1):
        if alvo in normalizar(" ".join(linhas[n - 1 :])):
            inicio = n
    return inicio


def aplicar_gates(checks: list[dict], veredito: dict, textos: dict[str, str]) -> tuple[list[dict], list[str]]:
    """Confere o veredito do juiz contra os textos originais.

    checks: os checks do baseline avaliados pelo juiz.
    veredito: {"results": [{"check_id", "evidence", "reasoning", "passed"}, ...]}
    textos: {"conversa": ..., "resumo": ...}

    Devolve os resultados finais (um por check, na ordem do baseline) e os ids que o juiz
    respondeu mas que não existem no baseline.
    """
    respostas: dict[str, dict] = {}
    for r in veredito["results"]:
        respostas.setdefault(r["check_id"], r)  # se o juiz repetir um id, vale a primeira resposta
    ids = {c["id"] for c in checks}
    ignorados = sorted(set(respostas) - ids)

    finais = []
    for check in checks:
        r = respostas.get(check["id"])
        if r is None:
            finais.append({
                "check_id": check["id"], "verified_by": "juiz", "passed": False, "passed_juiz": None,
                "evidence": [], "reasoning": "", "alerta": "o juiz não respondeu este check",
            })
            continue

        evidencias = []
        for e in r["evidence"]:
            linha = localizar(e["quote"], textos.get(e["source"], ""))
            evidencias.append({**e, "encontrado": linha is not None, "linha": linha})

        passed, alerta = r["passed"], None
        if passed:
            faltando = [
                fonte for fonte in check.get("evidence_required", [])
                if not any(e["encontrado"] and e["source"] == fonte for e in evidencias)
            ]
            if faltando:
                passed = False
                alerta = "rebaixado: o juiz aprovou sem evidência válida " + " e ".join(DA[f] for f in faltando)

        finais.append({
            "check_id": check["id"], "verified_by": "juiz", "passed": passed, "passed_juiz": r["passed"],
            "evidence": evidencias, "reasoning": r["reasoning"], "alerta": alerta,
        })
    return finais, ignorados
