"""Gera o EPUB 3 a partir do livro lido por montar.py.

Usa os PNGs de build/.tmp/imagens (gerados por imagens.mjs). Um arquivo XHTML por capítulo,
navegação EPUB 3 (nav.xhtml) e NCX (para leitores antigos e Kindle).
"""
from __future__ import annotations

import datetime
import html
import io
import re
import uuid
import zipfile
from pathlib import Path

from bs4 import BeautifulSoup
from lxml import etree
from lxml import html as lhtml
from PIL import Image

RAIZ = Path(__file__).resolve().parent.parent
BUILD = RAIZ / "build"
DIST = RAIZ / "dist"
IMAGENS = BUILD / ".tmp" / "imagens"
NOME = "system-design-50-conceitos"
TITULO = "50 Conceitos de System Design"

esc = lambda s: html.escape(str(s), quote=True)  # noqa: E731


def para_xhtml(fragmento: str) -> str:
    """HTML qualquer → XHTML bem formado."""
    if not fragmento.strip():
        return ""
    saida = []
    for parte in lhtml.fragments_fromstring(fragmento):
        if isinstance(parte, str):
            saida.append(html.escape(parte, quote=False))
        else:
            saida.append(etree.tostring(parte, method="xml", encoding="unicode"))
    return "".join(saida)


def documento(titulo: str, corpo: str, tipo: str = "", css: str = "../estilo.css") -> str:
    atributo = f' epub:type="{tipo}"' if tipo else ""
    return (
        '<?xml version="1.0" encoding="utf-8"?>\n<!DOCTYPE html>\n'
        '<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="pt-BR" lang="pt-BR">\n'
        f'<head><meta charset="utf-8"/><title>{esc(titulo)}</title><link rel="stylesheet" type="text/css" href="{css}"/></head>\n'
        f"<body{atributo}>\n{corpo}\n</body>\n</html>\n"
    )


