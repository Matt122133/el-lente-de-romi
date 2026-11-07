"use client";

// Compartir, cambiar y borrar una galería (US3 de specs/004-panel-de-romi).

import { useActionState, useState } from "react";
import { borrarGaleria, editarGaleria, type EstadoFormulario } from "./acciones";

export function CopiarLink({ slug }: { slug: string }) {
  const [copiado, setCopiado] = useState(false);
  return (
    <button
      type="button"
      className="boton"
      onClick={async () => {
        await navigator.clipboard.writeText(`${window.location.origin}/galeria/${slug}`);
        setCopiado(true);
        setTimeout(() => setCopiado(false), 2000);
      }}
    >
      {copiado ? "Link copiado" : "Copiar link"}
    </button>
  );
}

export function Editar({ slug, venceEl }: { slug: string; venceEl: string }) {
  const [estado, accion, enviando] = useActionState<EstadoFormulario, FormData>(
    editarGaleria.bind(null, slug),
    { error: null },
  );
  return (
    <form action={accion} className="form-clave">
      <label htmlFor="clave">Contraseña nueva (vacío = no cambiar)</label>
      <input id="clave" name="clave" type="text" autoComplete="off" minLength={4} />
      <label htmlFor="venceEl">Vence el</label>
      <input id="venceEl" name="venceEl" type="date" defaultValue={venceEl} />
      {estado.error && (
        <p className="form-error" role="alert">
          {estado.error}
        </p>
      )}
      {estado.ok && <p className="texto-suave">{estado.ok}</p>}
      <button type="submit" className="boton" disabled={enviando}>
        Guardar
      </button>
    </form>
  );
}

export function Borrar({ slug, titulo }: { slug: string; titulo: string }) {
  const [estado, accion, enviando] = useActionState<EstadoFormulario, FormData>(
    borrarGaleria.bind(null, slug),
    { error: null },
  );
  return (
    <form action={accion} className="form-clave">
      <label htmlFor="confirmacion">
        Para borrarla con todas sus fotos, escribí el título: <strong>{titulo}</strong>
      </label>
      <input id="confirmacion" name="confirmacion" autoComplete="off" required />
      {estado.error && (
        <p className="form-error" role="alert">
          {estado.error}
        </p>
      )}
      <button type="submit" className="boton boton-peligro" disabled={enviando}>
        {enviando ? "Borrando…" : "Borrar galería"}
      </button>
    </form>
  );
}
