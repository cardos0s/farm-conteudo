"""Executa o código Python de cada capítulo do livro.

Todos os blocos ```python de um capítulo são juntados, na ordem, num
único script, e executados num processo novo. Blocos marcados como
```{.python .ilustrativo} dependem de bibliotecas ou serviços externos
e ficam de fora.

Uso:  python codigo/testa_capitulos.py [trecho-do-nome-do-capítulo]
Requisitos: numpy e torch (a versão para CPU basta).
"""
import re
import subprocess
import sys
import tempfile
import time
from pathlib import Path

CAPITULOS = Path(__file__).resolve().parent.parent / "capitulos"
BLOCO = re.compile(r"^```python\n(.*?)^```$", re.M | re.S)


def main():
    filtro = sys.argv[1] if len(sys.argv) > 1 else ""
    falhas = 0
    for cap in sorted(CAPITULOS.glob("*.md")):
        if filtro not in cap.name:
            continue
        blocos = BLOCO.findall(cap.read_text(encoding="utf-8"))
        if not blocos:
            continue
        codigo = "\n\n".join(blocos)
        with tempfile.NamedTemporaryFile("w", suffix=".py",
                                         delete=False) as f:
            f.write(codigo)
        ini = time.time()
        r = subprocess.run([sys.executable, "-I", f.name],
                           capture_output=True, text=True)
        dur = time.time() - ini
        estado = "ok " if r.returncode == 0 else "FALHOU"
        print(f"{estado} {cap.name}: {len(blocos)} blocos, {dur:.1f} s")
        if r.returncode != 0:
            falhas += 1
            print(r.stdout[-2000:], r.stderr[-3000:], sep="\n")
    sys.exit(1 if falhas else 0)


if __name__ == "__main__":
    main()