class Montador:
    def __init__(self, livro: dict):
        self.livro = livro
        self.arquivos: list[tuple[str, str, str]] = []  # (id, titulo, xhtml)
        self.ids = (
            ["sobre", "como-estudar", "fechamento", "cola", "simulado"]
            + [p.id for p in livro["partes"]]
            + [c.id for c in livro["capitulos"]]
            + [a.id for a in livro["apendices"]]
        )
        self.imagens: set[str] = set()

    def arquivo_de(self, alvo: str) -> str:
        if alvo in self.ids:
            return alvo
        for i in sorted(self.ids, key=len, reverse=True):
            if alvo.startswith(i + "-"):
                return i
        return ""

    def ajustar(self, fragmento: str, descer_titulos: bool = False) -> str:
        """Links entre arquivos, diagramas em PNG e perguntas sem <details>."""
        s = BeautifulSoup(fragmento, "html.parser")
        for a in s.find_all("a", href=True):
            if a["href"].startswith("#"):
                alvo = a["href"][1:]
                arq = self.arquivo_de(alvo)
                if arq:
                    a["href"] = f"{arq}.xhtml#{alvo}"
            for atributo in ("title", "aria-hidden", "tabindex"):
                if atributo in a.attrs and atributo != "title":
                    del a[atributo]
        for quadro in s.find_all("div", class_="lousa-quadro"):
            nome = quadro.get("data-diagrama", "")
            fig = quadro.find_parent("figure")
            legenda = fig.find("figcaption") if fig else None
            alt = quadro.get("data-alt") or (legenda.get_text(" ", strip=True) if legenda else nome)
            img = s.new_tag("img", src=f"../imagens/{nome}.png", alt=alt)
            quadro.replace_with(img)
            self.imagens.add(nome)
        for det in s.find_all("details"):
            q = det.find("span", class_="q")
            r = det.find("div", class_="r")
            novo = s.new_tag("div", attrs={"class": "qa"})
            pq = s.new_tag("p", attrs={"class": "q"})
            forte = s.new_tag("strong")
            if q:
                forte.extend(list(q.contents))
            pq.append(forte)
            novo.append(pq)
            if r:
                novo.append(r)
            det.replace_with(novo)
        for el in s.find_all(attrs={"data-diagrama": True}):
            del el["data-diagrama"]
        x = para_xhtml(str(s))
        if descer_titulos:
            for n in (3, 4, 5):
                x = re.sub(rf"<(/?)h{n}\b", rf"<\g<1>h{n - 1}", x)
        return x

    def adicionar(self, id_: str, titulo: str, corpo: str, tipo: str = ""):
        self.arquivos.append((id_, titulo, documento(titulo, corpo, tipo)))

    def montar(self):
        L = self.livro
        tit = L["titulos"]
        for pg in L["abertura"]:
            self.adicionar(pg.id, pg.titulo, f'<section class="pagina" id="{pg.id}"><p class="sobretitulo">{esc(pg.rotulo)}</p><h1>{esc(pg.titulo)}</h1>{self.ajustar(pg.corpo)}</section>', "frontmatter")
        for p in L["partes"]:
            caps = "".join(f'<li><a href="{c.id}.xhtml#{c.id}">{c.numero} · {esc(c.titulo)}</a></li>' for c in p.capitulos)
            self.adicionar(
                p.id,
                f"Parte {p.numero}: {p.titulo}",
                f'<section class="parte" id="{p.id}" epub:type="part"><p class="parte-num">Parte {p.numero}</p><h1>{esc(p.titulo)}</h1>'
                f'<p class="original" lang="en" xml:lang="en">{esc(p.original)}</p>{self.ajustar(p.intro)}<ol class="parte-caps">{caps}</ol></section>',
            )
            for c in p.capitulos:
                from montar import inline  # noqa: PLC0415

                rel = "".join(f'<li><a href="cap-{r:02d}.xhtml#cap-{r:02d}">{r} · {esc(tit[r])}</a></li>' for r in c.relacionados if r in tit)
                corpo = (
                    f'<section class="capitulo" id="{c.id}" epub:type="chapter">'
                    f'<header><p class="cap-num">Capítulo {c.numero} · Parte {p.numero}</p><h1>{esc(c.titulo)}</h1>'
                    f'<p class="original" lang="en" xml:lang="en">{esc(c.original)}</p>'
                    f'<div class="frase"><p class="rotulo">Em uma frase</p><p>{para_xhtml(inline(c.resumo))}</p></div></header>'
                    f"{self.ajustar(c.corpo, descer_titulos=True)}"
                    + (f'<div class="conecta"><p class="rotulo">Conecta com</p><ul>{rel}</ul></div>' if rel else "")
                    + "</section>"
                )
                self.adicionar(c.id, f"{c.numero}. {c.titulo}", corpo)
        f = L["fechamento"]
        self.adicionar(f.id, f.titulo, f'<section class="pagina" id="{f.id}"><p class="sobretitulo">Fechamento</p><h1>{esc(f.titulo)}</h1>{self.ajustar(f.corpo)}</section>')
        from montar import inline  # noqa: PLC0415

        cola = "".join(
            f'<h2>Parte {p.numero} · {esc(p.titulo)}</h2><dl class="cola">'
            + "".join(f'<dt><a href="{c.id}.xhtml#{c.id}">{c.numero} · {esc(c.titulo)}</a></dt><dd>{para_xhtml(inline(c.resumo))}</dd>' for c in p.capitulos)
            + "</dl>"
            for p in L["partes"]
        )
        self.adicionar("cola", "Cola", f'<section class="pagina" id="cola"><p class="sobretitulo">Estudo</p><h1>Cola: os conceitos em uma linha</h1>{cola}</section>')
        for a in L["apendices"]:
            classe = "pagina glossario" if a.id == "glossario" else "pagina"
            self.adicionar(a.id, f"Apêndice {a.letra}: {a.titulo}", f'<section class="{classe}" id="{a.id}" epub:type="appendix"><p class="sobretitulo">{esc(a.rotulo)}</p><h1>{esc(a.titulo)}</h1>{self.ajustar(a.corpo)}</section>', "backmatter")
        if L["simulado"]:
            sim = L["simulado"]
            qs = "".join(
                f'<li class="questao"><p class="enunciado"><strong>{q.numero}.</strong> {self.ajustar(q.enunciado)}</p><ol class="alts" type="a">'
                + "".join(f"<li>{para_xhtml(alt)}</li>" for alt in q.alternativas)
                + "</ol></li>"
                for q in L["questoes"]
            )
            gab = "".join(f'<li><strong>{q.numero}. {"abcd"[q.correta]})</strong> {self.ajustar(q.explicacao)}</li>' for q in L["questoes"])
            self.adicionar(
                "simulado",
                f"Apêndice E: {sim.titulo}",
                f'<section class="pagina" id="simulado" epub:type="appendix"><p class="sobretitulo">Apêndice E</p><h1>{esc(sim.titulo)}</h1>{self.ajustar(sim.corpo)}'
                f'<ol class="simulado">{qs}</ol><h2>Gabarito comentado</h2><ol class="gabarito">{gab}</ol></section>',
                "backmatter",
            )

    # ───────── navegação ─────────

    def nav(self) -> str:
        L = self.livro
        item = lambda id_, t: f'<li><a href="texto/{id_}.xhtml#{id_}">{esc(t)}</a></li>'  # noqa: E731
        partes = "".join(
            f'<li><a href="texto/{p.id}.xhtml#{p.id}">Parte {p.numero}: {esc(p.titulo)}</a><ol>'
            + "".join(item(c.id, f"{c.numero}. {c.titulo}") for c in p.capitulos)
            + "</ol></li>"
            for p in L["partes"]
        )
        apend = "".join(item(a.id, f"Apêndice {a.letra}: {a.titulo}") for a in L["apendices"])
        if L["simulado"]:
            apend += item("simulado", f"Apêndice E: {L['simulado'].titulo}")
        lista = (
            "".join(item(pg.id, pg.titulo) for pg in L["abertura"])
            + partes
            + item("fechamento", L["fechamento"].titulo)
            + item("cola", "Cola: os conceitos em uma linha")
            + apend
        )
        corpo = (
            f'<nav epub:type="toc" id="toc"><h1>Sumário</h1><ol>{lista}</ol></nav>'
            '<nav epub:type="landmarks" hidden=""><ol>'
            '<li><a epub:type="cover" href="capa.xhtml">Capa</a></li>'
            '<li><a epub:type="toc" href="nav.xhtml">Sumário</a></li>'
            f'<li><a epub:type="bodymatter" href="texto/{L["partes"][0].id}.xhtml">Começo do livro</a></li>'
            "</ol></nav>"
        )
        return documento("Sumário", corpo, css="estilo.css")

    def ncx(self, uid: str) -> str:
        n = 0

        def ponto(id_: str, t: str, filhos: str = "") -> str:
            nonlocal n
            n += 1
            return f'<navPoint id="np{n}" playOrder="{n}"><navLabel><text>{esc(t)}</text></navLabel><content src="texto/{id_}.xhtml#{id_}"/>{filhos}</navPoint>'

        L = self.livro
        pontos = [ponto(pg.id, pg.titulo) for pg in L["abertura"]]
        for p in L["partes"]:
            pai_n = n + 1
            n += 1
            filhos = "".join(ponto(c.id, f"{c.numero}. {c.titulo}") for c in p.capitulos)
            pontos.append(
                f'<navPoint id="np{pai_n}" playOrder="{pai_n}"><navLabel><text>{esc(f"Parte {p.numero}: {p.titulo}")}</text></navLabel>'
                f'<content src="texto/{p.id}.xhtml#{p.id}"/>{filhos}</navPoint>'
            )
        pontos.append(ponto("fechamento", L["fechamento"].titulo))
        pontos.append(ponto("cola", "Cola"))
        for a in L["apendices"]:
            pontos.append(ponto(a.id, f"Apêndice {a.letra}: {a.titulo}"))
        if L["simulado"]:
            pontos.append(ponto("simulado", f"Apêndice E: {L['simulado'].titulo}"))
        return (
            '<?xml version="1.0" encoding="utf-8"?>\n<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1" xml:lang="pt-BR">'
            f'<head><meta name="dtb:uid" content="{uid}"/><meta name="dtb:depth" content="2"/>'
            '<meta name="dtb:totalPageCount" content="0"/><meta name="dtb:maxPageNumber" content="0"/></head>'
            f"<docTitle><text>{esc(TITULO)}</text></docTitle><navMap>{''.join(pontos)}</navMap></ncx>\n"
        )


