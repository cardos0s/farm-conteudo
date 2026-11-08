"""Gera um ebook em PDF, EPUB, HTML (versão web) e flashcards do Anki.

Requisitos: pandoc 3, Node com Playwright (Chromium), Python com
pypdf e PyYAML.

Uso:  python ebooks/_build/build.py <pasta-do-livro> [pdf|epub|web|anki]

A pasta do livro precisa ter:
  livro.yaml      metadados (título, autoria, textos da abertura...)
  capa.html       capa; {{BASE}} vira a pasta do build, {{ARTE}} a arte
  arte.svg        ilustração usada na capa e na abertura da versão web
  capitulos/*.md  o texto
"""
import base64
import glob
import os
import re
import subprocess
import sys
from pathlib import Path
from urllib.parse import unquote

import yaml
from pypdf import PdfReader, PdfWriter

BUILD = Path(__file__).resolve().parent


def ler(caminho):
    return Path(caminho).read_text(encoding="utf-8")


def gravar(caminho, texto):
    Path(caminho).write_text(texto, encoding="utf-8")


def roda(cmd, env=None):
    print("$", " ".join(os.path.basename(str(c)) for c in cmd[:3]), "...")
    subprocess.run([str(c) for c in cmd], check=True, env=env)


class Livro:
    def __init__(self, pasta):
        self.pasta = Path(pasta).resolve()
        self.meta = yaml.safe_load(ler(self.pasta / "livro.yaml"))
        self.nome = self.meta["arquivo"]
        self.dist = self.pasta / "dist"
        self.tmp = self.pasta / ".build"
        self.capitulos = sorted((self.pasta / "capitulos").glob("*.md"))
        self.dist.mkdir(exist_ok=True)
        self.tmp.mkdir(exist_ok=True)

    def t(self, nome):
        return self.tmp / nome

    def pandoc(self, saida, *extras, web=False):
        env = dict(os.environ, SAIDA="web" if web else "livro")
        cmd = ["pandoc", *self.capitulos,
               "--from", "markdown+tex_math_dollars+fenced_divs",
               "--metadata-file", self.pasta / "livro.yaml",
               "--metadata", f"base={BUILD.as_uri()}/",
               "--lua-filter", BUILD / "livro.lua",
               "--mathml", "--toc", "--toc-depth=2", "--section-divs",
               "--wrap=none", "-o", saida, *extras]
        roda(cmd, env=env)

    def render(self, modo, entrada, saida):
        roda(["node", BUILD / "render.cjs", modo, entrada, saida,
              self.meta.get("rodape", "")])

    def capa(self):
        html = (ler(self.pasta / "capa.html")
                .replace("{{BASE}}", BUILD.as_uri() + "/")
                .replace("{{ARTE}}", ler(self.pasta / "arte.svg")))
        gravar(self.t("capa.html"), html)
        self.render("capa", self.t("capa.html"), self.t("capa.pdf"))
        self.render("png", self.t("capa.html"), self.t("capa.png"))


def prepara_sumario(html):
    """Envolve cada item do sumário em txt + pontos + número
    (000 é o espaço reservado do primeiro passo)."""
    def item(m):
        alvo, attrs, interno = m.group(1), m.group(2), m.group(3)
        return (f'<a href="#{alvo}"{attrs}><span class="txt">'
                f'{interno}</span><span class="pontos"></span>'
                f'<span class="pg">000</span></a>')
    ini = html.index('<nav class="sumario"')
    fim = html.index("</nav>", ini)
    trecho = re.sub(r'<a href="#([^"]+)"([^>]*)>(.*?)</a>', item,
                    html[ini:fim], flags=re.S)
    return html[:ini] + trecho + html[fim:]


def paginas_dos_titulos(pdf):
    """Página de cada título, lida dos destinos nomeados que o
    Chromium grava no PDF para cada âncora (#id)."""
    leitor = PdfReader(pdf)
    paginas = {}
    for nome, destino in leitor.named_destinations.items():
        alvo = unquote(nome.lstrip("/"))
        paginas[alvo] = leitor.get_destination_page_number(destino) + 1
    return paginas


