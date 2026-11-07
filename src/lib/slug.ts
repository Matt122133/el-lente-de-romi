// Slug de una galería a partir de su título (research R6 de specs/004-panel-de-romi). El
// sufijo aleatorio lo hace imposible de adivinar (principio VI) y separa títulos repetidos.
// Sin imports del sitio: lo prueba Node sin bundler.

import { randomInt } from "node:crypto";

const LARGO_BASE = 40;
const LARGO_SUFIJO = 6;
const ALFABETO = "abcdefghijklmnopqrstuvwxyz0123456789";

export function sufijoAleatorio(): string {
  return Array.from({ length: LARGO_SUFIJO }, () => ALFABETO[randomInt(ALFABETO.length)]).join("");
}

// "Boda Ñandú & Co." → "boda-nandu-co-k3x9qa". Un título sin letras ni números queda solo
// con el sufijo.
export function slugDeTitulo(titulo: string, sufijo: string): string {
  const base = titulo
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .slice(0, LARGO_BASE)
    .replace(/^-+|-+$/g, "");
  return base ? `${base}-${sufijo}` : sufijo;
}
