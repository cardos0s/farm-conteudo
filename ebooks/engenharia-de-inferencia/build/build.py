"""Gera o ebook em PDF, EPUB e HTML (versão web).

Requisitos: pandoc 3, Node com Playwright (Chromium), Python com pypdf.
Uso (a partir da pasta do livro):  python build/build.py
"""
import base64
import glob
import os
import re
import subprocess
import sys
from urllib.parse import unquote

from pypdf import PdfReader, PdfWriter

AQUI = os.path.dirname(os.path.abspath(__file__))
LIVRO = os.path.dirname(AQUI)
DIST = os.path.join(LIVRO, "dist")
NOME = "engenharia-de-inferencia"
CAPITULOS = sorted(glob.glob(os.path.join(LIVRO, "capitulos", "*.md")))


def b(*partes):
    return os.path.join(AQUI, *partes)


def ler(caminho):
    with open(caminho, encoding="utf-8") as f:
        return f.read()


def gravar(caminho, texto):
    with open(caminho, "w", encoding="utf-8") as f:
        f.write(texto)


def roda(cmd):
    print("$", " ".join(os.path.basename(c) if os.sep in c else c
                        for c in cmd[:3]), "...")
    subprocess.run(cmd, check=True, cwd=AQUI)


def pandoc(saida, *extras):
    cmd = ["pandoc", *CAPITULOS,
           "--from", "markdown+tex_math_dollars+fenced_divs",
           "--metadata-file", b("meta.yaml"),
           "--lua-filter", b("livro.lua"),
           "--mathml", "--toc", "--toc-depth=2", "--section-divs",
           "--wrap=none", "-o", saida, *extras]
    roda(cmd)


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


def gera_pdf():
    svg = ler(b("roofline.svg"))
    gravar(b("_capa.html"), ler(b("capa.html")).replace("{{ROOFLINE}}", svg))
    roda(["node", b("render.cjs"), "capa", b("_capa.html"), b("_capa.pdf")])
    roda(["node", b("render.cjs"), "png", b("_capa.html"), b("_capa.png")])

    pandoc(b("_livro.html"), "--template", b("template-pdf.html"))
    html = prepara_sumario(ler(b("_livro.html")))
    gravar(b("_livro.html"), html)
    roda(["node", b("render.cjs"), "corpo", b("_livro.html"),
          b("_passo1.pdf")])
    paginas = paginas_dos_titulos(b("_passo1.pdf"))
    faltando = [a for a in re.findall(r'<a href="#([^"]+)"',
                                      html.split("</nav>")[0])
                if a not in paginas]
    if faltando:
        print("aviso: sem página para", faltando[:10])

    # passo 2: mesmo HTML, agora com os números de página
    html2 = ler(b("_livro.html"))
    html2 = re.sub(r'<span class="pg">000</span>', "", html2)
    html2 = re.sub(
        r'<a href="#([^"]+)"([^>]*)><span class="txt">(.*?)</span>'
        r'<span class="pontos"></span>',
        lambda m: (f'<a href="#{m.group(1)}"{m.group(2)}>'
                   f'<span class="txt">{m.group(3)}</span>'
                   f'<span class="pontos"></span>'
                   f'<span class="pg">{paginas.get(m.group(1), "")}'
                   f'</span>'),
        html2, flags=re.S)
    gravar(b("_livro2.html"), html2)
    roda(["node", b("render.cjs"), "corpo", b("_livro2.html"),
          b("_passo2.pdf")])

    escritor = PdfWriter()
    escritor.append(PdfReader(b("_capa.pdf")))
    escritor.append(PdfReader(b("_passo2.pdf")), import_outline=True)
    escritor.add_metadata({
        "/Author": "Júlia Cardoso (@juliacardoso.dev)",
        "/Title": "Engenharia de Inferência: o guia completo para "
                  "entrevistas",
        "/Subject": "Os 14 temas e as 50 perguntas de entrevistas de "
                    "engenharia de inferência",
        "/Keywords": "LLM, inferência, GPU, CUDA, KV cache, batching",
    })
    escritor.page_mode = "/UseOutlines"
    saida = os.path.join(DIST, f"{NOME}.pdf")
    with open(saida, "wb") as f:
        escritor.write(f)
    print("PDF:", saida, len(PdfReader(saida).pages), "páginas")


def gera_epub():
    fontes = sorted(glob.glob(b("fontes", "*.woff2")))
    extras = ["--to", "epub3", "--css", b("epub.css"),
              "--epub-cover-image", b("_capa.png"),
              "--split-level=1", "--epub-title-page=true",
              "--metadata", "title=Engenharia de Inferência",
              "--metadata", "subtitle=O guia completo para entrevistas"]
    for f in fontes:
        extras += ["--epub-embed-font", f]
    pandoc(os.path.join(DIST, f"{NOME}.epub"), *extras)


def gera_web():
    saida = os.path.join(DIST, f"{NOME}.html")
    pandoc(saida, "--to", "html5", "--template", b("template-web.html"))
    html = ler(saida)

    def data_uri(nome):
        with open(b("fontes", nome), "rb") as f:
            return ("data:font/woff2;base64,"
                    + base64.b64encode(f.read()).decode())
    fontes = "".join(
        f'@font-face{{font-family:"DejaVu Sans Mono";font-weight:{p};'
        f'font-display:swap;src:url({data_uri(n)}) format("woff2")}}\n'
        for p, n in ((400, "dejavu-sans-mono.woff2"),
                     (700, "dejavu-sans-mono-bold.woff2")))
    html = html.replace("/*FONTES*/", fontes)
    html = html.replace("/*ESTILO*/", ler(b("estilo.css")))
    html = html.replace("/*WEB*/", ler(b("web.css")))
    html = html.replace("<!--ROOFLINE-->", ler(b("roofline.svg")))
    gravar(saida, html)
    print("web:", saida, round(len(html.encode()) / 1e6, 2), "MB")


if __name__ == "__main__":
    os.makedirs(DIST, exist_ok=True)
    alvos = sys.argv[1:] or ["pdf", "epub", "web"]
    if "pdf" in alvos:
        gera_pdf()
    if "epub" in alvos:
        if not os.path.exists(b("_capa.png")):
            svg = ler(b("roofline.svg"))
            gravar(b("_capa.html"),
                   ler(b("capa.html")).replace("{{ROOFLINE}}", svg))
            roda(["node", b("render.cjs"), "png", b("_capa.html"),
                  b("_capa.png")])
        gera_epub()
    if "web" in alvos:
        gera_web()
