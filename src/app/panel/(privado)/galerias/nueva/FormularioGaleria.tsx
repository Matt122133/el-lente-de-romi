"use client";

import { useActionState } from "react";
import { crearGaleria, type EstadoFormulario } from "../acciones";

export function FormularioGaleria({ hoy, enUnMes }: { hoy: string; enUnMes: string }) {
  const [estado, accion, enviando] = useActionState<EstadoFormulario, FormData>(crearGaleria, {
    error: null,
  });

  return (
    <form action={accion} className="form-clave">
      <label htmlFor="titulo">Título</label>
      <input id="titulo" name="titulo" required autoFocus maxLength={120} />
      <label htmlFor="fecha">Fecha del evento</label>
      <input id="fecha" name="fecha" type="date" defaultValue={hoy} required />
      <label htmlFor="clave">Contraseña para el cliente</label>
      <input id="clave" name="clave" type="text" autoComplete="off" required minLength={4} />
      <label htmlFor="venceEl">Vence el</label>
      <input id="venceEl" name="venceEl" type="date" defaultValue={enUnMes} required />
      {estado.error && (
        <p className="form-error" role="alert">
          {estado.error}
        </p>
      )}
      <button type="submit" className="boton" disabled={enviando}>
        {enviando ? "Creando…" : "Crear galería"}
      </button>
    </form>
  );
}
