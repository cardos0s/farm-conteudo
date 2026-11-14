import React from "react";
import { MARCA } from "../Legendas";
import { Caixa, Cilindro, Esfera, Seg } from "../Pecas";
import { elastico, mix, mixV, prog, type V3 } from "../anim";
import { Balao, Conceito, POPPINS, criarEpisodio, type Quadro } from "../kit/Episodio";
import { Palco, projetar, type Cam } from "../kit/Palco";
import { REGISTRO, TEXTOS } from "./roteiro";
import tempos from "./tempos.json";

const CAM: Cam = { pos: [0, 9.2, 6.4], alvo: [0, 0, -0.1], fov: 34 };
const CINZA = "#C9C6D0";

const LUGARES = {
  casa: { pos: [0, 0, 2.5] as V3, nome: "Casa" },
  onibus: { pos: [-0.85, 0, 0.9] as V3, nome: "Ônibus" },
  mercado: { pos: [1.0, 0, 0.85] as V3, nome: "Mercado" },
  praca: { pos: [-1.0, 0, -1.0] as V3, nome: "Praça" },
  trabalho: { pos: [0.75, 0, -2.5] as V3, nome: "Trabalho" },
};
type Lugar = keyof typeof LUGARES;

const cor = (c: string, fora: number) => (fora > 0.5 ? CINZA : c);

const Cidade: React.FC<{ fora: Partial<Record<Lugar, number>> }> = ({ fora }) => {
  const L = LUGARES;
  const x = (l: Lugar) => fora[l] ?? 0;
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color="#E4F2D6" roughness={0.9} />
      </mesh>
      {/* casa */}
      <group position={L.casa.pos}>
        <Caixa t={[0.8, 0.6, 0.7]} raio={0.04} pos={[0, 0.3, 0]} cor="#FF7A59" />
        <Cilindro r={0.02} r2={0.62} h={0.4} pos={[0, 0.8, 0]} cor="#6C4BD8" />
        <Caixa t={[0.2, 0.32, 0.04]} raio={0.01} pos={[0, 0.16, 0.35]} cor="#FFFFFF" />
      </group>
      {/* ônibus */}
      <group position={L.onibus.pos}>
        <Caixa t={[1.05, 0.46, 0.44]} raio={0.08} pos={[0, 0.33, 0]} cor={cor("#FFC53D", x("onibus"))} />
        <Caixa t={[0.9, 0.16, 0.46]} raio={0.03} pos={[0, 0.42, 0]} cor={cor("#BFE6FF", x("onibus"))} />
        <Cilindro r={0.11} h={0.5} pos={[-0.32, 0.11, 0]} rot={[Math.PI / 2, 0, 0]} cor="#2B2F55" />
        <Cilindro r={0.11} h={0.5} pos={[0.32, 0.11, 0]} rot={[Math.PI / 2, 0, 0]} cor="#2B2F55" />
      </group>
      {/* mercado */}
      <group position={L.mercado.pos}>
        <Caixa t={[1.0, 0.55, 0.7]} raio={0.04} pos={[0, 0.275, 0]} cor={cor("#FFFFFF", x("mercado"))} />
        <Caixa t={[1.06, 0.06, 0.4]} raio={0.02} pos={[0, 0.56, 0.3]} rot={[0.35, 0, 0]} cor={cor("#FF5A4E", x("mercado"))} />
        <Esfera r={0.09} pos={[-0.25, 0.1, 0.45]} cor={cor("#3FAE6A", x("mercado"))} />
        <Esfera r={0.09} pos={[0, 0.1, 0.47]} cor={cor("#FF9F43", x("mercado"))} />
        <Esfera r={0.09} pos={[0.25, 0.1, 0.45]} cor={cor("#FF5A8A", x("mercado"))} />
      </group>
      {/* praça */}
      <group position={L.praca.pos}>
        <Cilindro r={0.75} h={0.02} pos={[0, 0.01, 0]} cor={cor("#BFE3A6", x("praca"))} sombra={false} />
        {[[-0.3, -0.2], [0.3, -0.25], [0, 0.3]].map(([a, b], i) => (
          <group key={i} position={[a, 0, b]}>
            <Cilindro r={0.05} h={0.34} pos={[0, 0.17, 0]} cor="#B8793F" />
            <Esfera r={0.24} pos={[0, 0.5, 0]} cor={cor("#3FAE6A", x("praca"))} />
          </group>
        ))}
      </group>
      {/* trabalho */}
      <group position={L.trabalho.pos}>
        <Caixa t={[0.9, 1.5, 0.8]} raio={0.04} pos={[0, 0.75, 0]} cor="#5B7BD8" />
        {[0, 1, 2].map((i) => [0, 1, 2].map((j) => <Caixa key={`${i}${j}`} t={[0.17, 0.2, 0.02]} raio={0.01} pos={[-0.26 + j * 0.26, 0.42 + i * 0.38, 0.4]} cor="#DDEBFF" sombra={false} />))}
      </group>
      {/* X nos lugares que saíram da rotina */}
      {(Object.keys(L) as Lugar[]).map((l) =>
        x(l) > 0.02 ? (
          <group key={l} position={[L[l].pos[0], 1.25, L[l].pos[2]]} scale={x(l)}>
            <Seg a={[-0.28, 0, -0.28]} b={[0.28, 0, 0.28]} r={0.07} cor="#FF5A4E" />
            <Seg a={[0.28, 0, -0.28]} b={[-0.28, 0, 0.28]} r={0.07} cor="#FF5A4E" />
          </group>
        ) : null,
      )}
    </>
  );
};

