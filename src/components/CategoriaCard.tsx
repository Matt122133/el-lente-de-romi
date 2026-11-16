import Link from "next/link";
import type { Categoria } from "@/content/site";
import { Foto } from "./Foto";
import { FotoSkeleton } from "./Skeleton";

// La tarjeta de una categoría: su portada recortada a 4:5, o el fondo neutro si todavía no
// tiene fotos (FR-001 de specs/005-portadas-y-fotos-del-sitio).
export function CategoriaCard({ categoria }: { categoria: Categoria }) {
  return (
    <Link href={`/portfolio/${categoria.slug}`} className="categoria-card">
      {categoria.portada ? (
        <Foto
          foto={categoria.portada}
          recorte={4 / 5}
          // Dos columnas en celular, cuatro desde 900 px (globals.css, .categorias).
          sizes="(max-width: 899px) 50vw, 25vw"
          prioridad
        />
      ) : (
        <FotoSkeleton proporcion={4 / 5} />
      )}
      <span className="categoria-nombre">{categoria.nombre}</span>
    </Link>
  );
}
