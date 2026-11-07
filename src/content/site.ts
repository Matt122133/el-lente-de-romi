// Contenido del sitio. Las categorías del portfolio ya salen de la base (feature 003); el
// resto vive acá hasta que tenga panel (ver sección 9 del doc). Los textos entre corchetes
// están pendientes de Romi.

import { connection } from "next/server";
import { db } from "@/lib/db";

export type Categoria = {
  slug: string;
  nombre: string;
  descripcion: string;
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

// Se arman en cada pedido, como getFotos (research R3 de la 003).
export async function getCategorias(): Promise<Categoria[]> {
  await connection();
  return [...(await db()<Categoria[]>`SELECT slug, nombre, descripcion FROM categorias ORDER BY orden`)];
}

export async function getCategoria(slug: string): Promise<Categoria | undefined> {
  await connection();
  const [categoria] = await db()<Categoria[]>`
    SELECT slug, nombre, descripcion FROM categorias WHERE slug = ${slug}`;
  return categoria;
}

export function whatsappUrl(): string | null {
  const { whatsapp, mensajeWhatsapp } = site.contacto;
  if (!whatsapp) return null;
  return `https://wa.me/${whatsapp}?text=${encodeURIComponent(mensajeWhatsapp)}`;
}
