// Conexión a la base para los scripts (research R1). La URL sale de DATABASE_URL: en la
// compu de quien corre los scripts es la URL pública de Railway en .env.local (research R5).
// Nunca se imprime: lleva la contraseña de la base.

import postgres from "postgres";

export function hayBase(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

export function conectar(conexiones = 1) {
  if (!hayBase()) {
    console.error("✗ Falta DATABASE_URL en .env.local (ver .env.example).");
    process.exit(1);
  }
  return postgres(process.env.DATABASE_URL!, { max: conexiones, onnotice: () => {} });
}
