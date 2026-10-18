import Link from "next/link";

export default function NotFound() {
  return (
    <section className="seccion contenedor contacto">
      <h1>No encontramos esta página</h1>
      <Link href="/" className="texto-suave">
        Volver al inicio
      </Link>
    </section>
  );
}
