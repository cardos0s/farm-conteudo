#!/usr/bin/env python3
"""Gera a música do Reel do Pix, sintetizada do zero (sem amostras de terceiros).

Saída em public/aulas/pix/sons/ (fora do git):
  musica.wav  faixa original (lo-fi/eletrônica, 96 BPM) com a estrutura do vídeo:
              intro com pads (0–8 s), batida quando o canvas entra (8 s), tensão no problema,
              groove completo nas soluções, pausa com subida na "escala" e final resolvido.
Os efeitos sonoros vêm do SFX Kit (CC0): ver scripts/aulas/baixar_sfx_pix.py.

Uso: python3 scripts/aulas/sons_pix.py
"""
import os
import wave

import numpy as np

SR = 48000
RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DEST = os.path.join(RAIZ, "public", "aulas", "pix", "sons")
rng = np.random.default_rng(20261124)


# ---------------------------------------------------------------- utilidades

def tempo(d):
    return np.arange(int(round(d * SR))) / SR


def hz(midi):
    return 440.0 * 2 ** ((midi - 69) / 12)


def salvar(nome, sinal, pico_db=-1.0):
    """Grava estéreo 16 bits normalizado para `pico_db`."""
    if sinal.ndim == 1:
        sinal = np.stack([sinal, sinal], axis=1)
    pico = np.max(np.abs(sinal)) or 1.0
    sinal = sinal / pico * 10 ** (pico_db / 20)
    dados = (np.clip(sinal, -1, 1) * 32767).astype("<i2")
    with wave.open(os.path.join(DEST, nome + ".wav"), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(dados.tobytes())


def filtro_fft(x, lo=0.0, hi=None, inclinacao=1.0):
    """Passa-faixa estático (suave) no domínio da frequência."""
    n = len(x)
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(n, 1 / SR)
    g = np.ones_like(f)
    if lo > 0:
        g *= 1 / (1 + (lo / np.maximum(f, 1e-3)) ** (4 * inclinacao))
    if hi:
        g *= 1 / (1 + (f / hi) ** (4 * inclinacao))
    return np.fft.irfft(X * g, n)


def ruido_varrido(d, lo_ini, lo_fim, hi_ini, hi_fim, quadro=1024):
    """Ruído com passa-faixa que varia no tempo (STFT com sobreposição)."""
    n = int(d * SR)
    passo = quadro // 2
    total = n + quadro
    x = rng.standard_normal(total)
    janela = np.hanning(quadro)
    f = np.fft.rfftfreq(quadro, 1 / SR)
    saida = np.zeros(total)
    for i in range(0, total - quadro, passo):
        p = min(1.0, i / max(1, n))
        lo = lo_ini * (lo_fim / lo_ini) ** p
        hi = hi_ini * (hi_fim / hi_ini) ** p
        g = 1 / (1 + (lo / np.maximum(f, 1e-3)) ** 4) / (1 + (f / hi) ** 4)
        saida[i : i + quadro] += np.fft.irfft(np.fft.rfft(x[i : i + quadro] * janela) * g, quadro)
    return saida[:n]


def envelope(n, ataque, queda, forma=1.0):
    """Sobe em `ataque` s e cai exponencialmente com constante `queda` s."""
    t = np.arange(n) / SR
    e = np.minimum(1.0, t / max(ataque, 1e-4)) * np.exp(-np.maximum(0, t - ataque) / queda)
    return e**forma


def fades(x, ini=0.005, fim=0.02):
    n = len(x)
    a = min(n, int(ini * SR))
    b = min(n, int(fim * SR))
    x = x.copy()
    if a:
        x[:a] *= np.linspace(0, 1, a)
    if b:
        x[-b:] *= np.linspace(1, 0, b)
    return x


def reverb(estereo, tamanho=1.6, queda=0.45, mistura=0.25):
    """Reverb por convolução com ruído decaindo (um IR por canal)."""
    n_ir = int(tamanho * SR)
    t = np.arange(n_ir) / SR
    saida = estereo.copy()
    for c in range(2):
        ir = rng.standard_normal(n_ir) * np.exp(-t / queda)
        ir = filtro_fft(ir, lo=150, hi=6000)
        ir /= np.sqrt(np.sum(ir**2))
        x = estereo[:, c]
        m = len(x) + n_ir
        tam = 1 << (m - 1).bit_length()
        y = np.fft.irfft(np.fft.rfft(x, tam) * np.fft.rfft(ir, tam), tam)[: len(x)]
        saida[:, c] = x + mistura * y
    return saida


def estereo(x, pan=0.0):
    """pan -1 (esquerda) a 1 (direita), potência constante."""
    a = (pan + 1) * np.pi / 4
    return np.stack([x * np.cos(a), x * np.sin(a)], axis=1)


# ---------------------------------------------------------------- efeito usado na música

def subida(d=1.5):
    t = tempo(d)
    p = t / d
    x = ruido_varrido(d, 200, 3000, 800, 14000) * p**2
    f = 180 * (6 ** p)
    tom = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.15 * p**2
    return estereo(fades(x + tom, 0.01, 0.03))


# ---------------------------------------------------------------- música

BPM = 96
BATIDA = 60 / BPM  # 0,625 s
COMPASSO = 4 * BATIDA  # 2,5 s
ORIGEM = 0.5  # o compasso 3 cai em 8,0 s, quando o canvas entra
DURACAO = 93.2  # duração do Reel com a narração (remotion/aulas/pix/roteiro.ts)

# acordes (midi) e baixo
A = [((53, 57, 60, 64), 41), ((55, 59, 62, 64), 43), ((57, 60, 64, 67), 45), ((52, 55, 59, 62), 40)]  # Fmaj7 G6 Am7 Em7
B = [((50, 53, 57, 60), 38), ((53, 57, 58, 62), 46), ((57, 60, 64, 67), 45), ((52, 56, 59, 62), 40)]  # Dm7 Bbmaj7 Am7 E7


def secao(c):
    """O que toca em cada compasso."""
    if c <= 2:
        return "intro"
    if c <= 7:
        return "historia"  # 8,0–20,5 s
    if c <= 12:
        return "problema"  # 20,5–33,0 s ("Só que o sistema da loja…" em 20,8 s)
    if c <= 29:
        return "solucoes"  # 33,0–75,5 s ("Primeiro" em 34,2 s)
    if c <= 32:
        return "pausa"  # 75,5–83,0 s ("Agora imagina…"; "operacional" em 81,9 s)
    return "final"


def piano(f, d, vel=1.0, brilho_=1.0):
    t = tempo(d + 0.6)
    env = np.exp(-t / 0.9) * np.minimum(1, t / 0.004)
    env[int(d * SR) :] *= np.exp(-(t[int(d * SR) :] - d) / 0.12)
    mod = 1.1 * brilho_ * np.exp(-t / 0.25)
    x = np.sin(2 * np.pi * f * t + mod * np.sin(2 * np.pi * f * t)) + 0.25 * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t / 0.3)
    return 0.5 * x * env * vel * (1 + 0.04 * np.sin(2 * np.pi * 4.5 * t))


