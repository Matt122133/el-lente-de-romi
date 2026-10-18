import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JustifiedGrid } from "@/components/JustifiedGrid";
import { getCategoria, site } from "@/content/site";
import { fotosDeMentira } from "@/lib/placeholders";

type Props = { params: Promise<{ categoria: string }> };

export function generateStaticParams() {
  return site.categorias.map((c) => ({ categoria: c.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const categoria = getCategoria((await params).categoria);
  return { title: categoria?.nombre };
}

export default async function CategoriaPage({ params }: Props) {
  const categoria = getCategoria((await params).categoria);
  if (!categoria) notFound();

  return (
    <div className="contenedor" style={{ paddingBottom: 56 }}>
      <header className="encabezado">
        <h1>{categoria.nombre}</h1>
        <p>{categoria.descripcion}</p>
      </header>
      <JustifiedGrid fotos={fotosDeMentira(categoria.slug, 24)} />
    </div>
  );
}
