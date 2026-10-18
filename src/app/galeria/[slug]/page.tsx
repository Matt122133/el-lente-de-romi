import type { Metadata } from "next";
import { JustifiedGrid } from "@/components/JustifiedGrid";
import { FotoSkeleton } from "@/components/Skeleton";
import { fotosDeMentira } from "@/lib/placeholders";

// Galería de entrega para clientes (fase 3 del roadmap). Por ahora es solo la forma:
// sin contraseña, sin descargas y con cualquier slug. Nunca se indexa en Google.
export const metadata: Metadata = {
  title: "Galería",
  robots: { index: false, follow: false },
};

type Props = { params: Promise<{ slug: string }> };

export default async function Galeria({ params }: Props) {
  const { slug } = await params;
  return (
    <>
      <section className="galeria-portada">
        <FotoSkeleton />
      </section>
      <div className="contenedor" style={{ paddingBottom: 56 }}>
        <div className="galeria-barra">
          <div>
            <h1>{slug.replace(/-/g, " ")}</h1>
            <p>[Fecha del evento] · Disponible hasta [fecha de vencimiento]</p>
          </div>
          <span className="boton boton-deshabilitado" title="Disponible en la fase 3">
            Descargar todo (.zip)
          </span>
        </div>
        <JustifiedGrid fotos={fotosDeMentira(slug, 40)} />
      </div>
    </>
  );
}
