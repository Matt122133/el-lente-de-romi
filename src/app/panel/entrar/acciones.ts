"use server";

import { randomBytes } from "node:crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { hashearClave, verificarClave } from "@/lib/claves";
import { bloqueada, limpiarIntentos, registrarFallo } from "@/lib/intentos";
import { COOKIE_SESION, DURACION_SESION_S, firmarSesion, opcionesCookie } from "@/lib/sesion";

export type EstadoEntrar = { error: string | null };

// Si falta el hash (o el mail no coincide) igual se corre scrypt contra este, así un mail
// equivocado tarda lo mismo que una clave equivocada (FR-016).
const HASH_DE_RELLENO = hashearClave(randomBytes(16).toString("hex"));
const MENSAJE = "El mail o la contraseña no son correctos.";

async function ipDelPedido(): Promise<string> {
  // Railway pone la IP del visitante primera en x-forwarded-for.
  return (await headers()).get("x-forwarded-for")?.split(",")[0].trim() || "local";
}

export async function entrar(_previo: EstadoEntrar, datos: FormData): Promise<EstadoEntrar> {
  const ip = await ipDelPedido();
  if (await bloqueada(ip)) {
    return { error: "Demasiados intentos. Probá de nuevo en 15 minutos." };
  }

  const mail = String(datos.get("mail") ?? "").trim().toLowerCase();
  const clave = String(datos.get("clave") ?? "");
  const mailEsperado = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
  const hash = process.env.ADMIN_CLAVE_HASH || HASH_DE_RELLENO;

  const claveOk = verificarClave(clave, hash) && Boolean(process.env.ADMIN_CLAVE_HASH);
  const mailOk = mailEsperado !== "" && mail === mailEsperado;
  if (!claveOk || !mailOk) {
    await registrarFallo(ip);
    return { error: MENSAJE };
  }

  await limpiarIntentos(ip);
  (await cookies()).set(COOKIE_SESION, firmarSesion(Date.now() + DURACION_SESION_S * 1000), opcionesCookie);
  redirect("/panel");
}
