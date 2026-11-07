"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { thumbHashToDataURL } from "thumbhash";
import type { Foto as FotoDatos } from "@/lib/fotos";
import { srcSet, urlDerivada } from "@/lib/imagenes";

// Una foto real: AVIF con WebP de respaldo, del tamaño que pide la pantalla, servida directo
// desde R2 (principio III). Mientras carga se ve su ThumbHash en el lugar exacto, y como la
// caja ya tiene la proporción de la foto, nada salta (principio II, sección 6 del doc).
export function Foto({
  foto,
  sizes,
  prioridad = false,
}: {
  foto: FotoDatos;
  sizes: string;
  // Las de la primera fila se piden antes que nada: es lo que se ve primero.
  prioridad?: boolean;
}) {
  const ref = useRef<HTMLImageElement>(null);
  const [estado, setEstado] = useState<"cargando" | "lista" | "error">("cargando");

  const fondo = useMemo(
    () => (foto.thumbhash ? thumbHashToDataURL(base64ABytes(foto.thumbhash)) : undefined),
    [foto.thumbhash],
  );

  // Si la imagen ya estaba en caché, puede terminar de cargar antes de que React escuche
  // onLoad: en ese caso nunca se mostraría.
  useEffect(() => {
    const img = ref.current;
    if (img?.complete) setEstado(img.naturalWidth > 0 ? "lista" : "error");
  }, [foto.ruta]);

  return (
    <div
      className="foto"
      style={
        {
          aspectRatio: foto.width / foto.height,
          backgroundImage: fondo ? `url(${fondo})` : undefined,
        } as CSSProperties
      }
    >
      {estado !== "error" && (
        <picture>
          <source type="image/avif" srcSet={srcSet(foto.ruta, "avif")} sizes={sizes} />
          <source type="image/webp" srcSet={srcSet(foto.ruta, "webp")} sizes={sizes} />
          <img
            ref={ref}
            src={urlDerivada(foto.ruta, "medium", "webp")}
            alt={foto.alt}
            width={foto.width}
            height={foto.height}
            loading={prioridad ? "eager" : "lazy"}
            fetchPriority={prioridad ? "high" : "auto"}
            decoding="async"
            className={estado === "lista" ? "foto-cargada" : undefined}
            onLoad={() => setEstado("lista")}
            // Sin la derivada queda el ThumbHash: ni ícono roto ni salto.
            onError={() => setEstado("error")}
          />
        </picture>
      )}
    </div>
  );
}

function base64ABytes(base64: string): Uint8Array {
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
}
