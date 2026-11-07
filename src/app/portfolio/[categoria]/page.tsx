import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JustifiedGrid } from "@/components/JustifiedGrid";
import { getFotos } from "@/content/fotos";
import { getCategoria } from "@/content/site";
import { fotosDeMentira } from "@/lib/placeholders";

type Props = { params: Promise<{ categoria: string }> };

// Sin generateStaticParams: las categorías y sus fotos salen de la base en cada pedido
// (research R3 de specs/003-base-de-datos-railway). Un slug que no existe da 404.

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const categoria = await getCategoria((await params).categoria);
  return { title: categoria?.nombre };
}

export default async function CategoriaPage({ params }: Props) {
  const categoria = await getCategoria((await params).categoria);
  if (!categoria) notFound();

  const fotos = await getFotos(`portfolio/${categoria.slug}`, () => fotosDeMentira(categoria.slug, 24));

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
