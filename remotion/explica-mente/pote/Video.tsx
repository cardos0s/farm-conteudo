import React from "react";
import { Euler, Matrix4, Vector3 } from "three";
import { MARCA } from "../Legendas";
import { Caixa, Cilindro, Esfera } from "../Pecas";
import { k, mix, mixV, prog, type V3 } from "../anim";
import { Mao, Mesa } from "../colher/Objetos";
import { Conceito, Etapas, criarEpisodio, type Quadro } from "../kit/Episodio";
import { Palco, type Cam } from "../kit/Palco";
import { ETAPAS, REGISTRO, TEXTOS } from "./roteiro";
import tempos from "./tempos.json";

const CAM: Cam = { pos: [0.06, 0.52, 0.86], alvo: [0, 0.1, 0.03], fov: 30 };
const POTE: V3 = [0.02, 0, 0.05];
const ALT = 0.16;
const COR_FIRMA = "#2EC4B6";
const COR_GIRA = "#FF5A4E";

/** A mão que segura o pote de lado: dedos para a frente, palma virada para o pote. */
const ROT_FIRMA: V3 = (() => {
  const e = new Euler().setFromRotationMatrix(new Matrix4().makeBasis(new Vector3(0, 1, 0), new Vector3(0, 0, 1), new Vector3(1, 0, 0)), "YXZ");
  return [e.x, e.y, e.z];
})();

const Pote: React.FC<{ giro: number; tampa: number; sobe: number; tampaFora?: V3 | null }> = ({ giro, tampa, sobe, tampaFora }) => (
  <>
    <group position={POTE} rotation={[0, giro, 0]}>
      <Cilindro r={0.056} h={ALT} pos={[0, ALT / 2, 0]} cor="#CFEFFF" rug={0.2} />
      <Cilindro r={0.05} h={ALT * 0.62} pos={[0, ALT * 0.33, 0]} escala={[1.03, 1, 1.03]} cor="#F6A93B" rug={0.8} sombra={false} />
      {/* rótulo, para dar pra ver quando o pote gira */}
      <Caixa t={[0.06, 0.07, 0.012]} raio={0.004} pos={[0, 0.075, 0.054]} cor="#FFFFFF" sombra={false} />
      <Caixa t={[0.035, 0.02, 0.014]} raio={0.004} pos={[0, 0.085, 0.055]} cor="#6C4BD8" sombra={false} />
    </group>
    <group position={tampaFora ?? [POTE[0], ALT + sobe, POTE[2]]} rotation={[0, giro + tampa, 0]}>
      <Cilindro r={0.062} h={0.03} pos={[0, 0.015, 0]} cor="#FF7A59" />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <Caixa key={i} t={[0.012, 0.03, 0.012]} raio={0.003} pos={[0.062 * Math.cos((i * Math.PI) / 3), 0.015, 0.062 * Math.sin((i * Math.PI) / 3)]} cor="#C9442E" sombra={false} />
      ))}
    </group>
  </>
);

/** Seta em arco, deitada, mostrando o sentido do giro. */
const SetaGiro: React.FC<{ y: number; raio: number; cor: string; forca: number; f: number }> = ({ y, raio, cor, forca, f }) => (
  <group position={[POTE[0], y, POTE[2]]} rotation={[0, f * 0.04, 0]}>
    {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => {
      const a = 0.4 + (i / 8) * 2.2;
      return <Esfera key={i} r={(i === 8 ? 0.026 : 0.012) * forca} pos={[raio * Math.sin(a), 0, raio * Math.cos(a)]} cor={cor} emissivo={cor} brilho={0.5} sombra={false} />;
    })}
  </group>
);

/** Setas que apertam o pote dos dois lados. */
const SetasFirmeza: React.FC<{ forca: number }> = ({ forca }) => (
  <>
    {[1, -1].map((l) => (
      <group key={l} position={[POTE[0] + l * 0.11, 0.08, POTE[2] + 0.05]}>
        <Cilindro r={0.006 * forca} h={0.05} rot={[0, 0, Math.PI / 2]} pos={[l * 0.02, 0, 0]} cor={COR_FIRMA} emissivo={COR_FIRMA} brilho={0.5} sombra={false} />
        <Esfera r={0.014 * forca} pos={[-l * 0.012, 0, 0]} cor={COR_FIRMA} emissivo={COR_FIRMA} brilho={0.5} sombra={false} />
      </group>
    ))}
  </>
);

type Est = { firma: number; torce: number; abre: number; setaPote?: number; setaTampa?: number; setasFirma?: number };

