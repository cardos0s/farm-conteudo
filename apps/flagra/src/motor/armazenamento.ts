import type { Post } from "./tipos";

// Posts criados no aparelho ficam no IndexedDB (a mídia como Blob), então sobrevivem a um recarregar.
// Num app real, o arquivo iria para um storage (S3, R2...) e o post para o banco.

type Salvo = Omit<Post, "midia"> & { arquivo: Blob; tipoMidia: "foto" | "video" };

const abrir = () =>
  new Promise<IDBDatabase>((ok, erro) => {
    const r = indexedDB.open("flagra-v2", 1);
    r.onupgradeneeded = () => r.result.createObjectStore("posts", { keyPath: "id" });
    r.onsuccess = () => ok(r.result);
    r.onerror = () => erro(r.error);
  });

const paraPost = ({ arquivo, tipoMidia, ...resto }: Salvo): Post => ({ ...resto, midia: { tipo: tipoMidia, url: URL.createObjectURL(arquivo) } });

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

export async function salvarMeu(post: Omit<Post, "midia">, arquivo: File): Promise<Post> {
  const salvo: Salvo = { ...post, arquivo, tipoMidia: arquivo.type.startsWith("video") ? "video" : "foto" };
  try {
    const db = await abrir();
    await new Promise<void>((ok, erro) => {
      const t = db.transaction("posts", "readwrite");
      t.objectStore("posts").put(salvo);
      t.oncomplete = () => ok();
      t.onerror = () => erro(t.error);
    });
  } catch {
    // Sem IndexedDB (aba anônima, por exemplo): o post vale até recarregar.
  }
  return paraPost(salvo);
}

export async function apagarMeus() {
  try {
    const db = await abrir();
    await new Promise<void>((ok) => {
      const t = db.transaction("posts", "readwrite");
      t.objectStore("posts").clear();
      t.oncomplete = () => ok();
    });
  } catch {
    /* nada a apagar */
  }
}
