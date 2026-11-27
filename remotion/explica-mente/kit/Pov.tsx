import React from "react";
import { AbsoluteFill } from "remotion";
import { Euler, Matrix4, Vector3 } from "three";
import { MARCA } from "../Legendas";
import { elastico, limitar, mix, norm, prog, soma, sub, type V3 } from "../anim";
import { Mao } from "../colher/Objetos";
import { POPPINS } from "./Episodio";
import { Palco, type Cam } from "./Palco";

/** Os olhos de quem vive a cena. `giro` 0 olha para o fundo da sala (−z), positivo vira para a direita; `baixa` inclina o olhar para baixo. */
export type Olhos = { pos: V3; giro: number; baixa: number; fov?: number };

export const olhar = (o: Olhos, f: number, extra: { andando?: number; treme?: number } = {}): Cam => {
  const passo = Math.abs(Math.sin(f * 0.34)) * (extra.andando ?? 0);
  const t = (extra.treme ?? 0) * 0.014;
  const pos: V3 = [o.pos[0] + 0.012 * Math.sin(f * 0.17) * (extra.andando ?? 0), o.pos[1] + 0.035 * passo, o.pos[2]];
  const c = Math.cos(o.baixa);
  return { pos, alvo: soma(pos, [Math.sin(o.giro) * c + t * Math.sin(f * 1.1), -Math.sin(o.baixa) + t * Math.sin(f * 1.7), -Math.cos(o.giro) * c]), fov: o.fov ?? 58 };
};

/** Mistura dois olhares (para virar a cabeça, andar, aproximar). */
export const entre = (a: Olhos, b: Olhos, t: number): Olhos => ({ pos: [mix(a.pos[0], b.pos[0], t), mix(a.pos[1], b.pos[1], t), mix(a.pos[2], b.pos[2], t)], giro: mix(a.giro, b.giro, t), baixa: mix(a.baixa, b.baixa, t), fov: mix(a.fov ?? 58, b.fov ?? 58, t) });

/**
 * A cena vista por dentro. `tensao` (0..1) aperta, escurece e desfoca a visão; `alivio` clareia;
 * `pulso` faz a imagem bater junto com o coração; `escuro` fecha os olhos.
 */
