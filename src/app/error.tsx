"use client";

// Si algo falla en el servidor (por ejemplo, la base no responde), un mensaje amable en
// lugar de una página rota. Nunca muestra el error ni datos (SC-005 de la feature 003).
export default function Error({ retry }: { error: unknown; retry: () => void }) {
  return (
    <section className="seccion contenedor contacto">
      <h1>No pudimos cargar esta página</h1>
      <p className="texto-suave" style={{ margin: 0 }}>
        Probá de nuevo en un momento.
      </p>
      <button type="button" className="boton" onClick={() => retry()}>
        Reintentar
      </button>
    </section>
  );
}
