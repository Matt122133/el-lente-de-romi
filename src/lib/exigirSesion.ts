// Chequeo de sesión que hacen todas las páginas y acciones del panel (research R2 de la
// 004). El proxy solo redirige de forma optimista: una server action se puede invocar por
// POST sin pasar por la página, así que cada una vuelve a verificar acá.

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE_SESION, sesionValida } from "./sesion";

export async function exigirSesion(): Promise<void> {
  const valor = (await cookies()).get(COOKIE_SESION)?.value;
  if (!sesionValida(valor)) redirect("/panel/entrar");
}
