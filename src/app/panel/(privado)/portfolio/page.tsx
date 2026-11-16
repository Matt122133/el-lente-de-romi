import type { Metadata } from "next";
import Link from "next/link";
import { Foto } from "@/components/Foto";
import { FotoSkeleton } from "@/components/Skeleton";
import { listarCategoriasPanel, recientesPanel } from "@/content/portfolio";
import { exigirSesion } from "@/lib/exigirSesion";
import { MAXIMO_RECIENTES } from "@/lib/recientes";
import { moverReciente, quitarReciente } from "./acciones";

export const metadata: Metadata = { title: "Portfolio" };

// Portadas y trabajos recientes (US2 y US3 de specs/005-portadas-y-fotos-del-sitio).
export default async function PortfolioEnPanel() {
  await exigirSesion();
  const [categorias, recientes] = await Promise.all([listarCategoriasPanel(), recientesPanel()]);
  const { marcadas, completa } = recientes;

  return (
    <>
      <header className="panel-encabezado">
        <h1>Portfolio</h1>
        <Link href="/" className="panel-enlace" target="_blank">
          Ver el sitio
        </Link>
      </header>

      <p className="texto-suave">Tocá una categoría para elegir su portada y marcar trabajos recientes.</p>
      <ul className="panel-categorias">
        {categorias.map((c) => (
          <li key={c.slug}>
            <Link href={`/panel/portfolio/${c.slug}`}>
              {c.portada ? (
                <Foto foto={c.portada} recorte={4 / 5} sizes="(max-width: 899px) 50vw, 25vw" />
              ) : (
                <FotoSkeleton proporcion={4 / 5} />
              )}
              <strong>{c.nombre}</strong>
              <span className="texto-suave">
                {c.cantidad} fotos ·{" "}
                {c.portada ? (c.elegida ? "portada elegida" : "portada: la primera") : "sin fotos"}
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <section className="panel-seccion">
        <h2 className="seccion-titulo">Trabajos recientes</h2>
        <p className="texto-suave">
          {marcadas.length === 0
            ? `No marcaste ninguna: el inicio muestra una mezcla de ${completa} fotos de todas las categorías.`
            : `Marcaste ${marcadas.length} de ${MAXIMO_RECIENTES}.` +
              (completa > 0 ? ` Las otras ${completa} las completa una mezcla de todas las categorías.` : "")}
        </p>
        {marcadas.length > 0 && (
          <ol className="panel-recientes">
            {marcadas.map((f, i) => (
              <li key={f.ruta}>
                <Foto foto={f} recorte={1} sizes="64px" />
                <span className="texto-suave">
                  {i + 1}. {f.categoria}
                </span>
                <div className="panel-acciones">
                  <form action={moverReciente.bind(null, f.destino, f.id, "arriba")}>
                    <button type="submit" className="panel-boton" disabled={i === 0} aria-label="Subir">
                      ↑
                    </button>
                  </form>
                  <form action={moverReciente.bind(null, f.destino, f.id, "abajo")}>
                    <button
                      type="submit"
                      className="panel-boton"
                      disabled={i === marcadas.length - 1}
                      aria-label="Bajar"
                    >
                      ↓
                    </button>
                  </form>
                  <form action={quitarReciente.bind(null, f.destino, f.id)}>
                    <button type="submit" className="panel-boton">
                      Quitar
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>
    </>
  );
}
