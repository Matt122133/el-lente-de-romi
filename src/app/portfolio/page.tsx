import type { Metadata } from "next";
import { CategoriaCard } from "@/components/CategoriaCard";
import { getCategorias } from "@/content/site";

export const metadata: Metadata = { title: "Portfolio" };

export default async function Portfolio() {
  const categorias = await getCategorias();

  return (
    <div className="contenedor">
      <header className="encabezado">
        <h1>Portfolio</h1>
      </header>
      <div className="categorias" style={{ paddingBottom: 56 }}>
        {categorias.map((c) => (
          <CategoriaCard key={c.slug} categoria={c} />
        ))}
      </div>
    </div>
  );
}
