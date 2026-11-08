"""Trilha e efeitos sonoros dos Reels do WhatsApp, sintetizados do zero (sem amostras de terceiros,
então não há direito autoral de ninguém envolvido).

    python3 materiais/whatsapp/sons.py

Grava em public/materiais/whatsapp/sons/ (fora do git):
- trilha.wav: batida lo-fi de 88 BPM com piano elétrico, baixo, bateria leve e chiado de vinil,
  32 compassos (~87 s) que emendam em loop;
- whoosh, pop, plim, erro, lapis, impacto, kaching: efeitos curtos.

Requisito: numpy. O resultado é determinístico (semente fixa).
"""

from pathlib import Path
import wave

import numpy as np

SR = 44100
RAIZ = Path(__file__).resolve().parents[2]
SAIDA = RAIZ / "public/materiais/whatsapp/sons"
rng = np.random.default_rng(7)


def nota(m: float) -> float:
    return 440.0 * 2 ** ((m - 69) / 12)


def t_(dur: float) -> np.ndarray:
    return np.arange(int(dur * SR)) / SR


def passa_baixa(x: np.ndarray, corte) -> np.ndarray:
    """Filtro passa-baixa de um polo; `corte` pode ser um número ou um vetor (varredura)."""
    corte = np.broadcast_to(np.asarray(corte, dtype=float), x.shape)
    a = np.exp(-2 * np.pi * corte / SR)
    y = np.empty_like(x)
    acc = 0.0
    for i in range(len(x)):
        acc = (1 - a[i]) * x[i] + a[i] * acc
        y[i] = acc
    return y


def passa_baixa_rapido(x: np.ndarray, corte: float) -> np.ndarray:
    """Passa-baixa fixo pela FFT (para sinais longos)."""
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    X *= 1 / np.sqrt(1 + (f / corte) ** 4)
    return np.fft.irfft(X, len(x))


def passa_alta_rapido(x: np.ndarray, corte: float) -> np.ndarray:
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    X *= 1 / np.sqrt(1 + (corte / np.maximum(f, 1)) ** 4)
    return np.fft.irfft(X, len(x))


def reverb(x: np.ndarray, dur: float = 1.4, mistura: float = 0.25) -> np.ndarray:
    ir = rng.standard_normal(int(dur * SR)) * np.exp(-t_(dur) * 5.5)
    ir = passa_baixa_rapido(ir, 4500)
    ir /= np.sqrt((ir**2).sum())
    n = len(x) + len(ir)
    molhado = np.fft.irfft(np.fft.rfft(x, n) * np.fft.rfft(ir, n), n)[: len(x)]
    return (1 - mistura) * x + mistura * molhado


