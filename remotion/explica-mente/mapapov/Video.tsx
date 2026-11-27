import React from "react";
import { MARCA } from "../Legendas";
import { Caixa, Cilindro, Seg } from "../Pecas";
import { elastico, mix, prog } from "../anim";
import { Balao, Conceito, criarEpisodio, type Quadro } from "../kit/Episodio";
import { Pensamento, Visao, entre, olhar, type Olhos } from "../kit/Pov";
import { DESVIO, DIRETO, LUGARES, Mapa, Rotulos, Trajeto, Zona } from "../mapa/Video";
import { REGISTRO, TEXTOS } from "./roteiro";
import tempos from "./tempos.json";

const LONGE: Olhos = { pos: [0, 1.5, 6.5], giro: 0, baixa: 0.06 };
const PERTO: Olhos = { pos: [0, 1.5, 2.6], giro: 0, baixa: 0.04 };
const DE_LADO: Olhos = { pos: [0.3, 1.5, 2.9], giro: -1.5, baixa: 0.1 };
const DUVIDA = "E se acontecer de novo?";

/** A rua: o ponto, o ônibus de porta aberta e, para o lado, a calçada comprida. */
const Rua: React.FC<{ f: number }> = () => (
  <>
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[80, 80]} />
      <meshStandardMaterial color="#CFCBD6" roughness={0.95} />
    </mesh>
    <Caixa t={[40, 0.12, 3.4]} raio={0.03} pos={[-14, 0.06, 2.6]} cor="#EDE7F2" />
    {/* ônibus */}
    <Caixa t={[7.2, 2.5, 2.4]} raio={0.25} pos={[1.4, 1.55, -1.4]} cor="#FFC53D" />
    <Caixa t={[6.4, 0.85, 2.45]} raio={0.1} pos={[1.6, 2.0, -1.4]} cor="#BFE6FF" />
    <Caixa t={[1.05, 2.0, 0.08]} raio={0.04} pos={[0, 1.25, -0.18]} cor="#2B2F55" />
    <Caixa t={[0.9, 1.85, 0.06]} raio={0.03} pos={[0, 1.25, -0.2]} cor="#4A3F7A" emissivo="#6C4BD8" brilho={0.25} sombra={false} />
    <Cilindro r={0.5} h={2.5} pos={[-1.2, 0.5, -1.4]} rot={[Math.PI / 2, 0, 0]} cor="#2B2F55" />
    <Cilindro r={0.5} h={2.5} pos={[3.6, 0.5, -1.4]} rot={[Math.PI / 2, 0, 0]} cor="#2B2F55" />
    {/* placa do ponto */}
    <Seg a={[-1.5, 0, 0.7]} b={[-1.5, 2.6, 0.7]} r={0.05} cor="#8B8FA8" />
    <Caixa t={[0.7, 0.7, 0.06]} raio={0.1} pos={[-1.5, 2.6, 0.7]} cor="#3D9BE9" />
    {/* a calçada comprida, com árvores */}
    {[0, 1, 2, 3, 4].map((i) => (
      <group key={i} position={[-4 - i * 4.5, 0, 0.9]}>
        <Cilindro r={0.14} h={1.6} pos={[0, 0.8, 0]} cor="#B8793F" />
        <mesh position={[0, 2.3, 0]} castShadow>
          <sphereGeometry args={[1.0, 24, 18]} />
          <meshStandardMaterial color="#3FAE6A" roughness={0.9} />
        </mesh>
      </group>
    ))}
  </>
);

type Est = { o: Olhos; andando?: number; tensao?: number; pulso?: number; alivio?: number };
const Cena: React.FC<{ f: number; e: Est }> = ({ f, e }) => (
  <Visao cam={olhar(e.o, f, { andando: e.andando, treme: e.tensao })} tensao={e.tensao ?? 0} alivio={e.alivio ?? 0} pulso={e.pulso ?? 0} sala={false}>
    <Rua f={f} />
  </Visao>
);

