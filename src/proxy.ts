// Chequeo optimista del panel (research R2 de specs/004-panel-de-romi): sin cookie de sesión
// válida, /panel/* va al login. No alcanza solo: cada página y acción del panel vuelve a
// verificar con exigirSesion().

import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_SESION, sesionValida } from "@/lib/sesion";

export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/panel/entrar")) return NextResponse.next();
  if (sesionValida(request.cookies.get(COOKIE_SESION)?.value)) return NextResponse.next();
  return NextResponse.redirect(new URL("/panel/entrar", request.url));
}

export const config = {
  matcher: ["/panel", "/panel/:path*"],
};
