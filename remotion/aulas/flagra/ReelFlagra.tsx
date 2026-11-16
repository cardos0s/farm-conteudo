import React from "react";
import { AbsoluteFill, Audio, getStaticFiles, OffthreadVideo, Sequence, staticFile } from "remotion";
import "../../lousa/fontes";
import { Ret } from "../../lousa/Esboco";
import { FONTE_LOUSA } from "../../lousa/fontes";
import { Lousa } from "../../lousa/Lousa";
import { cor } from "../../lousa/paleta";
import { Texto } from "../../lousa/Texto";
import { useT } from "../../lousa/tempo";
import { Coracao } from "../systemdesign/cenas/Comeco";
import { ReelSystemDesign } from "../systemdesign/Reel";
import { T as T_SD, TELA } from "../systemdesign/roteiro";
import { FALAS } from "./narracao";

// Reel completo do Flagra (1080x1920): trecho do trailer com a pergunta, o system design no canvas
// e a demo do app gravada da tela, com um fecho.
//
// O trecho do trailer não vem com o projeto: coloque o seu em public/flagra/trailer.mp4 (vertical,
// alguns segundos). Sem o arquivo, aparece um quadro indicando onde ele entra.

export const FPS = 30;
const s = (seg: number) => Math.round(seg * FPS);

export const PARTES = {
  trailer: 6,
  explicacao: T_SD.fim, // a explicação até a visão geral (o fecho próprio dela fica de fora)
  app: 58.4, // duração de public/flagra/demo.mp4 (gerado por scripts/flagra/gravar-demo.cjs)
  fecho: 5,
};

const INICIO = {
  trailer: 0,
  explicacao: PARTES.trailer,
  app: PARTES.trailer + PARTES.explicacao,
  fecho: PARTES.trailer + PARTES.explicacao + PARTES.app,
};

export const TOTAL_QUADROS = s(INICIO.fecho + PARTES.fecho);

const VISTA_FIXA = { tx: 0, ty: 0, z: 1 };

function Trailer() {
  const temClipe = getStaticFiles().some((f) => f.name === "flagra/trailer.mp4");
  const t = useT();
  const aparece = Math.min(1, Math.max(0, (t - 1.2) / 0.5));
  return (
    <AbsoluteFill style={{ background: "#111" }}>
      {temClipe ? (
        <OffthreadVideo src={staticFile("flagra/trailer.mp4")} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", background: "#1d1d1f" }}>
          <div
            style={{
              width: 820,
              height: 1300,
              border: "6px dashed #555",
              borderRadius: 40,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              color: "#8a8a8a",
              fontFamily: FONTE_LOUSA,
              fontSize: 48,
              lineHeight: 1.3,
              padding: 60,
            }}
          >
            trecho do trailer aqui
            <br />
            public/flagra/trailer.mp4
          </div>
        </AbsoluteFill>
      )}
      <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 300, opacity: aparece }}>
        <div
          style={{
            fontFamily: FONTE_LOUSA,
            fontSize: 76,
            lineHeight: 1.2,
            color: "#fff",
            textAlign: "center",
            padding: "28px 44px",
            background: "rgba(0,0,0,0.55)",
            borderRadius: 24,
            transform: `translateY(${(1 - aparece) * 30}px)`,
          }}
        >
          E se esse feed do GTA 6
          <br />
          fosse um <span style={{ color: "#ff8fb8" }}>app de verdade?</span>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

/** A demo gravada do app dentro de um celular, no mesmo canvas pontilhado da explicação. */
function App() {
  const W = 700;
  const H = Math.round((W * 1688) / 780);
  const x = (TELA.w - W) / 2;
  const y = 250;
  return (
    <AbsoluteFill>
      <Lousa vista={VISTA_FIXA} tela={TELA}>
        <Texto x={540} y={150} tam={76} ancora="middle" de={0.1} dur={0.6}>
          {"agora, o *{app}"}
        </Texto>
        <Ret x={x - 26} y={y - 26} w={W + 52} h={H + 52} cor={cor.tinta} espessura={4} de={0.2} dur={0.6} />
      </Lousa>
      <div
        style={{
          position: "absolute",
          left: x - 14,
          top: y - 14,
          width: W + 28,
          height: H + 28,
          borderRadius: 64,
          background: "#141414",
          boxShadow: "0 30px 60px rgba(30,30,25,0.25)",
          padding: 14,
        }}
      >
        <div style={{ width: W, height: H, borderRadius: 52, overflow: "hidden", background: "#fff" }}>
          <OffthreadVideo src={staticFile("flagra/demo.mp4")} muted style={{ width: W, height: H, display: "block" }} />
        </div>
      </div>
    </AbsoluteFill>
  );
}

function Fecho() {
  return (
    <AbsoluteFill>
      <Lousa vista={VISTA_FIXA} tela={TELA}>
        <Texto x={540} y={760} tam={84} ancora="middle" de={0.3} dur={0.7}>
          é isso que roda
        </Texto>
        <Texto x={540} y={870} tam={84} ancora="middle" cor={cor.rosa} de={0.9} dur={0.7}>
          quando você curte
        </Texto>
        <Coracao cx={540} cy={1100} s={90} de={1.6} />
        <Texto x={540} y={1340} tam={44} ancora="middle" cor={cor.cinza} de={2.3}>
          Flagra · app de demonstração
        </Texto>
      </Lousa>
    </AbsoluteFill>
  );
}

/** Falas geradas pela ElevenLabs (scripts/flagra/narrar.mjs); as que ainda não existem ficam de fora. */
function Narracao() {
  const arquivos = new Set(getStaticFiles().map((f) => f.name));
  return (
    <>
      {FALAS.filter((f) => arquivos.has(`flagra/narracao/${f.id}.mp3`)).map((f) => (
        <Sequence key={f.id} from={s(f.em)} layout="none">
          <Audio src={staticFile(`flagra/narracao/${f.id}.mp3`)} />
        </Sequence>
      ))}
    </>
  );
}

export function ReelFlagra() {
  return (
    <AbsoluteFill style={{ background: "#fdfdfc" }}>
      <Narracao />
      <Sequence from={s(INICIO.trailer)} durationInFrames={s(PARTES.trailer)}>
        <Trailer />
      </Sequence>
      <Sequence from={s(INICIO.explicacao)} durationInFrames={s(PARTES.explicacao)}>
        <ReelSystemDesign />
      </Sequence>
      <Sequence from={s(INICIO.app)} durationInFrames={s(PARTES.app)}>
        <App />
      </Sequence>
      <Sequence from={s(INICIO.fecho)} durationInFrames={s(PARTES.fecho)}>
        <Fecho />
      </Sequence>
    </AbsoluteFill>
  );
}
