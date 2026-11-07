// Galerías de entrega, desde la base (specs/003-base-de-datos-railway). Hasta el panel de
// Romi (004) solo existen las de ejemplo que carga `npm run db:sembrar`. Solo se importa
// desde código de servidor.

import { connection } from "next/server";
import { verificarClave } from "@/lib/claves";
import { db } from "@/lib/db";

export type Galeria = {
  slug: string;
  titulo: string;
  fecha: string; // día del evento, AAAA-MM-DD
  venceEl: string; // duran un mes (sección 12 del doc), AAAA-MM-DD
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
           to_char(vence_el, 'YYYY-MM-DD') AS "venceEl"
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
