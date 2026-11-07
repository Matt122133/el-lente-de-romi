// Qué migraciones hay y en qué orden van (research R2). Sin efectos al importarlo: lo usan
// migrar.ts y probar.ts.

import { readdir } from "node:fs/promises";

export const CARPETA_MIGRACIONES = "db/migraciones";

// Por nombre: el prefijo NNN- define el orden. Solo .sql.
export function ordenarMigraciones(archivos: string[]): string[] {
  return archivos.filter((a) => /^\d{3}-[a-z0-9-]+\.sql$/.test(a)).sort();
}

export async function listarMigraciones(carpeta = CARPETA_MIGRACIONES): Promise<string[]> {
  return ordenarMigraciones(await readdir(carpeta));
}

export function pendientes(todas: string[], aplicadas: Iterable<string>): string[] {
  const hechas = new Set(aplicadas);
  return todas.filter((m) => !hechas.has(m));
}
