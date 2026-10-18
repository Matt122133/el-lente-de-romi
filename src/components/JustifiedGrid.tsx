"use client";

import { useState, type CSSProperties } from "react";
import type { Foto } from "@/lib/placeholders";
import { Lightbox } from "./Lightbox";
import { FotoSkeleton } from "./Skeleton";

// Grilla justificada al estilo Pixieset/Flickr (sección 6 del doc), resuelta con CSS:
// cada foto crece en proporción a su relación de aspecto, así todas las de una fila
// quedan con la misma altura y la fila llena el ancho. No hace falta JS ni medir nada
// porque el ancho y el alto vienen con la foto: no hay saltos mientras carga.
export function JustifiedGrid({
  fotos,
  alturaFila = 280,
  descargable = false,
}: {
  fotos: Foto[];
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
              <FotoSkeleton proporcion={proporcion} />
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
