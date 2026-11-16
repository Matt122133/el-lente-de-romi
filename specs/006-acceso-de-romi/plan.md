---
ticket: none
status: active
covers:
  - src/lib/admins.ts
  - src/app/panel/entrar/acciones.ts
  - scripts/panel/probar.ts
  - .env.example
  - SECURITY.md
  - docs/processes/dev-setup.md
  - specs/006-acceso-de-romi/
verify: npm run typecheck && npm run build && npm run panel:probar
analyzed: 2026-11-16
---

<!--
Harness frontmatter:
- ticket: known Jira key, or none when there is no ticket.
- status: draft until a human promotes the analyzed plan to active.
- covers: repository-relative path prefixes this feature may edit.
- verify: command that proves the feature works; run until green.
- analyzed: date the /speckit-analyze report was read before promotion.
-->

# Implementation Plan: Acceso de Romi al panel

**Branch**: `006-acceso-de-romi` | **Date**: 2026-11-16 | **Spec**: `specs/006-acceso-de-romi/spec.md`

## Summary

`ADMIN_EMAIL` pasa a aceptar una lista separada por comas. Una función pura en
`src/lib/admins.ts` la normaliza (minúsculas, sin espacios, sin vacíos) y dice
si un mail está permitido; el login la usa en lugar de la comparación con un
solo mail. El resto del login no cambia: misma contraseña única, mismo mensaje,
mismo scrypt contra el hash de relleno y mismo límite por IP. En producción se
configuran los dos mails de Romi y el de Mateo, con el hash de `1234`.

## Technical Context

**Language/Version**: TypeScript 5.9, Node ≥ 22.9.
**Primary Dependencies**: Next.js 16.4. Nada nuevo.
**Storage**: ninguno nuevo. Variables `ADMIN_EMAIL` y `ADMIN_CLAVE_HASH` en Railway y `.env.local`.
**Testing**: `npm run panel:probar` suma casos de la lista (sin base ni red).
**Target Platform**: app en Railway.
**Project Type**: web.
**Performance Goals**: el login tarda lo mismo con mail equivocado o clave equivocada (scrypt corre siempre).
**Constraints**: mails reales nunca en el repo (principio VI).
**Scale/Scope**: 3 mails, 1 contraseña.

## Constitution Check

- **I. Romi's site, not a platform** — ✅ No hay cuentas: varios mails son alias de la única administradora.
- **III. Photo bytes never touch the app** — ✅ No aplica.
- **VI. Clients' photos are private** — ✅ Los mails viven solo en Railway y `.env.local`; el ejemplo y las pruebas usan mails inventados (`@example.com`).
- **Plan-bounded change** — ✅ `covers:` arriba.
- **Verified before done** — ✅ `verify:` arriba, más entrar en producción con cada mail.

Riesgo aceptado (Mateo, 16/11/2026): contraseña inicial `1234` hasta que Romi
entre por primera vez; la protege el límite de 5 intentos por IP cada 15
minutos. Se cambia con `npm run admin:clave`.

## Design

- `src/lib/admins.ts` (sin imports): `mailsAdmin(valor: string | undefined): string[]`
  separa por coma, recorta, pasa a minúsculas y descarta vacíos;
  `esMailAdmin(mail, lista): boolean` compara el mail normalizado contra la lista
  (lista vacía → false; mail vacío → false).
- `src/app/panel/entrar/acciones.ts`: `mailOk = esMailAdmin(mail, mailsAdmin(process.env.ADMIN_EMAIL))`;
  el resto igual (scrypt siempre, mismo mensaje, `registrarFallo`).
- `.env.example`, `SECURITY.md`, `docs/processes/dev-setup.md`: `ADMIN_EMAIL` admite varios mails separados por coma.

## Operación (después del merge)

1. `ADMIN_CLAVE_HASH` en Railway = hash de `1234` (`npm run admin:clave`, o
   `hashearClave("1234")`), y `ADMIN_EMAIL` = los dos mails de Romi y el de
   Mateo, separados por coma. Cambiar variables redespliega la app.
2. Entrar en producción con cada uno de los tres mails.
3. Anotar en `.env.local` (comentario de credenciales) y en la sección 0 del doc.

## Project Structure

```text
specs/006-acceso-de-romi/   spec.md, plan.md, tasks.md, checklists/
src/lib/admins.ts           nueva
src/app/panel/entrar/acciones.ts
scripts/panel/probar.ts
.env.example, SECURITY.md, docs/processes/dev-setup.md
```

## Complexity Tracking

Sin violaciones.
