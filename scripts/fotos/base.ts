// Lo que el script de fotos escribe en la base (specs/003-base-de-datos-railway). Sin
// efectos al importarlo: lo usan procesar.ts y scripts/db/probar.ts.

import type postgres from "postgres";
import { esGaleria, type Foto } from "../../src/lib/fotos.ts";

type Sql = postgres.Sql;

export type FilaFoto = Foto & { destino: string; thumbhash: string };

// Las fotos del lote, en el orden en que se procesaron. En la base solo entran fotos reales:
// una sin thumbhash es un error del pipeline, no una foto de mentira.
export function filasDeFotos(destino: string, fotos: Foto[]): FilaFoto[] {
  return fotos.map((f, posicion) => {
    if (!f.thumbhash) throw new Error(`La foto ${f.id} no tiene thumbhash`);
    return { ...f, destino, thumbhash: f.thumbhash, posicion };
  });
}

// La categoría o la galería tiene que existir antes de subir nada (FR-015).
export async function destinoExiste(sql: Sql, destino: string): Promise<boolean> {
  const [, slug] = destino.split("/");
  const filas = esGaleria(destino)
    ? await sql`SELECT 1 FROM galerias WHERE slug = ${slug}`
    : await sql`SELECT 1 FROM categorias WHERE slug = ${slug}`;
  return filas.length > 0;
}

// El destino queda con las fotos de este lote y nada más, en un solo paso: nadie lo ve a
// medio escribir (FR-003), y correrlo dos veces deja lo mismo (FR-004).
export async function reemplazarFotos(sql: Sql, destino: string, fotos: Foto[]): Promise<number> {
  const filas = filasDeFotos(destino, fotos);
  await sql.begin(async (tx) => {
    await tx`DELETE FROM fotos WHERE destino = ${destino}`;
    if (filas.length) {
      await tx`
        INSERT INTO fotos ${tx(filas, "destino", "id", "ruta", "width", "height", "thumbhash", "alt", "posicion")}`;
    }
  });
  return filas.length;
}