/** `firma` 0..1 leva a outra mão ao pote; `torce` é o vai e vem da mão de cima; `abre` solta e tira a tampa. */
const Cena: React.FC<{ f: number; e: Est; cam?: Cam }> = ({ f, e, cam = CAM }) => {
  const torcao = 0.75 * Math.sin(e.torce);
  const giroPote = torcao * (1 - e.firma);
  const tampa = e.firma * (torcao * (1 - e.abre) + 2.6 * e.abre);
  const sobe = 0.012 * prog(e.abre, 0.2, 0.6);
  const tira = prog(e.abre, 0.6, 1);
  const maoCima: V3 = mixV([POTE[0], ALT + 0.058 + sobe, POTE[2] - 0.036], [POTE[0] + 0.16, ALT + 0.2, POTE[2] - 0.02], tira);
  const descanso: V3 = [-0.24, 0.02, 0.06];
  const noPote: V3 = [POTE[0] - 0.086, 0.085, POTE[2] - 0.036];
  return (
    <Palco cam={cam} sala={[0, -0.62, 0.15]}>
      <Mesa />
      <Pote giro={giroPote} tampa={tampa} sobe={sobe} tampaFora={tira > 0.01 ? [maoCima[0], maoCima[1] - 0.058, maoCima[2] + 0.036] : null} />
      <group position={maoCima} rotation={[Math.PI / 2, giroPote + tampa * 0.4 * (1 - tira), 0, "YXZ"]}>
        <Mao fecha={0.62} faixa={COR_GIRA} />
      </group>
      <group position={mixV(descanso, noPote, e.firma)} rotation={e.firma > 0.5 ? [ROT_FIRMA[0], ROT_FIRMA[1], ROT_FIRMA[2], "YXZ"] : [Math.PI / 2, 0.5, 0, "YXZ"]}>
        <Mao fecha={mix(0.2, 0.7, e.firma)} faixa={COR_FIRMA} />
      </group>
      {(e.setaPote ?? 0) > 0.01 && <SetaGiro y={0.08} raio={0.1} cor={MARCA.coral} forca={e.setaPote ?? 0} f={f} />}
      {(e.setaTampa ?? 0) > 0.01 && <SetaGiro y={ALT + 0.02} raio={0.1} cor={COR_GIRA} forca={e.setaTampa ?? 0} f={f} />}
      {(e.setasFirma ?? 0) > 0.01 && <SetasFirmeza forca={e.setasFirma ?? 0} />}
    </Palco>
  );
};

const desenhar = (q: Quadro) => {
  const { f, p, em, F } = q;
  const vaiEVem = f * 0.16;
  if (em(0) || em(1)) return <Cena f={f} e={{ firma: 0, torce: vaiEVem, abre: 0 }} cam={{ ...CAM, pos: mixV([0.06, 0.6, 1.05], CAM.pos, em(0) ? p(0) : 1) }} />;
  if (em(2)) {
    // congela e mostra que o pote inteiro está girando
    const x = p(2);
    const para = prog(x, 0.1, 0.2);
    return (
      <>
        <Cena f={f} e={{ firma: 0, torce: mix(vaiEVem, Math.round(vaiEVem / Math.PI) * Math.PI + 1.2, para), abre: 0, setaPote: prog(x, 0.35, 0.5) }} />
        <div style={{ position: "absolute", top: 250, left: 64, opacity: para, background: MARCA.roxo, borderRadius: 999, padding: "20px 30px", display: "flex", gap: 12 }}>
          <div style={{ width: 16, height: 46, borderRadius: 6, background: "#FFFFFF" }} />
          <div style={{ width: 16, height: 46, borderRadius: 6, background: "#FFFFFF" }} />
        </div>
      </>
    );
  }
  if (em(3))
    return (
      <>
        <Cena f={f} e={{ firma: prog(p(3), 0.45, 0.7), torce: 1.2, abre: 0 }} />
        <Conceito f={f} de={F[3].de + 4} ate={F[4].de - 4} texto="coordenação bilateral" />
      </>
    );
  if (em(4)) {
    const x = p(4);
    return <Cena f={f} e={{ firma: 1, torce: 1.2 + prog(x, 0.4, 1) * 9, abre: prog(x, 0.55, 1), setasFirma: prog(x, 0.05, 0.2) * (1 - prog(x, 0.85, 1)), setaTampa: prog(x, 0.4, 0.55) * (1 - prog(x, 0.8, 0.95)) }} />;
  }
  const x = em(5) ? prog(p(5), 0.3, 1, (v) => v) : 1;
  const parte = em(5) ? (p(5) < 0.3 ? -1 : Math.min(2, Math.floor(x * 3))) : 2;
  return (
    <>
      <Cena f={f} e={{ firma: parte === -1 ? 0 : 1, torce: parte === 2 ? vaiEVem : 1.2, abre: 0, setasFirma: parte === 0 ? 1 : 0, setaTampa: parte === 2 ? 1 : 0 }} />
      {em(5) && <Etapas itens={ETAPAS} aceso={parte} emColuna topo={232} opacidade={prog(p(5), 0.2, 0.3)} />}
    </>
  );
};

export const { Componente: ExplicaMentePote, TOTAL } = criarEpisodio({ textos: TEXTOS, tempos, registro: REGISTRO, desenhar });