export const Visao: React.FC<{ cam: Cam; tensao?: number; alivio?: number; pulso?: number; escuro?: number; sala?: V3 | false; children?: React.ReactNode }> = ({ cam, tensao = 0, alivio = 0, pulso = 0, escuro = 0, sala, children }) => (
  <>
    <div style={{ position: "absolute", inset: 0, transform: `scale(${1 + 0.035 * pulso})`, filter: `blur(${2.2 * tensao}px) saturate(${1 - 0.45 * tensao + 0.15 * alivio}) brightness(${1 - 0.1 * tensao + 0.08 * alivio})` }}>
      <Palco cam={cam} sala={sala} escala={0.75}>
        {children}
      </Palco>
    </div>
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 42%, rgba(20,10,50,0) ${62 - 34 * tensao}%, rgba(20,10,50,${0.25 + 0.6 * tensao}) 100%)`, opacity: 1 - alivio * 0.9 }} />
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, rgba(255,246,214,0.55), rgba(255,246,214,0) 70%)", opacity: alivio }} />
    {pulso > 0.01 && <AbsoluteFill style={{ boxShadow: `inset 0 0 ${260 * pulso}px rgba(255,60,80,${0.6 * pulso})` }} />}
    {escuro > 0.01 && <AbsoluteFill style={{ background: "#120A2E", opacity: escuro }} />}
  </>
);

/** Um pensamento escrito na frente dos olhos; `ecos` (0..1) multiplica o texto quando ele insiste. */
export const Pensamento: React.FC<{ f: number; texto: string; forca: number; ecos?: number; topo?: number; tamanho?: number }> = ({ f, texto, forca, ecos = 0, topo = 720, tamanho = 86 }) => {
  if (forca < 0.02) return null;
  const lugares = [
    [0, 0, 1],
    [-150, -210, 0.55],
    [170, 190, 0.5],
    [-120, 330, 0.4],
    [130, -360, 0.4],
  ];
  return (
    <AbsoluteFill>
      {lugares.slice(0, 1 + Math.round(ecos * 4)).map(([x, y, s], i) => (
        <div key={i} style={{ position: "absolute", top: topo + y, left: 0, right: 0, textAlign: "center", transform: `translateX(${x + 6 * Math.sin(f * 0.21 + i)}px) scale(${(0.6 + 0.4 * Math.min(1, forca * 1.3)) * (i === 0 ? 1 + 0.03 * Math.sin(f * 0.5) : s)}) rotate(${i === 0 ? 0 : i % 2 ? 4 : -4}deg)`, fontFamily: POPPINS, fontStyle: "italic", fontWeight: 800, fontSize: tamanho, lineHeight: 1.05, color: "#FFFFFF", opacity: forca * (i === 0 ? 1 : 0.55), textShadow: "0 6px 30px rgba(20,10,50,0.9), 0 0 4px rgba(20,10,50,0.9)", padding: "0 70px" }}>
          {texto}
        </div>
      ))}
    </AbsoluteFill>
  );
};

/** Direções da câmera: para a frente, para a direita e para cima. */
export const eixos = (cam: Cam): { frente: V3; direita: V3; cima: V3 } => {
  const frente = norm(sub(cam.alvo, cam.pos));
  const direita = norm([-frente[2], 0, frente[0]]);
  const cima: V3 = [direita[1] * frente[2] - direita[2] * frente[1], direita[2] * frente[0] - direita[0] * frente[2], direita[0] * frente[1] - direita[1] * frente[0]];
  return { frente, direita, cima };
};

/** Um ponto dito em relação aos olhos: `d` para a direita, `c` para cima, `f` para a frente. */
export const diante = (cam: Cam, d: number, c: number, f: number): V3 => {
  const e = eixos(cam);
  return [cam.pos[0] + e.direita[0] * d + e.cima[0] * c + e.frente[0] * f, cam.pos[1] + e.direita[1] * d + e.cima[1] * c + e.frente[1] * f, cam.pos[2] + e.direita[2] * d + e.cima[2] * c + e.frente[2] * f];
};

/**
 * A mão de quem assiste, entrando por baixo do quadro até `alvo`.
 * `lado` 1 = direita; `quanto` 0 = fora de cena, 1 = no alvo; `palma` diz para onde a palma aponta (padrão: para baixo).
 */
export const MaoPov: React.FC<{ cam: Cam; alvo: V3; lado?: 1 | -1; quanto?: number; fecha?: number; faixa?: string; palma?: V3 }> = ({ cam, alvo, lado = 1, quanto = 1, fecha = 0.5, faixa, palma }) => {
  if (quanto < 0.01) return null;
  const cotovelo = diante(cam, lado * 0.26, -0.5, 0.1);
  const descanso = diante(cam, lado * 0.3, -0.75, 0.3);
  const pos: V3 = [mix(descanso[0], alvo[0], quanto), mix(descanso[1], alvo[1], quanto), mix(descanso[2], alvo[2], quanto)];
  const y = norm(sub(pos, cotovelo));
  const zb: V3 = palma ?? [0.12 * lado, -1, 0.1];
  const esc = zb[0] * y[0] + zb[1] * y[1] + zb[2] * y[2];
  const z = norm([zb[0] - esc * y[0], zb[1] - esc * y[1], zb[2] - esc * y[2]]);
  let x: V3 = [y[1] * z[2] - y[2] * z[1], y[2] * z[0] - y[0] * z[2], y[0] * z[1] - y[1] * z[0]];
  // a mão esquerda é o espelho da direita
  const e = new Euler().setFromRotationMatrix(new Matrix4().makeBasis(new Vector3(...x), new Vector3(...y), new Vector3(...z)), "YXZ");
  x = [x[0] * lado, x[1], x[2]];
  return (
    <group position={pos} rotation={[e.x, e.y, e.z, "YXZ"]} scale={[lado, 1, 1]}>
      <Mao fecha={fecha} faixa={faixa} />
    </group>
  );
};

/** Painel de explicação: um título e os passos, que vão entrando; `ativo` é o passo em destaque. */
export const Explica: React.FC<{ titulo?: string; passos: string[]; quantos: number; ativo: number; entra?: number; topo?: number }> = ({ titulo, passos, quantos, ativo, entra = 1, topo = 236 }) => (
  <AbsoluteFill style={{ background: "rgba(255,244,228,0.9)", opacity: entra }}>
    <div style={{ position: "absolute", top: topo, left: 60, right: 60, display: "flex", flexDirection: "column", gap: 30 }}>
      {titulo && <div style={{ alignSelf: "center", background: MARCA.sol, color: MARCA.tinta, fontFamily: POPPINS, fontWeight: 800, fontSize: titulo.length > 22 ? 54 : 66, padding: "22px 46px 16px", borderRadius: 38, boxShadow: "0 14px 36px rgba(36,26,74,0.22)", marginBottom: 12, whiteSpace: "nowrap" }}>{titulo}</div>}
      {passos.map((t, i) => {
        const p = prog(quantos, i, i + 0.35, elastico);
        const on = i === ativo;
        return (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 26, background: on ? MARCA.roxo : "#FFFFFF", color: on ? "#FFFFFF" : MARCA.tinta, borderRadius: 44, padding: "38px 40px 34px 32px", boxShadow: "0 12px 30px rgba(36,26,74,0.16)", transform: `scale(${limitar(p, 0, 1.2) * (on ? 1.02 : 1)})`, opacity: limitar(p * 2) }}>
            <span style={{ flex: "0 0 auto", width: 78, height: 78, borderRadius: "50%", background: on ? MARCA.sol : MARCA.roxo, color: on ? MARCA.tinta : "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: POPPINS, fontWeight: 800, fontSize: 44 }}>{i + 1}</span>
            <span style={{ fontFamily: POPPINS, fontWeight: 700, fontSize: 50, lineHeight: 1.15 }}>{t}</span>
          </div>
        );
      })}
    </div>
  </AbsoluteFill>
);

/** Ondas de som ásperas tomando a visão (só imagem, o vídeo não reproduz o ruído). `x`,`y` = de onde saem, em pixels. */
export const Barulho: React.FC<{ f: number; forca: number; x?: number; y?: number; cor?: string }> = ({ f, forca, x = 540, y = 700, cor = "#FF5A4E" }) => {
  if (forca < 0.02) return null;
  return (
    <AbsoluteFill style={{ transform: `translate(${5 * forca * Math.sin(f * 2.3)}px, ${5 * forca * Math.sin(f * 3.1)}px)` }}>
      <svg width="1080" height="1920" style={{ position: "absolute" }}>
        {[0, 1, 2, 3, 4].map((i) => {
          const t = ((f + i * 7) % 35) / 35;
          const r = 80 + t * 1100;
          const pts = Array.from({ length: 22 }, (_, k) => {
            const a = (k / 22) * Math.PI * 2 + f * 0.05 + i;
            const rr = r * (k % 2 ? 1 : 0.86);
            return `${x + rr * Math.cos(a)},${y + rr * Math.sin(a)}`;
          }).join(" ");
          return <polygon key={i} points={pts} fill="none" stroke={cor} strokeWidth={10 + 16 * (1 - t)} strokeLinejoin="round" opacity={forca * (1 - t) * 0.75} />;
        })}
      </svg>
      <AbsoluteFill style={{ background: "#FFFFFF", opacity: 0.22 * forca * (0.6 + 0.4 * Math.sin(f * 0.9)) }} />
    </AbsoluteFill>
  );
};

/** Só o efeito de aperto e alívio da visão, para pôr por cima de uma cena que já tem o próprio palco. */
export const Aperto: React.FC<{ tensao?: number; alivio?: number }> = ({ tensao = 0, alivio = 0 }) => (
  <>
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 42%, rgba(20,10,50,0) ${62 - 34 * tensao}%, rgba(20,10,50,${0.25 + 0.6 * tensao}) 100%)`, opacity: 1 - alivio * 0.9 }} />
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, rgba(255,246,214,0.55), rgba(255,246,214,0) 70%)", opacity: alivio }} />
  </>
);
