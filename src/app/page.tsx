import Link from "next/link";
import { BotonWhatsapp } from "@/components/BotonWhatsapp";
import { CategoriaCard } from "@/components/CategoriaCard";
import { JustifiedGrid } from "@/components/JustifiedGrid";
import { FotoSkeleton, TextoSkeleton } from "@/components/Skeleton";
import { site } from "@/content/site";
import { fotosDeMentira } from "@/lib/placeholders";

export default function Home() {
  return (
    <>
      <section className="hero">
        <FotoSkeleton />
        <div className="hero-texto">
          <h1>{site.nombre}</h1>
          <p>{site.bajada}</p>
        </div>
      </section>

      <section className="seccion contenedor">
        <h2 className="seccion-titulo">Portfolio</h2>
        <div className="categorias">
          {site.categorias.map((c) => (
            <CategoriaCard key={c.slug} categoria={c} />
          ))}
        </div>
      </section>

      <section className="seccion contenedor">
        <h2 className="seccion-titulo">Trabajos recientes</h2>
        <JustifiedGrid fotos={fotosDeMentira("home", 12)} />
      </section>

      <section className="seccion contenedor dos-columnas">
        <FotoSkeleton proporcion={4 / 5} />
        <div className="prosa">
          <h2 className="seccion-titulo">{site.sobreMi.titulo}</h2>
          <TextoSkeleton lineas={4} />
          <p style={{ marginTop: 24 }}>
            <Link href="/sobre-mi" className="texto-suave">
              Conocé más →
            </Link>
          </p>
        </div>
      </section>

      <section className="seccion contenedor contacto">
        <h2>¿Hablamos?</h2>
        <p className="texto-suave" style={{ margin: 0 }}>
          Contame qué tenés en mente y armamos algo juntos.
        </p>
        <BotonWhatsapp />
      </section>
    </>
  );
}
