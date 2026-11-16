# Tasks: Acceso de Romi al panel

**Input**: `specs/006-acceso-de-romi/` (spec, plan)

**Tests**: `npm run panel:probar` (sin base ni red). Las tareas **(op)** son
cambios de variables en Railway y pruebas en producción, no código. Ningún mail
real entra al repo (FR-007).

## Phase 1: User Story 1 — Romi entra con cualquiera de sus mails (P1)

**Goal**: el login acepta una lista de mails con una sola contraseña.
**Independent Test**: con cada mail de la lista entra; con otro, no, y con el mismo mensaje.

- [X] T001 [US1] Crear `src/lib/admins.ts` sin imports: `mailsAdmin(valor)` (separa por coma, recorta, minúsculas, descarta vacíos) y `esMailAdmin(mail, lista)` (normaliza el mail; vacío o lista vacía → false)
- [X] T002 [US1] `src/app/panel/entrar/acciones.ts`: `mailOk` con `esMailAdmin(mail, mailsAdmin(process.env.ADMIN_EMAIL))`; scrypt, mensaje y límite por IP sin cambios (FR-003)
- [X] T003 [P] [US1] `scripts/panel/probar.ts`: casos con mails inventados — un mail (FR-006), tres mails con espacios y mayúsculas (FR-001, FR-002), comas de más y vacíos (FR-005), mail fuera de la lista, mail vacío, variable vacía o ausente
- [X] T004 [P] [US1] `.env.example`, `SECURITY.md` y `docs/processes/dev-setup.md`: `ADMIN_EMAIL` admite varios mails separados por coma, todos con la misma contraseña
- [X] T005 Correr `verify:` hasta verde

## Phase 2: Operación

- [ ] T006 **(op)** Railway (app): `ADMIN_CLAVE_HASH` = hash de `1234`; `ADMIN_EMAIL` = los dos mails de Romi y el de Mateo (FR-008). Solo después del deploy del código de T002: antes, una lista con comas no deja entrar a nadie
- [ ] T007 **(op)** Entrar en producción con cada uno de los tres mails y `1234`; con un mail fuera de la lista, el mensaje de siempre (SC-001, SC-002)
- [ ] T008 **(op)** Actualizar el comentario de credenciales de `.env.local` (no va a git) y la sección 0 del doc

## Dependencies

T001 → T002 → T005; T003 y T004 en paralelo con T002. T006 después del merge y el deploy; T007 después de T006.