def gravar(nome: str, x: np.ndarray, pico: float = 0.89) -> None:
    x = x / (np.abs(x).max() + 1e-9) * pico
    est = np.repeat(x[:, None], 2, axis=1) if x.ndim == 1 else x
    dados = (np.clip(est, -1, 1) * 32767).astype("<i2")
    with wave.open(str(SAIDA / f"{nome}.wav"), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(dados.tobytes())
    print(f"{nome}.wav  {len(est) / SR:5.2f} s")


def somar(dest: np.ndarray, x: np.ndarray, em: float, ganho: float = 1.0) -> None:
    i = int(em * SR)
    if i >= len(dest):
        return
    j = min(len(dest), i + len(x))
    dest[i:j] += x[: j - i] * ganho


# ------------------------------------------------------------------ trilha

BPM = 88
BATIDA = 60 / BPM
COMPASSO = 4 * BATIDA
# Fmaj7 · Em7 · Dm7 · Cmaj7 (descendo), com uma variação na segunda volta
ACORDES = [
    [53, 57, 60, 64, 69],  # F A C E A
    [52, 55, 59, 62, 67],  # E G B D G
    [50, 53, 57, 60, 65],  # D F A C F
    [48, 52, 55, 59, 64],  # C E G B E
    [53, 57, 60, 64, 69],
    [52, 55, 59, 62, 67],
    [50, 53, 57, 60, 64],  # Dm9 sem a quinta em cima
    [55, 59, 62, 65, 69],  # G7(9): puxa de volta para o F
]


def piano(m: float, dur: float, vel: float) -> np.ndarray:
    t = t_(dur)
    f = nota(m)
    corpo = np.sin(2 * np.pi * f * t) + 0.32 * np.sin(2 * np.pi * 2 * f * t + 0.3) + 0.08 * np.sin(2 * np.pi * 3 * f * t)
    corpo += 0.5 * np.sin(2 * np.pi * f * 1.003 * t)  # leve desafinação: som mais quente
    env = np.exp(-t / 1.1) * np.minimum(1, t / 0.006)
    trem = 1 + 0.06 * np.sin(2 * np.pi * 4.2 * t)
    return corpo * env * trem * vel


def bumbo() -> np.ndarray:
    t = t_(0.45)
    f = 48 + 90 * np.exp(-t / 0.035)
    fase = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(fase) * np.exp(-t / 0.16) + 0.15 * rng.standard_normal(len(t)) * np.exp(-t / 0.004)


def caixa_bateria() -> np.ndarray:
    t = t_(0.3)
    ruido = passa_alta_rapido(passa_baixa_rapido(rng.standard_normal(len(t)), 5000), 900)
    return ruido * np.exp(-t / 0.07) * 0.6 + np.sin(2 * np.pi * 190 * t) * np.exp(-t / 0.05) * 0.4


def chimbal(aberto: bool = False) -> np.ndarray:
    t = t_(0.25 if aberto else 0.06)
    return passa_alta_rapido(rng.standard_normal(len(t)), 7000) * np.exp(-t / (0.07 if aberto else 0.018))


def trilha() -> np.ndarray:
    voltas = 4
    n_comp = len(ACORDES) * voltas  # 32 compassos
    total = n_comp * COMPASSO
    teclas = np.zeros(int(total * SR) + SR)
    baixo = np.zeros_like(teclas)
    bat = np.zeros_like(teclas)
    swing = BATIDA * 0.08
    for c in range(n_comp):
        ac = ACORDES[c % len(ACORDES)]
        t0 = c * COMPASSO
        volta = c // len(ACORDES)
        # acorde no 1 e um toque mais leve no "e" do 3, com as notas levemente espalhadas
        for k, m in enumerate(ac):
            somar(teclas, piano(m, COMPASSO * 1.2, 0.22), t0 + k * 0.012)
            somar(teclas, piano(m, BATIDA * 2, 0.11), t0 + 2.5 * BATIDA + swing + k * 0.01)
        # melodia simples nas duas voltas do meio
        if volta in (1, 2):
            topo = ac[-1] + 3 if c % 2 == 0 else ac[-1]
            somar(teclas, piano(topo + 12, BATIDA * 1.5, 0.07), t0 + 1.5 * BATIDA + swing)
        # baixo
        raiz = ac[0] - 12
        for em, d in ((0, 1.4), (2.5, 1.2)):
            tb = t_(BATIDA * d)
            som = np.sin(2 * np.pi * nota(raiz) * tb) + 0.25 * np.sin(2 * np.pi * nota(raiz) * 2 * tb)
            som *= np.minimum(1, tb / 0.02) * np.exp(-tb / 0.6)
            somar(baixo, som, t0 + em * BATIDA + (swing if em % 1 else 0), 0.35)
        # bateria (entra no 2º compasso, para a trilha começar suave)
        if c == 0:
            continue
        for b in (0, 2.5 if c % 4 == 3 else 2):
            somar(bat, bumbo(), t0 + b * BATIDA + (swing if b % 1 else 0), 0.55)
        for b in (1, 3):
            somar(bat, caixa_bateria(), t0 + b * BATIDA, 0.22)
        for k in range(8):
            em = t0 + k * BATIDA / 2 + (swing if k % 2 else 0)
            somar(bat, chimbal(aberto=(k == 7 and c % 2 == 1)), em, 0.07 if k % 2 else 0.1)
    teclas = reverb(passa_baixa_rapido(teclas, 3200), 1.8, 0.3)
    mix = teclas + baixo + bat
    # chiado de vinil
    estalos = np.zeros_like(mix)
    pos = rng.integers(0, len(mix), size=int(total * 9))
    estalos[pos] = rng.uniform(-1, 1, len(pos))
    mix += passa_baixa_rapido(estalos, 3000) * 0.05 + passa_baixa_rapido(rng.standard_normal(len(mix)), 1800) * 0.004
    mix = passa_baixa_rapido(mix, 6500)
    # emenda o fim no começo (o rabo do reverb volta no início do loop)
    n = int(total * SR)
    laço = mix[:n].copy()
    rabo = mix[n:]
    laço[: len(rabo)] += rabo
    # estéreo levemente largo
    atraso = int(0.011 * SR)
    esq = laço
    dir_ = np.roll(laço, atraso) * 0.97
    return np.stack([esq, dir_], axis=1)


# ------------------------------------------------------------------ efeitos


def whoosh() -> np.ndarray:
    dur = 0.55
    t = t_(dur)
    corte = 250 + 4200 * np.sin(np.pi * t / dur) ** 2
    som = passa_baixa(rng.standard_normal(len(t)), corte)
    env = np.sin(np.pi * np.minimum(1, t / dur)) ** 1.6
    return passa_alta_rapido(som * env, 180)


def pop() -> np.ndarray:
    t = t_(0.14)
    f = 330 + 520 * np.exp(-t / 0.018)
    fase = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(fase) * np.exp(-t / 0.035) * np.minimum(1, t / 0.002)


def plim() -> np.ndarray:
    t = t_(0.9)
    f = nota(88)  # mi agudo
    som = sum(a * np.sin(2 * np.pi * f * r * t) * np.exp(-t / d) for r, a, d in ((1, 1, 0.35), (2.0, 0.35, 0.18), (3.01, 0.18, 0.1), (4.2, 0.08, 0.06)))
    som2 = sum(a * np.sin(2 * np.pi * nota(95) * r * t) * np.exp(-t / d) for r, a, d in ((1, 0.8, 0.3), (2.0, 0.25, 0.15)))
    saida = np.zeros(len(t))
    saida += som
    saida[int(0.07 * SR) :] += som2[: len(t) - int(0.07 * SR)] * 0.8
    return reverb(saida * np.minimum(1, t / 0.002), 0.8, 0.2)


def erro() -> np.ndarray:
    saida = np.zeros(int(0.42 * SR))
    for i, (m, em) in enumerate(((52, 0.0), (47, 0.16))):
        t = t_(0.22)
        f = nota(m)
        onda = np.tanh(2.2 * np.sin(2 * np.pi * f * t)) * np.exp(-t / 0.09) * np.minimum(1, t / 0.004)
        somar(saida, passa_baixa_rapido(onda, 1600), em)
    return saida


def lapis() -> np.ndarray:
    dur = 1.6
    t = t_(dur)
    ruido = passa_alta_rapido(passa_baixa_rapido(rng.standard_normal(len(t)), 6000), 1800)
    traços = (0.5 + 0.5 * np.sin(2 * np.pi * 7.5 * t + 2 * np.sin(2 * np.pi * 1.3 * t))) ** 2
    env = np.minimum(1, t / 0.05) * np.minimum(1, (dur - t) / 0.25)
    return ruido * traços * env


def impacto() -> np.ndarray:
    t = t_(1.2)
    f = 38 + 60 * np.exp(-t / 0.08)
    fase = 2 * np.pi * np.cumsum(f) / SR
    grave = np.sin(fase) * np.exp(-t / 0.35)
    estalo = passa_baixa_rapido(rng.standard_normal(len(t)), 2500) * np.exp(-t / 0.03) * 0.5
    return reverb(grave + estalo, 1.2, 0.25)


def kaching() -> np.ndarray:
    saida = np.zeros(int(1.3 * SR))
    clique = passa_alta_rapido(rng.standard_normal(int(0.05 * SR)), 2000) * np.exp(-t_(0.05) / 0.008)
    somar(saida, clique, 0, 0.6)
    t = t_(1.1)
    for m, em, g in ((84, 0.05, 1.0), (91, 0.16, 0.9), (96, 0.16, 0.5)):
        sino = sum(a * np.sin(2 * np.pi * nota(m) * r * t) * np.exp(-t / d) for r, a, d in ((1, 1, 0.5), (2.4, 0.3, 0.2), (5.95, 0.12, 0.08)))
        somar(saida, sino, em, g)
    brilho = passa_alta_rapido(rng.standard_normal(len(saida)), 8000) * np.exp(-np.arange(len(saida)) / SR / 0.25) * 0.15
    return reverb(saida + brilho, 1.0, 0.25)


if __name__ == "__main__":
    SAIDA.mkdir(parents=True, exist_ok=True)
    gravar("trilha", trilha(), 0.8)
    for nome, f in (("whoosh", whoosh), ("pop", pop), ("plim", plim), ("erro", erro), ("lapis", lapis), ("impacto", impacto), ("kaching", kaching)):
        gravar(nome, f())