const desenhar = (q: Quadro) => {
  const { f, p, em, F } = q;
  const bate = Math.pow(Math.max(0, Math.sin(f * 0.3)), 6);
  // --- a vivência ---
  if (em(0)) return <Cena f={f} e={{ o: entre(LONGE, PERTO, prog(p(0), 0, 1, (v) => v) * 0.8), andando: 1 }} />;
  if (em(1)) return <Cena f={f} e={{ o: entre(LONGE, PERTO, mix(0.8, 0.9, prog(p(1), 0, 0.3))), andando: p(1) < 0.3 ? 1 : 0, tensao: 0.6 * prog(p(1), 0.2, 0.8), pulso: bate * prog(p(1), 0.3, 0.6) }} />;
  if (em(2))
    return (
      <>
        <Cena f={f} e={{ o: { ...entre(LONGE, PERTO, 0.9), fov: mix(58, 44, p(2)) }, tensao: mix(0.6, 1, p(2)), pulso: bate }} />
        <Pensamento f={f} texto={DUVIDA} forca={prog(p(2), 0.05, 0.3)} ecos={p(2)} />
      </>
    );
  if (em(3)) {
    const x = p(3);
    const o = entre(entre(LONGE, PERTO, 0.9), DE_LADO, prog(x, 0, 0.45));
    return <Cena f={f} e={{ o: { ...o, pos: [o.pos[0] - 2.2 * prog(x, 0.45, 1, (v) => v), 1.5, o.pos[2]] }, andando: x > 0.45 ? 1 : 0, tensao: 1 - prog(x, 0.2, 0.7), alivio: 0.5 * prog(x, 0.5, 0.9) }} />;
  }
  const andandoEmbora = (x: number): Olhos => ({ ...DE_LADO, pos: [DE_LADO.pos[0] - 2.2 - 1.6 * x, 1.5, DE_LADO.pos[2]] });
  if (em(4)) return <Cena f={f} e={{ o: andandoEmbora(p(4)), andando: 1, alivio: 0.3 }} />;
  // --- a explicação ---
  if (em(5) || em(6))
    return (
      <>
        <Cena f={f} e={{ o: andandoEmbora(1 + (em(5) ? p(5) : 1 + p(6))), andando: 1, tensao: 0.35 }} />
        <Pensamento f={f} texto={DUVIDA} forca={0.75} ecos={0.5} tamanho={70} />
        {em(6) && <Conceito f={f} de={F[6].de + 4} ate={F[7].de - 4} texto="ansiedade antecipatória" />}
      </>
    );
  if (em(7)) {
    const x = p(7);
    const fora = { onibus: prog(x, 0.4, 0.48, elastico), mercado: prog(x, 0.8, 0.88, elastico) };
    return (
      <>
        <Mapa fora={fora}>
          <Trajeto pts={DIRETO} ate={1} cor="#C9C6D0" pino={false} />
          <Trajeto pts={DESVIO} ate={prog(x, 0.45, 0.78, (v) => v)} cor="#FF5A4E" />
        </Mapa>
        <Rotulos fora={fora} />
        <Balao texto="evitação" p={prog(x, 0.12, 0.26, elastico)} topo={236} cor={MARCA.sol} tamanho={64} />
      </>
    );
  }
  if (em(8) || em(9)) {
    const fora = { onibus: 1, mercado: 1, praca: em(9) ? prog(p(9), 0.3, 0.4, elastico) : 0 };
    const raio = em(8) ? mix(3.6, 1.6, prog(p(8), 0.45, 1)) : mix(1.6, 1.15, p(9));
    return (
      <>
        <Mapa fora={fora}>
          <Trajeto pts={DESVIO} ate={1} cor="#FF5A4E" pino={false} />
          <Trajeto pts={[LUGARES.casa.pos, LUGARES.casa.pos]} ate={1} cor="#4B2BBF" />
          <Zona raio={raio} forca={0.85} />
        </Mapa>
        <Rotulos fora={fora} />
      </>
    );
  }
  // --- o que perguntar ---
  const fora = { onibus: 1, mercado: 1, praca: 1 };
  return (
    <>
      <Mapa fora={fora}>
        <Trajeto pts={DESVIO} ate={1} cor="#FF5A4E" pino={false} />
        <Trajeto pts={[LUGARES.casa.pos, LUGARES.casa.pos]} ate={1} cor="#4B2BBF" />
        <Zona raio={1.15} forca={0.85} />
      </Mapa>
      <Rotulos fora={fora} opacidade={0.5} />
      {(em(10) || em(11)) && <Balao texto="Teve crise?" p={em(10) ? prog(p(10), 0.3, 0.45, elastico) : 1} topo={240} cor="#EDE6F7" corTexto="#8B8FA8" tamanho={48} />}
      {em(11) && <Balao texto="O que mudou na sua rotina depois?" p={prog(p(11), 0.3, 0.45, elastico)} topo={372} cor={MARCA.roxo} corTexto="#FFFFFF" tamanho={46} />}
      {em(12) && <Balao texto="Tem tratamento" p={prog(p(12), 0.05, 0.2, elastico)} topo={250} cor="#2FB36B" corTexto="#FFFFFF" tamanho={64} />}
    </>
  );
};

export const { Componente: ExplicaMenteMapapov, TOTAL } = criarEpisodio({ textos: TEXTOS, tempos, registro: REGISTRO, desenhar });
