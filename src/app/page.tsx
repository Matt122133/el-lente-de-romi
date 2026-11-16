import Link from "next/link";
import { BotonWhatsapp } from "@/components/BotonWhatsapp";
import { CategoriaCard } from "@/components/CategoriaCard";
import { Foto } from "@/components/Foto";
import { JustifiedGrid } from "@/components/JustifiedGrid";
import { FotoSkeleton, TextoSkeleton } from "@/components/Skeleton";
import { getFotoSitio, getRecientes } from "@/content/portfolio";
import { getCategorias, site } from "@/content/site";

export default async function Home() {
  const [categorias, recientes, romi, sobreMi] = await Promise.all([
    getCategorias(),
    getRecientes(),
    getFotoSitio("portada"),
    getFotoSitio("sobremi"),
  ]);

  return (
    <>
      {/* Con la foto del lente, dos columnas; sin ella, la franja de siempre (US4 de la 005). */}
      {romi ? (
        <section className="hero hero-con-foto">
          <Foto
            foto={romi}
            className="hero-foto"
            sizes="(max-width: 899px) 100vw, 50vw"
            prioridad
          />
          <div className="hero-texto">
            <h1>{site.nombre}</h1>
            <p>{site.bajada}</p>
          </div>
        </section>
      ) : (
        <section className="hero">
          <FotoSkeleton />
          <div className="hero-texto">
            <h1>{site.nombre}</h1>
            <p>{site.bajada}</p>
          </div>
        </section>
      )}

      <section className="seccion contenedor">
        <h2 className="seccion-titulo">Portfolio</h2>
        <div className="categorias">
          {categorias.map((c) => (
            <CategoriaCard key={c.slug} categoria={c} />
          ))}
        </div>
      </section>

      {recientes.length > 0 && (
        <section className="seccion contenedor">
          <h2 className="seccion-titulo">Trabajos recientes</h2>
          <JustifiedGrid fotos={recientes} />
        </section>
      )}

      <section className="seccion contenedor dos-columnas">
        {sobreMi ? (
          <Foto foto={sobreMi} recorte={4 / 5} sizes="(max-width: 899px) 100vw, 50vw" />
        ) : (
          <FotoSkeleton proporcion={4 / 5} />
        )}
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
