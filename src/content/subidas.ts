// Fotos que Romi sube desde el panel (research R3–R5 de specs/004-panel-de-romi): la fila
// nace en "subiendo", pasa a "subida" cuando el original está entero en R2 y el worker la deja
// "lista" o con "error". Solo se importa desde acciones con sesión.

import { db } from "@/lib/db";
import { ordenNatural } from "@/lib/orden";

export type EstadoFoto = "subiendo" | "subida" | "procesando" | "lista" | "error";

export async function estadosDe(destino: string, ids: string[]): Promise<Map<string, EstadoFoto>> {
  if (ids.length === 0) return new Map();
  const filas = await db()<{ id: string; estado: EstadoFoto }[]>`
    SELECT id, estado FROM fotos WHERE destino = ${destino} AND id IN ${db()(ids)}`;
  return new Map(filas.map((f) => [f.id, f.estado]));
}

// Una foto nueva o una subida que se había cortado vuelve a empezar como "subiendo".
export async function registrarSubiendo(destino: string, fotos: Array<{ id: string; nombre: string }>) {
  if (fotos.length === 0) return;
  const filas = fotos.map((f) => ({
    destino,
    id: f.id,
    ruta: `${destino}/${f.id}`,
    nombre: f.nombre,
    estado: "subiendo",
    posicion: 0,
  }));
  await db()`
    INSERT INTO fotos ${db()(filas, "destino", "id", "ruta", "nombre", "estado", "posicion")}
    ON CONFLICT (destino, id) DO UPDATE
      SET estado = 'subiendo', nombre = EXCLUDED.nombre, error = NULL, cambiada = now()`;
}

// Orden natural del nombre de archivo, como el script (research R4). Las fotos sin nombre
// (subidas con el script) quedan primero, en el orden que ya tenían.
export async function reordenar(destino: string): Promise<void> {
  await db().begin(async (tx) => {
    const filas = await tx<{ id: string; nombre: string | null; posicion: number }[]>`
      SELECT id, nombre, posicion FROM fotos WHERE destino = ${destino} FOR UPDATE`;
    const ordenadas = [...filas].sort((a, b) => {
      if (a.nombre === null || b.nombre === null) {
        return a.nombre === b.nombre ? a.posicion - b.posicion : a.nombre === null ? -1 : 1;
      }
      return ordenNatural(a.nombre, b.nombre);
    });
    const cambios = ordenadas.map((f, posicion) => [f.id, posicion] as const);
    if (cambios.length) {
      await tx`
        UPDATE fotos SET posicion = c.posicion::int
        FROM (VALUES ${tx(cambios)}) AS c (id, posicion)
        WHERE fotos.destino = ${destino} AND fotos.id = c.id`;
    }
  });
}

export async function marcarSubida(destino: string, id: string): Promise<void> {
  await db()`
    UPDATE fotos SET estado = 'subida', cambiada = now()
    WHERE destino = ${destino} AND id = ${id} AND estado = 'subiendo'`;
}

export async function reintentarFoto(destino: string, id: string): Promise<void> {
  await db()`
    UPDATE fotos SET estado = 'subida', error = NULL, cambiada = now()
    WHERE destino = ${destino} AND id = ${id} AND estado = 'error'`;
}

export type Avance = {
  listas: number;
  pendientes: number;
  errores: Array<{ id: string; nombre: string | null; error: string | null }>;
};

export async function avanceDe(destino: string): Promise<Avance> {
  const [conteo] = await db()<{ listas: number; pendientes: number }[]>`
    SELECT count(*) FILTER (WHERE estado = 'lista')::int AS listas,
           count(*) FILTER (WHERE estado IN ('subiendo', 'subida', 'procesando'))::int AS pendientes
    FROM fotos WHERE destino = ${destino}`;
  const errores = await db()<Avance["errores"]>`
    SELECT id, nombre, error FROM fotos WHERE destino = ${destino} AND estado = 'error' ORDER BY nombre`;
  return { ...conteo, errores: [...errores] };
}

// Despierta al worker por la red privada (research R5). Si no responde, las fotos quedan en
// "subida" y las toma la próxima vez que arranque o lo despierten.
export async function despertarWorker(): Promise<void> {
  const url = process.env.WORKER_URL;
  if (!url) return;
  try {
    await fetch(`${url}/procesar`, {
      method: "POST",
      headers: { authorization: `Bearer ${process.env.WORKER_SECRETO ?? ""}` },
      signal: AbortSignal.timeout(3000),
    });
  } catch {
    // Dormido o arrancando: Railway lo levanta con este mismo pedido.
  }
}
