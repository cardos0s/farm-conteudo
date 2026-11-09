#!/usr/bin/env python3
"""Monta o ebook a partir de conteudo/ e diagramas/.

    python3 ebooks/system-design/build/montar.py            # HTML (dist/) e HTML de impressão (build/.tmp/)
    python3 ebooks/system-design/build/montar.py --epub     # também o EPUB (precisa de build/.tmp/imagens, ver epub)

Requisitos: Python 3.10+, pandoc, PyYAML, Jinja2, BeautifulSoup e lxml.
O PDF sai de build/pdf.mjs; os PNGs dos diagramas para o EPUB, de build/imagens.mjs.
"""
from __future__ import annotations

import base64
import html
import json
import re
import subprocess
import sys
from dataclasses import dataclass, field
from pathlib import Path

import yaml
from bs4 import BeautifulSoup, NavigableString, Tag
from jinja2 import Environment, FileSystemLoader

RAIZ = Path(__file__).resolve().parent.parent
REPO = RAIZ.parent.parent
CONTEUDO = RAIZ / "conteudo"
DIAGRAMAS = RAIZ / "diagramas"
BUILD = RAIZ / "build"
DIST = RAIZ / "dist"
TMP = BUILD / ".tmp"

NOME_ARQUIVO = "system-design-50-conceitos"
TOTAL_CAPITULOS = 51

# Seções dos capítulos: título no Markdown → (classe, rótulo exibido)
SECOES = {
    "O essencial": ("essencial", "O essencial"),
    "Aprofundando": ("aprofundando", "Aprofundando"),
    "Analogia": ("analogia", "Analogia"),
    "No mundo real": ("mundo-real", "No mundo real"),
    "Trade-offs": ("tradeoffs", "Trade-offs"),
    "Na entrevista": ("entrevista", "Na entrevista"),
    "Cuidado com": ("cuidado", "Cuidado com"),
    "Teste-se": ("teste", "Teste-se"),
}

APENDICE_ID = {"A": "apendice-a", "B": "apendice-b", "C": "apendice-c", "D": "glossario", "E": "simulado"}


# ───────────────────────── modelo de dados ─────────────────────────


@dataclass
class Pergunta:
    capitulo: int
    pergunta: str  # HTML
    resposta: str  # HTML


@dataclass
class Capitulo:
    numero: int
    titulo: str
    original: str
    resumo: str
    relacionados: list[int]
    parte: int
    corpo: str = ""  # HTML das seções
    perguntas: list[Pergunta] = field(default_factory=list)
    diagramas: int = 0
    palavras: int = 0
    pronto: bool = True

    @property
    def id(self) -> str:
        return f"cap-{self.numero:02d}"


@dataclass
class Parte:
    numero: int
    titulo: str
    original: str
    intro: str
    capitulos: list[Capitulo] = field(default_factory=list)

    @property
    def id(self) -> str:
        return f"parte-{self.numero}"


@dataclass
class Pagina:
    id: str
    titulo: str
    rotulo: str
    corpo: str
    letra: str = ""


@dataclass
class Questao:
    numero: int
    enunciado: str
    alternativas: list[str]
    correta: int
    explicacao: str
    capitulos: list[int]
    parte: int


# ───────────────────────── leitura ─────────────────────────


def frente(texto: str, arquivo: Path | None = None) -> tuple[dict, str]:
    m = re.match(r"^---\n(.*?)\n---\n(.*)$", texto, re.S)
    if not m:
        return {}, texto
    try:
        return yaml.safe_load(m.group(1)) or {}, m.group(2)
    except yaml.YAMLError as e:
        raise SystemExit(f"Cabeçalho YAML inválido em {arquivo or '?'}: rode build/checar.py para ver o motivo.") from e


def pandoc(md: str, prefixo: str = "", deslocar: int = 0) -> str:
    args = ["pandoc", "-f", "markdown+smart-raw_html", "-t", "html5", "--wrap=none", "--section-divs"]
    if prefixo:
        args.append(f"--id-prefix={prefixo}")
    if deslocar:
        args.append(f"--shift-heading-level-by={deslocar}")
    r = subprocess.run(args, input=md, capture_output=True, text=True)
    if r.returncode != 0:
        raise RuntimeError(f"pandoc falhou: {r.stderr}")
    return r.stdout


