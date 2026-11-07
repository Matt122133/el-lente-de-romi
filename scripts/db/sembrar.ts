// npm run db:sembrar — carga o actualiza las categorías del portfolio y las dos galerías de
// ejemplo (FR-009). Correrlo de nuevo no duplica nada y no toca las fotos. Solo datos
// inventados: el repo es público (FR-011).

import { hashearClave } from "../../src/lib/claves.ts";
import { conectar } from "./conexion.ts";

// Los textos entre corchetes están pendientes de Romi (sección 12 del doc).
const CATEGORIAS = [
  { slug: "social", nombre: "Fotografía social", descripcion: "[Casamientos, cumpleaños, quinces y celebraciones]" },
  { slug: "moda", nombre: "Fotografía de moda", descripcion: "[Editoriales, lookbooks y campañas]" },
  { slug: "productos", nombre: "Fotografía de productos", descripcion: "[Catálogos y contenido para marcas]" },
  { slug: "eventos", nombre: "Eventos y congresos", descripcion: "[Eventos sociales, culturales y corporativos]" },
];

function enDias(dias: number): string {
  return new Date(Date.now() + dias * 86_400_000).toISOString().slice(0, 10);
}

// La de ejemplo vence un año después de sembrar, así la demo no se apaga sola (plan D5).
const GALERIAS = [
  { slug: "ejemplo", titulo: "Galería de ejemplo", fecha: "2026-10-11", venceEl: enDias(365) },
  { slug: "ejemplo-vencida", titulo: "Galería vencida", fecha: "2026-08-02", venceEl: "2026-09-02" },
];

const sql = conectar();

try {
  await sql.begin(async (tx) => {
    for (const [orden, c] of CATEGORIAS.entries()) {
      await tx`
        INSERT INTO categorias (slug, nombre, descripcion, orden)
        VALUES (${c.slug}, ${c.nombre}, ${c.descripcion}, ${orden})
        ON CONFLICT (slug) DO UPDATE
          SET nombre = EXCLUDED.nombre, descripcion = EXCLUDED.descripcion, orden = EXCLUDED.orden`;
    }
    for (const g of GALERIAS) {
      await tx`
        INSERT INTO galerias (slug, titulo, fecha, vence_el, clave_hash)
        VALUES (${g.slug}, ${g.titulo}, ${g.fecha}, ${g.venceEl}, ${hashearClave("demo")})
        ON CONFLICT (slug) DO UPDATE
          SET titulo = EXCLUDED.titulo, fecha = EXCLUDED.fecha, vence_el = EXCLUDED.vence_el,
              clave_hash = EXCLUDED.clave_hash`;
    }
  });
  console.log(`✓ ${CATEGORIAS.length} categorías y ${GALERIAS.length} galerías de ejemplo`);
} catch (e) {
  console.error(`✗ ${(e as Error).message}`);
  process.exitCode = 1;
} finally {
  await sql.end();
}
