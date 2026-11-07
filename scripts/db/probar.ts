// npm run db:probar — verificación de la parte de base que se puede probar sin base ni red
// (contracts/cli.md de specs/003-base-de-datos-railway): claves, orden de las migraciones,
// destinos y filas de fotos.

import assert from "node:assert/strict";
import { hashearClave, verificarClave } from "../../src/lib/claves.ts";
import { destinoValido, type Foto } from "../../src/lib/fotos.ts";
import { filasDeFotos } from "../fotos/base.ts";
import { listarMigraciones, ordenarMigraciones, pendientes } from "./migraciones.ts";

// Claves (FR-006, research R4).
const hash = hashearClave("demo");
assert.match(hash, /^scrypt\$32768\$8\$1\$[A-Za-z0-9+/=]+\$[A-Za-z0-9+/=]+$/);
assert.ok(!hash.includes("demo"), "el hash no contiene la clave");
assert.ok(verificarClave("demo", hash), "la clave correcta entra");
assert.ok(!verificarClave("Demo", hash), "otra clave no entra");
assert.ok(!verificarClave("", hash), "vacía no entra");
assert.notEqual(hashearClave("demo"), hash, "cada hash lleva su sal");
assert.ok(!verificarClave("demo", "demo"), "texto plano no se acepta como hash");
assert.ok(!verificarClave("demo", "scrypt$x$8$1$a$b"), "parámetros inválidos");
assert.ok(!verificarClave("demo", "bcrypt$1$2$3$4$5"), "otro algoritmo");
// Los parámetros salen del hash guardado: alterarlos cambia el resultado.
const alterado = hash.replace(/^scrypt\$32768\$/, "scrypt$16384$");
assert.ok(!verificarClave("demo", alterado), "N alterado no verifica");

// Migraciones (research R2).
assert.deepEqual(
  ordenarMigraciones(["010-b.sql", "002-a.sql", "001-inicial.sql", "notas.md", "003-x.sql.bak"]),
  ["001-inicial.sql", "002-a.sql", "010-b.sql"],
);
assert.deepEqual(pendientes(["001-a.sql", "002-b.sql"], ["001-a.sql"]), ["002-b.sql"]);
const reales = await listarMigraciones();
assert.equal(reales[0], "001-inicial.sql", "la primera migración del repo");

// Destinos: solo formato; la existencia la verifica la base (FR-015).
for (const ok of ["portfolio/social", "portfolio/nueva", "galerias/ejemplo", "galerias/boda-2026"]) {
  assert.ok(destinoValido(ok), ok);
}
for (const mal of ["portfolio/Social", "portfolio/", "galerias/-x", "galerias/a--b", "otra/cosa", "portfolio/a/b"]) {
  assert.ok(!destinoValido(mal), mal);
}

// Filas de fotos (FR-003, FR-005): posición según el orden del lote, siempre con thumbhash.
const foto = (id: string, posicion: number): Foto => ({
  id,
  ruta: `galerias/ejemplo/${id}`,
  width: 4000,
  height: 6000,
  thumbhash: "XggGDQK0E0+T2TZHaJWYeP2lhAll",
  alt: "",
  posicion,
});
const filas = filasDeFotos("galerias/ejemplo", [foto("b", 7), foto("a", 3)]);
assert.deepEqual(filas.map((f) => [f.id, f.posicion, f.destino]), [
  ["b", 0, "galerias/ejemplo"],
  ["a", 1, "galerias/ejemplo"],
]);
assert.throws(() => filasDeFotos("galerias/ejemplo", [{ ...foto("c", 0), thumbhash: null }]), /thumbhash/);

console.log("OK");
