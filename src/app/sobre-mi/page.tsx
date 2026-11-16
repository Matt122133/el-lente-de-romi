import type { Metadata } from "next";
import { BotonWhatsapp } from "@/components/BotonWhatsapp";
import { Foto } from "@/components/Foto";
import { FotoSkeleton } from "@/components/Skeleton";
import { getFotoSitio } from "@/content/portfolio";
import { site } from "@/content/site";

export const metadata: Metadata = { title: "Sobre mí" };

export default async function SobreMi() {
  // La foto de Romi de Sobre mí (FR-010 de specs/005-portadas-y-fotos-del-sitio).
  const foto = await getFotoSitio("sobremi");

  return (
    <section className="seccion contenedor dos-columnas">
      {foto ? (
        <Foto foto={foto} recorte={4 / 5} sizes="(max-width: 899px) 100vw, 50vw" prioridad />
      ) : (
        <FotoSkeleton proporcion={4 / 5} />
      )}
      <div className="prosa">
        <h1 className="seccion-titulo">{site.sobreMi.titulo}</h1>
        {site.sobreMi.parrafos.map((p) => (
          <p key={p}>{p}</p>
        ))}
        <div style={{ marginTop: 32 }}>
          <BotonWhatsapp />
        </div>
      </div>
    </section>
  );
}