def inline(md: str) -> str:
    """Markdown de uma linha (negrito, itálico, código) para HTML."""
    s = html.escape(str(md).strip(), quote=False)
    s = re.sub(r"`([^`]+)`", r"<code>\1</code>", s)
    s = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", s)
    s = re.sub(r"(?<![\w*])\*(?!\s)(.+?)(?<!\s)\*(?![\w*])", r"<em>\1</em>", s)
    s = re.sub(r"(?<=\d)\^(\d+)\b", r"<sup>\1</sup>", s)
    return s


def texto_puro(fragmento: str) -> str:
    return re.sub(r"\s+", " ", BeautifulSoup(fragmento, "html.parser").get_text(" ")).strip()


def sopa(fragmento: str) -> BeautifulSoup:
    return BeautifulSoup(fragmento, "html.parser")


# ───────────────────────── pós-processamento ─────────────────────────

REF_CAP = re.compile(r"(\b[Cc]ap(?:ítulos?|s?\.)\s*)(\d{1,2}(?:\s*(?:,|e|a|–|-|/)\s*\d{1,2})*)")
REF_APENDICE = re.compile(r"(\b[Aa]pêndices?\s+)([A-E](?:\s*(?:,|e)\s*[A-E])*)\b")
NAO_LIGAR = {"a", "code", "pre", "h1", "h2", "h3", "h4", "summary", "script", "style", "svg", "title"}


def ligar_referencias(raiz: Tag, titulos: dict[int, str]):
    """Transforma "capítulo 25", "caps. 41–43" e "apêndice C" em links."""
    for no in list(raiz.find_all(string=True)):
        if not isinstance(no, NavigableString) or any(p.name in NAO_LIGAR for p in no.parents if isinstance(p, Tag)):
            continue
        texto = str(no)
        if not (REF_CAP.search(texto) or REF_APENDICE.search(texto)):
            continue
        partes: list = []
        pos = 0
        achados = sorted(
            [(m, "cap") for m in REF_CAP.finditer(texto)] + [(m, "ap") for m in REF_APENDICE.finditer(texto)],
            key=lambda x: x[0].start(),
        )
        for m, tipo in achados:
            if m.start() < pos:
                continue
            partes.append(texto[pos : m.start()])
            partes.append(m.group(1))
            lista = m.group(2)
            q = 0
            padrao = r"\d{1,2}" if tipo == "cap" else r"[A-E]"
            for alvo in re.finditer(padrao, lista):
                partes.append(lista[q : alvo.start()])
                valor = alvo.group(0)
                if tipo == "cap" and 1 <= int(valor) <= TOTAL_CAPITULOS:
                    a = Tag(name="a", attrs={"href": f"#cap-{int(valor):02d}", "class": "ref", "title": titulos.get(int(valor), "")})
                    a.string = valor
                    partes.append(a)
                elif tipo == "ap":
                    a = Tag(name="a", attrs={"href": f"#{APENDICE_ID[valor]}", "class": "ref"})
                    a.string = valor
                    partes.append(a)
                else:
                    partes.append(valor)
                q = alvo.end()
            partes.append(lista[q:])
            pos = m.end()
        partes.append(texto[pos:])
        for p in partes:
            if isinstance(p, str):
                if p:
                    no.insert_before(NavigableString(p))
            else:
                no.insert_before(p)
        no.extract()


POTENCIA = re.compile(r"(?<=\d)\^(\d+)\b")


def potencias(raiz: Tag):
    """10^5 → 10<sup>5</sup> no texto corrido (blocos de código ficam como estão)."""
    for no in list(raiz.find_all(string=POTENCIA)):
        if any(p.name in {"code", "pre", "script", "style", "svg"} for p in no.parents if isinstance(p, Tag)):
            continue
        for i, parte in enumerate(POTENCIA.split(str(no))):
            if i % 2 == 0:
                if parte:
                    no.insert_before(NavigableString(parte))
            else:
                sup = Tag(name="sup")
                sup.string = parte
                no.insert_before(sup)
        no.extract()


