"""Gera roteiro.html (o roteiro de gravação da Aula 2) a partir da narração e da lousa.

Junta, para cada seção do texto da ElevenLabs: o tempo estimado, as páginas da lousa (miniaturas),
o texto exato de cada fala e o que entender antes de gravar. Rode a partir da raiz do repositório:

    npm run miniaturas:aula
    python3 aulas/llm-como-juiz/pdf/fonte/gerar_roteiro.py
"""

import html
import json
import re
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[4]
NARRACAO = RAIZ / "remotion/aulas/llm-juiz/narracao"
AULA = RAIZ / "remotion/aulas/llm-juiz/Aula.tsx"
DESTINO = Path(__file__).with_name("roteiro.html")
MINIATURAS = "../../../../saida/aulas/llm-juiz/miniaturas"

TITULOS = {
    "abertura": "Abertura", "agente": "O seu agente de IA", "pergunta": "A pergunta", "promessa": "O que a aula entrega",
    "frase": "A frase da aula", "llm": "O que é um LLM", "proxima": "A próxima palavra", "confianca": "Mesma confiança",
    "alucinacao": "Alucinação", "colega": "O colega da voz firme", "agenteDef": "O que é um agente", "nota": "O experimento da nota",
    "llmNota": "E se a nota vier de um LLM?", "subjetiva": "Subjetiva × estruturada", "enem": "A redação do Enem",
    "cap2": "Capa da parte 2", "juiz": "LLM como juiz", "var": "Como o VAR", "fluxo": "O sistema em cinco caixas",
    "conceitos": "Quatro conceitos", "honestidade": "Honestidade técnica", "cap3": "Capa da parte 3", "conversa": "O caso da aula",
    "checks": "Check = sim ou não", "estranho": "O teste do estranho", "pesos": "Pesos", "codigoJuiz": "Código ou juiz?",
    "baseline": "O baseline em JSON", "evidencia": "O que é evidência", "cap4": "Capa da parte 4", "pecas": "Três peças",
    "formulario": "Parte A: o formulário", "prompt": "O prompt do juiz", "julgar": "A chamada ao modelo",
    "localizar": "Parte B: localizar", "repl": "Testando", "gates": "Os gates", "existir": "Existir não é sustentar",
    "score": "Parte C: calculate_score", "conta": "A conta", "rodar": "Rodando nos três resumos", "cap5": "Capa da parte 5",
    "tresVezes": "Três execuções", "detetive": "Lendo o relatório", "raciocinio": "O raciocínio do juiz",
    "investigacao": "A investigação", "v2": "Consertando a régua", "provaFalsa": "A prova falsa", "media": "A média não basta",
    "cap6": "Capa da parte 6", "ci": "CI/CD", "skills": "Skill ou subagente?", "limites": "Os limites do juiz",
    "resumoFinal": "Cinco frases", "desafio": "O desafio", "fim": "Encerramento",
}

# O que entender antes de gravar cada seção (na ordem das seções de falas.json).
ENTENDER = [
    ["Só o título: tom de abertura, animado e calmo.", "Diga <em>LLM</em> como sigla (\"éle éle ême\")."],
    ["O gancho é a pergunta: <strong>como você prova</strong> que o agente faz o que deveria?",
     "\"Parecer certo não é estar certo\" é a frase da aula: dê peso a ela, com uma pausa antes."],
    ["LLM prevê a próxima palavra; por isso escreve com a <strong>mesma confiança</strong> no acerto e no erro.",
     "Alucinação = dado inventado com cara de verdadeiro. O perigo é ser bem escrita.",
     "Em \"O plano anual tem dez por cento de...\", faça uma pausa de suspense antes de \"desconto\"."],
    ["Agente = LLM + tarefa + ferramentas.", "No experimento, peça mesmo para a pessoa pausar o vídeo; deixe um respiro depois.",
     "A mensagem: as notas mudam porque o <strong>critério</strong> não estava escrito."],
    ["Subjetiva pede opinião; estruturada pede verificação.",
     "O Enem é a analogia: até com grade, corretores discordam, e existe um processo para medir isso."],
    ["O juiz não decide sozinho: mostra provas, e um programa confere.", "VAR: sem replay, não vale."],
    ["As cinco caixas: PRD, baseline congelado, implementador, juiz independente, score em Python.",
     "Os gates ficam entre o juiz e a conta. A lousa mostra cada caixa enquanto você fala dela: siga a ordem."],
    ["Determinismo, contaminação de contexto, independência e estado limpo: um exemplo do dia a dia para cada.",
     "Honestidade técnica: a conta é determinística; o julgamento pode variar. Reduzir e medir."],
    ["O caso: Marina (vendas), Roberto (três padarias), R$ 890, 10% de desconto e <strong>três ações</strong>.",
     "Check binário e o teste do estranho. Avise que o C02 vai dar trabalho, sem explicar por quê."],
    ["Pesos 1, 2 e 3: inventar é o erro mais caro.", "Regra de ouro: se dá para verificar com código, verifique com código.",
     "Nomes de campos em inglês (<em>verified by</em>, <em>pass condition</em>) podem ser lidos como estão."],
    ["Formulário = saída estruturada; a ordem dos campos força a prova antes da decisão.",
     "Prompt injection: o resumo é avaliado, não manda.", "Na chamada ao modelo, cada linha tem um porquê (estado limpo, rede de segurança)."],
    ["localizar e normalizar: existe ou não existe, e em que linha.", "Gates só rebaixam, nunca promovem.",
     "Existir não é sustentar: o limite mais importante da parte técnica.", "A conta: quatro de seis, 0,6667."],
    ["Diga que os resultados são ilustrativos (está no texto).", "A média engana; a concordância por check mostra o endereço do problema: o C02.",
     "A régua estava torta: o check era ambíguo."],
    ["A v2 diz o que reprova, e a v1 não é editada.", "A prova falsa: o juiz alucinou a própria prova, e o gate corrigiu.",
     "Mesma média, histórias diferentes."],
    ["CI/CD em duas camadas: pytest (grátis) e avaliação real.", "Skill é o mesmo agente; subagente é outro agente com contexto limpo."],
    ["Seis limites, cinco frases, o desafio e a mensagem final.", "Feche devagar: \"quando estão corretos, quando falham, e por quê\"."],
]


