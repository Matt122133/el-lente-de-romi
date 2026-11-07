// Fotos de una categoría o galería, desde la base (specs/003-base-de-datos-railway). Las
// escribe el script de subida (scripts/fotos/) con --subir. Solo se importa desde código de
// servidor.

import { connection } from "next/server";
import { db } from "@/lib/db";
import type { Foto } from "@/lib/fotos";

export async function getFotos(destino: string, respaldo: () => Foto[]): Promise<Foto[]> {
  // Se arma en cada pedido: el build no tiene acceso a la base, y lo que se sube se ve al
  // instante (research R3).
  await connection();
  const fotos = await db()<Foto[]>`
    SELECT id, ruta, width, height, thumbhash, alt, posicion
    FROM fotos
    WHERE destino = ${destino}
    ORDER BY posicion`;
  // Sin fotos, las de mentira de siempre.
  return fotos.length ? [...fotos] : respaldo();
}