def preparar_figuras(raiz: Tag, base: Path) -> int:
    """Troca <img> de diagrama por um marcador; o SVG entra depois, como texto cru."""
    n = 0
    for fig in raiz.find_all("figure"):
        img = fig.find("img")
        if not img:
            continue
        caminho = (base / img["src"]).resolve()
        nome = caminho.stem
        legenda = fig.find("figcaption")
        if legenda and legenda.has_attr("aria-hidden"):
            del legenda["aria-hidden"]
        marcador = Tag(name="div", attrs={"class": "lousa-quadro", "data-diagrama": nome, "data-alt": img.get("alt", "")})
        img.replace_with(marcador)
        fig["class"] = "diagrama"
        n += 1
    return n


def embrulhar_tabelas(raiz: Tag):
    for t in raiz.find_all("table"):
        if t.parent and "tabela" in (t.parent.get("class") or []):
            continue
        caixa = Tag(name="div", attrs={"class": "tabela"})
        t.wrap(caixa)


def marcar_atualizacoes(raiz: Tag):
    for forte in raiz.find_all("strong"):
        if forte.get_text().strip().rstrip(":") == "Atualização":
            alvo = forte.find_parent(["li", "p"])
            if alvo:
                alvo["class"] = (alvo.get("class") or []) + ["atualizacao"]


def extrair_perguntas(secao: Tag, capitulo: int) -> list[Pergunta]:
    perguntas: list[Pergunta] = []
    atual: dict | None = None
    for filho in [c for c in secao.children if isinstance(c, Tag) and c.name not in ("h3", "h2")]:
        forte = filho.find("strong") if filho.name == "p" else None
        rotulo = forte.get_text().strip() if forte and filho.contents and filho.contents[0] == forte else ""
        if rotulo == "P:":
            forte.extract()
            atual = {"p": filho.decode_contents().strip(), "r": []}
            perguntas.append(atual)  # type: ignore[arg-type]
        elif rotulo == "R:" and atual is not None:
            forte.extract()
            atual["r"].append(f"<p>{filho.decode_contents().strip()}</p>")
        elif atual is not None:
            atual["r"].append(str(filho))
    return [Pergunta(capitulo, p["p"], "".join(p["r"])) for p in perguntas]  # type: ignore[index]


def ler_capitulo(arq: Path, parte: int, titulos: dict[int, str]) -> Capitulo:
    fm, corpo = frente(arq.read_text(encoding="utf-8"), arq)
    cap = Capitulo(
        numero=int(fm["numero"]),
        titulo=str(fm["titulo"]),
        original=str(fm.get("original", "")),
        resumo=str(fm.get("resumo", "")).strip(),
        relacionados=[int(r) for r in fm.get("relacionados") or []],
        parte=parte,
    )
    s = sopa(pandoc(corpo, prefixo=f"{cap.id}-", deslocar=1))
    cap.diagramas = preparar_figuras(s, arq.parent)
    potencias(s)
    embrulhar_tabelas(s)
    marcar_atualizacoes(s)
    for secao in s.find_all("section", class_="level3"):
        h = secao.find("h3")
        nome = h.get_text().strip() if h else ""
        classe, rotulo = SECOES.get(nome, ("extra", nome))
        secao["class"] = ["secao", f"secao-{classe}"]
        h["class"] = "secao-titulo"
        h.clear()
        h.append(rotulo)
        if classe == "essencial":
            nota = Tag(name="span", attrs={"class": "secao-nota"})
            nota.string = "tradução do artigo original"
            h.append(nota)
        if classe == "teste":
            cap.perguntas = extrair_perguntas(secao, cap.numero)
            for filho in [c for c in secao.children if isinstance(c, Tag) and c.name != "h3"]:
                filho.extract()
            lista = sopa(
                '<ol class="perguntas">'
                + "".join(
                    f'<li><details><summary><span class="q">{p.pergunta}</span><span class="ver">ver resposta</span></summary>'
                    f'<div class="r">{p.resposta}</div></details></li>'
                    for p in cap.perguntas
                )
                + "</ol>"
            )
            secao.append(lista)
    ligar_referencias(s, titulos)
    cap.corpo = str(s)
    cap.palavras = len(texto_puro(cap.corpo).split())
    return cap