const DIRETO: V3[] = [LUGARES.casa.pos, [-0.75, 0, 1.75], LUGARES.onibus.pos, [-0.2, 0, -0.7], LUGARES.trabalho.pos];
const DESVIO: V3[] = [LUGARES.casa.pos, [1.75, 0, 2.0], [1.95, 0, 0.2], [1.75, 0, -1.4], LUGARES.trabalho.pos];

const noCaminho = (pts: V3[], t: number): V3 => {
  const x = Math.max(0, Math.min(1, t)) * (pts.length - 1);
  const i = Math.min(pts.length - 2, Math.floor(x));
  return mixV(pts[i], pts[i + 1], x - i);
};

/** Trajeto pontilhado até `ate` (0..1) e o marcador da pessoa. */
const Trajeto: React.FC<{ pts: V3[]; ate: number; cor: string; pino?: boolean }> = ({ pts, ate, cor: c, pino = true }) => {
  const N = 26;
  const p = noCaminho(pts, ate);
  return (
    <>
      {Array.from({ length: N }, (_, i) => i / (N - 1))
        .filter((t) => t <= ate)
        .map((t, i) => {
          const q = noCaminho(pts, t);
          return <Esfera key={i} r={0.075} pos={[q[0], 0.08, q[2]]} cor={c} sombra={false} />;
        })}
      {pino && (
        <group position={[p[0], 0, p[2]]}>
          <Cilindro r={0.2} r2={0.02} h={0.5} pos={[0, 0.3, 0]} cor="#4B2BBF" />
          <Esfera r={0.24} pos={[0, 0.66, 0]} cor="#4B2BBF" />
          <Esfera r={0.1} pos={[0, 0.7, 0.19]} cor="#FFFFFF" sombra={false} />
        </group>
      )}
    </>
  );
};

/** Área que a rotina ainda alcança. */
const Zona: React.FC<{ raio: number; forca: number }> = ({ raio, forca }) => (
  <mesh position={[LUGARES.casa.pos[0] + 0.3, 0.03, LUGARES.casa.pos[2] - raio * 0.72]} rotation={[-Math.PI / 2, 0, 0]}>
    <ringGeometry args={[raio * 0.965, raio, 80]} />
    <meshBasicMaterial color="#4B2BBF" transparent opacity={forca} depthWrite={false} />
  </mesh>
);

