from evidencias import aplicar_gates, localizar, normalizar

CONVERSA = (
    "Marina (vendas): No plano anual eu consigo 10% de desconto. Acima disso, preciso falar com a minha gerente.\n"
    "Roberto (cliente): Então fala com ela, porque eu queria chegar perto de 15%.\n"
)
CHECK = {"id": "C03", "verified_by": "juiz", "evidence_required": ["conversa", "resumo"]}


def test_normalizar_ignora_caixa_aspas_e_espacos():
    assert normalizar('  "No plano   ANUAL eu consigo 10%."  ') == "no plano anual eu consigo 10%"


def test_trecho_literal_e_encontrado_com_linha():
    assert localizar("eu queria chegar perto de 15%", CONVERSA) == 2


def test_trecho_com_rotulo_do_falante_tambem_vale():
    assert localizar("Marina (vendas): No plano anual eu consigo 10% de desconto", CONVERSA) == 1


def test_trecho_alterado_nao_e_encontrado():
    assert localizar("consigo 15% de desconto no plano anual", CONVERSA) is None


def test_trecho_curto_demais_nao_prova_nada():
    assert localizar("10%", CONVERSA) is None
    assert localizar("de desconto", CONVERSA) is None


def test_trecho_que_atravessa_linhas():
    assert localizar("minha gerente. Roberto (cliente): Então fala com ela", CONVERSA) == 1


def veredito(passed, *evidencias):
    return {"results": [{"check_id": "C03", "passed": passed, "reasoning": "...",
                         "evidence": [{"source": s, "quote": q} for s, q in evidencias]}]}


def test_aprovado_com_evidencia_inventada_e_rebaixado():
    v = veredito(True, ("conversa", "consigo 15% de desconto no plano anual"), ("resumo", "ofereceu 15% de desconto"))
    [r], _ = aplicar_gates([CHECK], v, {"conversa": CONVERSA, "resumo": "Marina ofereceu 15% de desconto."})
    assert r["passed_juiz"] is True
    assert r["passed"] is False
    assert "conversa" in r["alerta"]


def test_aprovado_com_evidencias_validas_continua_aprovado():
    v = veredito(True, ("conversa", "No plano anual eu consigo 10% de desconto"), ("resumo", "Marina consegue 10% de desconto"))
    [r], _ = aplicar_gates([CHECK], v, {"conversa": CONVERSA, "resumo": "No plano anual, Marina consegue 10% de desconto."})
    assert r["passed"] is True and r["alerta"] is None
    assert [e["linha"] for e in r["evidence"]] == [1, 1]


def test_reprovado_continua_reprovado_mesmo_com_evidencia_invalida():
    v = veredito(False, ("conversa", "frase que ninguém disse aqui"))
    [r], _ = aplicar_gates([CHECK], v, {"conversa": CONVERSA, "resumo": ""})
    assert r["passed"] is False and r["alerta"] is None


def test_check_sem_resposta_reprova_e_id_desconhecido_e_ignorado():
    v = {"results": [{"check_id": "C99", "passed": True, "reasoning": "", "evidence": []}]}
    [r], ignorados = aplicar_gates([CHECK], v, {"conversa": CONVERSA, "resumo": ""})
    assert r["passed"] is False and r["alerta"] == "o juiz não respondeu este check"
    assert ignorados == ["C99"]
