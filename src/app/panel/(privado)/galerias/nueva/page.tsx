import type { Metadata } from "next";
import { exigirSesion } from "@/lib/exigirSesion";
import { FormularioGaleria } from "./FormularioGaleria";

export const metadata: Metadata = { title: "Nueva galería" };

// Día de hoy en Argentina, AAAA-MM-DD, corrido `meses` meses.
function fecha(meses = 0): string {
  const d = new Date();
  d.setMonth(d.getMonth() + meses);
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Argentina/Buenos_Aires" }).format(d);
}

// Las galerías duran un mes (sección 12 del doc): el vencimiento viene precargado.
export default async function NuevaGaleria() {
  await exigirSesion();
  return (
    <>
      <header className="panel-encabezado">
        <h1>Nueva galería</h1>
      </header>
      <FormularioGaleria hoy={fecha()} enUnMes={fecha(1)} />
    </>
  );
}
