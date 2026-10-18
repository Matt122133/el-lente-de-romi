import type { CSSProperties } from "react";
import type { Foto } from "@/lib/placeholders";
import { FotoSkeleton } from "./Skeleton";

// Grilla justificada al estilo Pixieset/Flickr (sección 6 del doc), resuelta con CSS:
// cada foto crece en proporción a su relación de aspecto, así todas las de una fila
// quedan con la misma altura y la fila llena el ancho. No hace falta JS ni medir nada
// porque el ancho y el alto vienen con la foto: no hay saltos mientras carga.
export function JustifiedGrid({
  fotos,
  alturaFila = 280,
}: {
  fotos: Foto[];
  alturaFila?: number;
}) {
  return (
    <div className="jgrid" style={{ "--row-h": `${alturaFila}px` } as CSSProperties}>
      {fotos.map((foto) => {
        const proporcion = foto.width / foto.height;
        return (
          <FotoSkeleton
            key={foto.id}
            className="jgrid-item"
            proporcion={proporcion}
            style={{ "--ar": proporcion } as CSSProperties}
          />
        );
      })}
    </div>
  );
}
