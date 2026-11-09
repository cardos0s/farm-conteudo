#!/usr/bin/env python3
"""Confere o formato dos arquivos do ebook (o que a build espera).

    python3 ebooks/system-design/build/checar.py                 # tudo
    python3 ebooks/system-design/build/checar.py caminho/a.md ... # só alguns arquivos

Erros (formato quebrado) fazem a saída ser 1. Avisos (tamanho fora da faixa sugerida) não.
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

import yaml

RAIZ = Path(__file__).resolve().parent.parent
CONTEUDO = RAIZ / "conteudo"

SECOES = ["O essencial", "Aprofundando", "Analogia", "No mundo real", "Trade-offs", "Na entrevista", "Cuidado com", "Teste-se"]
FAIXAS = {  # palavras sugeridas por seção (aviso, não erro)
    "Aprofundando": (180, 480),
    "Analogia": (30, 110),
    "No mundo real": (40, 160),
    "Na entrevista": (50, 160),
    "Cuidado com": (40, 160),
}
IMAGEM = re.compile(r"!\[([^\]]*)\]\(([^)]+)\)")


class CabecalhoInvalido(Exception):
    pass


def frente(texto: str):
    m = re.match(r"^---\n(.*?)\n---\n(.*)$", texto, re.S)
    if not m:
        return None, texto
    try:
        return yaml.safe_load(m.group(1)) or {}, m.group(2)
    except yaml.YAMLError as e:
        raise CabecalhoInvalido(
            f"cabeçalho YAML inválido ({str(e).splitlines()[0]}). Se um valor tiver ': ' no meio, "
            'coloque-o entre aspas: resumo: "..."'
        ) from e


def palavras(s: str) -> int:
    s = re.sub(r"```.*?```", " ", s, flags=re.S)
    s = IMAGEM.sub(" ", s)
    return len(re.findall(r"[\wÀ-ÿ'-]+", s))


def secoes(corpo: str):
    partes = re.split(r"^## +(.+?)\s*$", corpo, flags=re.M)
    return [(partes[i].strip(), partes[i + 1]) for i in range(1, len(partes), 2)]


def checar_capitulo(arq: Path, erros: list, avisos: list):
    texto = arq.read_text(encoding="utf-8")
    fm, corpo = frente(texto)
    if fm is None:
        erros.append("sem cabeçalho YAML entre --- e ---")
        return
    for chave in ["numero", "titulo", "original", "resumo", "relacionados"]:
        if chave not in fm or fm[chave] in (None, ""):
            erros.append(f"cabeçalho sem '{chave}'")
    num = fm.get("numero")
    prefixo = re.match(r"^(\d+)-", arq.name)
    if prefixo and num != int(prefixo.group(1)):
        erros.append(f"numero {num} não bate com o nome do arquivo")
    rel = fm.get("relacionados") or []
    if not isinstance(rel, list) or not all(isinstance(r, int) and 1 <= r <= 51 and r != num for r in rel):
        erros.append("relacionados precisa ser uma lista de números de capítulos (1–51), sem o próprio")
    elif not 2 <= len(rel) <= 5:
        avisos.append(f"relacionados com {len(rel)} itens (sugerido: 2 a 5)")
    if len(str(fm.get("resumo", "")).split()) > 45:
        avisos.append("resumo com mais de 45 palavras")
    if re.search(r"^# ", corpo, re.M):
        erros.append("não use título '# ' no corpo (o título vem do cabeçalho)")
    achadas = secoes(corpo)
    nomes = [n for n, _ in achadas]
    if nomes != SECOES:
        erros.append(f"seções diferentes do esperado.\n      achei:    {nomes}\n      esperado: {SECOES}")
    mapa = dict(achadas)
    for nome, (mi, ma) in FAIXAS.items():
        if nome in mapa:
            n = palavras(mapa[nome])
            if not mi <= n <= ma:
                avisos.append(f"'{nome}' com {n} palavras (sugerido {mi}–{ma})")
    teste = mapa.get("Teste-se", "")
    p = re.findall(r"^\*\*P:\*\*", teste, re.M)
    r = re.findall(r"^\*\*R:\*\*", teste, re.M)
    if len(p) != 3 or len(r) != 3:
        erros.append(f"'Teste-se' precisa de 3 pares **P:**/**R:** no começo da linha (achei {len(p)} P e {len(r)} R)")
    else:
        ordem = re.findall(r"^\*\*([PR]):\*\*", teste, re.M)
        if ordem != ["P", "R"] * 3:
            erros.append("'Teste-se' fora da ordem P, R, P, R, P, R")
    checar_imagens(arq, corpo, erros)
    if re.search(r"</?(div|span|br|details|img|table)\b", corpo):
        avisos.append("tem HTML no texto; prefira Markdown puro")


def checar_imagens(arq: Path, corpo: str, erros: list):
    for alt, caminho in IMAGEM.findall(corpo):
        alvo = (arq.parent / caminho).resolve()
        if not alt.strip():
            erros.append(f"imagem sem legenda: {caminho}")
        if not alvo.exists():
            erros.append(f"diagrama não encontrado: {caminho} (rode diagramas/renderizar.mjs)")
        elif alvo.suffix != ".svg" or alvo.parent.name != "diagramas":
            erros.append(f"imagem fora do kit de diagramas: {caminho}")


def checar_parte(arq: Path, erros: list, avisos: list):
    fm, corpo = frente(arq.read_text(encoding="utf-8"))
    if fm is None:
        erros.append("sem cabeçalho YAML")
        return
    for chave in ["parte", "titulo", "original"]:
        if not fm.get(chave):
            erros.append(f"cabeçalho sem '{chave}'")
    n = palavras(corpo)
    if not 70 <= n <= 200:
        avisos.append(f"introdução com {n} palavras (sugerido 90–160)")


def checar_simulado(arq: Path, erros: list, avisos: list):
    fm, corpo = frente(arq.read_text(encoding="utf-8"))
    blocos = re.split(r"^### +", corpo, flags=re.M)[1:]
    if len(blocos) < 30:
        avisos.append(f"só {len(blocos)} questões")
    posicoes = []
    for i, b in enumerate(blocos, 1):
        if not re.match(rf"{i}\. ", b):
            erros.append(f"questão {i}: o título precisa começar com '{i}. '")
        alts = re.findall(r"^- \[([ x])\] ", b, re.M)
        if len(alts) != 4 or alts.count("x") != 1:
            erros.append(f"questão {i}: precisa de 4 alternativas '- [ ]' com exatamente uma '- [x]'")
        else:
            posicoes.append(alts.index("x"))
        if not re.search(r"^> ", b, re.M):
            erros.append(f"questão {i}: falta a explicação em '> '")
    if posicoes and max(posicoes.count(k) for k in range(4)) > len(posicoes) * 0.4:
        avisos.append("a alternativa correta está concentrada numa mesma posição")


def checar_generico(arq: Path, erros: list, avisos: list):
    fm, corpo = frente(arq.read_text(encoding="utf-8"))
    if fm is None or not fm.get("titulo"):
        erros.append("cabeçalho YAML precisa ter 'titulo'")
    if re.search(r"^# ", corpo, re.M):
        erros.append("não use título '# ' no corpo")
    checar_imagens(arq, corpo, erros)


def tipo(arq: Path) -> str:
    if arq.name == "_parte.md":
        return "parte"
    if re.match(r"^\d{2}-", arq.name) and arq.parent.name.startswith("parte-"):
        return "capitulo"
    if "simulado" in arq.name:
        return "simulado"
    return "generico"


def main(args: list[str]) -> int:
    arquivos = [Path(a).resolve() for a in args] if args else sorted(CONTEUDO.rglob("*.md"))
    total_erros = 0
    for arq in arquivos:
        erros: list[str] = []
        avisos: list[str] = []
        try:
            {"parte": checar_parte, "capitulo": checar_capitulo, "simulado": checar_simulado}.get(tipo(arq), checar_generico)(arq, erros, avisos)
        except CabecalhoInvalido as e:
            erros.append(str(e))
        rotulo = arq.relative_to(RAIZ) if arq.is_relative_to(RAIZ) else arq
        if erros:
            total_erros += len(erros)
            print(f"ERRO  {rotulo}")
            for e in erros:
                print(f"   - {e}")
        else:
            print(f"ok    {rotulo}")
        for a in avisos:
            print(f"   aviso: {a}")
    return 1 if total_erros else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
