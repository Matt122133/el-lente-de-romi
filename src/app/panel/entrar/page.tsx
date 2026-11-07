import type { Metadata } from "next";
import { FormularioEntrar } from "./FormularioEntrar";

export const metadata: Metadata = { title: "Panel" };

// Login del panel de Romi (US1 de specs/004-panel-de-romi). Está fuera del grupo (privado):
// es la única página del panel que se ve sin sesión.
export default function Entrar() {
  return (
    <section className="seccion contenedor contacto">
      <h1>Panel</h1>
      <FormularioEntrar />
    </section>
  );
}
