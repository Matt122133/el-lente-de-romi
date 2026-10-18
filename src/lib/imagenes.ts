// Cómo se arma la URL de cada foto. Las imágenes salen directo de R2 con dominio propio
// (sección 5 del doc): nunca pasan por la app, así el hosting no cobra bandwidth.

export const IMG_HOST = "https://img.ellentederomi.com";

// Todas las rutas en R2 empiezan con el identificador de la fotógrafa (sección 9).
// Es gratis hacerlo ahora y carísimo migrarlo después.
export const PREFIJO = "romi";

// Derivadas que genera el script de subida (fase 1), por ancho en píxeles. El original
// nunca se muestra: solo se entrega al descargar (sección 7).
export const VARIANTES = {
  thumb: 480,
  medium: 1000,
  large: 1600,
  xlarge: 2400,
} as const;

export type Variante = keyof typeof VARIANTES;
export type Formato = "avif" | "webp";

// `ruta` es relativa al prefijo, ej. "portfolio/social/a1b2c3". El nombre es un hash del
// contenido, así se cachea un año sin miedo (como Pixieset, sección 2).
export function urlDerivada(ruta: string, variante: Variante, formato: Formato): string {
  return `${IMG_HOST}/${PREFIJO}/${ruta}-${variante}.${formato}`;
}

export function srcSet(ruta: string, formato: Formato): string {
  return (Object.keys(VARIANTES) as Variante[])
    .map((v) => `${urlDerivada(ruta, v, formato)} ${VARIANTES[v]}w`)
    .join(", ");
}