def gera_pdf(livro):
    livro.capa()
    livro.pandoc(livro.t("livro.html"),
                 "--template", BUILD / "template-pdf.html")
    html = prepara_sumario(ler(livro.t("livro.html")))
    gravar(livro.t("livro.html"), html)
    livro.render("corpo", livro.t("livro.html"), livro.t("passo1.pdf"))
    paginas = paginas_dos_titulos(livro.t("passo1.pdf"))
    faltando = [a for a in re.findall(r'<a href="#([^"]+)"',
                                      html.split("</nav>")[0])
                if a not in paginas]
    if faltando:
        print("aviso: sem página para", faltando[:10])

    # passo 2: mesmo HTML, agora com os números de página
    html2 = re.sub(
        r'<a href="#([^"]+)"([^>]*)><span class="txt">(.*?)</span>'
        r'<span class="pontos"></span><span class="pg">000</span>',
        lambda m: (f'<a href="#{m.group(1)}"{m.group(2)}>'
                   f'<span class="txt">{m.group(3)}</span>'
                   f'<span class="pontos"></span>'
                   f'<span class="pg">{paginas.get(m.group(1), "")}'
                   f'</span>'),
        html, flags=re.S)
    gravar(livro.t("livro2.html"), html2)
    livro.render("corpo", livro.t("livro2.html"), livro.t("passo2.pdf"))

    m = livro.meta
    escritor = PdfWriter()
    escritor.append(PdfReader(livro.t("capa.pdf")))
    escritor.append(PdfReader(livro.t("passo2.pdf")), import_outline=True)
    escritor.add_metadata({
        "/Author": f'{m["author"]} ({m.get("handle", "")})',
        "/Title": m.get("pdf-titulo", m["title"]),
        "/Subject": m.get("pdf-assunto", ""),
        "/Keywords": m.get("pdf-palavras", ""),
    })
    escritor.page_mode = "/UseOutlines"
    saida = livro.dist / f"{livro.nome}.pdf"
    with open(saida, "wb") as f:
        escritor.write(f)
    print("PDF:", saida, len(PdfReader(saida).pages), "páginas")


def gera_epub(livro):
    if not livro.t("capa.png").exists():
        livro.capa()
    extras = ["--to", "epub3", "--css", BUILD / "epub.css",
              "--epub-cover-image", livro.t("capa.png"),
              "--split-level=1", "--epub-title-page=true"]
    for f in sorted((BUILD / "fontes").glob("*.woff2")):
        extras += ["--epub-embed-font", f]
    livro.pandoc(livro.dist / f"{livro.nome}.epub", *extras)


def gera_web(livro):
    saida = livro.dist / f"{livro.nome}.html"
    livro.pandoc(saida, "--to", "html5",
                 "--template", BUILD / "template-web.html", web=True)
    html = ler(saida)

    def data_uri(nome):
        dados = (BUILD / "fontes" / nome).read_bytes()
        return "data:font/woff2;base64," + base64.b64encode(dados).decode()
    fontes = "".join(
        f'@font-face{{font-family:"DejaVu Sans Mono";font-weight:{p};'
        f'font-display:swap;src:url({data_uri(n)}) format("woff2")}}\n'
        for p, n in ((400, "dejavu-sans-mono.woff2"),
                     (700, "dejavu-sans-mono-bold.woff2")))
    html = html.replace("/*FONTES*/", fontes)
    html = html.replace("/*ESTILO*/", ler(BUILD / "estilo.css"))
    html = html.replace("/*WEB*/", ler(BUILD / "web.css"))
    html = html.replace("<!--ARTE-->", ler(livro.pasta / "arte.svg"))
    gravar(saida, html)
    print("web:", saida, round(len(html.encode()) / 1e6, 2), "MB")


def gera_anki(livro):
    """Exporta os blocos ::: flashcards como texto para o Anki
    (Arquivo > Importar; frente, verso e etiqueta por capítulo)."""
    linhas = ["#separator:tab", "#html:true", "#tags column:3"]
    total = 0
    for cap in livro.capitulos:
        texto = ler(cap)
        titulo = re.search(r"^# (.+?)(?:\s*\{#.*\})?$", texto, re.M)
        etiqueta = re.sub(r"\W+", "_", cap.stem)
        for bloco in re.findall(r"^::: flashcards\n(.*?)^:::$", texto,
                                re.M | re.S):
            for frente, verso in re.findall(
                    r"^- \*\*(.+?)\*\*\s+(.+)$", bloco, re.M):
                frente = markdown_simples(frente)
                verso = markdown_simples(verso)
                linhas.append(f"{frente}\t{verso}\t{etiqueta}")
                total += 1
    if total == 0:
        return
    saida = livro.dist / f"{livro.nome}-flashcards.txt"
    gravar(saida, "\n".join(linhas) + "\n")
    print("anki:", saida, total, "cartões")


def markdown_simples(s):
    """Negrito, itálico e código para HTML; fórmulas ficam em texto."""
    s = s.replace("\t", " ")
    s = re.sub(r"`([^`]+)`", r"<code>\1</code>", s)
    s = re.sub(r"\*\*([^*]+)\*\*", r"<b>\1</b>", s)
    s = re.sub(r"(?<!\w)\*([^*]+)\*(?!\w)", r"<i>\1</i>", s)
    s = re.sub(r"\$([^$]+)\$", r"\1", s)
    return s


if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    livro = Livro(sys.argv[1])
    alvos = sys.argv[2:] or ["pdf", "epub", "web", "anki"]
    if "pdf" in alvos:
        gera_pdf(livro)
    if "epub" in alvos:
        gera_epub(livro)
    if "web" in alvos:
        gera_web(livro)
    if "anki" in alvos:
        gera_anki(livro)
