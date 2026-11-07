// La cola de fotos del worker vive en la tabla fotos (research R5 de specs/004-panel-de-romi):
// subida → procesando → lista o error. Sin efectos al importarlo.

import type postgres from "postgres";

type Sql = postgres.Sql;

export type Trabajo = { destino: string; id: string; ruta: string };

// Si un worker murió a mitad de una foto, después de 10 minutos vuelve a la cola.
export async function liberarColgadas(sql: Sql): Promise<number> {
  const r = await sql`
    UPDATE fotos SET estado = 'subida', cambiada = now()
    WHERE estado = 'procesando' AND cambiada < now() - interval '10 minutes'`;
  return r.count;
}

// SKIP LOCKED: dos workers (o dos vueltas) nunca toman la misma foto.
export async function tomarSiguiente(sql: Sql): Promise<Trabajo | null> {
  const [t] = await sql<Trabajo[]>`
    UPDATE fotos SET estado = 'procesando', cambiada = now()
    WHERE (destino, id) = (
      SELECT destino, id FROM fotos
      WHERE estado = 'subida'
      ORDER BY cambiada
      LIMIT 1
      FOR UPDATE SKIP LOCKED
    )
    RETURNING destino, id, ruta`;
  return t ?? null;
}

export async function marcarLista(
  sql: Sql,
  t: Trabajo,
  datos: { width: number; height: number; thumbhash: string },
): Promise<void> {
  await sql`
    UPDATE fotos
    SET estado = 'lista', width = ${datos.width}, height = ${datos.height},
        thumbhash = ${datos.thumbhash}, error = NULL, cambiada = now()
    WHERE destino = ${t.destino} AND id = ${t.id}`;
}

export async function marcarError(sql: Sql, t: Trabajo, mensaje: string): Promise<void> {
  await sql`
    UPDATE fotos SET estado = 'error', error = ${mensaje.slice(0, 500)}, cambiada = now()
    WHERE destino = ${t.destino} AND id = ${t.id}`;
}
