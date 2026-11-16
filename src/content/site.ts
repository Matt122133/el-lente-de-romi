// Contenido del sitio. Las categorías del portfolio ya salen de la base (feature 003); el
// resto vive acá hasta que tenga panel (ver sección 9 del doc). Los textos entre corchetes
// están pendientes de Romi.

import { connection } from "next/server";
import { db } from "@/lib/db";
import type { Foto } from "@/lib/fotos";

export type Categoria = {
  slug: string;
  nombre: string;
  descripcion: string;
  // La elegida por Romi en el panel, si no la primera de la categoría; null sin fotos
  // (specs/005-portadas-y-fotos-del-sitio, FR-001).
  portada: Foto | null;
};

export const site = {
  nombre: "El Lente de Romi",
  bajada: "[Frase de presentación a definir con Romi]",
  descripcion:
    "Fotografía social, de moda, de productos y cobertura de eventos y congresos.",


  sobreMi: {
    titulo: "Sobre mí",
    parrafos: [
      "[Texto de presentación de Romi: quién es, cómo trabaja y qué la diferencia.]",
      "[Segundo párrafo: cómo acompaña a cada cliente, desde la primera charla hasta la entrega.]",
    ],
  },

  contacto: {
    // Formato internacional sin "+" ni espacios, ej. 5491112345678. Vacío = pendiente.
    whatsapp: "",
    mensajeWhatsapp: "Hola Romi! Te escribo desde tu web.",
    instagram: "", // usuario sin @
    email: "",
  },
};

// Texto alternativo de una foto del portfolio que no tiene uno propio (research R8 de la 005).
export function altDeCategoria(nombre: string): string {
  return `${nombre} — ${site.nombre}`;
}

type FilaCategoria = Omit<Categoria, "portada"> & {
  id: string | null;
  ruta: string;
  width: number;
  height: number;
  thumbhash: string;
  alt: string;
  posicion: number;
};

// Cada categoría con su portada en una sola consulta: la elegida si sigue entre las fotos
// listas, si no la de menor posición (research R1 y R9 de la 005).
function categorias(slug: string | null) {
  return db()<FilaCategoria[]>`
    SELECT c.slug, c.nombre, c.descripcion,
           p.id, p.ruta, p.width, p.height, p.thumbhash, p.alt, p.posicion
    FROM categorias c
    LEFT JOIN LATERAL (
      SELECT f.id, f.ruta, f.width, f.height, f.thumbhash, f.alt, f.posicion
      FROM fotos f
      WHERE f.destino = 'portfolio/' || c.slug AND f.estado = 'lista'
      ORDER BY (f.id IS NOT DISTINCT FROM c.portada) DESC, f.posicion
      LIMIT 1
    ) p ON true
    WHERE ${slug}::text IS NULL OR c.slug = ${slug}
    ORDER BY c.orden`;
}

function aCategoria({ id, ruta, width, height, thumbhash, alt, posicion, ...c }: FilaCategoria): Categoria {
  return {
    ...c,
    portada: id ? { id, ruta, width, height, thumbhash, alt: alt || altDeCategoria(c.nombre), posicion } : null,
  };
}

// Se arman en cada pedido, como getFotos (research R3 de la 003).
export async function getCategorias(): Promise<Categoria[]> {
  await connection();
  return (await categorias(null)).map(aCategoria);
}

export async function getCategoria(slug: string): Promise<Categoria | undefined> {
  await connection();
  const [fila] = await categorias(slug);
  return fila && aCategoria(fila);
}

export function whatsappUrl(): string | null {
  const { whatsapp, mensajeWhatsapp } = site.contacto;
  if (!whatsapp) return null;
  return `https://wa.me/${whatsapp}?text=${encodeURIComponent(mensajeWhatsapp)}`;
}