def pad(fs, d, corte=1400):
    t = tempo(d)
    x = np.zeros(len(t))
    for f in fs:
        for det in (-0.12, 0.0, 0.12):
            fase = rng.uniform(0, 1)
            x += 2 * (((f * 2 ** (det / 12)) * t + fase) % 1.0) - 1
    x = filtro_fft(x, lo=60, hi=corte)
    a = min(len(t), int(0.8 * SR))
    env = np.ones(len(t))
    env[:a] = np.linspace(0, 1, a)
    r = min(len(t), int(0.9 * SR))
    env[-r:] *= np.linspace(1, 0, r)
    return x * env / (len(fs) * 3)


def baixo(f, d):
    t = tempo(d)
    x = np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * 2 * f * t)
    x = np.tanh(1.6 * x) * envelope(len(t), 0.008, d * 0.9)
    return fades(x, 0.005, 0.05)


def bumbo(forte=1.0):
    t = tempo(0.45)
    f = 46 + 110 * np.exp(-t / 0.035)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * envelope(len(t), 0.001, 0.16) * forte


def chimbal(aberto=False):
    t = tempo(0.25 if aberto else 0.06)
    return filtro_fft(rng.standard_normal(len(t)), lo=7000, hi=16000) * envelope(len(t), 0.0005, 0.08 if aberto else 0.018)


def palmas():
    t = tempo(0.35)
    x = np.zeros(len(t))
    for k, a in enumerate((0, 0.011, 0.022)):
        i = int(a * SR)
        x[i:] += rng.standard_normal(len(t) - i) * np.exp(-np.arange(len(t) - i) / SR / (0.012 if k < 2 else 0.11))
    return filtro_fft(x, lo=900, hi=5000) * 0.5


def dedilhado(f, d=0.3):
    t = tempo(d)
    x = 2 * np.abs(2 * ((f * t) % 1.0) - 1) - 1
    return filtro_fft(x, hi=3500) * envelope(len(t), 0.002, 0.09)


def chiado(d):
    """Chiado de vinil: estalos esparsos e um fundo bem baixo."""
    n = int(d * SR)
    x = filtro_fft(rng.standard_normal(n), lo=900, hi=6000) * 0.012
    for i in rng.integers(0, n - 200, int(d * 7)):
        x[i : i + 60] += rng.standard_normal(60) * np.exp(-np.arange(60) / 12) * rng.uniform(0.05, 0.25)
    return x


