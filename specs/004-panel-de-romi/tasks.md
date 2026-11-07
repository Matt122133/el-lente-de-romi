# Tasks: Panel de Romi

**Input**: `specs/004-panel-de-romi/` (plan, spec, research, data-model, contracts, quickstart)

**Tests**: sin runner. `npm run panel:probar` cubre lo que se prueba sin base
ni red; el resto es el quickstart contra Railway. Las tareas **(Mateo)** son
acciones en los dashboards de Railway y Cloudflare.

## Phase 1: Setup

- [X] T001 `package.json`: mover `@aws-sdk/client-s3` y `sharp` a `dependencies`, sumar `@aws-sdk/s3-request-presigner` **3.1155.0** exacta, y los scripts `worker`, `admin:clave` y `panel:probar` con el patrón de `db:*` (`admin:clave` y `worker` con `--env-file-if-exists=.env.local`); `npm install`
- [X] T002 [P] `.env.example`: `ADMIN_EMAIL`, `ADMIN_CLAVE_HASH`, `SESION_SECRETO`, `WORKER_SECRETO`, `WORKER_URL`, sin valores, con un comentario por variable (data-model § Variables)
- [X] T003 [P] Crear `db/migraciones/002-panel.sql` según `data-model.md`: columnas nuevas de `galerias` y `fotos`, nulabilidad de `width`/`height`/`thumbhash` con el CHECK por estado, índice parcial `fotos_pendientes`, tabla `intentos_login` con su índice

---

## Phase 2: Foundational

- [X] T004 Mover `PIPELINE` de `scripts/fotos/pipeline.ts` a `src/lib/imagenes.ts` (sin cambiar su valor) y que `pipeline.ts` lo importe
- [X] T005 [P] Crear `src/lib/orden.ts` con `ordenNatural(a, b)` (`Intl.Collator("es", { numeric: true, sensitivity: "base" })`) y usarlo en `scripts/fotos/procesar.ts` en lugar del collator local
- [X] T006 [P] Crear `src/lib/slug.ts` sin imports: `slugDeTitulo(titulo, sufijo)` y `sufijoAleatorio()` según research R6
- [X] T007 [P] Crear `src/lib/sesion.ts`: `firmarSesion(vence)`, `sesionValida(valor, ahora)` (HMAC con `SESION_SECRETO`, `timingSafeEqual`), `exigirSesion()` (lee la cookie con `cookies()`, redirige a `/panel/entrar` si no vale) y el nombre/opciones de la cookie (path `/panel`, 30 días)
- [X] T008 `src/lib/acceso.ts` y `src/app/galeria/[slug]/{page.tsx,acciones.ts}`: la cookie de acceso firma `slug:clave_version` (research R7); `getGaleria` en `src/content/galerias.ts` devuelve `claveVersion`
- [X] T009 [P] Crear `src/lib/r2.ts` (servidor): cliente S3 desde las `R2_*`; `empezarMultipart`, `firmarPartes` (15 min), `completarMultipart`, `abortarMultipart`, `borrarPrefijo(bucket, prefijo)` (lista + `DeleteObjects` de a 1.000 + aborta multipart pendientes)
- [X] T010 `src/content/fotos.ts`: `getFotos` filtra `estado = 'lista'`; `src/app/galeria/[slug]/page.tsx` muestra "Esta galería se está preparando" en lugar de placeholders cuando la galería no tiene fotos listas pero sí pendientes
- [X] T011 Crear `scripts/panel/probar.ts` según `contracts/panel.md` § Comandos (slug, sesión firmada y vencida, cookie de acceso con versión, `ordenNatural`, id con WebCrypto igual a `nombreDeHash`)
- [X] T012 Quickstart §1.4: `npm run db:migrar` contra Railway (`✓ 002-panel.sql`)

**Checkpoint**: verify verde y la base migrada; el sitio público sigue igual.

---

## Phase 3: User Story 1 — Entrar al panel (P1) 🎯

**Goal**: solo Romi entra a `/panel`.

**Independent Test**: quickstart §2.

- [X] T013 [US1] Crear `scripts/admin/clave.ts` (`npm run admin:clave`): pide la clave dos veces sin mostrarla, imprime `hashearClave`
- [X] T014 [US1] Crear `src/proxy.ts` con matcher `/panel/:path*` excepto `/panel/entrar`: sin cookie con firma válida → redirect a `/panel/entrar`
- [X] T015 [US1] Crear `src/app/panel/entrar/page.tsx` y `acciones.ts` (`entrar`): mail + clave contra `ADMIN_EMAIL`/`ADMIN_CLAVE_HASH`, scrypt siempre (mismo tiempo), mismo mensaje, `intentos_login` por IP (5 en 15 min, research R1), cookie de `src/lib/sesion.ts`
- [X] T016 [US1] Crear `src/app/panel/layout.tsx` (solo `robots` noindex, lo heredan todas) y el route group `src/app/panel/(privado)/layout.tsx` con `exigirSesion()` y la barra con "Cerrar sesión" (acción `salir`). `/panel/entrar` queda fuera del grupo, así no hay loop de redirecciones; la lista y las galerías van dentro de `(privado)`
- [X] T017 [US1] Crear `src/app/panel/(privado)/page.tsx` mínima, con `exigirSesion()` al principio, (lista de títulos) para probar el login; se completa en US3

