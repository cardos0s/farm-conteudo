"""O harness: junta juiz, evidências e pontuação, roda N vezes e escreve o relatório.

Exemplos:
    python avaliar.py --caso incompleto --execucoes 3 --gravado   # sem internet, com respostas gravadas
    python avaliar.py --caso incompleto --execucoes 3             # chamando o Claude de verdade
    python avaliar.py --caso todos --gravado                      # os três casos de teste
    python avaliar.py --gerar --execucoes 3 --minimo 0.9          # o agente resume e o juiz avalia (CI)
    python avaliar.py --caso incompleto --execucoes 3 --gravado --baseline baseline/resumo_comercial.v2.json
"""

from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime
from pathlib import Path

from evidencias import aplicar_gates
from score import calculate_score, comparar_execucoes

AQUI = Path(__file__).parent
NA = {"conversa": "na conversa", "resumo": "no resumo"}
BASELINE_PADRAO = AQUI / "baseline" / "resumo_comercial.v1.json"
CASOS = json.loads((AQUI / "casos" / "esperado.json").read_text(encoding="utf-8"))

# Checks que o Python resolve sozinho. Se dá para conferir com código, não pergunte ao LLM.
REGRAS = {
    "resumo_nao_vazio": lambda resumo: len(resumo.strip()) > 0,
}


def ler(caminho: str | Path) -> str:
    return (AQUI / caminho).read_text(encoding="utf-8")


def checar_por_codigo(check: dict, resumo: str) -> dict:
    passed = REGRAS[check["regra"]](resumo)
    return {
        "check_id": check["id"], "verified_by": "codigo", "passed": passed, "passed_juiz": None,
        "evidence": [], "reasoning": f"regra '{check['regra']}' em Python", "alerta": None,
    }


def pasta_gravacoes(baseline: dict, caso: str) -> Path:
    return AQUI / "gravacoes" / f"{baseline['id']}.v{baseline['versao']}" / caso


