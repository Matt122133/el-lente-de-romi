"use client";

import { useActionState } from "react";
import { entrarConClave, type EstadoClave } from "./acciones";

export function FormularioClave({ slug }: { slug: string }) {
  const [estado, accion, enviando] = useActionState<EstadoClave, FormData>(
    entrarConClave.bind(null, slug),
    { error: null },
  );

  return (
    <form action={accion} className="form-clave">
      <label htmlFor="clave" className="texto-suave">
        Contraseña
      </label>
      <input id="clave" name="clave" type="password" autoComplete="off" required autoFocus />
      {estado.error && (
        <p className="form-error" role="alert">
          {estado.error}
        </p>
      )}
      <button type="submit" className="boton" disabled={enviando}>
        {enviando ? "Entrando…" : "Ver galería"}
      </button>
    </form>
  );
}
