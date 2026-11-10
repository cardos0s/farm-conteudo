"""Os três casos de teste, com as respostas gravadas do juiz, dão o resultado esperado."""

import json

import pytest

from avaliar import AQUI, CASOS, avaliar, ler, pasta_gravacoes

V1 = json.loads((AQUI / "baseline" / "resumo_comercial.v1.json").read_text(encoding="utf-8"))
V2 = json.loads((AQUI / "baseline" / "resumo_comercial.v2.json").read_text(encoding="utf-8"))
CONVERSA = ler(CASOS["conversa"])


def rodar(baseline, caso, n):
    gravacao = json.loads((pasta_gravacoes(baseline, caso) / f"execucao{n}.json").read_text(encoding="utf-8"))
    return avaliar(baseline, CONVERSA, ler(CASOS["casos"][caso]["resumo"]), gravacao["veredito"])


@pytest.mark.parametrize("baseline", [V1, V2], ids=["v1", "v2"])
@pytest.mark.parametrize("caso", list(CASOS["casos"]))
def test_evidencias_das_gravacoes_existem(baseline, caso):
    """Toda evidência gravada existe no texto, menos a inventada de propósito (v1, inventado, execução 2)."""
    for n in (1, 2, 3):
        for r in rodar(baseline, caso, n)["resultados"]:
            invalidas = [e["quote"] for e in r["evidence"] if not e["encontrado"]]
            if (baseline["versao"], caso, n, r["check_id"]) == (1, "inventado", 2, "C03"):
                assert invalidas == ["consigo 15% de desconto no plano anual"]
            else:
                assert invalidas == [], (caso, n, r["check_id"])


@pytest.mark.parametrize("caso", list(CASOS["casos"]))
def test_v2_bate_com_o_gabarito_nas_tres_execucoes(caso):
    esperado = CASOS["casos"][caso]
    for n in (1, 2, 3):
        execucao = rodar(V2, caso, n)
        assert {r["check_id"]: r["passed"] for r in execucao["resultados"]} == esperado["esperado"]
        assert execucao["score"] == esperado["score"]


def test_v1_execucao_3_do_incompleto_diverge_em_C02():
    resultados = rodar(V1, "incompleto", 3)["resultados"]
    assert next(r for r in resultados if r["check_id"] == "C02")["passed"] is True


def test_v1_gate_corrige_o_juiz_no_inventado():
    execucao = rodar(V1, "inventado", 2)
    assert execucao["score_bruto"] == 0.6667
    assert execucao["score"] == 0.1667
