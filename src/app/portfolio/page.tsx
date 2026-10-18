import type { Metadata } from "next";
import { CategoriaCard } from "@/components/CategoriaCard";
import { site } from "@/content/site";

export const metadata: Metadata = { title: "Portfolio" };

export default function Portfolio() {
  return (
    <div className="contenedor">
      <header className="encabezado">
        <h1>Portfolio</h1>
      </header>
      <div className="categorias" style={{ paddingBottom: 56 }}>
        {site.categorias.map((c) => (
          <CategoriaCard key={c.slug} categoria={c} />
        ))}
      </div>
    </div>
  );
}
