#!/usr/bin/env python3
"""Gera a música do Reel de design patterns com o mesmo gerador do Reel do Pix (sons_pix.musica),
numa estrutura que segue este vídeo (tempos do vídeo final, sem narração no canvas):

  0–5,5 s     intro (pads) sob a voz do gancho (3,85 s) e o começo do canvas
  5,5–35,5 s  batida leve: gancho no canvas e contexto do Gang of Four
  35,5–135,5  groove completo: os 9 padrões ("Padrões criacionais" em ~35,4 s)
  135,5–148   pausa: visão geral e a ponte com a IA, com subida até "Antes de estudar…" (~148 s)
  148–fim     final resolvido

Uso: python3 scripts/aulas/musica_patterns.py [duracao_em_s]   (padrão: 178.2)
Saída: public/aulas/patterns/musica.wav
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import sons_pix as base  # noqa: E402

DURACAO = float(sys.argv[1]) if len(sys.argv) > 1 else 178.2


def secao(c):
    if c <= 1:
        return "intro"
    if c <= 13:
        return "historia"
    if c <= 53:
        return "solucoes"
    if c <= 58:
        return "pausa"
    return "final"


base.DEST = os.path.join(base.RAIZ, "public", "aulas", "patterns")
os.makedirs(base.DEST, exist_ok=True)
base.salvar("musica", base.musica(DURACAO, secao, ((3.9, 1.6), (146.4, 1.6))), pico_db=-1.0)
print("ok:", os.path.join(base.DEST, "musica.wav"))