def obter_veredito(baseline, conversa, resumo, caso, n, gravado, gravar) -> tuple[dict, str]:
    """O veredito bruto do juiz: de uma gravação (aula sem internet) ou do Claude."""
    arquivo = pasta_gravacoes(baseline, caso) / f"execucao{n}.json"
    if gravado:
        if not arquivo.exists():
            sys.exit(f"Não há gravação em {arquivo.relative_to(AQUI)}. Rode sem --gravado (e com --gravar) para criar.")
        dados = json.loads(arquivo.read_text(encoding="utf-8"))
        return dados["veredito"], dados["modelo"]

    from juiz import julgar  # só importa o SDK quando for chamar a API

    veredito, modelo = julgar(baseline, conversa, resumo)
    dados = {"origem": f"resposta real do juiz em {datetime.now():%Y-%m-%d %H:%M}", "modelo": modelo,
             "veredito": veredito.model_dump()}
    if gravar:
        arquivo.parent.mkdir(parents=True, exist_ok=True)
        arquivo.write_text(json.dumps(dados, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return dados["veredito"], modelo


def avaliar(baseline: dict, conversa: str, resumo: str, veredito: dict) -> dict:
    """Uma execução completa: checks de código + checks do juiz conferidos pelos gates + pontuação."""
    checks = baseline["checks"]
    do_juiz = [c for c in checks if c["verified_by"] == "juiz"]
    finais_juiz, ignorados = aplicar_gates(do_juiz, veredito, {"conversa": conversa, "resumo": resumo})
    por_id = {r["check_id"]: r for r in finais_juiz}
    resultados = [checar_por_codigo(c, resumo) if c["verified_by"] == "codigo" else por_id[c["id"]] for c in checks]

    # "bruto" = o que o juiz disse; "final" = depois de conferir as evidências.
    brutos = [{"check_id": r["check_id"], "passed": r["passed"] if r["passed_juiz"] is None else r["passed_juiz"]}
              for r in resultados]
    return {
        "resultados": resultados,
        "ignorados": ignorados,
        "score_bruto": calculate_score(checks, brutos),
        "score": calculate_score(checks, resultados),
    }


# ---------------------------------------------------------------- saída no terminal

def marca(passou: bool | None) -> str:
    return "✓" if passou else "✗"


def barra(valor: float, largura: int = 20) -> str:
    cheio = round(valor * largura)
    return "█" * cheio + "░" * (largura - cheio)


def imprimir_execucao(n: int, execucao: dict, esperado: dict | None, detalhes: bool) -> None:
    celulas = "  ".join(f"{r['check_id']} {marca(r['passed'])}" for r in execucao["resultados"])
    linha = f"  Execução {n}   {celulas}   score {execucao['score']:.4f}"
    if execucao["score_bruto"] != execucao["score"]:
        linha += f"  (o juiz sozinho daria {execucao['score_bruto']:.4f})"
    if esperado:
        bate = all(r["passed"] == esperado[r["check_id"]] for r in execucao["resultados"])
        linha += "   gabarito: " + ("confere" if bate else "NÃO confere")
    print(linha)
    for r in execucao["resultados"]:
        if r["alerta"]:
            print(f"      ⚠ {r['check_id']}: {r['alerta']}")
            for e in r["evidence"]:
                if not e["encontrado"]:
                    print(f"        não existe {NA[e['source']]}: \"{e['quote']}\"")
    for cid in execucao["ignorados"]:
        print(f"      ⚠ o juiz respondeu {cid}, que não está no baseline (ignorado)")
    if detalhes:
        for r in execucao["resultados"]:
            if r["verified_by"] != "juiz":
                continue
            veredito = f"juiz {marca(r['passed_juiz'])}"
            if r["passed_juiz"] != r["passed"]:
                veredito += f" → final {marca(r['passed'])}"
            print(f"      {r['check_id']} ({veredito})  {r['reasoning']}")
            for e in r["evidence"]:
                onde = f"linha {e['linha']}" if e["encontrado"] else "NÃO ENCONTRADO"
                print(f"          [{e['source']}, {onde}] \"{e['quote']}\"")


def imprimir_benchmark(checks: list[dict], execucoes: list[dict]) -> dict:
    comp = comparar_execucoes(checks, [e["resultados"] for e in execucoes])
    print("\n  Benchmark")
    for n, s in enumerate(comp["scores"], start=1):
        print(f"    Run {n}  {barra(s)}  {s:.4f}")
    print(f"    média {comp['media']:.4f} · desvio {comp['desvio']:.4f} · mín {comp['minimo']:.4f} · máx {comp['maximo']:.4f}")
    print("    concordância  " + "  ".join(
        f"{cid} {valor:.0%}{' ⚠' if valor < 1 else ''}" for cid, valor in comp["concordancia"].items()))
    if comp["instaveis"]:
        print("    checks instáveis: " + ", ".join(comp["instaveis"]) + "  → leia o raciocínio de cada execução:")
        for cid in comp["instaveis"]:
            for n, e in enumerate(execucoes, start=1):
                r = next(r for r in e["resultados"] if r["check_id"] == cid)
                print(f"      Run {n} {cid} {marca(r['passed'])}  {r['reasoning']}")
    else:
        print("    nenhum check instável")
    # A concordância acima é do resultado final. Os erros que os gates corrigiram também contam
    # como instabilidade do juiz, então aparecem aqui para não sumirem do relatório.
    corrigidos = [f"Run {n} {r['check_id']}" for n, e in enumerate(execucoes, start=1)
                  for r in e["resultados"] if r["alerta"]]
    print("    corrigidos pelos gates: " + (", ".join(corrigidos) if corrigidos else "nenhum"))
    return comp


# ---------------------------------------------------------------- linha de comando

def main() -> int:
    p = argparse.ArgumentParser(description="Avalia resumos de conversas com um LLM como juiz.")
    p.add_argument("--caso", default="todos", help="correto, incompleto, inventado ou todos")
    p.add_argument("--gerar", action="store_true", help="o agente resume a conversa e o juiz avalia esse resumo")
    p.add_argument("--execucoes", type=int, default=1)
    p.add_argument("--baseline", default=str(BASELINE_PADRAO))
    p.add_argument("--gravado", action="store_true", help="usa respostas gravadas do juiz (não chama a API)")
    p.add_argument("--gravar", action="store_true", help="salva as respostas do juiz em gravacoes/")
    p.add_argument("--detalhes", action="store_true", help="mostra raciocínio e evidências de cada check")
    p.add_argument("--minimo", type=float, help="falha (código de saída 1) se alguma média ficar abaixo")
    a = p.parse_args()

    baseline = json.loads(Path(a.baseline).read_text(encoding="utf-8"))
    conversa = ler(CASOS["conversa"])

    if a.gerar:
        if a.gravado:
            sys.exit("--gerar chama o agente de verdade; não dá para usar com --gravado.")
        from agente import resumir

        alvos = {"gerado": (resumir(conversa), None)}
        print("Resumo gerado pelo agente:\n\n" + alvos["gerado"][0] + "\n")
    else:
        nomes = list(CASOS["casos"]) if a.caso == "todos" else [a.caso]
        if any(n not in CASOS["casos"] for n in nomes):
            sys.exit(f"Caso desconhecido: {a.caso}. Use: {', '.join(CASOS['casos'])} ou todos.")
        alvos = {n: (ler(CASOS["casos"][n]["resumo"]), CASOS["casos"][n]["esperado"]) for n in nomes}

    relatorio = {"baseline": f"{baseline['id']} v{baseline['versao']}", "gerado_em": datetime.now().isoformat(timespec="seconds"),
                 "modo": "gravado" if a.gravado else "ao vivo", "casos": {}}
    abaixo = False
    for caso, (resumo, esperado) in alvos.items():
        print(f"Caso: {caso} · baseline {baseline['id']} v{baseline['versao']} · "
              f"{a.execucoes} execução(ões) {'gravadas' if a.gravado else 'ao vivo'}")
        execucoes = []
        for n in range(1, a.execucoes + 1):
            veredito, modelo = obter_veredito(baseline, conversa, resumo, caso, n, a.gravado, a.gravar)
            execucao = {**avaliar(baseline, conversa, resumo, veredito), "modelo": modelo}
            execucoes.append(execucao)
            imprimir_execucao(n, execucao, esperado, a.detalhes)
        comp = imprimir_benchmark(baseline["checks"], execucoes) if a.execucoes > 1 else None
        media = comp["media"] if comp else execucoes[0]["score"]
        if a.minimo is not None and media < a.minimo:
            abaixo = True
            print(f"  ✗ média {media:.4f} abaixo do mínimo {a.minimo}")
        relatorio["casos"][caso] = {"resumo": resumo, "esperado": esperado, "execucoes": execucoes, "benchmark": comp}
        print()

    pasta = AQUI / "relatorios"
    pasta.mkdir(exist_ok=True)
    destino = pasta / f"{datetime.now():%Y%m%d-%H%M%S}-{'-'.join(alvos)}.json"
    destino.write_text(json.dumps(relatorio, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Relatório completo: {destino.relative_to(AQUI)}")
    return 1 if abaixo else 0


if __name__ == "__main__":
    sys.exit(main())
