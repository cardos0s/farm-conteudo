"""Gera os efeitos sonoros curtos dos vídeos verticais (sem depender de banco de sons).

Uso:
    python3 scripts/telas/efeitos.py public/selloop/sons

Escreve salto.wav (o "pop" de um elemento saltando da tela) e sino.wav (duas notas, para um
pagamento confirmado ou uma avaliação). 48 kHz, estéreo, 16 bits.
"""

import os
import sys
import wave

import numpy as np

SR = 48000


def salvar(caminho, mono, pico_db):
    mono = mono / (np.max(np.abs(mono)) + 1e-9) * (10 ** (pico_db / 20))
    estereo = np.stack([mono, mono], axis=1)
    with wave.open(caminho, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((np.clip(estereo, -1, 1) * 32767).astype("<i2").tobytes())
    print(f"{caminho} · {len(mono) / SR:.2f} s")


def salto():
    """Um 'pop' macio: seno que sobe rápido de 380 a 900 Hz e some em ~120 ms, com um estalinho no ataque."""
    dur = 0.22
    t = np.arange(int(SR * dur)) / SR
    freq = 380 + (900 - 380) * (1 - np.exp(-t / 0.035))
    fase = 2 * np.pi * np.cumsum(freq) / SR
    corpo = np.sin(fase) * np.exp(-t / 0.045)
    rng = np.random.default_rng(7)
    estalo = rng.standard_normal(len(t)) * np.exp(-t / 0.004) * 0.25
    ataque = np.minimum(1, t / 0.003)
    return (corpo + estalo) * ataque


def sino():
    """Duas notas de sino (lá e mi), a segunda 110 ms depois: confirmação alegre e discreta."""
    dur = 1.3
    t = np.arange(int(SR * dur)) / SR

    def nota(f, inicio):
        tt = np.maximum(0, t - inicio)
        env = np.where(t >= inicio, np.minimum(1, tt / 0.004) * np.exp(-tt / 0.32), 0)
        return (np.sin(2 * np.pi * f * tt) + 0.42 * np.sin(2 * np.pi * 2 * f * tt) * np.exp(-tt / 0.12) + 0.18 * np.sin(2 * np.pi * 3.01 * f * tt) * np.exp(-tt / 0.07)) * env

    return nota(880.0, 0.0) * 0.9 + nota(1318.5, 0.11)


if __name__ == "__main__":
    pasta = sys.argv[1] if len(sys.argv) > 1 else "public/selloop/sons"
    os.makedirs(pasta, exist_ok=True)
    salvar(os.path.join(pasta, "salto.wav"), salto(), -7)
    salvar(os.path.join(pasta, "sino.wav"), sino(), -9)
