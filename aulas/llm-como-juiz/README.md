# Aula: LLM as a Judge

**Como avaliar agentes de IA com evidências e métricas** · 60 minutos · teoria + live coding

O objetivo é construir um harness de avaliação reproduzível: ele verifica requisitos, registra evidências e
calcula uma pontuação sem depender de uma nota subjetiva do LLM.

- **[ROTEIRO.md](ROTEIRO.md)**: a aula inteira, minuto a minuto, com o texto para falar (explicado desde o zero),
  o que desenhar na lousa, o que mostrar na tela, perguntas para a turma e o plano B.
- **[DESAFIO.md](DESAFIO.md)**: o exercício para depois da aula.

## Rodar

Python 3.10 ou mais novo.

```bash
cd aulas/llm-como-juiz
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
```

```bash
pytest
```

```bash
python avaliar.py --caso todos --gravado
```

```bash
python avaliar.py --caso incompleto --execucoes 3 --gravado --detalhes
```

`--gravado` usa respostas do juiz já salvas em `gravacoes/`: a aula funciona sem internet e sem chave de API, e
o resultado é sempre o mesmo. **As gravações que vêm no repositório foram escritas à mão para a aula** (o campo
`origem` de cada arquivo diz isso). Elas reproduzem os comportamentos que a aula discute, mas não são
respostas reais do modelo.

Para chamar o Claude de verdade, configure `ANTHROPIC_API_KEY` e tire o `--gravado`. Com `--gravar`, as
respostas reais substituem as de exemplo:

```bash
python avaliar.py --caso todos --execucoes 3 --gravar
```

O modelo do juiz e o do agente vêm de `JUIZ_MODEL` e `AGENTE_MODEL` (padrão `claude-opus-5-5`).

## O que tem aqui

| Arquivo | Na arquitetura | Na aula |
|---|---|---|
| `baseline/resumo_comercial.v1.json` | Baseline congelado (checks binários versionados) | Bloco 3 |
| `baseline/resumo_comercial.v2.json` | A versão corrigida depois do benchmark | Bloco 5 |
| `baseline/template.json` | Template para os alunos | Material |
| `prompts/agente.md`, `agente.py` | Implementador: o agente que resume | Blocos 2 e 6 |
| `prompts/juiz.md`, `juiz.py` | Juiz independente, com saída estruturada | Live coding, parte A |
| `evidencias.py` | Validação das evidências e gates | Live coding, parte B |
| `score.py` | Score Calculator e comparação entre execuções | Live coding, parte C |
| `avaliar.py` | O harness: junta tudo, roda N vezes, escreve o relatório | Blocos 4 e 5 |
| `casos/` | Uma conversa, três resumos (correto, incompleto, inventado) e o gabarito | Blocos 3 a 5 |
| `gravacoes/` | Respostas do juiz para rodar sem internet | Blocos 4 e 5 |
| `testes/` | Testes do harness (`pytest`) | Bloco 6 (CI) |
| `exemplo-ci.yml` | Pipeline de CI no GitHub Actions | Bloco 6 |

Os relatórios de cada rodada vão para `relatorios/` (fora do git).

## Material para entregar aos alunos

1. Esta pasta inteira (agente, avaliador, casos e testes).
2. Template de baseline: `baseline/template.json`.
3. Prompt de avaliação estruturada: `prompts/juiz.md`.
4. Script de cálculo e comparação de scores: `score.py`.
5. Três casos de teste com resultados esperados: `casos/esperado.json`.
6. Desafio: `DESAFIO.md`.