**Checkpoint**: quickstart §2 en local.

---

## Phase 4: User Story 2 — Crear una galería y subirle fotos (P1)

**Goal**: Romi crea una galería y arrastra la carpeta; las fotos aparecen listas.

**Independent Test**: quickstart §3.

- [X] T018 [US2] `src/content/galerias.ts`: `crearGaleria({titulo, fecha, clave, venceEl})` con `slugDeTitulo` + `sufijoAleatorio` y reintento si choca
- [X] T019 [US2] Crear `src/app/panel/(privado)/galerias/nueva/page.tsx` (con `exigirSesion()`) y la acción `crearGaleria` en `src/app/panel/(privado)/galerias/acciones.ts` (exigirSesion, vencimiento precargado a un mes)
- [X] T020 [US2] Acciones `empezarSubida`, `terminarSubida`, `reintentar` y `estadoGaleria` en `src/app/panel/(privado)/galerias/[slug]/acciones.ts` (cada una con `exigirSesion()`) según `contracts/panel.md` y research R3/R4 (filas `subiendo`, recálculo de `posicion` por `nombre`, despertar al worker con `fetch(WORKER_URL + "/procesar")` sin esperar)
- [X] T021 [US2] Crear `src/app/panel/(privado)/galerias/[slug]/Subida.tsx` (cliente): zona para soltar la carpeta o elegir archivos, saltea lo que no es JPEG con aviso, calcula el id con WebCrypto, 4 fotos en paralelo, partes de 8 MB, avance por foto, retoma al volver a soltar
- [X] T022 [US2] Crear `scripts/worker/cola.ts`: `tomarSiguiente` (`FOR UPDATE SKIP LOCKED`), `liberarColgadas` (> 10 min), `marcarLista`, `marcarError`
- [X] T023 [US2] Crear `scripts/worker/index.ts`: servidor `node:http` en `PORT`, `POST /procesar` con `WORKER_SECRETO` → 202 y vaciar la cola; al arrancar también la vacía. Por foto: bajar original del bucket privado, verificar hash = id, `procesarFoto`, subir derivadas con el cache de un año, `marcarLista`
- [X] T024 [P] [US2] Crear `railway.worker.json`: sin build de Next (`buildCommand` que no compile), `startCommand` `npm run worker`, sin `preDeployCommand` ni healthcheck HTTP público
- [ ] T025 **(Mateo)** Quickstart §1.1–1.3: variables de la app (`npm run admin:clave`), servicio `worker` con `railway.worker.json`, `WORKER_URL`, CORS del bucket privado
- [ ] T026 [US2] Quickstart §3 en local (`npm run dev` + worker de Railway, o `npm run worker` local con `WORKER_URL=http://localhost:<puerto>`)

**Checkpoint**: una galería creada y llena desde el panel se ve en el sitio.

---

## Phase 5: User Story 3 — Compartir, cambiar y borrar (P2)

**Goal**: Romi maneja sus galerías sin ayuda.

**Independent Test**: quickstart §4.

- [X] T027 [US3] `src/content/galerias.ts`: `listarGalerias()` (con conteo de fotos listas), `editarGaleria` (clave nueva → hash y `clave_version + 1`), `borrarGaleria` (research R8 con `borrarPrefijo` en los dos buckets, después la base)
- [X] T028 [US3] `src/app/panel/(privado)/page.tsx` completa (con `exigirSesion()`): título, fotos, vencimiento, estado (vigente / ≤ 7 días / vencida), "Nueva galería"
- [X] T029 [US3] `src/app/panel/(privado)/galerias/[slug]/page.tsx` (con `exigirSesion()`; la crea T026 si hace falta antes): "Copiar link" (cliente, `navigator.clipboard`), formulario de clave y vencimiento, "Borrar galería" que pide escribir el título; acciones `editarGaleria` y `borrarGaleria`
- [ ] T030 [US3] Quickstart §4

---

## Phase 6: Polish

- [X] T031 [P] `ARCHITECTURE.md` (panel, proxy, worker, cola, `src/lib/r2.ts`), `SECURITY.md` (login del panel, sesión, límite de intentos, variables), `docs/processes/dev-setup.md` (variables nuevas, `admin:clave`, correr el worker en local)
- [ ] T032 Mergear a `master`, quickstart §2–§5 en Railway, anotar en `plan.md` § Verificación
- [ ] T033 Revisar que el diff no tenga el mail de Romi, hashes, secretos ni slugs reales (FR-015, principio VI)

---

## Dependencies & Execution Order

- Setup → Foundational → US1 → US2 → US3 → Polish.
- T012 (migración) bloquea todo lo que corre contra la base.
- US2 necesita la sesión de US1 (todas las acciones la exigen).
- US3 usa `src/lib/r2.ts` (T009) y la lista de US1.
- T025 (Mateo) bloquea T026 y la parte publicada de T032.

## Parallel Opportunities

- T002 y T003 con T001.
- T005, T006, T007 y T009 entre sí.
- T024 con el resto de US2.

## Implementation Strategy

MVP = Phase 1–4: Romi entra, crea una galería y la llena desde el navegador.
US3 completa el ciclo de vida. Nada de esto habilita galerías reales hasta
saldar la deuda de la 002 (Pixieset) y la de la 003 (respaldo y base de
desarrollo).
