import path from "node:path";
import { executar } from "./comum";
import { carregarPersona } from "../ugc/persona";
import { existe } from "../ugc/midia";
import { gerarImagem } from "../ugc/provedores";

// Gera as folhas de personagem que ainda não existem, a partir da aparência em personas/<id>/persona.json.
// A primeira folha vira referência das outras, para o rosto não mudar.
// Uso: npm run persona exemplo

const FOLHAS = [
  "Folha de personagem (character sheet) fotorrealista sobre fundo cinza-claro liso: a mesma pessoa vista de frente, de três quartos e de perfil, do ombro para cima, mais um corpo inteiro de frente. Luz de estúdio suave e uniforme.",
  "Folha de expressões fotorrealista sobre fundo cinza-claro liso: a mesma pessoa em 6 quadros, do ombro para cima, falando, sorrindo, surpresa, pensativa, explicando com a mão e rindo. Mesma roupa e cabelo em todos.",
  "Três fotos verticais lado a lado da mesma pessoa gravando vídeo com o celular em casa: selfie segurando o celular, sentada à mesa com o celular apoiado, e andando pela sala. Fotorrealista, luz natural.",
];

await executar("folha de personagem", async () => {
  const id = process.argv[2];
  if (!id) throw new Error("Uso: npm run persona <id>");
  const persona = await carregarPersona(id);
  const feitas: string[] = [];
  for (const [i, arquivo] of persona.folha.entries()) {
    if (await existe(arquivo)) {
      feitas.push(arquivo);
      continue;
    }
    const pedido = FOLHAS[i % FOLHAS.length];
    const prompt = `${pedido}\nA pessoa é uma personagem fictícia, que não se parece com ninguém famoso: ${persona.aparencia}.\nSem texto, rótulos ou marca d'água.`;
    console.log(`Gerando ${path.basename(arquivo)}...`);
    await gerarImagem(prompt, feitas.slice(0, 1), arquivo);
    feitas.push(arquivo);
  }
  console.log(`Folhas prontas em ${persona.pasta}. Confira se o rosto ficou igual em todas antes de usar.`);
});
