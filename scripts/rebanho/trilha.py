"""Sintetiza a trilha e os efeitos do Reel de pesagem (sem depender de serviço externo).

Violão dedilhado (Karplus-Strong), ambiente de roça (vento e passarinhos) e efeitos curtos:
casco, porteira, clique da câmera, bipe da contagem, giro, plim do peso e carimbo.
Uso: python3 scripts/rebanho/trilha.py [pesagem|confinamento]   →  public/rebanho/<video>/sons/
Os efeitos curtos ficam só em pesagem/sons e servem aos dois vídeos.
"""
import subprocess
import sys
import wave
from pathlib import Path
import numpy as np

SR = 44100
VIDEO = sys.argv[1] if len(sys.argv) > 1 else "pesagem"
DUR = {"pesagem": 27.0, "confinamento": 51.0}[VIDEO]
SAIDA = Path(__file__).resolve().parents[2] / f"public/rebanho/{VIDEO}/sons"
rng = np.random.default_rng(12)


def salvar(nome, x, pico):
    """Grava mono 16 bits com o pico pedido (0..1)."""
    x = x / (np.abs(x).max() + 1e-9) * pico
    with wave.open(str(SAIDA / f"{nome}.wav"), "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((x * 32767).astype(np.int16).tobytes())
    print(f"{nome}: {len(x) / SR:.2f}s, rms {20 * np.log10(np.sqrt((x ** 2).mean()) + 1e-9):.1f} dB")


def t_(dur):
    return np.arange(int(dur * SR)) / SR


def passa_baixa(x, corte):
    """Filtro de um polo; `corte` pode variar no tempo (Hz)."""
    a = 1 - np.exp(-2 * np.pi * np.broadcast_to(corte, x.shape) / SR)
    y = np.empty_like(x); acc = 0.0
    for i in range(len(x)):
        acc += a[i] * (x[i] - acc); y[i] = acc
    return y


def corda(freq, dur, brilho=0.5, decai=0.996):
    """Corda dedilhada (Karplus-Strong)."""
    n = int(round(SR / freq))
    periodo = passa_baixa(rng.uniform(-1, 1, n), 800 + 5000 * brilho)
    partes = []
    for _ in range(int(dur * SR / n) + 1):
        partes.append(periodo)
        periodo = decai * 0.5 * (periodo + np.roll(periodo, 1))
    x = np.concatenate(partes)[: int(dur * SR)]
    x[: 80] *= np.linspace(0, 1, 80)
    return x


def musica(dur=27.0, bpm=96):
    G = dict(b=(98.0, 146.83), a=(196.0, 246.94, 293.66))
    C = dict(b=(130.81, 164.81), a=(196.0, 261.63, 329.63))
    D = dict(b=(146.83, 110.0), a=(220.0, 293.66, 369.99))
    Em = dict(b=(82.41, 123.47), a=(196.0, 246.94, 329.63))
    volta = [G, G, C, G, Em, C, D, G]
    compassos = [volta[i % len(volta)] for i in range(int(dur / (8 * 60 / bpm / 2)) + 2)]
    colcheia = 60 / bpm / 2
    x = np.zeros(int((dur + 3) * SR))
    def tocar(freq, quando, forca, dura=2.2, brilho=0.5):
        i = max(0, int(quando * SR)); n = corda(freq, dura, brilho) * forca
        x[i: i + len(n)] += n[: len(x) - i]
    for c, ac in enumerate(compassos):
        t0 = c * 8 * colcheia
        if t0 > dur - 2.6:
            # acorde final, rasgueado devagar
            for k, f in enumerate((ac["b"][0], *ac["a"], ac["a"][0] * 2)):
                tocar(f, t0 + k * 0.045, 0.8, 3.5, 0.6)
            break
        agudos = [ac["a"][0], ac["a"][1], ac["a"][2], ac["a"][1]]
        for k in range(8):
            atraso = rng.uniform(-0.006, 0.006)
            if k % 2 == 0:
                tocar(ac["b"][(k // 2) % 2], t0 + k * colcheia + atraso, 1.0 if k % 4 == 0 else 0.8, 1.6, 0.35)
            else:
                tocar(agudos[k // 2], t0 + k * colcheia + atraso, 0.55 + 0.1 * rng.random(), 1.4, 0.6)
    x = x[: int(dur * SR)]
    x[: int(0.3 * SR)] *= np.linspace(0, 1, int(0.3 * SR))
    x[-int(1.2 * SR):] *= np.linspace(1, 0, int(1.2 * SR)) ** 1.5
    return passa_baixa(x, 5200.0)


def ambiente(dur=27.0):
    t = t_(dur)
    vento = passa_baixa(rng.normal(0, 1, len(t)), 420 + 180 * np.sin(t * 0.5)) * (0.7 + 0.3 * np.sin(t * 0.31 + 1))
    x = vento / np.abs(vento).max() * 0.5
    # passarinhos: trinados curtos e espaçados
    inicio = 0.6
    while inicio < dur - 1:
        base = rng.uniform(2600, 4600); notas = rng.integers(2, 6); forca = rng.uniform(0.12, 0.3)
        for k in range(notas):
            d = rng.uniform(0.05, 0.11); tt = t_(d)
            f = base * (1 + rng.uniform(-0.12, 0.2)) * (1 + 0.25 * np.sin(np.pi * tt / d) * rng.choice([-1, 1]))
            pio = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * tt / d) ** 2 * forca
            i = int((inicio + k * rng.uniform(0.09, 0.15)) * SR)
            if i + len(pio) < len(x): x[i: i + len(pio)] += pio
        inicio += rng.uniform(0.9, 2.6)
    x[: SR // 2] *= np.linspace(0, 1, SR // 2); x[-SR:] *= np.linspace(1, 0, SR)
    return x


def trator(dur=13.0):
    """Motor a diesel em marcha lenta, com a ração caindo no cocho; entra e sai aos poucos."""
    t = t_(dur)
    giro = 38 + 3 * np.sin(t * 0.7)
    fase = 2 * np.pi * np.cumsum(giro) / SR
    motor = sum(np.sin(fase * h) / h for h in (1, 2, 3, 4, 6)) * (0.75 + 0.25 * np.sign(np.sin(fase * 0.5)))
    motor = passa_baixa(motor + 0.25 * rng.normal(0, 1, len(t)), 520.0)
    racao = rng.normal(0, 1, len(t)); racao = (racao - passa_baixa(racao, 1800.0)) * (0.6 + 0.4 * np.sin(t * 9) ** 2)
    x = motor / np.abs(motor).max() + 0.22 * racao / np.abs(racao).max()
    env = np.minimum(1, t / 1.6) * np.minimum(1, (dur - t) / 3.5)
    return x * env


def casco(grave):
    t = t_(0.16)
    batida = np.sin(2 * np.pi * (grave * np.exp(-t * 18)).cumsum() / SR * 1.0) * np.exp(-t * 34)
    terra = passa_baixa(rng.normal(0, 1, len(t)), 1500.0) * np.exp(-t * 60)
    return batida * 0.9 + terra * 0.7


def porteira():
    """Batida seca de madeira quando a folha encosta no batente."""
    t = t_(0.35)
    x = sum(np.sin(2 * np.pi * f * t) * np.exp(-t * d) * a for f, d, a in ((180, 22, 1.0), (410, 34, 0.5), (760, 50, 0.3)))
    return x + passa_baixa(rng.normal(0, 1, len(t)), 2500.0) * np.exp(-t * 80) * 0.6


def clique():
    t = t_(0.14); x = np.zeros(len(t))
    for quando, forca in ((0.0, 1.0), (0.055, 0.7)):
        i = int(quando * SR); tt = t[: len(t) - i]
        ruido = rng.normal(0, 1, len(tt)); ruido = ruido - passa_baixa(ruido, 2200.0)
        x[i:] += (ruido * np.exp(-tt * 190) + 0.5 * np.sin(2 * np.pi * 3100 * tt) * np.exp(-tt * 120)) * forca
    return x


def bipe(freq=1320.0):
    t = t_(0.09)
    return np.sin(2 * np.pi * freq * t) * np.minimum(1, t * 400) * np.exp(-t * 30)


def giro(dur=0.5):
    t = t_(dur); p = t / dur
    return passa_baixa(rng.normal(0, 1, len(t)), 300 + 3200 * np.sin(np.pi * p) ** 2) * np.sin(np.pi * p) ** 1.5


def plim():
    t = t_(1.1); x = np.zeros(len(t))
    for k, (f, quando) in enumerate(((1046.5, 0.0), (1318.5, 0.07), (1568.0, 0.14), (2093.0, 0.21))):
        i = int(quando * SR); tt = t[: len(t) - i]
        x[i:] += (np.sin(2 * np.pi * f * tt) + 0.3 * np.sin(2 * np.pi * 2.01 * f * tt)) * np.exp(-tt * (5 + k)) * np.minimum(1, tt * 500)
    return x


def carimbo():
    t = t_(0.22)
    return np.sin(2 * np.pi * (95 * np.exp(-t * 9)).cumsum() / SR) * np.exp(-t * 26) + passa_baixa(rng.normal(0, 1, len(t)), 3000.0) * np.exp(-t * 110) * 0.5


SAIDA.mkdir(parents=True, exist_ok=True)
longos = {"musica": (musica(DUR), 0.5), "ambiente": (ambiente(DUR), 0.25)}
if VIDEO == "confinamento":
    longos["trator"] = (trator(), 0.35)
for nome, (x, pico) in longos.items():
    # os longos vão em mp3 para não pesar no repositório
    salvar(nome, x, pico)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(SAIDA / f"{nome}.wav"), "-b:a", "128k", str(SAIDA / f"{nome}.mp3")], check=True)
    (SAIDA / f"{nome}.wav").unlink()
if VIDEO == "pesagem":
    salvar("casco-1", casco(150.0), 0.6)
    salvar("casco-2", casco(120.0), 0.6)
    salvar("porteira", porteira(), 0.6)
    salvar("clique", clique(), 0.8)
    salvar("bipe", bipe(), 0.4)
    salvar("giro", giro(), 0.5)
    salvar("plim", plim(), 0.55)
    salvar("carimbo", carimbo(), 0.7)
