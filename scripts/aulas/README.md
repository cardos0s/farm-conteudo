# Aulas da comunidade: da gravação no celular ao vídeo com lousa

Pipeline usado nos vídeos de **Algoritmos e Estruturas de Dados**:

| Aula | Pasta (`remotion/aulas/…`) | Composição |
|---|---|---|
| 1 · Complexidade de algoritmos | `complexidade/` | `AulaComplexidade` |
| 2 · Recursividade e complexidade | `recursividade/` | `AulaRecursividade` |

Os vídeos brutos e os renders não vão para o git: ficam numa pasta de trabalho fora do repositório e em `saida/`.
O passo a passo abaixo usa a aula 1 como exemplo; para outra aula, troque `complexidade` pelo nome da pasta.

## Requisitos

- ffmpeg com `libzimg` (filtro `zscale`, para converter o HDR do iPhone) e `libx264`
- Python 3 com `pip install gdown faster-whisper opencv-python-headless numpy`
- Node 20+ (`npm install`)

## Passo a passo

```bash
P=~/aula-complexidade   # pasta de trabalho (fora do repositório)

# 1. Baixar a pasta do Drive (compartilhada por link) e descartar cópias idênticas
python3 scripts/aulas/baixar_drive.py "https://drive.google.com/drive/folders/<id>" $P

# 2. Áudio para análise + vídeo 2560x1440 30 fps SDR + cópia em public/aulas/complexidade/
scripts/aulas/preparar.sh $P complexidade

# 3. Transcrever com palavras e tempos (base para decidir os cortes e sincronizar a lousa)
python3 scripts/aulas/transcrever.py $P

# 4. Decidir os cortes em remotion/aulas/complexidade/edicao/cortes.json e gerar o EDL
python3 scripts/aulas/montar_edl.py $P remotion/aulas/complexidade/edicao/cortes.json remotion/aulas/complexidade/edicao/edl.json

# 5. Voz cortada e tratada (~-16 LUFS)
python3 scripts/aulas/montar_audio.py $P remotion/aulas/complexidade/edicao/edl.json saida/aulas/complexidade/voz.wav

# 6. Trilha do rosto para o recorte automático da câmera
python3 scripts/aulas/rostos.py $P remotion/aulas/complexidade/edicao/rostos.json

# 7. Conferir no estúdio e renderizar (vídeo + voz)
npm run estudio          # escolha a composição AulaComplexidade
npm run render:aula -- complexidade   # ou: recursividade
```

## Como a edição funciona

- **`cortes.json`** guarda as decisões editoriais: quais trechos de cada clipe entram, onde estavam
  os tropeços (falsos inícios, repetições, autocorreções) e os respiros entre capítulos. Cada corte
  é ajustado automaticamente para o ponto mais silencioso perto da borda, e pausas longas dentro dos
  trechos são encurtadas.
- **`edl.json`** é a lista final de segmentos, em quadros (30 fps). O áudio e o vídeo usam o mesmo EDL,
  então ficam sempre sincronizados.
- **As animações** são marcadas no tempo do arquivo original: `S("3229", 9.5)` é o instante 9,5 s do
  clipe IMG_3229 convertido para o tempo do vídeo final. Se um corte mudar, os desenhos continuam
  presos à palavra certa.
- **A câmera** alterna entre tela cheia, tela dividida e um quadro no canto da lousa (PiP). O recorte
  segue o rosto (`rostos.json`) e os cortes em tela cheia alternam um leve zoom para disfarçar o salto.

## A lousa (estilo Excalidraw)

Os componentes ficam em `remotion/lousa/` e servem para qualquer aula:

| Componente | Para quê |
|---|---|
| `Ret`, `Elipse`, `Linha`, `Curva`, `Caminho`, `Seta`, `Check`, `Xis` | formas à mão (roughjs, o motor do Excalidraw) que se desenham no tempo |
| `Texto` | texto manuscrito (Excalifont) que aparece letra a letra; `^{2}` sobrescrito, `*{palavra}` em destaque |
| `Caixa`, `Etiqueta`, `Marca` | caixa com texto, etiqueta ajustada ao texto, marca-texto |
| `Lousa`, `NaPagina`, `vistaEm` | canvas infinito com páginas; a câmera desliza entre elas |
| `Codigo` | janela de editor com Python colorido, digitado caractere a caractere (fonte Cascadia Code) |
| `Capitulo` | rótulo "capítulo n · título" no canto da página |

Todos recebem `de` (segundo em que começam a ser desenhados), `dur` e, opcionalmente, `ate` (quando somem).

O que é igual em toda aula fica em `remotion/aulas/comum/`: `Camera.tsx` (enquadramentos, recorte pelo
rosto, PiP) e `roteiro.ts` (`criarRoteiro(edl)` devolve `S`, `pausas`, `FIM`… a partir do EDL da aula).

## Dicas que economizaram tempo

- Renderize sem `gl: "swangle"`: nesta composição o modo padrão do Chrome foi ~3x mais rápido.
- O Whisper às vezes pula trechos falados muito rápido. Transcrever em blocos curtos, cortados nas pausas,
  resolveu (foi assim que apareceram as instruções da CPU e o "merge sort").
- Para conferir um corte sem ouvir, transcreva 2 s antes e depois da emenda no áudio final: palavra
  mordida aparece como palavra faltando ou trocada.
