"""Parte C da aula: a matemática sai do LLM.

O juiz só responde SIM ou NÃO por check. A pontuação é uma conta simples, feita aqui,
que dá sempre o mesmo número para as mesmas respostas.
"""

from __future__ import annotations

from statistics import mean, pstdev


def calculate_score(checks, results):
    passed = {r["check_id"]: r["passed"] for r in results}
    total = sum(c["weight"] for c in checks)
    earned = sum(
        c["weight"]
        for c in checks
        if passed.get(c["id"], False)
    )
    return round(earned / total, 4) if total else 0


def comparar_execucoes(checks, execucoes):
    """Compara várias avaliações do MESMO resumo com o MESMO baseline.

    execucoes: lista de listas de resultados, uma lista por execução.
    A média diz "quanto", a concordância diz "o quanto dá para confiar".
    """
    scores = [calculate_score(checks, resultados) for resultados in execucoes]
    concordancia = {}
    for c in checks:
        votos = [
            next((r["passed"] for r in resultados if r["check_id"] == c["id"]), False)
            for resultados in execucoes
        ]
        maioria = max(votos.count(True), votos.count(False))
        concordancia[c["id"]] = round(maioria / len(votos), 4)
    return {
        "scores": scores,
        "media": round(mean(scores), 4),
        "desvio": round(pstdev(scores), 4),
        "minimo": min(scores),
        "maximo": max(scores),
        "concordancia": concordancia,
        "instaveis": [cid for cid, valor in concordancia.items() if valor < 1],
    }
