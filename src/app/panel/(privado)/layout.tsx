import Link from "next/link";
import { exigirSesion } from "@/lib/exigirSesion";
import { salir } from "./acciones";

// Todo lo que está acá adentro exige sesión. Cada página y acción lo vuelve a verificar: el
// layout no corre de nuevo en cada navegación (research R2 de specs/004-panel-de-romi).
export default async function PanelPrivadoLayout({ children }: { children: React.ReactNode }) {
  await exigirSesion();
  return (
    <div className="contenedor panel">
      <nav className="panel-barra">
        <div className="panel-acciones">
          <Link href="/panel">Galerías</Link>
          <Link href="/panel/portfolio">Portfolio</Link>
        </div>
        <form action={salir}>
          <button type="submit" className="panel-enlace">
            Cerrar sesión
          </button>
        </form>
      </nav>
      {children}
    </div>
  );
}