def musica():
    n = int(DURACAO * SR)
    mix = {k: np.zeros((n, 2)) for k in ("harmonia", "bateria", "baixo")}

    def soma(trilha, x, inicio, pan=0.0, ganho=1.0):
        a = int(inicio * SR)
        if a >= n:
            return
        s = estereo(x, pan) if x.ndim == 1 else x
        b = min(n, a + len(s))
        mix[trilha][a:b] += s[: b - a] * ganho

    swing = BATIDA * 0.08
    for c in range(int((DURACAO - ORIGEM) / COMPASSO) + 1):
        t0 = ORIGEM + c * COMPASSO
        if t0 > DURACAO - 1.0:
            break
        sec = secao(c)
        prog = B if sec == "problema" else A
        acorde, raiz = prog[c % 4]
        ultimo = t0 + COMPASSO > DURACAO - 2.6

        # pad em todas as seções (mais aberto nas soluções e no final)
        corte = {"intro": 900, "historia": 1300, "problema": 1000, "solucoes": 2200, "pausa": 1100, "volta": 1600, "final": 1800}[sec]
        dur_pad = COMPASSO + 0.9 if not ultimo else DURACAO - t0
        soma("harmonia", pad([hz(m) for m in acorde], dur_pad, corte), t0 - 0.1, ganho=0.6 if sec in ("intro", "pausa") else 0.52)

        if sec == "intro":
            # arpejo de piano bem filtrado, só nas notas do acorde
            for i, m in enumerate(acorde * 2):
                soma("harmonia", piano(hz(m + 12), 0.5, 0.35 + 0.1 * c, 0.5), t0 + i * BATIDA / 2, pan=0.4 * np.sin(i))
            continue

        # piano: acorde no 1 e no "e" do 3
        for b in ((0, 2.5) if sec != "pausa" else (0,)):
            for k, m in enumerate(acorde):
                soma("harmonia", piano(hz(m + 12), BATIDA * 1.2, 0.32, 0.8), t0 + b * BATIDA + k * 0.012, pan=-0.25 + k * 0.17)
        if ultimo:
            continue

        if sec in ("pausa",):
            continue

        # baixo
        for b, d in ((0, 1.5), (1.5, 1.0), (2.5, 1.4)):
            soma("baixo", baixo(hz(raiz), d * BATIDA), t0 + b * BATIDA, ganho=0.39)

        # bateria
        forte = {"historia": 0.8, "problema": 0.9, "solucoes": 1.0, "volta": 0.7, "final": 0.7}[sec]
        for b in (0, 2.5) if sec != "volta" else (0,):
            soma("bateria", bumbo(forte), t0 + b * BATIDA)
        if sec in ("problema", "solucoes"):
            soma("bateria", bumbo(0.6), t0 + 1.75 * BATIDA)
            for b in (1, 3):
                soma("bateria", palmas(), t0 + b * BATIDA, pan=0.1, ganho=2.2 if sec == "solucoes" else 1.6)
        for i in range(8):
            atraso = swing if i % 2 else 0
            soma("bateria", chimbal(aberto=(i == 7 and sec == "solucoes")), t0 + i * BATIDA / 2 + atraso, pan=0.3, ganho=(0.8 if i % 2 else 1.1) * forte)

        # dedilhado nas soluções
        if sec == "solucoes":
            notas = [m + 24 for m in acorde]
            for i in range(8):
                m = notas[(i * 3) % 4] if i % 2 else notas[i // 2 % 4]
                soma("harmonia", dedilhado(hz(m)), t0 + i * BATIDA / 2 + (swing if i % 2 else 0), pan=-0.35 if i % 2 else 0.35, ganho=0.33)

    # subidas na entrada do canvas e antes do "operacional"
    for ini, d in ((6.4, 1.6), (80.3, 1.6)):  # a 2ª termina no "operacional" (81,9 s)
        s = subida(d)
        a = int(ini * SR)
        mix["harmonia"][a : a + len(s)] += s * 0.9

    harmonia = reverb(mix["harmonia"], tamanho=2.2, queda=0.6, mistura=0.35)
    bateria = reverb(mix["bateria"], tamanho=0.8, queda=0.18, mistura=0.15)
    total = harmonia * 0.9 + bateria * 0.8 + mix["baixo"] * 0.9 + estereo(chiado(DURACAO)) * 1.7
    # leve compressão suave e fades do começo/fim
    total = np.tanh(total * 0.9) / 0.9
    f_ini = int(0.6 * SR)
    total[:f_ini] *= np.linspace(0, 1, f_ini)[:, None]
    f_fim = int(2.5 * SR)
    total[-f_fim:] *= np.linspace(1, 0, f_fim)[:, None] ** 1.5
    return total


def main():
    os.makedirs(DEST, exist_ok=True)
    salvar("musica", musica(), pico_db=-1.0)
    print("ok:", DEST)


if __name__ == "__main__":
    main()
