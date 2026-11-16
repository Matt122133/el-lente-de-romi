"use server";

// Acciones de la sección Portfolio del panel (contracts/panel-portfolio.md de
// specs/005-portadas-y-fotos-del-sitio). Todas exigen sesión; solo mueven ids de fotos que
// ya están en R2, nunca bytes de imagen (principio III).

import { revalidatePath } from "next/cache";
import type postgres from "postgres";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { exigirSesion } from "@/lib/exigirSesion";
import { MAXIMO_RECIENTES } from "@/lib/recientes";

const ID = /^[0-9a-f]{32}$/;
const SLUG = /^[a-z]+$/;

// La categoría existe y la foto es una de sus fotos listas (FR-004).
async function fotoDeCategoria(categoria: string, id: string): Promise<string> {
  await exigirSesion();
  if (!SLUG.test(categoria) || !ID.test(id)) throw new Error("Foto inválida");
  const destino = `portfolio/${categoria}`;
  const [fila] = await db()`
    SELECT 1 FROM fotos f JOIN categorias c ON c.slug = ${categoria}
    WHERE f.destino = ${destino} AND f.id = ${id} AND f.estado = 'lista'`;
  if (!fila) throw new Error("La foto no es de esa categoría");
  return destino;
}

// Las páginas públicas se arman en cada pedido; esto refresca lo que el navegador ya tenga.
function refrescar(categoria?: string) {
  revalidatePath("/panel/portfolio", "layout");
  revalidatePath("/");
  revalidatePath("/portfolio");
  if (categoria) revalidatePath(`/portfolio/${categoria}`);
}

export async function elegirPortada(categoria: string, id: string): Promise<void> {
  await fotoDeCategoria(categoria, id);
  await db()`UPDATE categorias SET portada = ${id} WHERE slug = ${categoria}`;
  refrescar(categoria);
}

export async function quitarPortada(categoria: string): Promise<void> {
  await exigirSesion();
  if (!SLUG.test(categoria)) throw new Error("Categoría inválida");
  await db()`UPDATE categorias SET portada = NULL WHERE slug = ${categoria}`;
  refrescar(categoria);
}

type Tx = postgres.TransactionSql;

// Borra las marcas cuya foto ya no está y deja las posiciones 0, 1, 2… sin huecos.
async function compactar(tx: Tx): Promise<void> {
  await tx`
    DELETE FROM recientes r WHERE NOT EXISTS (
      SELECT 1 FROM fotos f WHERE f.destino = r.destino AND f.id = r.id AND f.estado = 'lista')`;
  await tx`
    UPDATE recientes r SET posicion = o.nueva
    FROM (SELECT destino, id, row_number() OVER (ORDER BY posicion) - 1 AS nueva FROM recientes) o
    WHERE r.destino = o.destino AND r.id = o.id`;
}

export async function alternarReciente(categoria: string, id: string): Promise<void> {
  const destino = await fotoDeCategoria(categoria, id);
  const lleno = await db().begin(async (tx) => {
    await tx`LOCK TABLE recientes IN EXCLUSIVE MODE`;
    await compactar(tx);
    const quitada = await tx`DELETE FROM recientes WHERE destino = ${destino} AND id = ${id}`;
    if (quitada.count === 0) {
      const [{ n }] = await tx<{ n: number }[]>`SELECT count(*)::int AS n FROM recientes`;
      if (n >= MAXIMO_RECIENTES) return true;
      await tx`INSERT INTO recientes (destino, id, posicion) VALUES (${destino}, ${id}, ${n})`;
    }
    await compactar(tx);
    return false;
  });
  refrescar(categoria);
  // El aviso lo muestra la página de la categoría (FR-006: hasta 12).
  if (lleno) redirect(`/panel/portfolio/${categoria}?aviso=maximo`);
}

export async function moverReciente(destino: string, id: string, hacia: "arriba" | "abajo"): Promise<void> {
  await exigirSesion();
  if (!ID.test(id)) throw new Error("Foto inválida");
  await db().begin(async (tx) => {
    await tx`LOCK TABLE recientes IN EXCLUSIVE MODE`;
    await compactar(tx);
    const [actual] = await tx<{ posicion: number }[]>`
      SELECT posicion FROM recientes WHERE destino = ${destino} AND id = ${id}`;
    if (!actual) return;
    const otra = actual.posicion + (hacia === "arriba" ? -1 : 1);
    // Intercambia con la vecina; en el borde no hay vecina y no cambia nada.
    await tx`
      UPDATE recientes SET posicion = CASE WHEN posicion = ${otra}::int THEN ${actual.posicion}::int ELSE ${otra}::int END
      WHERE posicion IN (${actual.posicion}::int, ${otra}::int)
        AND EXISTS (SELECT 1 FROM recientes WHERE posicion = ${otra}::int)`;
  });
  refrescar();
}

export async function quitarReciente(destino: string, id: string): Promise<void> {
  await exigirSesion();
  if (!ID.test(id)) throw new Error("Foto inválida");
  await db().begin(async (tx) => {
    await tx`LOCK TABLE recientes IN EXCLUSIVE MODE`;
    await tx`DELETE FROM recientes WHERE destino = ${destino} AND id = ${id}`;
    await compactar(tx);
  });
  refrescar();
}
