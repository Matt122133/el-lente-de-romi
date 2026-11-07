"use server";

// Acciones de una galería en el panel (contracts/panel.md de specs/004-panel-de-romi). Todas
// exigen sesión y ninguna recibe ni devuelve bytes de imagen: solo ids, nombres, URLs
// firmadas y ETags (principio III).

import { redirect } from "next/navigation";
import { borrarGaleria as borrar, editarGaleria as editar, getGaleria } from "@/content/galerias";
import {
  avanceDe,
  despertarWorker,
  estadosDe,
  marcarSubida,
  olvidarSubida,
  registrarSubiendo,
  reintentarFoto,
  reordenar,
  type Avance,
} from "@/content/subidas";
import { exigirSesion } from "@/lib/exigirSesion";
import { claveOriginal } from "@/lib/imagenes";
import {
  abortarMultipart,
  buckets,
  cantidadDePartes,
  completarMultipart,
  empezarMultipart,
  firmarPartes,
} from "@/lib/r2";

const ID = /^[0-9a-f]{32}$/;
const MAXIMO_BYTES = 200 * 1024 * 1024;
const MAXIMO_POR_TANDA = 50;

async function galeriaExistente(slug: string) {
  await exigirSesion();
  const galeria = await getGaleria(slug);
  if (!galeria) throw new Error("La galería no existe");
  return { galeria, destino: `galerias/${slug}` };
}

export type ArchivoASubir = { id: string; nombre: string; tamano: number };
export type SubidaNueva = { id: string; uploadId: string; partes: string[] };

// Las que ya están (subidas, procesándose, listas o con error) se saltean: así retomar una
// subida cortada no vuelve a subir nada (FR-008).
export async function empezarSubida(
  slug: string,
  archivos: ArchivoASubir[],
): Promise<{ ya: string[]; nuevas: SubidaNueva[] }> {
  const { destino } = await galeriaExistente(slug);
  if (archivos.length > MAXIMO_POR_TANDA) throw new Error("Demasiadas fotos en una tanda");
  for (const a of archivos) {
    if (!ID.test(a.id) || !a.nombre || a.tamano <= 0 || a.tamano > MAXIMO_BYTES) {
      throw new Error(`Archivo inválido: ${a.nombre}`);
    }
  }

  const estados = await estadosDe(destino, archivos.map((a) => a.id));
  const ya = archivos.filter((a) => estados.has(a.id) && estados.get(a.id) !== "subiendo").map((a) => a.id);
  const aSubir = archivos.filter((a) => !ya.includes(a.id));

  await registrarSubiendo(destino, aSubir);
  await reordenar(destino);

  const { originales } = buckets();
  const nuevas = await Promise.all(
    aSubir.map(async (a) => {
      const clave = claveOriginal(`${destino}/${a.id}`);
      const uploadId = await empezarMultipart(originales, clave);
      const partes = await firmarPartes(originales, clave, uploadId, cantidadDePartes(a.tamano));
      return { id: a.id, uploadId, partes };
    }),
  );
  return { ya, nuevas };
}

export async function terminarSubida(
  slug: string,
  id: string,
  uploadId: string,
  partes: Array<{ numero: number; etag: string }>,
): Promise<void> {
  const { destino } = await galeriaExistente(slug);
  if (!ID.test(id)) throw new Error("Id inválido");
  await completarMultipart(buckets().originales, claveOriginal(`${destino}/${id}`), uploadId, partes);
  await marcarSubida(destino, id);
  await despertarWorker();
}

// El navegador no pudo subirla: se aborta el multipart y se borra la fila, así no queda
// "subiendo" para siempre y volver a soltar la carpeta la sube de nuevo.
export async function abandonarSubida(slug: string, id: string, uploadId: string): Promise<void> {
  const { destino } = await galeriaExistente(slug);
  if (!ID.test(id)) throw new Error("Id inválido");
  try {
    await abortarMultipart(buckets().originales, claveOriginal(`${destino}/${id}`), uploadId);
  } catch {
    // Ya abortado o vencido: R2 lo limpia solo.
  }
  await olvidarSubida(destino, id);
}

export async function reintentar(slug: string, id: string): Promise<void> {
  const { destino } = await galeriaExistente(slug);
  await reintentarFoto(destino, id);
  await despertarWorker();
}

export async function avance(slug: string): Promise<Avance> {
  const { destino } = await galeriaExistente(slug);
  return avanceDe(destino);
}

export type EstadoFormulario = { error: string | null; ok?: string };

const FECHA = /^\d{4}-\d{2}-\d{2}$/;

export async function editarGaleria(
  slug: string,
  _previo: EstadoFormulario,
  datos: FormData,
): Promise<EstadoFormulario> {
  await galeriaExistente(slug);
  const clave = String(datos.get("clave") ?? "");
  const venceEl = String(datos.get("venceEl") ?? "");
  if (clave && clave.length < 4) return { error: "La contraseña tiene que tener al menos 4 caracteres." };
  if (venceEl && !FECHA.test(venceEl)) return { error: "Revisá la fecha." };
  await editar(slug, { clave: clave || undefined, venceEl: venceEl || undefined });
  return { error: null, ok: clave ? "Listo. La contraseña anterior ya no sirve." : "Listo." };
}

// Se confirma escribiendo el título exacto (FR-012).
export async function borrarGaleria(
  slug: string,
  _previo: EstadoFormulario,
  datos: FormData,
): Promise<EstadoFormulario> {
  const { galeria } = await galeriaExistente(slug);
  if (String(datos.get("confirmacion") ?? "").trim() !== galeria.titulo) {
    return { error: "El título no coincide." };
  }
  await borrar(slug);
  redirect("/panel");
}
