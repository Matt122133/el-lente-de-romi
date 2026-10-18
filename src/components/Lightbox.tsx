"use client";

import { useEffect, type CSSProperties } from "react";
import type { Foto } from "@/lib/placeholders";
import { FotoSkeleton } from "./Skeleton";

// Vista de una foto a pantalla completa, con flechas y teclado. Cuando haya fotos reales,
// acá se pre-cargan la anterior y la siguiente (sección 6 del doc): es lo que hace que
// navegar se sienta inmediato.
export function Lightbox({
  fotos,
  indice,
  onCambiar,
  onCerrar,
  descargable,
}: {
  fotos: Foto[];
  indice: number;
  onCambiar: (i: number) => void;
  onCerrar: () => void;
  descargable: boolean;
}) {
  const foto = fotos[indice];
  const anterior = indice > 0 ? indice - 1 : null;
  const siguiente = indice < fotos.length - 1 ? indice + 1 : null;

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCerrar();
      if (e.key === "ArrowLeft" && anterior !== null) onCambiar(anterior);
      if (e.key === "ArrowRight" && siguiente !== null) onCambiar(siguiente);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [anterior, siguiente, onCambiar, onCerrar]);

  // Que la página de atrás no scrollee mientras está abierto.
  useEffect(() => {
    const previo = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previo;
    };
  }, []);

  return (
    <div className="lightbox" role="dialog" aria-modal="true" aria-label="Foto ampliada">
      <div className="lightbox-barra">
        <span>
          {indice + 1} / {fotos.length}
        </span>
        <div className="lightbox-acciones">
          {descargable && (
            // Descarga del original con URL firmada directo a R2 (sección 8). Fase 3.
            <span className="lightbox-accion deshabilitado" title="Disponible en la fase 3">
              Descargar
            </span>
          )}
          <button type="button" className="lightbox-accion" onClick={onCerrar}>
            Cerrar
          </button>
        </div>
      </div>

      <div className="lightbox-escenario" onClick={onCerrar}>
        <div
          className="lightbox-foto"
          style={{ "--ar": foto.width / foto.height } as CSSProperties}
          onClick={(e) => e.stopPropagation()}
        >
          <FotoSkeleton />
        </div>
      </div>

      {anterior !== null && (
        <button
          type="button"
          className="lightbox-flecha lightbox-anterior"
          onClick={() => onCambiar(anterior)}
          aria-label="Foto anterior"
        >
          ‹
        </button>
      )}
      {siguiente !== null && (
        <button
          type="button"
          className="lightbox-flecha lightbox-siguiente"
          onClick={() => onCambiar(siguiente)}
          aria-label="Foto siguiente"
        >
          ›
        </button>
      )}
    </div>
  );
}
