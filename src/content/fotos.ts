// Fotos de una categoría o galería. Por ahora salen del manifiesto que deja el script de
// subida (scripts/fotos/) en manifiestos/, que no está en git porque lleva slugs de
// clientes; en la feature 003 esto pasa a ser una consulta a la base de datos.
// Usa node:fs: solo se importa desde código de servidor.

import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Foto, Manifiesto } from "@/lib/fotos";

export function getFotos(destino: string, respaldo: () => Foto[]): Foto[] {
  let texto: string;
  try {
    texto = readFileSync(join(process.cwd(), "manifiestos", `${destino}.json`), "utf8");
  } catch {
    // Sin manifiesto, las fotos de mentira de siempre.
    return respaldo();
  }
  const manifiesto = JSON.parse(texto) as Manifiesto;
  return [...manifiesto.fotos].sort((a, b) => a.posicion - b.posicion);
}
