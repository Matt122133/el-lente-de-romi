import { createHmac, timingSafeEqual } from "node:crypto";

// Acceso a una galería con su contraseña (sección 5 del doc): el cliente no se registra.
// Al acertar la clave se guarda una cookie firmada por galería, así no hay que volver a
// escribirla y nadie puede fabricarla sin el secreto del servidor. La firma incluye la
// versión de la clave: cuando Romi la cambia, las cookies viejas dejan de valer (research R7
// de specs/004-panel-de-romi).

const SECRETO = process.env.GALERIAS_SECRETO ?? "solo-para-desarrollo";

export function nombreCookie(slug: string): string {
  return `galeria-${slug}`;
}

export function firmar(slug: string, version: number): string {
  return createHmac("sha256", SECRETO).update(`${slug}:${version}`).digest("hex");
}

export function firmaValida(slug: string, version: number, firma: string | undefined): boolean {
  if (!firma) return false;
  const esperada = Buffer.from(firmar(slug, version));
  const recibida = Buffer.from(firma);
  return esperada.length === recibida.length && timingSafeEqual(esperada, recibida);
}
