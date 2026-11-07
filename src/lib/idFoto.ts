// Id de una foto calculado con WebCrypto: el mismo que nombreDeHash del pipeline (SHA-256 de
// PIPELINE + bytes, 32 caracteres), así el panel sabe en el navegador qué fotos ya están
// subidas y la clave del original coincide con la que espera el worker (research R3 de
// specs/004-panel-de-romi). Corre en el navegador y en Node.

import { PIPELINE } from "./imagenes.ts";

export async function idDeFoto(bytes: ArrayBuffer): Promise<string> {
  const prefijo = new TextEncoder().encode(PIPELINE);
  const todo = new Uint8Array(prefijo.length + bytes.byteLength);
  todo.set(prefijo, 0);
  todo.set(new Uint8Array(bytes), prefijo.length);
  const hash = new Uint8Array(await crypto.subtle.digest("SHA-256", todo));
  return Array.from(hash, (b) => b.toString(16).padStart(2, "0")).join("").slice(0, 32);
}
