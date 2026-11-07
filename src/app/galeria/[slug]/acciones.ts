"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { claveCorrecta, getGaleria } from "@/content/galerias";
import { firmar, nombreCookie } from "@/lib/acceso";

export type EstadoClave = { error: string | null };

export async function entrarConClave(
  slug: string,
  _previo: EstadoClave,
  datos: FormData,
): Promise<EstadoClave> {
  const galeria = await getGaleria(slug);
  if (!galeria) return { error: "Esta galería no existe." };

  const clave = datos.get("clave");
  if (typeof clave !== "string" || !(await claveCorrecta(slug, clave))) {
    return { error: "La contraseña no es correcta." };
  }

  (await cookies()).set(nombreCookie(slug), firmar(slug, galeria.claveVersion), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: `/galeria/${slug}`,
    maxAge: 60 * 60 * 24 * 31, // lo que dura una galería
  });
  redirect(`/galeria/${slug}`);
}
