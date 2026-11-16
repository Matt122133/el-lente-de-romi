// Los mails que pueden entrar al panel (specs/006-acceso-de-romi). ADMIN_EMAIL admite varios
// separados por coma: son alias de la única administradora, todos con la misma contraseña
// (principio I: no hay cuentas). Sin imports: lo prueba scripts/panel/probar.ts con Node.

function normalizar(mail: string): string {
  return mail.trim().toLowerCase();
}

// "a@x.com, B@x.com,," → ["a@x.com", "b@x.com"]. Los vacíos nunca cuentan (FR-005).
export function mailsAdmin(valor: string | undefined): string[] {
  return (valor ?? "").split(",").map(normalizar).filter(Boolean);
}

export function esMailAdmin(mail: string, lista: string[]): boolean {
  const buscado = normalizar(mail);
  return buscado !== "" && lista.includes(buscado);
}