def png_otimizado(caminho: Path, cores: int = 128) -> bytes:
    im = Image.open(caminho).convert("RGB").quantize(colors=cores, method=Image.Quantize.FASTOCTREE)
    buf = io.BytesIO()
    im.save(buf, format="PNG", optimize=True)
    return buf.getvalue()


def gerar_epub(livro: dict) -> Path:
    if not (IMAGENS / "capa-livro.png").exists():
        raise SystemExit("Faltam as imagens do EPUB: rode node ebooks/system-design/build/imagens.mjs")
    m = Montador(livro)
    m.montar()
    uid = f"urn:uuid:{uuid.uuid5(uuid.NAMESPACE_URL, 'farm-conteudo/ebooks/system-design-50-conceitos')}"
    agora = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    # todo XHTML precisa ser XML bem formado
    for id_, _, x in m.arquivos:
        etree.fromstring(x.encode("utf-8"))
    nav = m.nav()
    etree.fromstring(nav.encode("utf-8"))

    faltam = [n for n in m.imagens if not (IMAGENS / f"{n}.png").exists()]
    if faltam:
        raise SystemExit(f"PNG faltando para: {faltam} (rode imagens.mjs de novo)")

    manifesto = [
        '<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>',
        '<item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>',
        '<item id="css" href="estilo.css" media-type="text/css"/>',
        '<item id="capa-img" href="imagens/capa.png" media-type="image/png" properties="cover-image"/>',
        '<item id="capa" href="capa.xhtml" media-type="application/xhtml+xml"/>',
    ]
    manifesto += [f'<item id="t-{id_}" href="texto/{id_}.xhtml" media-type="application/xhtml+xml"/>' for id_, _, _ in m.arquivos]
    manifesto += [f'<item id="i-{n}" href="imagens/{n}.png" media-type="image/png"/>' for n in sorted(m.imagens)]
    espinha = ['<itemref idref="capa" linear="yes"/>', '<itemref idref="nav" linear="yes"/>'] + [f'<itemref idref="t-{id_}"/>' for id_, _, _ in m.arquivos]
    opf = (
        '<?xml version="1.0" encoding="utf-8"?>\n'
        '<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="uid" xml:lang="pt-BR">'
        '<metadata xmlns:dc="http://purl.org/dc/elements/1.1/">'
        f'<dc:identifier id="uid">{uid}</dc:identifier><dc:title>{esc(TITULO)}</dc:title><dc:language>pt-BR</dc:language>'
        '<dc:creator>Arslan Ahmad</dc:creator><dc:contributor>Edição de estudo em português</dc:contributor>'
        "<dc:description>Tradução fiel e expansão de '50 System Design Concepts for Beginners in 90 Minutes', com diagramas, dicas de entrevista, perguntas de revisão e simulado.</dc:description>"
        '<dc:subject>System design</dc:subject>'
        f'<meta property="dcterms:modified">{agora}</meta><meta name="cover" content="capa-img"/>'
        f'</metadata><manifest>{"".join(manifesto)}</manifest><spine toc="ncx">{"".join(espinha)}</spine></package>\n'
    )
    capa = documento("Capa", f'<div class="capa"><img src="imagens/capa.png" alt="{esc(TITULO)}: capa"/></div>', "cover", css="estilo.css")

    destino = DIST / f"{NOME}.epub"
    with zipfile.ZipFile(destino, "w") as z:
        z.writestr(zipfile.ZipInfo("mimetype"), "application/epub+zip", compress_type=zipfile.ZIP_STORED)
        zd = lambda nome, dados: z.writestr(nome, dados, compress_type=zipfile.ZIP_DEFLATED)  # noqa: E731
        zd(
            "META-INF/container.xml",
            '<?xml version="1.0" encoding="utf-8"?>\n<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">'
            '<rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles></container>\n',
        )
        zd("OEBPS/content.opf", opf)
        zd("OEBPS/nav.xhtml", nav)
        zd("OEBPS/toc.ncx", m.ncx(uid))
        zd("OEBPS/estilo.css", (BUILD / "epub.css").read_text(encoding="utf-8"))
        zd("OEBPS/capa.xhtml", capa)
        z.writestr("OEBPS/imagens/capa.png", png_otimizado(IMAGENS / "capa-livro.png", 256))
        for n in sorted(m.imagens):
            z.writestr(f"OEBPS/imagens/{n}.png", png_otimizado(IMAGENS / f"{n}.png"))
        for id_, _, x in m.arquivos:
            zd(f"OEBPS/texto/{id_}.xhtml", x)
    return destino


