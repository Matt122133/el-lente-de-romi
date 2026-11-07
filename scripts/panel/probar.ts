// npm run panel:probar — verificación del panel sin base ni red (contracts/panel.md de
// specs/004-panel-de-romi): slug, sesión, cookie de acceso con versión, orden natural e id de
// la foto igual en el navegador y en el pipeline.

import assert from "node:assert/strict";
import { firmaValida, firmar } from "../../src/lib/acceso.ts";
import { idDeFoto } from "../../src/lib/idFoto.ts";
import { ordenNatural } from "../../src/lib/orden.ts";
import { firmarSesion, sesionValida } from "../../src/lib/sesion.ts";
import { slugDeTitulo, sufijoAleatorio } from "../../src/lib/slug.ts";
import { nombreDeHash } from "../fotos/pipeline.ts";

// Slug (research R6, FR-004).
assert.equal(slugDeTitulo("Boda Ñandú & Co.", "abc123"), "boda-nandu-co-abc123");
assert.equal(slugDeTitulo("  15 de Sofía!! ", "abc123"), "15-de-sofia-abc123");
assert.equal(slugDeTitulo("¡¡¡", "abc123"), "abc123");
const largo = slugDeTitulo("a".repeat(100), "abc123");
assert.ok(largo.length <= 40 + 7, "base acotada");
assert.match(slugDeTitulo("Cumple de Juan Pérez en Mar del Plata 2026 — fiesta", "abc123"), /^[a-z0-9]+(-[a-z0-9]+)*$/);
const sufijos = new Set(Array.from({ length: 50 }, sufijoAleatorio));
assert.ok([...sufijos].every((s) => /^[a-z0-9]{6}$/.test(s)), "formato del sufijo");
assert.ok(sufijos.size > 45, "sufijos al azar");

// Sesión del panel (research R1).
const ahora = Date.now();
const valida = firmarSesion(ahora + 60_000);
assert.ok(sesionValida(valida, ahora), "sesión vigente");
assert.ok(!sesionValida(firmarSesion(ahora - 1), ahora), "sesión vencida");
assert.ok(!sesionValida(valida.replace(/^\d+/, String(ahora + 10 ** 9)), ahora), "vencimiento alterado");
assert.ok(!sesionValida(`${valida}x`, ahora), "firma alterada");
for (const basura of [undefined, "", "abc", "123.", ".abc", "NaN.abc"]) {
  assert.ok(!sesionValida(basura, ahora), String(basura));
}

// Cookie de acceso con la versión de la clave (research R7, FR-011).
assert.ok(firmaValida("ejemplo", 1, firmar("ejemplo", 1)));
assert.ok(!firmaValida("ejemplo", 2, firmar("ejemplo", 1)), "cambiar la clave invalida la cookie");
assert.ok(!firmaValida("otra", 1, firmar("ejemplo", 1)), "una cookie no abre otra galería");

// Orden natural (research R4).
assert.deepEqual(["IMG_10.jpg", "IMG_2.jpg", "img_1.JPG"].sort(ordenNatural), ["img_1.JPG", "IMG_2.jpg", "IMG_10.jpg"]);

// El id que calcula el navegador es el del pipeline (research R3).
for (const largoBytes of [0, 1, 1000, 5_000_000]) {
  const bytes = Buffer.alloc(largoBytes, largoBytes % 251);
  const vista = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.length);
  assert.equal(await idDeFoto(vista), nombreDeHash(bytes), `${largoBytes} bytes`);
}

console.log("OK");
