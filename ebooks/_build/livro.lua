-- Ajustes de estrutura do ebook para as saídas HTML, PDF e EPUB.

-- destaque de sintaxe: o pandoc não conhece "cuda"; usa o de C++
function CodeBlock(el)
  local lang = el.classes[1]
  if lang == "cuda" then
    el.classes = pandoc.List({ "cpp" })
  end
  if lang then
    el.attributes["data-lang"] = lang
  end
  return el
end

-- respostas dos testes: recolhidas na versão web
local web = os.getenv("SAIDA") == "web"
function Div(el)
  if web and el.classes:includes("respostas") then
    local blocos = pandoc.List({
      pandoc.RawBlock("html", '<details class="respostas">'
        .. "<summary>Ver respostas</summary>") })
    blocos:extend(el.content)
    blocos:insert(pandoc.RawBlock("html", "</details>"))
    return blocos
  end
end

-- tabelas largas rolam dentro de um contêiner próprio
function Table(el)
  return pandoc.Div({ el }, pandoc.Attr("", { "tabela" }))
end

local function str(el, texto)
  return el and el.t == "Str" and (texto == nil or el.text == texto)
end

function Header(el)
  local c = el.content
  -- "Q009 — Texto"  ->  [Q009] Texto
  if el.identifier:match("^q%d%d%d$") and #c >= 4 and str(c[1])
      and c[1].text:match("^Q%d%d%d$") and str(c[3], "—") then
    local novo = pandoc.Inlines({
      pandoc.Span({ pandoc.Str(c[1].text) }, pandoc.Attr("", { "qid" })),
      pandoc.Space(),
    })
    for i = 5, #c do novo:insert(c[i]) end
    el.content = novo
    el.classes:insert("pergunta")
  -- "Capítulo 3 — Texto" ou "Apêndice A — Texto"
  elseif el.level == 1 and #c >= 6 and str(c[1]) and str(c[5], "—")
      and (c[1].text == "Capítulo" or c[1].text == "Apêndice") then
    local rotulo = pandoc.Span(
      { pandoc.Str(c[1].text), pandoc.Space(), pandoc.Str(c[3].text) },
      pandoc.Attr("", { "rotulo" }))
    local titulo = pandoc.List()
    for i = 7, #c do titulo:insert(c[i]) end
    el.content = pandoc.Inlines({
      rotulo, pandoc.Space(),
      pandoc.Span(titulo, pandoc.Attr("", { "titulo" })),
    })
  end
  -- seções que se repetem em todo capítulo ficam fora do sumário
  local fixas = {
    ["Resumo do capítulo"] = true, ["Checklist para a entrevista"] = true,
    ["Erros comuns"] = true, ["Por que importa"] = true,
    ["Teste-se"] = true, ["Flashcards"] = true,
  }
  if el.level == 2 and fixas[pandoc.utils.stringify(el.content)] then
    el.classes:insert("unlisted")
  end
  return el
end
