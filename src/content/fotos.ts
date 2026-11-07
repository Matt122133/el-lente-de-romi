// Fotos de una categoría o galería, desde la base (specs/003-base-de-datos-railway). Las
// escribe el script de subida (scripts/fotos/) con --subir. Solo se importa desde código de
// servidor.

import { connection } from "next/server";
import { db } from "@/lib/db";
import type { Foto } from "@/lib/fotos";
import { pendiente } from "./subidas";

export async function getFotos(destino: string, respaldo: () => Foto[]): Promise<Foto[]> {
  // Se arma en cada pedido: el build no tiene acceso a la base, y lo que se sube se ve al
  // instante (research R3).
  await connection();
  const fotos = await db()<Foto[]>`
    SELECT id, ruta, width, height, thumbhash, alt, posicion
    FROM fotos
    WHERE destino = ${destino} AND estado = 'lista'
    ORDER BY posicion`;
  // Sin fotos, las de mentira de siempre.
  return fotos.length ? [...fotos] : respaldo();
}

// Fotos subidas desde el panel que el worker todavía no terminó (specs/004-panel-de-romi).
export async function fotosPendientes(destino: string): Promise<number> {
  await connection();
  const [{ n }] = await db()<{ n: number }[]>`
    SELECT count(*)::int AS n FROM fotos
    WHERE destino = ${destino} AND ${pendiente()}`;
  return n;
}
