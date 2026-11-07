"use client";

// Subida de fotos desde el navegador (US2 de specs/004-panel-de-romi). Romi suelta la carpeta
// o elige las fotos; cada JPEG sube por partes directo al bucket privado de R2 con URLs
// firmadas (principio III) y el worker lo procesa. Si se corta, volver a soltar la carpeta
// sube solo lo que faltaba.

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { idDeFoto } from "@/lib/idFoto";
import { ordenNatural } from "@/lib/orden";
import {
  abandonarSubida,
  avance,
  empezarSubida,
  reintentar,
  terminarSubida,
  type SubidaNueva,
} from "./acciones";
import type { Avance } from "@/content/subidas";

const TAMANO_PARTE = 8 * 1024 * 1024; // el mismo que src/lib/r2.ts
const TANDA = 20;
const EN_PARALELO = 4;
const REINTENTOS_PARTE = 3;

type Progreso = { total: number; hechas: number; ya: number; salteadas: string[]; fallidas: string[] };

const esJpeg = (f: File) => /\.jpe?g$/i.test(f.name) || f.type === "image/jpeg";

// Una carpeta soltada llega como entradas de directorio: se recorren enteras.
async function archivosDe(items: DataTransferItemList): Promise<File[]> {
  const leerEntrada = async (entrada: FileSystemEntry): Promise<File[]> => {
    if (entrada.isFile) {
      return [await new Promise<File>((ok, mal) => (entrada as FileSystemFileEntry).file(ok, mal))];
    }
    const lector = (entrada as FileSystemDirectoryEntry).createReader();
    const hijos: FileSystemEntry[] = [];
    for (;;) {
      const tanda = await new Promise<FileSystemEntry[]>((ok, mal) => lector.readEntries(ok, mal));
      if (tanda.length === 0) break;
      hijos.push(...tanda);
    }
    return (await Promise.all(hijos.map(leerEntrada))).flat();
  };
  const entradas = Array.from(items)
    .map((i) => i.webkitGetAsEntry())
    .filter((e): e is FileSystemEntry => e !== null);
  return (await Promise.all(entradas.map(leerEntrada))).flat();
}

async function subirParte(url: string, cuerpo: Blob): Promise<string> {
  for (let intento = 1; ; intento++) {
    try {
      const r = await fetch(url, { method: "PUT", body: cuerpo });
      const etag = r.headers.get("etag");
      if (r.ok && etag) return etag;
      throw new Error(`R2 respondió ${r.status}${etag ? "" : " sin ETag (revisar CORS)"}`);
    } catch (e) {
      if (intento >= REINTENTOS_PARTE) throw e;
      await new Promise((ok) => setTimeout(ok, 1000 * intento));
    }
  }
}

async function subirFoto(slug: string, archivo: File, nueva: SubidaNueva): Promise<void> {
  const partes = [];
  for (const [i, url] of nueva.partes.entries()) {
    const cuerpo = archivo.slice(i * TAMANO_PARTE, (i + 1) * TAMANO_PARTE);
    partes.push({ numero: i + 1, etag: await subirParte(url, cuerpo) });
  }
  await terminarSubida(slug, nueva.id, nueva.uploadId, partes);
}

async function enParalelo<T>(items: T[], tarea: (item: T) => Promise<void>): Promise<void> {
  const cola = [...items];
  await Promise.all(
    Array.from({ length: EN_PARALELO }, async () => {
      for (let item = cola.shift(); item !== undefined; item = cola.shift()) await tarea(item);
    }),
  );
}

