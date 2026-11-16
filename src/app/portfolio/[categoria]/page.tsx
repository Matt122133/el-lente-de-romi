import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JustifiedGrid } from "@/components/JustifiedGrid";
import { getFotos } from "@/content/fotos";
import { altDeCategoria, getCategoria } from "@/content/site";
import { vistaPrevia } from "@/lib/compartir";
import { fotosDeMentira } from "@/lib/placeholders";

type Props = { params: Promise<{ categoria: string }> };

// Sin generateStaticParams: las categorías y sus fotos salen de la base en cada pedido
// (research R3 de specs/003-base-de-datos-railway). Un slug que no existe da 404.

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const categoria = await getCategoria((await params).categoria);
  if (!categoria) return {};
  // Al compartir una categoría se ve su portada (FR-012 de la 005).
  return { title: categoria.nombre, ...vistaPrevia(categoria.portada, categoria.nombre) };
}

export default async function CategoriaPage({ params }: Props) {
  const categoria = await getCategoria((await params).categoria);
  if (!categoria) notFound();

  const fotos = (await getFotos(`portfolio/${categoria.slug}`, () => fotosDeMentira(categoria.slug, 24))).map(
    // Sin alt propio, el de la categoría (FR-014 de la 005).
    (f) => (f.alt ? f : { ...f, alt: altDeCategoria(categoria.nombre) }),
  );

  return (
    <div className="contenedor" style={{ paddingBottom: 56 }}>
      <header className="encabezado">
        <h1>{categoria.nombre}</h1>
        <p>{categoria.descripcion}</p>
      </header>
      <JustifiedGrid fotos={fotos} />
    </div>
  );
}
