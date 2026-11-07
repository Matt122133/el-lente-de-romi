// Galerías de entrega, desde la base (specs/003-base-de-datos-railway). Hasta el panel de
// Romi (004) solo existen las de ejemplo que carga `npm run db:sembrar`. Solo se importa
// desde código de servidor.

import { connection } from "next/server";
import { hashearClave, verificarClave } from "@/lib/claves";
import { db } from "@/lib/db";
import { PREFIJO } from "@/lib/imagenes";
import { borrarPrefijo, buckets } from "@/lib/r2";
import { slugDeTitulo, sufijoAleatorio } from "@/lib/slug";

export type Galeria = {
  slug: string;
  titulo: string;
  fecha: string; // día del evento, AAAA-MM-DD
  venceEl: string; // duran un mes (sección 12 del doc), AAAA-MM-DD
  claveVersion: number; // sube al cambiar la clave: invalida las cookies de acceso
  // La contraseña no viaja con la galería: se compara con claveCorrecta. El .zip con todas
  // las fotos no pasa por el sitio: Romi se lo pasa al cliente por su cuenta (sección 0 del
  // doc, 21/10/2026).
};

// Se arma en cada pedido (research R3): una galería que vence deja de mostrarse sola.
export async function getGaleria(slug: string): Promise<Galeria | undefined> {
  await connection();
  const [galeria] = await db()<Galeria[]>`
    SELECT slug, titulo,
           to_char(fecha, 'YYYY-MM-DD') AS fecha,
           to_char(vence_el, 'YYYY-MM-DD') AS "venceEl",
           clave_version AS "claveVersion"
    FROM galerias
    WHERE slug = ${slug}`;
  return galeria;
}

// Compara contra el hash guardado (scrypt, research R4); el hash nunca sale de acá.
export async function claveCorrecta(slug: string, clave: string): Promise<boolean> {
  const [fila] = await db()<{ clave_hash: string }[]>`
    SELECT clave_hash FROM galerias WHERE slug = ${slug}`;
  return fila ? verificarClave(clave, fila.clave_hash) : false;
}

export function estaVencida(galeria: Galeria, hoy = new Date()): boolean {
  // Vence al terminar el día indicado, hora de Argentina.
  return hoy > new Date(`${galeria.venceEl}T23:59:59-03:00`);
}

export function formatearFecha(fecha: string): string {
  return new Intl.DateTimeFormat("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(new Date(`${fecha}T12:00:00-03:00`));
}

// ---------- Panel de Romi (specs/004-panel-de-romi). Solo las llaman acciones con sesión. ----------

export type GaleriaEnPanel = Galeria & { fotos: number; pendientes: number; errores: number };

export async function listarGalerias(): Promise<GaleriaEnPanel[]> {
  await connection();
  return [
    ...(await db()<GaleriaEnPanel[]>`
      SELECT g.slug, g.titulo,
             to_char(g.fecha, 'YYYY-MM-DD') AS fecha,
             to_char(g.vence_el, 'YYYY-MM-DD') AS "venceEl",
             g.clave_version AS "claveVersion",
             count(f.id) FILTER (WHERE f.estado = 'lista')::int AS fotos,
             count(f.id) FILTER (WHERE f.estado IN ('subiendo', 'subida', 'procesando'))::int AS pendientes,
             count(f.id) FILTER (WHERE f.estado = 'error')::int AS errores
      FROM galerias g
      LEFT JOIN fotos f ON f.destino = 'galerias/' || g.slug
      GROUP BY g.slug
      ORDER BY g.vence_el, g.creada`),
  ];
}

// El slug lleva un sufijo al azar (research R6); si justo choca, se prueba otro.
export async function crearGaleria(datos: {
  titulo: string;
  fecha: string;
  clave: string;
  venceEl: string;
}): Promise<string> {
  const hash = hashearClave(datos.clave);
  for (let intento = 0; intento < 5; intento++) {
    const slug = slugDeTitulo(datos.titulo, sufijoAleatorio());
    const filas = await db()`
      INSERT INTO galerias (slug, titulo, fecha, vence_el, clave_hash)
      VALUES (${slug}, ${datos.titulo}, ${datos.fecha}, ${datos.venceEl}, ${hash})
      ON CONFLICT (slug) DO NOTHING
      RETURNING slug`;
    if (filas.length) return slug;
  }
  throw new Error("No se pudo generar un slug libre");
}

// Una clave nueva sube clave_version: quien entró con la anterior tiene que volver a
// escribirla (FR-011).
export async function editarGaleria(
  slug: string,
  cambios: { clave?: string; venceEl?: string },
): Promise<void> {
  if (cambios.clave) {
    await db()`
      UPDATE galerias SET clave_hash = ${hashearClave(cambios.clave)}, clave_version = clave_version + 1
      WHERE slug = ${slug}`;
  }
  if (cambios.venceEl) {
    await db()`UPDATE galerias SET vence_el = ${cambios.venceEl} WHERE slug = ${slug}`;
  }
}

// Primero los archivos de los dos buckets y después la base: si se corta a mitad, la galería
// sigue en la lista y se puede borrar de nuevo (research R8, SC-004).
export async function borrarGaleria(slug: string): Promise<void> {
  const prefijo = `${PREFIJO}/galerias/${slug}/`;
  const b = buckets();
  await borrarPrefijo(b.publico, prefijo);
  await borrarPrefijo(b.originales, prefijo);
  await db().begin(async (tx) => {
    await tx`DELETE FROM fotos WHERE destino = ${`galerias/${slug}`}`;
    await tx`DELETE FROM galerias WHERE slug = ${slug}`;
  });
}
