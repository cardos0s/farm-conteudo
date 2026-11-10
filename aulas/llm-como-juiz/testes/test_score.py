from score import calculate_score, comparar_execucoes

CHECKS = [
    {"id": "C01", "weight": 1},
    {"id": "C02", "weight": 2},
    {"id": "C03", "weight": 3},
]


def res(c01, c02, c03):
    return [{"check_id": "C01", "passed": c01}, {"check_id": "C02", "passed": c02}, {"check_id": "C03", "passed": c03}]


def test_pesos():
    assert calculate_score(CHECKS, res(True, True, True)) == 1.0
    assert calculate_score(CHECKS, res(True, False, True)) == 0.6667
    assert calculate_score(CHECKS, res(True, False, False)) == 0.1667


def test_check_sem_resposta_conta_como_reprovado():
    assert calculate_score(CHECKS, [{"check_id": "C03", "passed": True}]) == 0.5


def test_mesmas_respostas_mesmo_score():
    assert len({calculate_score(CHECKS, res(True, False, True)) for _ in range(100)}) == 1


def test_baseline_vazio():
    assert calculate_score([], []) == 0


def test_comparar_execucoes():
    comp = comparar_execucoes(CHECKS, [res(True, False, True), res(True, False, True), res(True, True, True)])
    assert comp["scores"] == [0.6667, 0.6667, 1.0]
    assert comp["media"] == 0.7778
    assert comp["concordancia"] == {"C01": 1.0, "C02": 0.6667, "C03": 1.0}
    assert comp["instaveis"] == ["C02"]
