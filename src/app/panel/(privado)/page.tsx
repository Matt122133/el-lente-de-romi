import type { Metadata } from "next";
import Link from "next/link";
import { estaVencida, formatearFecha, listarGalerias, type Galeria } from "@/content/galerias";
import { exigirSesion } from "@/lib/exigirSesion";

export const metadata: Metadata = { title: "Galerías" };

const SEMANA_MS = 7 * 24 * 60 * 60 * 1000;

function estado(g: Galeria): { texto: string; clase: string } {
  if (estaVencida(g)) return { texto: "Vencida", clase: "panel-estado-vencida" };
  if (estaVencida(g, new Date(Date.now() + SEMANA_MS))) {
    return { texto: "Vence esta semana", clase: "panel-estado-por-vencer" };
  }
  return { texto: "Vigente", clase: "" };
}

// Lista de galerías del panel (FR-013 de specs/004-panel-de-romi).
export default async function Galerias() {
  await exigirSesion();
  const galerias = await listarGalerias();

  return (
    <>
      <header className="panel-encabezado">
        <h1>Galerías</h1>
        <Link href="/panel/galerias/nueva" className="boton">
          Nueva galería
        </Link>
      </header>
      {galerias.length === 0 ? (
        <p className="texto-suave">Todavía no hay galerías.</p>
      ) : (
        <ul className="panel-lista">
          {galerias.map((g) => {
            const e = estado(g);
            return (
              <li key={g.slug}>
                <Link href={`/panel/galerias/${g.slug}`}>
                  <strong>{g.titulo}</strong>
                  <span className="texto-suave">
                    {g.fotos} fotos
                    {g.pendientes > 0 && ` · ${g.pendientes} procesando`}
                    {g.errores > 0 && ` · ${g.errores} con error`}
                    {" · "}vence el {formatearFecha(g.venceEl)}
                  </span>
                  <span className={`panel-estado ${e.clase}`}>{e.texto}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
