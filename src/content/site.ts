// Contenido del sitio. Por ahora vive acá; cuando haya base de datos, sale de ahí
// (ver sección 9 del doc). Los textos entre corchetes están pendientes de Romi.

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

  categorias: [
    {
      slug: "social",
      nombre: "Fotografía social",
      descripcion: "[Casamientos, cumpleaños, quinces y celebraciones]",
    },
    {
      slug: "moda",
      nombre: "Fotografía de moda",
      descripcion: "[Editoriales, lookbooks y campañas]",
    },
    {
      slug: "productos",
      nombre: "Fotografía de productos",
      descripcion: "[Catálogos y contenido para marcas]",
    },
    {
      slug: "eventos",
      nombre: "Eventos y congresos",
      descripcion: "[Eventos sociales, culturales y corporativos]",
    },
  ] satisfies Categoria[],

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

export function getCategoria(slug: string): Categoria | undefined {
  return site.categorias.find((c) => c.slug === slug);
}

export function whatsappUrl(): string | null {
  const { whatsapp, mensajeWhatsapp } = site.contacto;
  if (!whatsapp) return null;
  return `https://wa.me/${whatsapp}?text=${encodeURIComponent(mensajeWhatsapp)}`;
}
