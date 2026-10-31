import { readFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { EstiloSchema, type Estilo } from "./formato";

// Personas (personagens fictícios que apresentam os vídeos) e guias de estilo ficam em pastas
// versionadas: personas/<id>/persona.json e estilos/<id>/estilo.json.

export const PersonaSchema = z.object({
  id: z.string(),
  nome: z.string(),
  /** Confirma que o rosto e a voz não são de uma pessoa real. */
  ficticia: z.literal(true),
  /** Aparência fixa, repetida em todo prompt de imagem e vídeo para manter a personagem igual. */
  aparencia: z.string(),
  personalidade: z.string(),
  /** Imagens da folha de personagem, relativas à pasta da persona. */
  folha: z.array(z.string()).min(1),
  voz: z.object({
    /** ID de uma voz da Voice Library ou criada no Voice Design do ElevenLabs. */
    vozId: z.string(),
    ajustes: z.record(z.string(), z.union([z.number(), z.boolean()])).optional(),
  }),
});

export type Persona = z.infer<typeof PersonaSchema> & { pasta: string };

export const DIR_PERSONAS = process.env.FABRICA_PERSONAS || "personas";
export const DIR_ESTILOS = process.env.FABRICA_ESTILOS || "estilos";

export async function carregarPersona(id: string): Promise<Persona> {
  const pasta = path.join(DIR_PERSONAS, id);
  const bruto = JSON.parse(await readFile(path.join(pasta, "persona.json"), "utf8"));
  const p = PersonaSchema.parse(bruto);
  return { ...p, pasta, folha: p.folha.map((f) => path.join(pasta, f)) };
}

export async function carregarEstilo(id: string): Promise<Estilo> {
  const bruto = JSON.parse(await readFile(path.join(DIR_ESTILOS, id, "estilo.json"), "utf8"));
  return EstiloSchema.parse(bruto);
}
