"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE_SESION, opcionesCookie } from "@/lib/sesion";

export async function salir(): Promise<void> {
  (await cookies()).delete({ name: COOKIE_SESION, path: opcionesCookie.path });
  redirect("/panel/entrar");
}
