import Link from "next/link";
import type { Categoria } from "@/content/site";
import { FotoSkeleton } from "./Skeleton";

export function CategoriaCard({ categoria }: { categoria: Categoria }) {
  return (
    <Link href={`/portfolio/${categoria.slug}`} className="categoria-card">
      <FotoSkeleton proporcion={4 / 5} />
      <span className="categoria-nombre">{categoria.nombre}</span>
    </Link>
  );
}
