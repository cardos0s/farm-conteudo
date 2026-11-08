import torch
import torch.nn.functional as F

# --- cap 2: atenção online (FlashAttention didático)
def atencao_ingenua(q, k, v):
    s = q @ k.T / q.shape[-1] ** 0.5
    return torch.softmax(s, dim=-1) @ v

def atencao_online(q, k, v, bloco=64):
    d = q.shape[-1]
    m = torch.full((q.shape[0], 1), float("-inf"))
    l = torch.zeros(q.shape[0], 1)
    o = torch.zeros_like(q)
    for j in range(0, k.shape[0], bloco):
        s = q @ k[j:j + bloco].T / d ** 0.5
        m_novo = torch.maximum(m, s.max(-1, keepdim=True).values)
        p = torch.exp(s - m_novo)
        fator = torch.exp(m - m_novo)
        l = l * fator + p.sum(-1, keepdim=True)
        o = o * fator + p @ v[j:j + bloco]
        m = m_novo
    return o / l

q, k, v = (torch.randn(128, 64) for _ in range(3))
assert torch.allclose(atencao_ingenua(q, k, v), atencao_online(q, k, v), atol=1e-5)

# --- cap 2: rope
def rope(x, pos, base=500000.0):
    d = x.shape[-1]
    i = torch.arange(0, d, 2, dtype=torch.float32)
    inv_freq = base ** (-i / d)
    ang = pos.float()[:, None] * inv_freq[None]
    cos = torch.cat([ang.cos(), ang.cos()], -1)
    sin = torch.cat([ang.sin(), ang.sin()], -1)
    x1, x2 = x[..., : d // 2], x[..., d // 2 :]
    rot = torch.cat([-x2, x1], dim=-1)
    return x * cos + rot * sin
# propriedade: <rope(q,m), rope(k,n)> depende só de m-n
qv, kv = torch.randn(1, 1, 1, 128), torch.randn(1, 1, 1, 128)
a = (rope(qv, torch.tensor([10])) * rope(kv, torch.tensor([3]))).sum()
b = (rope(qv, torch.tensor([107])) * rope(kv, torch.tensor([100]))).sum()
assert torch.allclose(a, b, atol=1e-3), (a, b)

# --- cap 2: atenção com cache e deslocamento de máscara
def atencao_com_cache(q, k, v):
    tq, tk = q.shape[-2], k.shape[-2]
    s = q @ k.transpose(-1, -2) / q.shape[-1] ** 0.5
    pos_q = torch.arange(tq).unsqueeze(1) + (tk - tq)
    pos_k = torch.arange(tk).unsqueeze(0)
    s = s.masked_fill(pos_k > pos_q, float("-inf"))
    return F.softmax(s, dim=-1) @ v
Q, K, V = (torch.randn(2, 4, 10, 32) for _ in range(3))
completo = atencao_com_cache(Q, K, V)
ultimo = atencao_com_cache(Q[:, :, -1:], K, V)
assert torch.allclose(completo[:, :, -1:], ultimo, atol=1e-5)
chunk = atencao_com_cache(Q[:, :, 6:], K, V)
assert torch.allclose(completo[:, :, 6:], chunk, atol=1e-5)

# --- cap 6: KVCache
class KVCache:
    def __init__(self, n_camadas, batch, n_kv_heads, head_dim,
                 max_len, dtype=torch.bfloat16, device="cuda"):
        shape = (batch, n_kv_heads, max_len, head_dim)
        self.k = [torch.zeros(shape, dtype=dtype, device=device) for _ in range(n_camadas)]
        self.v = [torch.zeros(shape, dtype=dtype, device=device) for _ in range(n_camadas)]
        self.comp = torch.zeros(batch, dtype=torch.long, device=device)
        self.max_len = max_len
    def update(self, camada, k_novo, v_novo):
        B, _, t, _ = k_novo.shape
        ini = self.comp
        if int(ini.max()) + t > self.max_len:
            raise ValueError("contexto maior que max_len")
        pos = ini[:, None] + torch.arange(t, device=ini.device)
        b_idx = torch.arange(B, device=ini.device)[:, None]
        kc, vc = self.k[camada], self.v[camada]
        kc.permute(0, 2, 1, 3)[b_idx, pos] = (k_novo.permute(0, 2, 1, 3).to(kc.dtype))
        vc.permute(0, 2, 1, 3)[b_idx, pos] = (v_novo.permute(0, 2, 1, 3).to(vc.dtype))
        fim = int((ini + t).max())
        return kc[:, :, :fim], vc[:, :, :fim]
    def avancar(self, t):
        self.comp += t
    def reordenar(self, indices):
        for c in range(len(self.k)):
            self.k[c] = self.k[c].index_select(0, indices)
            self.v[c] = self.v[c].index_select(0, indices)
        self.comp = self.comp.index_select(0, indices)

c = KVCache(2, 3, 2, 8, 16, dtype=torch.float32, device="cpu")
k1 = torch.randn(3, 2, 5, 8); v1 = torch.randn(3, 2, 5, 8)
for cam in range(2):
    kk, vv = c.update(cam, k1, v1)
c.avancar(5)
assert torch.equal(kk, k1) and torch.equal(vv, v1)
k2 = torch.randn(3, 2, 1, 8); v2 = torch.randn(3, 2, 1, 8)
for cam in range(2):
    kk, vv = c.update(cam, k2, v2)
c.avancar(1)
assert torch.equal(kk, torch.cat([k1, k2], 2))
c.reordenar(torch.tensor([2, 2, 0]))
assert torch.equal(c.k[0][0, :, :6], torch.cat([k1, k2], 2)[2])
print("ok: caps 2 e 6")
