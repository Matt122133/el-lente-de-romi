// Galerías de entrega. Por ahora son de ejemplo y viven acá; en la fase 3 salen de la
// base de datos y las crea Romi desde su panel.

export type Galeria = {
  slug: string;
  titulo: string;
  fecha: string; // día del evento, AAAA-MM-DD
  venceEl: string; // duran un mes (sección 12 del doc), AAAA-MM-DD
  clave: string; // en la DB va hasheada, nunca en texto plano
  // Cuántas fotos de mentira mostrar mientras la galería no tiene manifiesto.
  cantidadFotos: number;
  // El .zip con todas las fotos no pasa por el sitio: Romi se lo pasa al cliente por su
  // cuenta (sección 0 del doc, 21/10/2026).
};

const galerias: Galeria[] = [
  {
    slug: "ejemplo",
    titulo: "Galería de ejemplo",
    fecha: "2026-10-11",
    venceEl: "2026-11-11",
    clave: "demo",
    cantidadFotos: 40,
  },
  {
    slug: "ejemplo-vencida",
    titulo: "Galería vencida",
    fecha: "2026-08-02",
    venceEl: "2026-09-02",
    clave: "demo",
    cantidadFotos: 40,
  },
];

export function getGaleria(slug: string): Galeria | undefined {
  return galerias.find((g) => g.slug === slug);
}

export function estaVencida(galeria: Galeria, hoy = new Date()): boolean {
  // Vence al terminar el día indicado, hora de Argentina.
  return hoy > new Date(`${galeria.venceEl}T23:59:59-03:00`);
}

export function formatearFecha(fecha: string): string {
  return new Intl.DateTimeFormat("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(new Date(`${fecha}T12:00:00-03:00`));
}
