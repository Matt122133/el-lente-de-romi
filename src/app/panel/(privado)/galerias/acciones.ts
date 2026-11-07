"use server";

import { redirect } from "next/navigation";
import { crearGaleria as crear } from "@/content/galerias";
import { exigirSesion } from "@/lib/exigirSesion";

export type EstadoFormulario = { error: string | null };

const FECHA = /^\d{4}-\d{2}-\d{2}$/;

export async function crearGaleria(_previo: EstadoFormulario, datos: FormData): Promise<EstadoFormulario> {
  await exigirSesion();
  const titulo = String(datos.get("titulo") ?? "").trim();
  const fecha = String(datos.get("fecha") ?? "");
  const venceEl = String(datos.get("venceEl") ?? "");
  const clave = String(datos.get("clave") ?? "");

  if (!titulo) return { error: "Falta el título." };
  if (!FECHA.test(fecha) || !FECHA.test(venceEl)) return { error: "Revisá las fechas." };
  if (clave.length < 4) return { error: "La contraseña tiene que tener al menos 4 caracteres." };

  const slug = await crear({ titulo, fecha, clave, venceEl });
  redirect(`/panel/galerias/${slug}`);
}
