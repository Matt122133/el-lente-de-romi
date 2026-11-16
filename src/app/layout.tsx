import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { connection } from "next/server";
import { getFotoSitio } from "@/content/portfolio";
import { site } from "@/content/site";
import { vistaPrevia } from "@/lib/compartir";
import "./globals.css";

// La vista previa al compartir lleva la foto de Romi en todas las páginas; las categorías la
// pisan con su portada (FR-012 de specs/005-portadas-y-fotos-del-sitio). connection() antes
// de la base, así el build no la necesita.
export async function generateMetadata(): Promise<Metadata> {
  await connection();
  return {
    title: { default: site.nombre, template: `%s · ${site.nombre}` },
    description: site.descripcion,
    ...vistaPrevia(await getFotoSitio("portada")),
  };
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body>
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
