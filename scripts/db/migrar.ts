// npm run db:migrar — aplica las migraciones pendientes de db/migraciones (research R2).
// Railway lo corre antes de cada deploy: si falla, el deploy no sigue. Contrato:
// specs/003-base-de-datos-railway/contracts/cli.md.

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { conectar } from "./conexion.ts";
import { CARPETA_MIGRACIONES, listarMigraciones, pendientes } from "./migraciones.ts";

const sql = conectar();

try {
  await sql`
    CREATE TABLE IF NOT EXISTS migraciones (
      nombre   text PRIMARY KEY,
      aplicada timestamptz NOT NULL DEFAULT now()
    )`;
  const aplicadas = (await sql<{ nombre: string }[]>`SELECT nombre FROM migraciones`).map((m) => m.nombre);
  const faltan = pendientes(await listarMigraciones(), aplicadas);

  if (faltan.length === 0) console.log("Base al día");
  for (const nombre of faltan) {
    const contenido = await readFile(join(CARPETA_MIGRACIONES, nombre), "utf8");
    // La migración y su registro van juntos: o queda todo o no queda nada.
    await sql.begin(async (tx) => {
      await tx.unsafe(contenido);
      await tx`INSERT INTO migraciones (nombre) VALUES (${nombre})`;
    });
    console.log(`✓ ${nombre}`);
  }
} catch (e) {
  console.error(`✗ ${(e as Error).message}`);
  process.exitCode = 1;
} finally {
  await sql.end();
}