def mmss(t: float) -> str:
    return f"{int(t // 60):02d}:{int(t % 60):02d}"


def main() -> None:
    cfg = json.loads((NARRACAO / "falas.json").read_text(encoding="utf-8"))
    tempos = json.loads((NARRACAO / "tempos.json").read_text(encoding="utf-8"))["falas"]
    # página da lousa → primeira fala dela (do ROTEIRO de Aula.tsx)
    pares = re.findall(r'\["(\w+)", "(\w+)"\]', AULA.read_text(encoding="utf-8"))
    pagina_da_fala = {fala: pagina for pagina, fala in pares}
    assert len(ENTENDER) == len(cfg["secoes"]), (len(ENTENDER), len(cfg["secoes"]))

    total = max(t["ate"] for t in tempos.values())
    n_falas = sum(len(s["falas"]) for s in cfg["secoes"])
    partes = [f"""<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Roteiro de gravação · LLM as a Judge</title>
<link rel="stylesheet" href="estilo.css"><style>
.secao {{ break-before: page; }}
.secao h1 {{ break-before: auto; margin-bottom: 1mm; }}
.tempo {{ font-family: "Excalifont"; color: var(--cinza); font-size: 13pt; margin-bottom: 3mm; }}
.pag {{ display: grid; grid-template-columns: 64mm 1fr; gap: 5mm; margin: 0 0 5mm; padding-top: 3mm; border-top: 1px dashed #ced4da; }}
.pag > div:first-child {{ break-inside: avoid; }}
.fala {{ break-inside: avoid; }}
.pag img {{ width: 100%; border: 1.2px solid #ced4da; border-radius: 2mm; }}
.pag .nome {{ font-family: "Excalifont"; font-size: 11.5pt; color: var(--azul); margin-top: 1mm; }}
.fala {{ display: grid; grid-template-columns: 12mm 1fr; gap: 2mm; margin-bottom: 2mm; font-size: 11pt; line-height: 1.5; }}
.fala .t {{ font-family: "Comic Shanns"; font-size: 8.2pt; color: var(--cinza); padding-top: 0.8mm; }}
.pausa {{ color: var(--laranja); font-size: 8.5pt; }}
</style></head><body>
<section class="capa"><span class="etiqueta">aula 2 · roteiro de gravação</span><h1>LLM as a Judge</h1>
<div class="sub">o texto de cada trecho, <b>na ordem do vídeo</b></div>
<img src="{MINIATURAS}/abertura.jpeg" alt="">
<div class="rodape">{len(cfg["secoes"])} seções · {n_falas} falas · cerca de {round(total / 60)} minutos (tempo estimado; a sua voz define o tempo final)</div></section>

<h1>Como usar este roteiro</h1>
<p>O vídeo da lousa já está pronto e espera a sua voz. Este roteiro tem, para cada <strong>seção</strong>, o texto exato que você vai gravar, a lousa que aparece enquanto você fala e o que entender antes de gravar. Estude primeiro a <strong>apostila</strong>; depois use este roteiro para ensaiar e gravar.</p>
<div class="caixa chave"><span class="rotulo">Como gravar na ElevenLabs</span><ol>
<li>Gere <strong>um arquivo de áudio por seção</strong>, na ordem: <code>01.mp3</code>, <code>02.mp3</code>... até <code>{len(cfg["secoes"]):02d}.mp3</code>.</li>
<li>Cole o texto da seção mantendo <strong>uma fala por linha</strong>: as quebras de linha viram pausas naturais. O texto limpo, pronto para colar, está em <code>remotion/aulas/llm-juiz/narracao/roteiro-elevenlabs.md</code>.</li>
<li>Pode trocar uma palavra ou outra: o alinhamento acha cada fala mesmo com pequenas diferenças. Só não pule falas nem mude a ordem.</li>
<li>Coloque os arquivos numa pasta <code>audios/</code> e rode o alinhamento e o render (comandos abaixo).</li>
</ol></div>
<pre>pip install faster-whisper numpy
python3 scripts/aulas/alinhar.py remotion/aulas/llm-juiz/narracao audios/*.mp3
npm run render:aula -- llm-juiz</pre>
<div class="caixa analogia"><span class="rotulo">Dicas de leitura</span><ul>
<li>Fale para <strong>uma pessoa</strong>, não para uma plateia: o tom é de conversa.</li>
<li>Vírgulas no texto são pausas curtas de propósito ("e não vale responder: eu li, e achei bom").</li>
<li>Siglas: <em>LLM</em> (éle éle ême), <em>PRD</em> (pê érre dê), <em>CI/CD</em> (cê í cê dê), <em>VAR</em> (var), <em>JSON</em> (djêison), <em>pytest</em> (pai-test).</li>
<li>Os checks estão escritos por extenso ("C zero dois") para a voz ler certo.</li>
<li>Os tempos ao lado de cada fala são <strong>estimados</strong>: servem para você se localizar no vídeo, não para cronometrar.</li>
</ul></div>
<h2>Mapa das seções</h2><table><tr><th style="width:9%">#</th><th>Seção</th><th style="width:18%">Começa em</th><th style="width:14%">Duração</th></tr>"""]

    for i, sec in enumerate(cfg["secoes"], start=1):
        de, ate = tempos[sec["falas"][0]["id"]]["de"], tempos[sec["falas"][-1]["id"]]["ate"]
        partes.append(f"<tr><td>{i:02d}</td><td>{html.escape(sec['titulo'])}</td><td>~{mmss(de)}</td><td>~{f"{(ate - de) / 60:.1f}".replace(".", ",")} min</td></tr>")
    partes.append("</table>")

    for i, sec in enumerate(cfg["secoes"], start=1):
        de, ate = tempos[sec["falas"][0]["id"]]["de"], tempos[sec["falas"][-1]["id"]]["ate"]
        partes.append(f'<section class="secao"><h1><span class="num">{i:02d}</span>{html.escape(sec["titulo"])}</h1>')
        partes.append(f'<div class="tempo">~{mmss(de)} a {mmss(ate)} · arquivo <span style="font-family:Comic Shanns">{i:02d}.mp3</span></div>')
        partes.append('<div class="caixa chave"><span class="rotulo">Entenda antes de gravar</span><ul>' + "".join(f"<li>{x}</li>" for x in ENTENDER[i - 1]) + "</ul></div>")
        grupo: list[dict] = []
        pagina = None

        def fechar() -> None:
            if not grupo:
                return
            img = f'<img src="{MINIATURAS}/{pagina}.jpeg" alt="">' if pagina else ""
            nome = TITULOS.get(pagina, "") if pagina else ""
            linhas = "".join(
                f'<div class="fala"><span class="t">{mmss(tempos[f["id"]]["de"])}</span><span>{html.escape(f["texto"])}'
                + (f' <span class="pausa">(pausa)</span>' if f.get("pausa", 0) >= 1.8 else "")
                + "</span></div>"
                for f in grupo
            )
            partes.append(f'<div class="pag"><div>{img}<div class="nome">{nome}</div></div><div>{linhas}</div></div>')

        for f in sec["falas"]:
            if f["id"] in pagina_da_fala:
                fechar()
                grupo = []
                pagina = pagina_da_fala[f["id"]]
            grupo.append(f)
        fechar()
        partes.append("</section>")

    partes.append("</body></html>")
    DESTINO.write_text("\n".join(partes), encoding="utf-8")
    print(f"ok: {DESTINO}")


if __name__ == "__main__":
    main()
