import type { Post } from "./tipos";

// Os posts criados no aparelho ficam no IndexedDB (mídia como Blob), então sobrevivem a um recarregar.

type Salvo = Omit<Post, "midia"> & { criadoEm: number; arquivo?: Blob; tipoMidia?: "video" | "imagem" };

const abrir = () =>
  new Promise<IDBDatabase>((ok, erro) => {
    const r = indexedDB.open("flagra", 1);
    r.onupgradeneeded = () => r.result.createObjectStore("posts", { keyPath: "id" });
    r.onsuccess = () => ok(r.result);
    r.onerror = () => erro(r.error);
  });

const paraPost = (s: Salvo): Post => {
  const { arquivo, tipoMidia, criadoEm, ...resto } = s;
  return {
    ...resto,
    ha: Math.max(0, Math.round((Date.now() - criadoEm) / 60_000)),
    midia: arquivo && tipoMidia ? { url: URL.createObjectURL(arquivo), tipo: tipoMidia } : undefined,
  };
};

export async function carregarMeus(): Promise<Post[]> {
  try {
    const db = await abrir();
    const todos = await new Promise<Salvo[]>((ok, erro) => {
      const r = db.transaction("posts").objectStore("posts").getAll();
      r.onsuccess = () => ok(r.result as Salvo[]);
      r.onerror = () => erro(r.error);
    });
    return todos.sort((a, b) => b.criadoEm - a.criadoEm).map(paraPost);
  } catch {
    return [];
  }
}

export async function salvarMeu(post: Omit<Post, "midia" | "ha">, arquivo?: File): Promise<Post> {
  const salvo: Salvo = {
    ...post,
    ha: 0,
    criadoEm: Date.now(),
    arquivo,
    tipoMidia: arquivo ? (arquivo.type.startsWith("video") ? "video" : "imagem") : undefined,
  };
  try {
    const db = await abrir();
    await new Promise<void>((ok, erro) => {
      const t = db.transaction("posts", "readwrite");
      t.objectStore("posts").put(salvo);
      t.oncomplete = () => ok();
      t.onerror = () => erro(t.error);
    });
  } catch {
    // Sem IndexedDB (aba anônima, por exemplo): o post vale só até recarregar.
  }
  return paraPost(salvo);
}

export async function apagarMeus(): Promise<void> {
  const db = await abrir();
  await new Promise<void>((ok) => {
    const t = db.transaction("posts", "readwrite");
    t.objectStore("posts").clear();
    t.oncomplete = () => ok();
  });
}
