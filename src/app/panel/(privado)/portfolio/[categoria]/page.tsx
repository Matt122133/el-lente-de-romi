import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Foto } from "@/components/Foto";
import { fotosDeCategoria } from "@/content/portfolio";
import { exigirSesion } from "@/lib/exigirSesion";
import { MAXIMO_RECIENTES } from "@/lib/recientes";
import { alternarReciente, elegirPortada, quitarPortada } from "../acciones";

export const metadata: Metadata = { title: "Portfolio" };

type Props = {
  params: Promise<{ categoria: string }>;
  searchParams: Promise<{ aviso?: string }>;
};

// Las fotos de una categoría con sus dos botones, Portada y Reciente
// (contracts/panel-portfolio.md de specs/005-portadas-y-fotos-del-sitio).
export default async function CategoriaEnPanel({ params, searchParams }: Props) {
  await exigirSesion();
  const { categoria: slug } = await params;
  const { aviso } = await searchParams;
  const datos = await fotosDeCategoria(slug);
  if (!datos) notFound();
  const { categoria, fotos } = datos;

  return (
    <>
      <header className="panel-encabezado">
        <div>
          <p className="texto-suave">
            <Link href="/panel/portfolio">← Portfolio</Link>
          </p>
          <h1>{categoria.nombre}</h1>
          <p className="texto-suave">
            {fotos.length} fotos · {categoria.elegida ? "portada elegida" : "portada: la primera"}
          </p>
        </div>
        <div className="panel-acciones">
          {categoria.elegida && (
            <form action={quitarPortada.bind(null, slug)}>
              <button type="submit" className="panel-boton">
                Usar la primera
              </button>
            </form>
          )}
          <Link href={`/portfolio/${slug}`} className="panel-enlace" target="_blank">
            Ver categoría
          </Link>
        </div>
      </header>

      {aviso === "maximo" && (
        <p className="panel-aviso" role="status">
          Ya hay {MAXIMO_RECIENTES} recientes. Quitá alguna en Portfolio para sumar otra.
        </p>
      )}

      {fotos.length === 0 ? (
        <p className="texto-suave">Esta categoría todavía no tiene fotos.</p>
      ) : (
        <ul className="panel-fotos">
          {fotos.map((f) => (
            <li key={f.id} className={f.esPortada ? "panel-foto-portada" : undefined}>
              <Foto foto={f} recorte={1} sizes="(max-width: 699px) 33vw, 180px" />
              <div className="panel-foto-botones">
                <form action={elegirPortada.bind(null, slug, f.id)}>
                  <button type="submit" className="panel-boton" aria-pressed={f.esPortada} disabled={f.esPortada}>
                    {f.esPortada ? "Portada ✓" : "Portada"}
                  </button>
                </form>
                <form action={alternarReciente.bind(null, slug, f.id)}>
                  <button type="submit" className="panel-boton" aria-pressed={f.esReciente}>
                    {f.esReciente ? "Reciente ✓" : "Reciente"}
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