def ler_pagina(arq: Path, id_: str, rotulo: str, titulos: dict[int, str], letra: str = "") -> Pagina:
    fm, corpo = frente(arq.read_text(encoding="utf-8"), arq)
    s = sopa(pandoc(corpo, prefixo=f"{id_}-"))
    preparar_figuras(s, arq.parent)
    potencias(s)
    embrulhar_tabelas(s)
    ligar_referencias(s, titulos)
    return Pagina(id=id_, titulo=str(fm.get("titulo", "")), rotulo=rotulo, corpo=str(s), letra=letra)


def ler_simulado(arq: Path, capitulo_parte: dict[int, int], titulos: dict[int, str]) -> tuple[Pagina, list[Questao]]:
    fm, corpo = frente(arq.read_text(encoding="utf-8"), arq)
    blocos = re.split(r"^### +", corpo, flags=re.M)
    intro = sopa(pandoc(blocos[0])) if blocos[0].strip() else sopa("")
    ligar_referencias(intro, titulos)
    questoes: list[Questao] = []
    for bloco in blocos[1:]:
        cabeca, _, resto = bloco.partition("\n")
        m = re.match(r"(\d+)\.\s+(.*)$", cabeca.strip())
        if not m:
            continue
        numero = int(m.group(1))
        enunciado_md = m.group(2)
        linhas = resto.split("\n")
        extra, alternativas, explicacao = [], [], []
        for linha in linhas:
            a = re.match(r"^- \[([ x])\] (.*)$", linha)
            if a:
                alternativas.append((a.group(1) == "x", a.group(2)))
            elif linha.startswith(">"):
                explicacao.append(linha.lstrip("> ").rstrip())
            elif not alternativas and linha.strip():
                extra.append(linha)
        enun = sopa(pandoc(enunciado_md + ("\n\n" + "\n".join(extra) if extra else "")))
        potencias(enun)
        exp = sopa(pandoc(" ".join(explicacao)))
        potencias(exp)
        ligar_referencias(exp, titulos)
        caps = [int(c) for c in re.findall(r"[Cc]ap(?:ítulos?|s?\.)\s*([\d,\se–-]+)", " ".join(explicacao)) for c in re.findall(r"\d{1,2}", c)]
        caps = [c for c in caps if 1 <= c <= TOTAL_CAPITULOS]
        corretas = [i for i, (ok, _) in enumerate(alternativas) if ok]
        questoes.append(
            Questao(
                numero=numero,
                enunciado=re.sub(r"^<p>(.*)</p>$", r"\1", str(enun).strip(), flags=re.S),
                alternativas=[inline(t) for _, t in alternativas],
                correta=corretas[0] if corretas else 0,
                explicacao=re.sub(r"^<p>(.*)</p>$", r"\1", str(exp).strip(), flags=re.S),
                capitulos=caps,
                parte=capitulo_parte.get(caps[0], 0) if caps else 0,
            )
        )
    return Pagina(id="simulado", titulo=str(fm.get("titulo", "Simulado")), rotulo="Apêndice E", corpo=str(intro), letra="E"), questoes


# ───────────────────────── livro ─────────────────────────


def mapa_titulos() -> dict[int, str]:
    titulos: dict[int, str] = {}
    for arq in CONTEUDO.glob("parte-*/[0-9][0-9]-*.md"):
        fm, _ = frente(arq.read_text(encoding="utf-8"), arq)
        if fm.get("numero"):
            titulos[int(fm["numero"])] = str(fm.get("titulo", ""))
    return titulos


