from collections import deque
import heapq
import random


def topo_kahn(n, arestas):
    """n nós (0..n-1), arestas (u, v) = u antes de v.
    Retorna uma ordem topológica ou levanta erro se houver ciclo."""
    adj = [[] for _ in range(n)]
    grau = [0] * n
    for u, v in arestas:
        adj[u].append(v)
        grau[v] += 1
    fila = deque(i for i in range(n) if grau[i] == 0)
    ordem = []
    while fila:
        u = fila.popleft()
        ordem.append(u)
        for v in adj[u]:
            grau[v] -= 1
            if grau[v] == 0:
                fila.append(v)
    if len(ordem) != n:
        raise ValueError("o grafo tem ciclo")
    return ordem


def topo_menor_lexico(n, arestas):
    """Mesma ideia, mas sempre escolhe o menor nó disponível."""
    adj = [[] for _ in range(n)]
    grau = [0] * n
    for u, v in arestas:
        adj[u].append(v)
        grau[v] += 1
    heap = [i for i in range(n) if grau[i] == 0]
    heapq.heapify(heap)
    ordem = []
    while heap:
        u = heapq.heappop(heap)
        ordem.append(u)
        for v in adj[u]:
            grau[v] -= 1
            if grau[v] == 0:
                heapq.heappush(heap, v)
    if len(ordem) != n:
        raise ValueError("o grafo tem ciclo")
    return ordem


def topo_dfs(n, arestas):
    """DFS iterativa com 3 cores (sem limite de recursão)."""
    adj = [[] for _ in range(n)]
    for u, v in arestas:
        adj[u].append(v)
    BRANCO, CINZA, PRETO = 0, 1, 2
    cor = [BRANCO] * n
    pos_ordem = []
    for raiz in range(n):
        if cor[raiz] != BRANCO:
            continue
        pilha = [(raiz, 0)]
        cor[raiz] = CINZA
        while pilha:
            u, i = pilha[-1]
            if i < len(adj[u]):
                pilha[-1] = (u, i + 1)
                v = adj[u][i]
                if cor[v] == CINZA:
                    raise ValueError("o grafo tem ciclo")
                if cor[v] == BRANCO:
                    cor[v] = CINZA
                    pilha.append((v, 0))
            else:
                cor[u] = PRETO
                pos_ordem.append(u)
                pilha.pop()
    return pos_ordem[::-1]


class No:
    def __init__(self, val, esq=None, dir=None):
        self.val, self.esq, self.dir = val, esq, dir


def serializar(raiz):
    """Pré-ordem com marcador '#' para nulo. O(n)."""
    partes, pilha = [], [raiz]
    while pilha:
        no = pilha.pop()
        if no is None:
            partes.append("#")
            continue
        partes.append(str(no.val))
        pilha.append(no.dir)     # dir primeiro: esq sai antes
        pilha.append(no.esq)
    return ",".join(partes)


def desserializar(s):
    """Reconstrói a pré-ordem sem recursão. O(n)."""
    tokens = iter(s.split(","))
    primeiro = next(tokens)
    if primeiro == "#":
        return None
    raiz = No(int(primeiro))
    pilha = [(raiz, 0)]          # (nó, filhos já preenchidos)
    for t in tokens:
        pai, k = pilha.pop()
        filho = None if t == "#" else No(int(t))
        if k == 0:
            pai.esq = filho
            pilha.append((pai, 1))
        else:
            pai.dir = filho
        if filho is not None:
            pilha.append((filho, 0))
    return raiz


def serializar_bfs(raiz):
    """Estilo LeetCode: nível a nível, remove nulos do fim."""
    saida, fila = [], deque([raiz])
    while fila:
        no = fila.popleft()
        if no is None:
            saida.append("null")
            continue
        saida.append(str(no.val))
        fila.append(no.esq)
        fila.append(no.dir)
    while saida and saida[-1] == "null":
        saida.pop()
    return "[" + ",".join(saida) + "]"


def desserializar_bfs(s):
    itens = s.strip("[]")
    if not itens:
        return None
    vals = itens.split(",")
    raiz = No(int(vals[0]))
    fila, i = deque([raiz]), 1
    while fila and i < len(vals):
        no = fila.popleft()
        for lado in ("esq", "dir"):
            if i < len(vals) and vals[i] != "null":
                filho = No(int(vals[i]))
                setattr(no, lado, filho)
                fila.append(filho)
            i += 1
    return raiz


def iguais(a, b):
    pilha = [(a, b)]
    while pilha:
        x, y = pilha.pop()
        if x is None or y is None:
            if x is not y:
                return False
            continue
        if x.val != y.val:
            return False
        pilha.append((x.esq, y.esq))
        pilha.append((x.dir, y.dir))
    return True


def arvore_aleatoria(n, rng):
    if n == 0:
        return None
    raiz = No(rng.randint(-1000, 1000))
    nos = [raiz]
    for _ in range(n - 1):
        while True:
            pai = rng.choice(nos)
            lado = rng.choice(("esq", "dir"))
            if getattr(pai, lado) is None:
                filho = No(rng.randint(-1000, 1000))
                setattr(pai, lado, filho)
                nos.append(filho)
                break
    return raiz


def valida_topo(n, arestas, ordem):
    posicao = {u: i for i, u in enumerate(ordem)}
    return (sorted(ordem) == list(range(n))
            and all(posicao[u] < posicao[v] for u, v in arestas))


if __name__ == "__main__":
    rng = random.Random(42)
    # topological sort: DAGs aleatórios
    for _ in range(300):
        n = rng.randint(1, 40)
        perm = list(range(n))
        rng.shuffle(perm)
        arestas = []
        for _ in range(rng.randint(0, n * 2)):
            a, b = sorted(rng.sample(range(n), 2)) if n > 1 else (0, 0)
            if a != b:
                arestas.append((perm[a], perm[b]))
        for f in (topo_kahn, topo_menor_lexico, topo_dfs):
            assert valida_topo(n, arestas, f(n, arestas)), f.__name__
    # ciclos
    for f in (topo_kahn, topo_menor_lexico, topo_dfs):
        try:
            f(3, [(0, 1), (1, 2), (2, 0)])
            raise AssertionError("não detectou ciclo")
        except ValueError:
            pass
    assert topo_menor_lexico(4, [(3, 0), (2, 1)]) == [2, 1, 3, 0]
    # árvores
    for _ in range(300):
        t = arvore_aleatoria(rng.randint(0, 60), rng)
        assert iguais(t, desserializar(serializar(t)))
        assert iguais(t, desserializar_bfs(serializar_bfs(t)))
    exemplo = No(1, No(2), No(3, No(4), No(5)))
    print(serializar(exemplo))
    print(serializar_bfs(exemplo))
    # árvore degenerada profunda (sem recursão)
    fundo = None
    for i in range(200_000):
        fundo = No(i, esq=fundo)
    assert iguais(fundo, desserializar(serializar(fundo)))
    print("ok: topo sort e serialização")