const Rotulos: React.FC<{ fora: Partial<Record<Lugar, number>>; opacidade?: number }> = ({ fora, opacidade = 1 }) => (
  <>
    {(Object.keys(LUGARES) as Lugar[]).map((l) => {
      const s = projetar(CAM, [LUGARES[l].pos[0], l === "trabalho" ? 1.7 : 1.0, LUGARES[l].pos[2] - 0.5]);
      const off = (fora[l] ?? 0) > 0.5;
      return (
        <div key={l} style={{ position: "absolute", left: s.x - 150, top: s.y - 34, width: 300, display: "flex", justifyContent: "center", opacity: opacidade }}>
          <div style={{ background: off ? "#EDEAF2" : "#FFFFFF", color: off ? "#9A97A6" : MARCA.tinta, textDecoration: off ? "line-through" : "none", fontFamily: POPPINS, fontWeight: 800, fontSize: 36, padding: "10px 26px 6px", borderRadius: 999, boxShadow: "0 8px 20px rgba(36,26,74,0.18)" }}>{LUGARES[l].nome}</div>
        </div>
      );
    })}
  </>
);

const Mapa: React.FC<{ fora: Partial<Record<Lugar, number>>; children?: React.ReactNode }> = ({ fora, children }) => (
  <Palco cam={CAM} sala={false}>
    <Cidade fora={fora} />
    {children}
  </Palco>
);

const desenhar = (q: Quadro) => {
  const { f, p, em, F } = q;
  if (em(0)) {
    // vai em direção ao ônibus, hesita e volta
    const x = p(0);
    const t = x < 0.55 ? mix(0, 0.42, prog(x, 0.05, 0.55)) : mix(0.42, 0.18, prog(x, 0.7, 1));
    return (
      <>
        <Mapa fora={{}}>
          <Trajeto pts={DIRETO} ate={t} cor="#4B2BBF" />
        </Mapa>
        <Rotulos fora={{}} />
      </>
    );
  }
  if (em(1))
    return (
      <>
        <Mapa fora={{}}>
          <Trajeto pts={DIRETO} ate={prog(p(1), 0.1, 0.9, (v) => v)} cor="#4B2BBF" />
        </Mapa>
        <Rotulos fora={{}} />
      </>
    );
  if (em(2)) {
    const x = p(2);
    const fora = { onibus: prog(x, 0.12, 0.2, elastico), mercado: prog(x, 0.72, 0.8, elastico) };
    return (
      <>
        <Mapa fora={fora}>
          <Trajeto pts={DIRETO} ate={1} cor={CINZA} pino={false} />
          <Trajeto pts={DESVIO} ate={prog(x, 0.24, 0.66, (v) => v)} cor="#FF5A4E" />
        </Mapa>
        <Rotulos fora={fora} />
      </>
    );
  }
  const fora = { onibus: 1, mercado: 1, praca: em(4) ? prog(p(4), 0.55, 0.65, elastico) : em(3) ? 0 : 1 };
  const raio = em(3) ? 4.6 : em(4) ? mix(4.6, 1.5, prog(p(4), 0.08, 0.8)) : 1.5;
  return (
    <>
      <Mapa fora={fora}>
        <Trajeto pts={DESVIO} ate={1} cor="#FF5A4E" pino={false} />
        <Trajeto pts={[LUGARES.casa.pos, LUGARES.casa.pos]} ate={1} cor="#4B2BBF" />
        <Zona raio={raio} forca={em(3) ? 0 : 0.85} />
      </Mapa>
      <Rotulos fora={fora} opacidade={em(5) || em(6) ? 0.5 : 1} />
      {em(3) && <Conceito f={f} de={F[3].de + 4} ate={F[4].de - 4} texto="ansiedade antecipatória" topo={236} />}
      {em(3) && <Conceito f={f} de={F[3].de + 44} ate={F[4].de - 4} texto="evitação" topo={372} />}
      {em(5) && <Balao texto="Como foi a crise?" p={prog(p(5), 0.05, 0.17, elastico)} topo={240} cor="#EDE6F7" corTexto="#8B8FA8" tamanho={46} />}
      {em(5) && <Balao texto="O que mudou na rotina depois?" p={prog(p(5), 0.45, 0.57, elastico)} topo={370} cor={MARCA.roxo} corTexto="#FFFFFF" tamanho={46} />}
    </>
  );
};

export const { Componente: ExplicaMenteMapa, TOTAL } = criarEpisodio({ textos: TEXTOS, tempos, registro: REGISTRO, desenhar });
