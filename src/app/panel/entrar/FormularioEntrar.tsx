"use client";

import { useActionState } from "react";
import { entrar, type EstadoEntrar } from "./acciones";

export function FormularioEntrar() {
  const [estado, accion, enviando] = useActionState<EstadoEntrar, FormData>(entrar, { error: null });

  return (
    <form action={accion} className="form-clave">
      <label htmlFor="mail" className="texto-suave">
        Mail
      </label>
      <input id="mail" name="mail" type="email" autoComplete="username" required autoFocus />
      <label htmlFor="clave" className="texto-suave">
        Contraseña
      </label>
      <input id="clave" name="clave" type="password" autoComplete="current-password" required />
      {estado.error && (
        <p className="form-error" role="alert">
          {estado.error}
        </p>
      )}
      <button type="submit" className="boton" disabled={enviando}>
        {enviando ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
