import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { estaVencida, formatearFecha, getGaleria } from "@/content/galerias";
import { avanceDe } from "@/content/subidas";
import { exigirSesion } from "@/lib/exigirSesion";
import { Borrar, CopiarLink, Editar } from "./Gestion";
import { Subida } from "./Subida";

export const metadata: Metadata = { title: "Galería" };

type Props = { params: Promise<{ slug: string }> };

// Una galería en el panel: subir fotos, compartir, cambiar y borrar (US2 y US3 de
// specs/004-panel-de-romi).
export default async function GaleriaEnPanel({ params }: Props) {
  await exigirSesion();
  const { slug } = await params;
  const galeria = await getGaleria(slug);
  if (!galeria) notFound();
  const avance = await avanceDe(`galerias/${slug}`);

  return (
    <>
      <header className="panel-encabezado">
        <div>
          <h1>{galeria.titulo}</h1>
          <p className="texto-suave">
            {formatearFecha(galeria.fecha)} · {estaVencida(galeria) ? "venció" : "vence"} el{" "}
            {formatearFecha(galeria.venceEl)}
          </p>
        </div>
        <div className="panel-acciones">
          <CopiarLink slug={slug} />
          <Link href={`/galeria/${slug}`} className="panel-enlace" target="_blank">
            Ver galería
          </Link>
        </div>
      </header>

      <Subida slug={slug} avanceInicial={avance} />

      <section className="panel-seccion">
        <h2 className="seccion-titulo">Contraseña y vencimiento</h2>
        <Editar slug={slug} venceEl={galeria.venceEl} />
      </section>

      <section className="panel-seccion">
        <h2 className="seccion-titulo">Borrar</h2>
        <Borrar slug={slug} titulo={galeria.titulo} />
      </section>
    </>
  );
}
