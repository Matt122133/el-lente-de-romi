import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { BotonWhatsapp } from "@/components/BotonWhatsapp";
import { JustifiedGrid } from "@/components/JustifiedGrid";
import { FotoSkeleton } from "@/components/Skeleton";
import { fotosPendientes, getFotos } from "@/content/fotos";
import { estaVencida, formatearFecha, getGaleria } from "@/content/galerias";
import { firmaValida, nombreCookie } from "@/lib/acceso";
import { fotosDeMentira } from "@/lib/placeholders";
import { FormularioClave } from "./FormularioClave";

// Galería de entrega para clientes (fase 3 del roadmap). Ya tiene contraseña y
// vencimiento; la galería y sus fotos salen de la base, y la descarga de cada foto todavía
// es de mentira. Nunca se indexa en Google.
export const metadata: Metadata = {
  title: "Galería",
  robots: { index: false, follow: false },
};

type Props = { params: Promise<{ slug: string }> };

// Una galería sin fotos en la base muestra placeholders, como la de ejemplo antes de subir.
const FOTOS_DE_MENTIRA = 40;

export default async function Galeria({ params }: Props) {
  const { slug } = await params;
  const galeria = await getGaleria(slug);
  if (!galeria) notFound();

  // Romi avisa que duran un mes y habla con el cliente antes de borrarla (sección 12).
  if (estaVencida(galeria)) {
    return (
      <section className="seccion contenedor contacto">
        <h1>{galeria.titulo}</h1>
        <p className="texto-suave prosa" style={{ margin: 0 }}>
          Esta galería estuvo disponible hasta el {formatearFecha(galeria.venceEl)}. Si
          necesitás las fotos, escribime y lo vemos.
        </p>
        <BotonWhatsapp />
      </section>
    );
  }

  const firma = (await cookies()).get(nombreCookie(slug))?.value;
  if (!firmaValida(slug, galeria.claveVersion, firma)) {
    return (
      <section className="seccion contenedor contacto">
        <h1>{galeria.titulo}</h1>
        <p className="texto-suave" style={{ margin: 0 }}>
          Esta galería es privada. Ingresá la contraseña que te pasó Romi.
        </p>
        <FormularioClave slug={slug} />
      </section>
    );
  }

  // Recién acá, con la contraseña ya validada: una galería cerrada no deja ninguna ruta de
  // foto en la página (FR-014).
  const destino = `galerias/${slug}`;
  const fotos = await getFotos(destino, () => []);

  // Subida desde el panel y todavía sin ninguna foto lista: un aviso, no placeholders.
  if (fotos.length === 0 && (await fotosPendientes(destino)) > 0) {
    return (
      <section className="seccion contenedor contacto">
        <h1>{galeria.titulo}</h1>
        <p className="texto-suave" style={{ margin: 0 }}>
          Esta galería se está preparando. Volvé a entrar en unos minutos.
        </p>
      </section>
    );
  }
  const visibles = fotos.length ? fotos : fotosDeMentira(slug, FOTOS_DE_MENTIRA);

  return (
    <>
      <section className="galeria-portada">
        <FotoSkeleton />
      </section>
      <div className="contenedor" style={{ paddingBottom: 56 }}>
        <div className="galeria-barra">
          <div>
            <h1>{galeria.titulo}</h1>
            <p>
              {formatearFecha(galeria.fecha)} · {visibles.length} fotos · Disponible
              hasta el {formatearFecha(galeria.venceEl)}
            </p>
          </div>
        </div>
        <JustifiedGrid fotos={visibles} descargable />
      </div>
    </>
  );
}
