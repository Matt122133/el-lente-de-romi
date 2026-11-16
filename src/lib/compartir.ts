// La vista previa al compartir un link (WhatsApp, Instagram): FR-012 de
// specs/005-portadas-y-fotos-del-sitio. La imagen es la derivada og de R2, en JPEG: nunca
// pasa por la app (principio III).

import type { Metadata } from "next";
import type { Foto } from "./fotos";
import { OG, urlOg } from "./imagenes";

const SITIO = "El Lente de Romi";

// Next combina la metadata de a una clave entera: una página que declara openGraph pisa todo
// el del layout, así que siempre se arma completo acá.
export function vistaPrevia(foto: Foto | null, titulo?: string): Pick<Metadata, "openGraph" | "twitter"> {
  const imagenes = foto ? [{ url: urlOg(foto.ruta), width: OG.width, height: OG.height, alt: foto.alt }] : undefined;
  return {
    openGraph: {
      siteName: SITIO,
      locale: "es_AR",
      type: "website",
      ...(titulo && { title: titulo }),
      ...(imagenes && { images: imagenes }),
    },
    twitter: {
      card: foto ? "summary_large_image" : "summary",
      ...(titulo && { title: titulo }),
      ...(imagenes && { images: imagenes.map((i) => i.url) }),
    },
  };
}