export function Subida({ slug, avanceInicial }: { slug: string; avanceInicial: Avance }) {
  const router = useRouter();
  const [progreso, setProgreso] = useState<Progreso | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [estado, setEstado] = useState<Avance>(avanceInicial);
  const [encima, setEncima] = useState(false);
  const entrada = useRef<HTMLInputElement>(null);

  // Mientras el worker tenga fotos de esta galería, se consulta el avance cada 3 segundos.
  useEffect(() => {
    if (subiendo || estado.pendientes === 0) return;
    const t = setTimeout(async () => {
      const nuevo = await avance(slug);
      setEstado(nuevo);
      if (nuevo.pendientes === 0) router.refresh();
    }, 3000);
    return () => clearTimeout(t);
  }, [slug, estado, subiendo, router]);

  async function subir(todos: File[]) {
    const salteadas = todos.filter((f) => !esJpeg(f)).map((f) => f.name);
    const jpegs = todos.filter(esJpeg).sort((a, b) => ordenNatural(a.name, b.name));
    const p: Progreso = { total: jpegs.length, hechas: 0, ya: 0, salteadas, fallidas: [] };
    const avisar = () => setProgreso({ ...p });
    setSubiendo(true);
    avisar();

    for (let i = 0; i < jpegs.length; i += TANDA) {
      const tanda = jpegs.slice(i, i + TANDA);
      const conId = [];
      for (const archivo of tanda) {
        conId.push({ archivo, id: await idDeFoto(await archivo.arrayBuffer()) });
      }
      const { ya, nuevas } = await empezarSubida(
        slug,
        conId.map(({ archivo, id }) => ({ id, nombre: archivo.name, tamano: archivo.size })),
      );
      p.ya += ya.length;
      p.hechas += ya.length;
      avisar();

      const porId = new Map(conId.map((c) => [c.id, c.archivo]));
      await enParalelo(nuevas, async (nueva) => {
        const archivo = porId.get(nueva.id)!;
        try {
          await subirFoto(slug, archivo, nueva);
        } catch (e) {
          console.error(`${archivo.name}:`, e);
          p.fallidas.push(archivo.name);
          await abandonarSubida(slug, nueva.id, nueva.uploadId).catch(() => {});
        }
        p.hechas++;
        avisar();
      });
    }

    setSubiendo(false);
    setEstado(await avance(slug));
  }

  return (
    <section className="panel-seccion">
      <h2 className="seccion-titulo">Fotos</h2>
      <div
        className={`panel-soltar${encima ? " panel-soltar-encima" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setEncima(true);
        }}
        onDragLeave={() => setEncima(false)}
        onDrop={async (e) => {
          e.preventDefault();
          setEncima(false);
          if (!subiendo) await subir(await archivosDe(e.dataTransfer.items));
        }}
      >
        <p>Soltá acá la carpeta con las fotos de la galería</p>
        <button
          type="button"
          className="boton"
          disabled={subiendo}
          onClick={() => entrada.current?.click()}
        >
          O elegí las fotos
        </button>
        <input
          ref={entrada}
          type="file"
          accept="image/jpeg"
          multiple
          hidden
          onChange={async (e) => {
            const archivos = Array.from(e.target.files ?? []);
            e.target.value = "";
            if (archivos.length) await subir(archivos);
          }}
        />
      </div>

      {progreso && (
        <div className="panel-progreso" role="status">
          <p>
            {subiendo ? "Subiendo" : "Subida terminada"}: {progreso.hechas} de {progreso.total}
            {progreso.ya > 0 && ` (${progreso.ya} ya estaban)`}
          </p>
          <progress max={progreso.total || 1} value={progreso.hechas} />
          {progreso.salteadas.length > 0 && (
            <p className="texto-suave">
              Se saltearon {progreso.salteadas.length} archivos que no son JPEG.
            </p>
          )}
          {progreso.fallidas.length > 0 && (
            <p className="form-error">
              No se pudieron subir {progreso.fallidas.length}: {progreso.fallidas.join(", ")}. Volvé a
              soltar la carpeta para reintentar.
            </p>
          )}
        </div>
      )}

      <p className="texto-suave">
        {estado.listas} fotos listas
        {estado.pendientes > 0 && ` · ${estado.pendientes} procesando`}
      </p>
      {estado.errores.length > 0 && (
        <ul className="panel-errores">
          {estado.errores.map((f) => (
            <li key={f.id}>
              <span>
                {f.nombre ?? f.id}: {f.error ?? "error"}
              </span>
              <button
                type="button"
                className="panel-enlace"
                onClick={async () => {
                  await reintentar(slug, f.id);
                  setEstado(await avance(slug));
                }}
              >
                Reintentar
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
