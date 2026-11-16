// npm run portfolio:probar — la mezcla de "Trabajos recientes" sin base ni red
// (specs/005-portadas-y-fotos-del-sitio, research R5, FR-006 y FR-007).

import assert from "node:assert/strict";
import { armarRecientes, MAXIMO_RECIENTES, type CategoriaParaMezcla } from "../../src/lib/recientes.ts";

type F = { ruta: string; cat: string };

function categoria(cat: string, n: number, portada: number | null = 0): CategoriaParaMezcla<F> {
  const fotos = Array.from({ length: n }, (_, i) => ({ ruta: `portfolio/${cat}/${i}`, cat }));
  return { fotos, portada: portada === null ? null : (fotos[portada]?.ruta ?? null) };
}

const cuatro = () => [categoria("moda", 47), categoria("social", 38), categoria("eventos", 17), categoria("productos", 57)];

function sinRepetidas(fotos: F[]) {
  assert.equal(new Set(fotos.map((f) => f.ruta)).size, fotos.length, "sin repetidas");
}

// Sin marcadas: 12, las cuatro categorías, nunca dos seguidas de la misma.
const mezcla = armarRecientes([], cuatro());
assert.equal(mezcla.length, MAXIMO_RECIENTES);
assert.deepEqual(new Set(mezcla.map((f) => f.cat)), new Set(["moda", "social", "eventos", "productos"]));
for (let i = 1; i < mezcla.length; i++) assert.notEqual(mezcla[i].cat, mezcla[i - 1].cat, `alternadas en ${i}`);
sinRepetidas(mezcla);
// No repite la portada (la de índice 0) y no toma las primeras seguidas.
assert.ok(!mezcla.some((f) => f.ruta.endsWith("/0")), "sin portadas");
const moda = mezcla.filter((f) => f.cat === "moda").map((f) => Number(f.ruta.split("/")[2]));
assert.ok(moda[moda.length - 1] - moda[0] > 10, "espaciadas a lo largo de la sesión");

// Determinística.
assert.deepEqual(armarRecientes([], cuatro()), mezcla);

// 3 marcadas: primero esas, en orden, y completa hasta 12 sin repetirlas.
const cats = cuatro();
const marcadas = [cats[2].fotos[5], cats[0].fotos[1], cats[3].fotos[9]];
const conMarcadas = armarRecientes(marcadas, cats);
assert.equal(conMarcadas.length, MAXIMO_RECIENTES);
assert.deepEqual(conMarcadas.slice(0, 3), marcadas);
sinRepetidas(conMarcadas);

// 12 marcadas: solo esas. Más de 12: se corta.
const doce = cats[3].fotos.slice(0, 12);
assert.deepEqual(armarRecientes(doce, cats), doce);
assert.equal(armarRecientes(cats[3].fotos.slice(0, 20), cats).length, MAXIMO_RECIENTES);

// Una categoría con una sola foto que es su portada: igual aparece.
const corta = armarRecientes([], [categoria("moda", 47), categoria("eventos", 1)]);
assert.ok(corta.some((f) => f.cat === "eventos"), "la categoría corta aparece");
assert.equal(corta.length, MAXIMO_RECIENTES, "las otras completan");
sinRepetidas(corta);

// Pocas fotos en total: todas, sin inventar.
const pocas = armarRecientes([], [categoria("moda", 2, null), categoria("social", 3, null)]);
assert.equal(pocas.length, 5);
sinRepetidas(pocas);

// Sin fotos: nada.
assert.deepEqual(armarRecientes([], []), []);
assert.deepEqual(armarRecientes([], [categoria("moda", 0, null)]), []);

console.log("OK");
