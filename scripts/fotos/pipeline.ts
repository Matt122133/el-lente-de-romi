// Una foto original → sus derivadas para pantalla y los datos que guarda el manifiesto.
// Corre en la compu de quien sube (sección 5 del doc). Calidad y color: sección 7 y
// principio IV de la constitución; decisiones en specs/002-fotos-reales/research.md.

import { createHash } from "node:crypto";
import sharp from "sharp";
import { rgbaToThumbHash } from "thumbhash";
import type { Foto } from "../../src/lib/fotos.ts";
import { claveDerivada, VARIANTES, type Formato, type Variante } from "../../src/lib/imagenes.ts";

// Entra en el hash de los nombres. Las derivadas se cachean un año: si cambia algo de
// abajo (calidad, tamaños, color), se cambia esta fecha y todas las URLs cambian.
export const PIPELINE = "2026-10-21";

// Punto de partida para comparar con Pixieset, no un valor final (research R2). 4:4:4 en
// AVIF para que no se corran rojos ni tonos de piel.
const CALIDAD = {
  avif: { quality: 55, effort: 4, chromaSubsampling: "4:4:4" },
  webp: { quality: 80, smartSubsample: true },
} as const;

const TIPOS: Record<Formato, string> = { avif: "image/avif", webp: "image/webp" };

export type Derivada = { clave: string; contentType: string; bytes: Buffer };

export type Procesada = {
  foto: Omit<Foto, "posicion">;
  derivadas: Derivada[];
};

export function nombreDeHash(bytes: Buffer): string {
  return createHash("sha256").update(PIPELINE).update(bytes).digest("hex").slice(0, 32);
}

export async function procesarFoto(bytes: Buffer, destino: string): Promise<Procesada> {
  const id = nombreDeHash(bytes);
  const ruta = `${destino}/${id}`;

  // failOn "error": un JPEG truncado falla acá en vez de dar una derivada a medias.
  // autoOrient aplica la orientación EXIF; sharp no copia metadatos (ni GPS) salvo que se
  // le pida, y withIccProfile convierte a sRGB y deja el perfil puesto.
  const base = sharp(bytes, { failOn: "error" }).autoOrient();
  const meta = await base.metadata();
  if (meta.format !== "jpeg") throw new Error("no es un JPEG válido");
  const { width, height } = meta.autoOrient;

  const derivadas: Derivada[] = [];
  for (const variante of Object.keys(VARIANTES) as Variante[]) {
    const ancho = VARIANTES[variante];
    const redimensionada = base.clone().resize({ width: ancho, withoutEnlargement: true }).withIccProfile("srgb");
    for (const formato of ["avif", "webp"] as Formato[]) {
      const salida =
        formato === "avif"
          ? redimensionada.clone().avif(CALIDAD.avif)
          : redimensionada.clone().webp(CALIDAD.webp);
      derivadas.push({
        clave: claveDerivada(ruta, variante, formato),
        contentType: TIPOS[formato],
        bytes: await salida.toBuffer(),
      });
    }
  }

  // ThumbHash pide como máximo 100 × 100.
  const chica = await base
    .clone()
    .resize(100, 100, { fit: "inside" })
    .toColorspace("srgb")
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const thumbhash = Buffer.from(rgbaToThumbHash(chica.info.width, chica.info.height, chica.data)).toString(
    "base64",
  );

  return { foto: { id, ruta, width, height, thumbhash, alt: "" }, derivadas };
}