def ler_livro() -> dict:
    titulos = mapa_titulos()
    partes: list[Parte] = []
    for pasta in sorted(CONTEUDO.glob("parte-*")):
        n = int(re.match(r"parte-(\d+)", pasta.name).group(1))
        intro_arq = pasta / "_parte.md"
        if intro_arq.exists():
            fm, corpo = frente(intro_arq.read_text(encoding="utf-8"), intro_arq)
            s = sopa(pandoc(corpo))
            potencias(s)
            ligar_referencias(s, titulos)
            parte = Parte(n, str(fm.get("titulo", f"Parte {n}")), str(fm.get("original", "")), str(s))
        else:
            parte = Parte(n, f"Parte {n}", "", "")
        for arq in sorted(pasta.glob("[0-9][0-9]-*.md")):
            parte.capitulos.append(ler_capitulo(arq, n, titulos))
        partes.append(parte)

    capitulos = [c for p in partes for c in p.capitulos]
    capitulo_parte = {c.numero: c.parte for c in capitulos}
    for i, c in enumerate(capitulos):
        c.anterior = capitulos[i - 1].id if i > 0 else ""  # type: ignore[attr-defined]
        c.proximo = capitulos[i + 1].id if i + 1 < len(capitulos) else ""  # type: ignore[attr-defined]

    abertura = [
        ler_pagina(CONTEUDO / "00-abertura/sobre.md", "sobre", "Abertura", titulos),
        ler_pagina(CONTEUDO / "00-abertura/como-estudar.md", "como-estudar", "Abertura", titulos),
    ]
    fechamento = ler_pagina(CONTEUDO / "fechamento.md", "fechamento", "Fechamento", titulos)

    apendices: list[Pagina] = []
    simulado, questoes = None, []
    for arq in sorted((CONTEUDO / "apendices").glob("*.md")):
        letra = arq.name[0].upper()
        if "simulado" in arq.name:
            simulado, questoes = ler_simulado(arq, capitulo_parte, titulos)
        else:
            apendices.append(ler_pagina(arq, APENDICE_ID.get(letra, f"apendice-{letra.lower()}"), f"Apêndice {letra}", titulos, letra))

    flashcards = []
    for c in capitulos:
        flashcards.append({"c": c.numero, "p": c.parte, "q": f"Em uma frase: o que é <strong>{html.escape(c.titulo)}</strong>?", "r": inline(c.resumo)})
        for p in c.perguntas:
            flashcards.append({"c": c.numero, "p": c.parte, "q": p.pergunta, "r": p.resposta})

    return {
        "titulos": titulos,
        "partes": partes,
        "capitulos": capitulos,
        "abertura": abertura,
        "fechamento": fechamento,
        "apendices": apendices,
        "simulado": simulado,
        "questoes": questoes,
        "flashcards": flashcards,
        "numeros": {
            "capitulos": len(capitulos),
            "diagramas": len(
                {d for t in [c.corpo for c in capitulos] + [pg.corpo for pg in abertura + [fechamento] + apendices] for d in re.findall(r'data-diagrama="([^"]+)"', t)}
            ),
            "perguntas": sum(len(c.perguntas) for c in capitulos),
            "questoes": len(questoes),
            "flashcards": len(flashcards),
            "palavras": sum(c.palavras for c in capitulos),
        },
    }


# ───────────────────────── saída ─────────────────────────


def svg_do_diagrama(nome: str, alt: str) -> str:
    arq = DIAGRAMAS / f"{nome}.svg"
    if not arq.exists():
        return f'<p class="faltando">Diagrama {html.escape(nome)} ainda não renderizado.</p>'
    svg = arq.read_text(encoding="utf-8")
    svg = re.sub(r"<\?xml.*?\?>\s*", "", svg)
    svg = re.sub(r'(<svg[^>]*?) width="[\d.]+" height="[\d.]+"', r"\1", svg, count=1)
    # ids únicos por diagrama (vários SVGs convivem no mesmo documento)
    svg = re.sub(r'id="([^"]+)"', lambda m: f'id="{m.group(1)}"' if m.group(1).startswith("lousa-") else f'id="{nome}-{m.group(1)}"', svg)
    return svg


def fonte_base64(caminho: Path) -> str:
    return "data:font/woff2;base64," + base64.b64encode(caminho.read_bytes()).decode("ascii")


