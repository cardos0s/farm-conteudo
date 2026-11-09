"""Gera uma trilha de fundo discreta (pad de acordes + sininhos), sem depender de banco de músicas.

Uso: python3 scripts/telas/trilha.py <saida.wav> [segundos]

Ré maior, 100 bpm, progressão Dmaj7 – Bm7 – Gmaj7 – A6/9 (2 compassos cada). Pensada para ficar
baixinha embaixo da locução: sem bateria, ataque lento, nada que brigue com a voz.
"""

import sys
import wave

import numpy as np

SR = 44100
BPM = 100
BATIDA = 60 / BPM
COMPASSO = 4 * BATIDA


def nota(n):
    """Frequência de uma nota MIDI."""
    return 440.0 * 2 ** ((n - 69) / 12)


# acordes em notas MIDI (voz média, sem graves embolados)
ACORDES = [
    [50, 57, 61, 66, 69],  # Dmaj7: D3 A3 C#4 F#4 A4
    [47, 54, 57, 62, 66],  # Bm7:   B2 F#3 A3 D4 F#4
    [43, 50, 54, 59, 62],  # Gmaj7: G2 D3 F#3 B3 D4
    [45, 52, 57, 61, 64],  # A6/9:  A2 E3 A3 C#4 E4
]
ARPEJO = [
    [74, 78, 81, 85],
    [71, 74, 78, 81],
    [67, 71, 74, 78],
    [69, 73, 76, 81],
]


def envelope(n, ataque, soltura):
    e = np.ones(n)
    a = min(n, int(ataque * SR))
    r = min(n - a, int(soltura * SR))
    e[:a] = np.linspace(0, 1, a) ** 2
    if r > 0:
        e[n - r:] = np.linspace(1, 0, r) ** 2
    return e


def pad(freq, dur, rng):
    n = int(dur * SR)
    t = np.arange(n) / SR
    s = np.zeros(n)
    for desafinado in (-0.12, 0.0, 0.13):  # três vozes levemente desafinadas = coro natural
        f = freq * 2 ** (desafinado / 12)
        fase = rng.uniform(0, 2 * np.pi)
        # poucas harmônicas, decaindo rápido: som macio, sem chiado
        for h, amp in ((1, 1.0), (2, 0.28), (3, 0.09), (4, 0.03)):
            s += amp * np.sin(2 * np.pi * f * h * t + fase * h)
    vibrato = 1 + 0.002 * np.sin(2 * np.pi * 0.23 * t)
    return s * vibrato / 3


def sino(freq, dur):
    n = int(dur * SR)
    t = np.arange(n) / SR
    corpo = np.sin(2 * np.pi * freq * t) * np.exp(-t / 0.55)
    brilho = 0.25 * np.sin(2 * np.pi * freq * 2.0 * t) * np.exp(-t / 0.18)
    ataque = np.minimum(1, t / 0.004)
    return (corpo + brilho) * ataque


def principal():
    saida = sys.argv[1]
    total = float(sys.argv[2]) if len(sys.argv) > 2 else 100.0
    rng = np.random.default_rng(11)
    n = int(total * SR)
    L = np.zeros(n)
    R = np.zeros(n)

    tam_acorde = 2 * COMPASSO
    i = 0
    t0 = 0.0
    while t0 < total:
        acorde = ACORDES[i % len(ACORDES)]
        dur = tam_acorde + 1.6  # sobreposição para trocar de acorde sem buraco
        ini = int(t0 * SR)
        for k, m in enumerate(acorde):
            s = pad(nota(m), dur, rng) * envelope(int(dur * SR), 1.2, 1.6) * (0.16 if k else 0.2)
            fim = min(n, ini + len(s))
            pan = 0.35 + 0.3 * (k / (len(acorde) - 1))
            L[ini:fim] += s[: fim - ini] * (1 - pan)
            R[ini:fim] += s[: fim - ini] * pan
        # sininhos em colcheias, bem baixos, a partir do segundo acorde
        if i >= 1:
            for b in range(16):
                tb = t0 + b * BATIDA / 2
                if tb >= total or rng.random() < 0.35:
                    continue
                f = nota(ARPEJO[i % len(ARPEJO)][b % 4])
                s = sino(f, 1.4) * (0.06 + 0.02 * rng.random())
                a = int(tb * SR)
                fim = min(n, a + len(s))
                pan = 0.3 + 0.4 * rng.random()
                L[a:fim] += s[: fim - a] * (1 - pan)
                R[a:fim] += s[: fim - a] * pan
        t0 += tam_acorde
        i += 1

    # eco estéreo simples (ambiência)
    atraso = int(0.33 * SR)
    for _ in range(3):
        L[atraso:] += 0.22 * R[:-atraso]
        R[atraso:] += 0.22 * L[:-atraso]
    # passa-baixa suave (média móvel) para tirar qualquer aspereza
    k = 6
    L = np.convolve(L, np.ones(k) / k, "same")
    R = np.convolve(R, np.ones(k) / k, "same")
    # entrada e saída em fade
    f_in = int(2.5 * SR)
    f_out = int(4.0 * SR)
    for c in (L, R):
        c[:f_in] *= np.linspace(0, 1, f_in) ** 2
        c[-f_out:] *= np.linspace(1, 0, f_out) ** 2
    pico = max(np.max(np.abs(L)), np.max(np.abs(R)))
    L, R = L / pico * 0.85, R / pico * 0.85
    est = np.empty(2 * n)
    est[0::2], est[1::2] = L, R
    with wave.open(saida, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((est * 32767).astype(np.int16).tobytes())
    rms = np.sqrt(np.mean(np.concatenate([L, R]) ** 2))
    print(f"trilha: {saida} · {total:.0f} s · RMS {20 * np.log10(rms):.1f} dBFS")


if __name__ == "__main__":
    principal()