def verificar_epub(caminho: Path) -> list[str]:
    """Conferência estrutural: manifesto x arquivos, links internos, imagens e XML bem formado."""
    problemas: list[str] = []
    with zipfile.ZipFile(caminho) as z:
        nomes = z.namelist()
        if nomes[0] != "mimetype" or z.getinfo("mimetype").compress_type != zipfile.ZIP_STORED:
            problemas.append("mimetype precisa ser o primeiro arquivo, sem compressão")
        opf = etree.fromstring(z.read("OEBPS/content.opf"))
        ns = {"o": "http://www.idpf.org/2007/opf"}
        manifesto = {i.get("href"): i.get("id") for i in opf.findall(".//o:manifest/o:item", ns)}
        ids_manifesto = set(manifesto.values())
        for href in manifesto:
            if f"OEBPS/{href}" not in nomes:
                problemas.append(f"no manifesto mas não no zip: {href}")
        for nome in nomes:
            if nome.startswith("OEBPS/") and nome != "OEBPS/content.opf" and nome[6:] not in manifesto:
                problemas.append(f"no zip mas não no manifesto: {nome}")
        for ref in opf.findall(".//o:spine/o:itemref", ns):
            if ref.get("idref") not in ids_manifesto:
                problemas.append(f"spine aponta para id inexistente: {ref.get('idref')}")
        xhtml = {n: etree.fromstring(z.read(n)) for n in nomes if n.endswith(".xhtml")}
        ids_por_arquivo = {n: {e.get("id") for e in doc.iter() if e.get("id")} for n, doc in xhtml.items()}
        for n, doc in xhtml.items():
            base = n.rsplit("/", 1)[0]
            for el in doc.iter("{http://www.w3.org/1999/xhtml}a", "{http://www.w3.org/1999/xhtml}img"):
                alvo = el.get("href") or el.get("src") or ""
                if not alvo or re.match(r"^[a-z]+:", alvo):
                    continue
                arquivo, _, ancora = alvo.partition("#")
                destino = n if not arquivo else str(Path(base, arquivo)).replace("\\", "/")
                destino = re.sub(r"[^/]+/\.\./", "", destino)
                if destino not in nomes:
                    problemas.append(f"{n}: alvo inexistente {alvo}")
                elif ancora and destino in ids_por_arquivo and ancora not in ids_por_arquivo[destino]:
                    problemas.append(f"{n}: âncora inexistente {alvo}")
    return problemas
