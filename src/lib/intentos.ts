// Límite de intentos del login del panel (research R1 de specs/004-panel-de-romi): 5 fallos
// de la misma IP en 15 minutos la bloquean 15 minutos. Por IP y no global, para que nadie
// pueda dejar a Romi afuera. Solo se importa desde código de servidor.

import { db } from "./db";

const MAXIMO = 5;
const VENTANA = "15 minutes";

export async function bloqueada(ip: string): Promise<boolean> {
  const [{ n }] = await db()<{ n: number }[]>`
    SELECT count(*)::int AS n FROM intentos_login
    WHERE ip = ${ip} AND fecha > now() - ${VENTANA}::interval`;
  return n >= MAXIMO;
}

export async function registrarFallo(ip: string): Promise<void> {
  await db()`DELETE FROM intentos_login WHERE fecha < now() - interval '1 day'`;
  await db()`INSERT INTO intentos_login (ip) VALUES (${ip})`;
}

export async function limpiarIntentos(ip: string): Promise<void> {
  await db()`DELETE FROM intentos_login WHERE ip = ${ip}`;
}
