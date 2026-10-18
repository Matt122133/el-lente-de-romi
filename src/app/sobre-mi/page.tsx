import type { Metadata } from "next";
import { BotonWhatsapp } from "@/components/BotonWhatsapp";
import { FotoSkeleton } from "@/components/Skeleton";
import { site } from "@/content/site";

export const metadata: Metadata = { title: "Sobre mí" };

export default function SobreMi() {
  return (
    <section className="seccion contenedor dos-columnas">
      <FotoSkeleton proporcion={4 / 5} />
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
