// Contraseñas de galería con scrypt (research R4 de specs/003-base-de-datos-railway). Solo
// usa node:crypto: lo cargan el sitio y los scripts sin bundler. El formato guarda los
// parámetros, así se pueden endurecer sin invalidar las claves ya guardadas.

import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const N = 2 ** 15;
const R = 8;
const P = 1;
const LARGO = 32;
// scrypt usa 128·N·r bytes; con N = 2^15 son 32 MB, justo el límite por defecto de Node.
const MEMORIA = 64 * 1024 * 1024;

export function hashearClave(clave: string): string {
  const sal = randomBytes(16);
  const hash = scryptSync(clave, sal, LARGO, { N, r: R, p: P, maxmem: MEMORIA });
  return `scrypt$${N}$${R}$${P}$${sal.toString("base64")}$${hash.toString("base64")}`;
}

// Un hash con otro formato da false en vez de tirar: la galería simplemente no abre.
export function verificarClave(clave: string, guardado: string): boolean {
  const partes = guardado.split("$");
  if (partes.length !== 6 || partes[0] !== "scrypt") return false;
  const [n, r, p] = partes.slice(1, 4).map(Number);
  if (![n, r, p].every((x) => Number.isInteger(x) && x > 0)) return false;
  const sal = Buffer.from(partes[4], "base64");
  const esperado = Buffer.from(partes[5], "base64");
  if (sal.length === 0 || esperado.length === 0) return false;
  try {
    const hash = scryptSync(clave, sal, esperado.length, { N: n, r, p, maxmem: MEMORIA });
    return timingSafeEqual(hash, esperado);
  } catch {
    return false;
  }
}
