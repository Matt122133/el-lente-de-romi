"use client";

import { useState, type CSSProperties } from "react";
import type { Foto as FotoDatos } from "@/lib/fotos";
import { Foto } from "./Foto";
import { Lightbox } from "./Lightbox";
import { FotoSkeleton } from "./Skeleton";

// Las primeras fotos se piden con prioridad: son la primera fila, lo que se ve primero.
const CON_PRIORIDAD = 6;
// Altura de fila en celular; la misma que fija globals.css.
const ALTURA_FILA_CELULAR = 160;
// Una fila puede estirarse hasta ~1,5 veces su altura base para llenar el ancho.
const ESTIRAMIENTO = 1.5;

// Grilla justificada al estilo Pixieset/Flickr (sección 6 del doc), resuelta con CSS:
// cada foto crece en proporción a su relación de aspecto, así todas las de una fila
// quedan con la misma altura y la fila llena el ancho. No hace falta JS ni medir nada
// porque el ancho y el alto vienen con la foto: no hay saltos mientras carga.
export function JustifiedGrid({
  fotos,
  alturaFila = 280,
  descargable = false,
}: {
  fotos: FotoDatos[];
  alturaFila?: number;
  // En las galerías de entrega los invitados bajan las fotos que quieran (sección 12).
  descargable?: boolean;
}) {
  const [abierta, setAbierta] = useState<number | null>(null);

  return (
    <>
      <div className="jgrid" style={{ "--row-h": `${alturaFila}px` } as CSSProperties}>
        {fotos.map((foto, i) => {
          const proporcion = foto.width / foto.height;
          return (
            <button
              key={foto.id}
              type="button"
              className="jgrid-item"
              style={{ "--ar": proporcion } as CSSProperties}
              onClick={() => setAbierta(i)}
              aria-label={`Ver foto ${i + 1} de ${fotos.length}`}
            >
              {foto.thumbhash ? (
                <Foto
                  foto={foto}
                  sizes={`(max-width: 600px) ${Math.ceil(proporcion * ALTURA_FILA_CELULAR * ESTIRAMIENTO)}px, ${Math.ceil(proporcion * alturaFila * ESTIRAMIENTO)}px`}
                  prioridad={i < CON_PRIORIDAD}
                />
              ) : (
                <FotoSkeleton proporcion={proporcion} />
              )}
            </button>
          );
        })}
      </div>
      {abierta !== null && (
        <Lightbox
          fotos={fotos}
          indice={abierta}
          onCambiar={setAbierta}
          onCerrar={() => setAbierta(null)}
          descargable={descargable}
        />
      )}
    </>
  );
}
