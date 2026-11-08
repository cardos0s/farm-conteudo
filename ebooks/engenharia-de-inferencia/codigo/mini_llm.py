import torch
import torch.nn as nn
import torch.nn.functional as F


class Config:
    vocab = 1000
    d = 128
    n_heads = 8
    n_kv = 2          # GQA: 4 heads de query por head de KV
    n_layers = 2
    d_ff = 344


def rope_cos_sin(pos, head_dim, base=10000.0):
    # pos: [B, T] posições absolutas -> cos, sin: [B, T, D]
    i = torch.arange(0, head_dim, 2, dtype=torch.float32)
    inv_freq = base ** (-i / head_dim)
    ang = pos.float()[..., None] * inv_freq
    ang = torch.cat([ang, ang], dim=-1)
    return ang.cos(), ang.sin()


def aplica_rope(x, cos, sin):
    # x: [B, H, T, D]; cos, sin: [B, 1, T, D]
    d = x.shape[-1]
    x1, x2 = x[..., : d // 2], x[..., d // 2 :]
    return x * cos + torch.cat([-x2, x1], dim=-1) * sin


class RMSNorm(nn.Module):
    def __init__(self, d, eps=1e-6):
        super().__init__()
        self.g = nn.Parameter(torch.ones(d))
        self.eps = eps

    def forward(self, x):
        rms = torch.rsqrt(x.pow(2).mean(-1, keepdim=True) + self.eps)
        return x * rms * self.g


class Atencao(nn.Module):
    def __init__(self, c):
        super().__init__()
        self.h, self.hkv = c.n_heads, c.n_kv
        self.hd = c.d // c.n_heads
        self.wq = nn.Linear(c.d, c.d, bias=False)
        self.wk = nn.Linear(c.d, self.hkv * self.hd, bias=False)
        self.wv = nn.Linear(c.d, self.hkv * self.hd, bias=False)
        self.wo = nn.Linear(c.d, c.d, bias=False)

    def forward(self, x, cos, sin, cache, mask):
        B, T, _ = x.shape
        q = self.wq(x).view(B, T, self.h, self.hd).transpose(1, 2)
        k = self.wk(x).view(B, T, self.hkv, self.hd).transpose(1, 2)
        v = self.wv(x).view(B, T, self.hkv, self.hd).transpose(1, 2)
        q, k = aplica_rope(q, cos, sin), aplica_rope(k, cos, sin)
        if cache is not None:          # K já tem RoPE no cache
            k = torch.cat([cache[0], k], dim=2)
            v = torch.cat([cache[1], v], dim=2)
        rep = self.h // self.hkv       # GQA: expande só na conta
        o = F.scaled_dot_product_attention(
            q, k.repeat_interleave(rep, 1),
            v.repeat_interleave(rep, 1), attn_mask=mask)
        o = o.transpose(1, 2).reshape(B, T, -1)
        return self.wo(o), (k, v)


class Bloco(nn.Module):
    def __init__(self, c):
        super().__init__()
        self.n1, self.att = RMSNorm(c.d), Atencao(c)
        self.n2 = RMSNorm(c.d)
        self.gate = nn.Linear(c.d, c.d_ff, bias=False)
        self.up = nn.Linear(c.d, c.d_ff, bias=False)
        self.down = nn.Linear(c.d_ff, c.d, bias=False)

    def forward(self, x, cos, sin, cache, mask):
        h, cache = self.att(self.n1(x), cos, sin, cache, mask)
        x = x + h
        y = self.n2(x)
        x = x + self.down(F.silu(self.gate(y)) * self.up(y))
        return x, cache


class MiniLLM(nn.Module):
    def __init__(self, c):
        super().__init__()
        self.c = c
        self.emb = nn.Embedding(c.vocab, c.d)
        self.blocos = nn.ModuleList(
            Bloco(c) for _ in range(c.n_layers))
        self.norm = RMSNorm(c.d)
        self.head = nn.Linear(c.d, c.vocab, bias=False)

    def forward(self, ids, pos, attn_mask, caches=None):
        # ids, pos: [B, T]; attn_mask: [B, Tk], 1 = token real
        T, Tk = ids.shape[1], attn_mask.shape[1]
        cos, sin = rope_cos_sin(pos, self.c.d // self.c.n_heads)
        cos, sin = cos[:, None], sin[:, None]
        i = torch.arange(T)[:, None] + (Tk - T)   # pos. das queries
        j = torch.arange(Tk)[None, :]
        mask = (j <= i)[None] & attn_mask[:, None, :].bool()
        mask = (mask | (j == i)[None])[:, None]   # nunca linha vazia
        x = self.emb(ids)
        novos = []
        for n, bloco in enumerate(self.blocos):
            cache = None if caches is None else caches[n]
            x, c = bloco(x, cos, sin, cache, mask)
            novos.append(c)
        logits = self.head(self.norm(x[:, -1]))  # só o último token
        return logits, novos


def sample(logits, temperatura=0.0, top_p=1.0):
    if temperatura == 0:
        return logits.argmax(dim=-1)
    probs = torch.softmax(logits / temperatura, dim=-1)
    sp, idx = probs.sort(dim=-1, descending=True)
    cum = sp.cumsum(dim=-1)
    sp[(cum - sp) > top_p] = 0.0
    sp = sp / sp.sum(dim=-1, keepdim=True)
    escolha = torch.multinomial(sp, num_samples=1)
    return idx.gather(-1, escolha).squeeze(-1)


@torch.inference_mode()
def gerar(modelo, prompts, max_novos=20, temperatura=0.0,
          top_p=1.0, eos=None):
    B, L = len(prompts), max(len(p) for p in prompts)
    ids = torch.zeros(B, L, dtype=torch.long)
    mask = torch.zeros(B, L, dtype=torch.long)
    for b, p in enumerate(prompts):           # padding à esquerda
        ids[b, L - len(p):] = torch.tensor(p)
        mask[b, L - len(p):] = 1
    pos = (mask.cumsum(-1) - 1).clamp(min=0)
    logits, caches = modelo(ids, pos, mask)   # PREFILL
    saidas = [[] for _ in range(B)]
    ativo = [True] * B
    for _ in range(max_novos):
        prox = sample(logits, temperatura, top_p)       # [B]
        for b, t in enumerate(prox.tolist()):  # 1 sync por passo
            if ativo[b]:
                saidas[b].append(t)
                if eos is not None and t == eos:
                    ativo[b] = False
        if not any(ativo):
            break
        pos = mask.sum(-1, keepdim=True)       # posição do novo
        um = torch.ones(B, 1, dtype=mask.dtype)
        mask = torch.cat([mask, um], dim=-1)
        logits, caches = modelo(prox[:, None], pos, mask, caches)
    return saidas


@torch.inference_mode()
def gerar_sem_cache(modelo, prompt, max_novos=20):
    seq = list(prompt)
    for _ in range(max_novos):
        ids = torch.tensor([seq])
        mask = torch.ones_like(ids)
        pos = torch.arange(len(seq))[None]
        logits, _ = modelo(ids, pos, mask)
        seq.append(int(logits.argmax(-1)))
    return seq[len(prompt):]


if __name__ == "__main__":
    torch.manual_seed(0)
    m = MiniLLM(Config()).eval()
    prompts = [[5, 17, 300, 42], [9, 8], [1, 2, 3, 4, 5, 6, 7]]
    com_cache = gerar(m, prompts, max_novos=15)
    for p, saida in zip(prompts, com_cache):
        ref = gerar_sem_cache(m, p, max_novos=15)
        assert saida == ref, (p, saida, ref)
        sozinho = gerar(m, [p], max_novos=15)[0]
        assert saida == sozinho, (p, saida, sozinho)
    amostras = gerar(m, prompts, max_novos=10, temperatura=0.8,
                     top_p=0.9)
    assert all(len(a) == 10 for a in amostras)
    print("ok: com cache == sem cache; batch == sozinho")
