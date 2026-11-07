// Cliente único de la base para el sitio (research R1 y R5 de specs/003-base-de-datos-railway).
// Solo se importa desde código de servidor: la URL lleva la contraseña de la base.
// En Railway, DATABASE_URL apunta a la base por la red privada.

import postgres from "postgres";

type Sql = ReturnType<typeof postgres>;

// `next dev` recarga los módulos en cada cambio: sin esto, cada recarga abriría conexiones
// nuevas sin cerrar las anteriores.
const global = globalThis as typeof globalThis & { __sql?: Sql };

export function db(): Sql {
  if (!global.__sql) {
    if (!process.env.DATABASE_URL) throw new Error("Falta DATABASE_URL");
    global.__sql = postgres(process.env.DATABASE_URL, { max: 5, onnotice: () => {} });
  }
  return global.__sql;
}
