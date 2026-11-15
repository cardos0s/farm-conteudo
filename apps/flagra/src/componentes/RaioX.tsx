import React, { useState } from "react";
import { PESOS, type Nota } from "../motor/ranking";
import { useLoja } from "../motor/loja";
import { tempo } from "../util";
import { Icone } from "./Icone";

/** Etiqueta sobre cada post no modo Raio-X: por que ele está nessa posição. */
export function NotaChip({ nota, posicao }: { nota: Nota; posicao?: number }) {
  const [aberto, setAberto] = useState(false);
  return (
    <button className={`nota-chip ${aberto ? "aberto" : ""}`} onPointerUp={(e) => e.stopPropagation()} onClick={(e) => (e.stopPropagation(), setAberto((a) => !a))}>
      <span className="nota-topo">
        {posicao !== undefined && <b>#{posicao + 1}</b>} nota {nota.total.toFixed(2)}
        <Icone nome="raiox" tam={14} />
      </span>
      {aberto && (
        <span className="nota-corpo">
          <span className="nota-conta">
            <i>afinidade</i> {nota.afinidade.toFixed(2)} × <i>interesse</i> {nota.interesse.toFixed(2)} × <i>engajamento</i> {nota.engajamento.toFixed(2)} × <i>frescor</i> {nota.frescor.toFixed(2)}
          </span>
          {nota.motivos.map((m) => (
            <span key={m} className="nota-motivo">
              · {m}
            </span>
          ))}
        </span>
      )}
    </button>
  );
}

/** Painel do Raio-X: os eventos (o que cada toque fez no "servidor") e os seus sinais. */
export function PainelRaioX() {
  const { estado, raioX, setRaioX, acoes } = useLoja();
  const [aba, setAba] = useState<"eventos" | "sinais">("eventos");
  const [min, setMin] = useState(false);
  if (!raioX) return null;
  const temas = Object.entries(estado.interesse).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const pessoas = Object.entries(estado.afinidade).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const maxT = Math.max(1, ...temas.map(([, v]) => v));
  return (
    <section className={`raiox ${min ? "min" : ""}`}>
      <header className="raiox-topo" onClick={() => setMin((m) => !m)}>
        <span className="raiox-titulo">
          <Icone nome="raiox" tam={16} /> Raio-X do feed
        </span>
        <nav onClick={(e) => e.stopPropagation()}>
          <button className={aba === "eventos" ? "ativa" : ""} onClick={() => (setAba("eventos"), setMin(false))}>
            O que aconteceu
          </button>
          <button className={aba === "sinais" ? "ativa" : ""} onClick={() => (setAba("sinais"), setMin(false))}>
            Seus sinais
          </button>
          <button className="raiox-x" onClick={() => setRaioX(false)} aria-label="Fechar Raio-X">
            <Icone nome="fechar" tam={16} />
          </button>
        </nav>
      </header>
      {!min && aba === "eventos" && (
        <div className="raiox-corpo">
          {estado.eventos.length === 0 && <p className="raiox-vazio">Curta, comente, reposte ou assista a um reel: cada toque aparece aqui, passo a passo.</p>}
          {estado.eventos.slice(0, 12).map((ev, i) => (
            <article key={ev.id} className={`evento ${i === 0 ? "novo" : ""}`}>
              <h4>
                <span>{ev.icone}</span> {ev.titulo} <time>{tempo(ev.em)}</time>
              </h4>
              <ol>
                {ev.passos.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ol>
            </article>
          ))}
        </div>
      )}
      {!min && aba === "sinais" && (
        <div className="raiox-corpo">
          <p className="raiox-formula">
            nota = <b>afinidade</b> × <b>interesse</b> × <b>engajamento</b> × <b>frescor</b>
            <br />
            pesos: curtida {PESOS.curtida} · comentário {PESOS.comentario} · salvar {PESOS.salvo} · repost {PESOS.repost} · reel assistido até o fim +2
          </p>
          <h5>Temas que você mais reage</h5>
          {temas.length === 0 && <p className="raiox-vazio">Ainda nenhum. Interaja com os posts.</p>}
          {temas.map(([t, v]) => (
            <div key={t} className="barra-sinal">
              <span>#{t}</span>
              <i style={{ width: `${(v / maxT) * 100}%` }} />
              <b>{v}</b>
            </div>
          ))}
          <h5>Pessoas com quem você mais interage</h5>
          {pessoas.length === 0 && <p className="raiox-vazio">Ainda ninguém.</p>}
          {pessoas.map(([u, v]) => (
            <div key={u} className="barra-sinal pessoa">
              <span>@{u}</span>
              <b>{v}</b>
            </div>
          ))}
          <div className="raiox-botoes">
            <button onClick={acoes.recalcularFeed}>
              <Icone nome="atualizar" tam={15} /> Recalcular feed
            </button>
            <button className="perigo" onClick={acoes.zerar}>
              Zerar tudo
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