def fontes_css() -> str:
    f = BUILD / "fontes"
    exc = REPO / "public/fontes/Excalifont-Regular.woff2"
    blocos = [
        ("Literata", "literata-latin.woff2", "normal", "200 900", ""),
        ("Literata", "literata-italico-latin.woff2", "italic", "200 900", ""),
        ("Bricolage Grotesque", "bricolage-grotesque-latin.woff2", "normal", "200 800", "font-stretch: 75% 100%;"),
        ("JetBrains Mono", "jetbrains-mono-latin.woff2", "normal", "400 700", ""),
    ]
    css = []
    for familia, arq, estilo, peso, extra in blocos:
        css.append(
            f"@font-face{{font-family:'{familia}';src:url({fonte_base64(f / arq)}) format('woff2');"
            f"font-style:{estilo};font-weight:{peso};{extra}font-display:swap}}"
        )
    css.append(f"@font-face{{font-family:'Excalifont';src:url({fonte_base64(exc)}) format('woff2');font-display:swap}}")
    return "\n".join(css)


def renderizar(livro: dict, modo: str, fragmento: bool = False) -> str:
    amb = Environment(loader=FileSystemLoader(BUILD), autoescape=False, trim_blocks=True, lstrip_blocks=True)
    amb.filters["md"] = inline
    modelo = amb.get_template("modelo.html.j2")
    estilo = (BUILD / "estilo.css").read_text(encoding="utf-8")
    if modo == "impressao":
        estilo += "\n" + (BUILD / "impressao.css").read_text(encoding="utf-8")
    app = (BUILD / "app.js").read_text(encoding="utf-8") if modo == "web" else ""
    dados_flash = json.dumps(livro["flashcards"], ensure_ascii=False).replace("</", "<\\/")
    capa_svg = svg_do_diagrama("capa", "") if (DIAGRAMAS / "capa.svg").exists() else ""
    saida = modelo.render(
        **livro,
        modo=modo,
        fragmento=fragmento,
        fontes=fontes_css(),
        estilo=estilo,
        app=app,
        dados_flash=dados_flash,
        capa_svg=capa_svg,
        nome_arquivo=NOME_ARQUIVO,
    )
    # diagramas: o SVG entra cru (sem passar pelo parser, que estragaria o camelCase do SVG)
    def trocar(m: re.Match) -> str:
        nome = re.search(r'data-diagrama="([^"]+)"', m.group(1)).group(1)
        return f'<div class="lousa-quadro" data-diagrama="{nome}">{svg_do_diagrama(nome, "")}</div>'

    # (o BeautifulSoup ordena os atributos, então o padrão não depende da ordem)
    return re.sub(r'<div class="lousa-quadro"([^>]*)></div>', trocar, saida)


def main(args: list[str]) -> int:
    livro = ler_livro()
    DIST.mkdir(exist_ok=True)
    TMP.mkdir(exist_ok=True)
    web = renderizar(livro, "web")
    (DIST / f"{NOME_ARQUIVO}.html").write_text(web, encoding="utf-8")
    (TMP / "artefato.html").write_text(renderizar(livro, "web", fragmento=True), encoding="utf-8")
    (TMP / "impressao.html").write_text(renderizar(livro, "impressao"), encoding="utf-8")
    n = livro["numeros"]
    faltam = sorted(set(range(1, TOTAL_CAPITULOS + 1)) - {c.numero for c in livro["capitulos"]})
    print(
        f"HTML: dist/{NOME_ARQUIVO}.html ({len(web) // 1024} KB) · {n['capitulos']} capítulos, "
        f"{n['diagramas']} diagramas, {n['perguntas']} perguntas, {n['questoes']} questões, "
        f"{n['flashcards']} flashcards, ~{n['palavras']} palavras"
    )
    if faltam:
        print(f"faltam os capítulos: {faltam}")
    if "--epub" in args:
        from epub import gerar_epub, verificar_epub

        caminho = gerar_epub(livro)
        problemas = verificar_epub(caminho)
        print(f"EPUB: {caminho.relative_to(RAIZ)} ({caminho.stat().st_size // 1024} KB)" + (" · estrutura ok" if not problemas else ""))
        for p in problemas[:30]:
            print(f"  problema: {p}")
        if problemas:
            return 1
    return 0


if __name__ == "__main__":
    sys.path.insert(0, str(BUILD))
    sys.exit(main(sys.argv[1:]))
