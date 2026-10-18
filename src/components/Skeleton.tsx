import type { CSSProperties } from "react";

// Bloque gris donde después va una foto. Cuando lleguen las reales, este componente
// pasa a mostrar el ThumbHash de fondo y la imagen encima.
export function FotoSkeleton({
  proporcion,
  className = "",
  style,
}: {
  proporcion?: number;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={`skeleton ${className}`}
      style={proporcion ? { aspectRatio: proporcion, ...style } : style}
      aria-hidden="true"
    />
  );
}

// Líneas grises para texto que todavía no existe.
export function TextoSkeleton({ lineas = 3 }: { lineas?: number }) {
  return (
    <div className="texto-skeleton" aria-hidden="true">
      {Array.from({ length: lineas }, (_, i) => (
        <span key={i} className="skeleton" />
      ))}
    </div>
  );
}
