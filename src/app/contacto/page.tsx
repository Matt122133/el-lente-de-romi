import type { Metadata } from "next";
import { BotonWhatsapp } from "@/components/BotonWhatsapp";
import { site } from "@/content/site";

export const metadata: Metadata = { title: "Contacto" };

// Romi gestiona todo por WhatsApp (sección 12 del doc): no hay formulario.
export default function Contacto() {
  const { instagram, email } = site.contacto;
  return (
    <section className="seccion contenedor contacto">
      <h1>Contacto</h1>
      <p className="texto-suave prosa" style={{ margin: 0 }}>
        Escribime por WhatsApp para consultar disponibilidad, presupuestos o cualquier duda.
      </p>
      <BotonWhatsapp />
      <ul className="contacto-redes">
        <li>
          {instagram ? (
            <a href={`https://instagram.com/${instagram}`}>Instagram</a>
          ) : (
            <span>Instagram [pendiente]</span>
          )}
        </li>
        <li>
          {email ? <a href={`mailto:${email}`}>{email}</a> : <span>Email [pendiente]</span>}
        </li>
      </ul>
    </section>
  );
}
