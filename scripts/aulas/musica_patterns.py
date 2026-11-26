#!/usr/bin/env python3
"""Gera a música do Reel de design patterns com o mesmo gerador do Reel do Pix (sons_pix.musica),
numa estrutura que segue este vídeo (tempos do vídeo final, sem narração no canvas):

  0–5,5 s     intro (pads) sob a voz do gancho (3,85 s) e o começo do canvas
  5,5–33 s    batida leve: gancho no canvas e contexto do Gang of Four
  33–118 s    groove completo: os 9 padrões (Singleton em ~32,9 s)
  118–130,5   pausa: visão geral e a ponte com a IA, com subida até o fechamento
  130,5–fim   final resolvido

Uso: python3 scripts/aulas/musica_patterns.py [duracao_em_s]   (padrão: 158.85)
Saída: public/aulas/patterns/musica.wav
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import sons_pix as base  # noqa: E402

DURACAO = float(sys.argv[1]) if len(sys.argv) > 1 else 158.85


def secao(c):
    if c <= 1:
        return "intro"
    if c <= 12:
        return "historia"
    if c <= 46:
        return "solucoes"
    if c <= 51:
        return "pausa"
    return "final"


base.DEST = os.path.join(base.RAIZ, "public", "aulas", "patterns")
os.makedirs(base.DEST, exist_ok=True)
base.salvar("musica", base.musica(DURACAO, secao, ((3.9, 1.6), (128.9, 1.6))), pico_db=-1.0)
print("ok:", os.path.join(base.DEST, "musica.wav"))
