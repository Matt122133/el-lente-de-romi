// Sesión del panel de Romi (research R1 y R2 de specs/004-panel-de-romi). Una sola usuaria,
// así que no hay tabla de sesiones: la cookie lleva cuándo vence, firmado con HMAC. Cerrar
// sesión la borra; cambiar SESION_SECRETO cierra todas.
// Las funciones de firma no importan nada de Next: las usan el proxy, las páginas y
// scripts/panel/probar.ts.

import { createHmac, timingSafeEqual } from "node:crypto";

export const COOKIE_SESION = "panel";
export const DURACION_SESION_S = 60 * 60 * 24 * 30;

function secreto(): string {
  const s = process.env.SESION_SECRETO;
  // Sin secreto en producción, nadie entra: mejor eso que una firma adivinable.
  if (!s && process.env.NODE_ENV === "production") throw new Error("Falta SESION_SECRETO");
  return s ?? "solo-para-desarrollo";
}

function firma(vence: number): string {
  return createHmac("sha256", secreto()).update(`panel:${vence}`).digest("hex");
}

// Valor de la cookie: "<vence en ms>.<firma>".
export function firmarSesion(vence: number): string {
  return `${vence}.${firma(vence)}`;
}

export function sesionValida(valor: string | undefined, ahora = Date.now()): boolean {
  if (!valor) return false;
  const [texto, recibida] = valor.split(".");
  const vence = Number(texto);
  if (!Number.isSafeInteger(vence) || vence <= ahora || !recibida) return false;
  const esperada = Buffer.from(firma(vence));
  const dada = Buffer.from(recibida);
  return esperada.length === dada.length && timingSafeEqual(esperada, dada);
}

export const opcionesCookie = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/panel",
  maxAge: DURACION_SESION_S,
};
