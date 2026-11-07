# Tasks: Base de datos y hosting en Railway

**Input**: `specs/003-base-de-datos-railway/` (plan, spec, research, data-model, contracts, quickstart)

**Tests**: sin runner (como en la 002). `npm run db:probar` cubre lo que se
puede probar sin base; el resto es el quickstart contra Railway.

Las tareas marcadas **(Mateo)** son acciones en el dashboard de Railway que
el agente no puede ni debe hacer en la cuenta.

## Phase 1: Setup

- [ ] T001 Agregar `postgres` **3.4.9** (versión exacta) a `dependencies`, los scripts `db:migrar`, `db:sembrar` y `db:probar` (mismo patrón que `fotos`: `node --experimental-strip-types --no-warnings --env-file-if-exists=.env.local scripts/db/<x>.ts`) y `engines.node` `>=22.9` en `package.json`; `npm install` para actualizar `package-lock.json`
- [ ] T002 [P] Agregar `DATABASE_URL=` a `.env.example` con un comentario: en Railway es la referencia a la base; en `.env.local`, la URL pública del TCP proxy (research R5). Sin valor

---

## Phase 2: Foundational

- [ ] T003 Crear `db/migraciones/001-inicial.sql` con las tablas `categorias`, `galerias`, `fotos` (PK `(destino, id)`, índice `(destino, posicion)`) y `migraciones`, con los checks de formato de `specs/003-base-de-datos-railway/data-model.md`
- [ ] T004 [P] Crear `scripts/db/conexion.ts`: cliente `postgres` desde `DATABASE_URL`; si falta, mensaje claro y código 1; nunca imprime la URL
- [ ] T005 Crear `scripts/db/migraciones.ts` (listar y ordenar los `.sql`) y `scripts/db/migrar.ts` según `contracts/cli.md` § db:migrar: crea `migraciones` si no existe, aplica en orden por nombre los `.sql` pendientes, cada uno en una transacción junto con su fila en `migraciones`
- [ ] T006 [P] Crear `src/lib/claves.ts` sin imports del sitio (solo `node:crypto`): `hashearClave(clave)` y `verificarClave(clave, hash)` con scrypt y el formato de research R4; un hash con formato inválido devuelve `false`, no tira
- [ ] T007 Crear `scripts/db/sembrar.ts` según `contracts/cli.md` § db:sembrar: upsert de las 4 categorías (mismos slug, nombre y descripción que hoy en `src/content/site.ts`, con `orden`) y de `ejemplo` (vence un año después de hoy) y `ejemplo-vencida` (`2026-09-02`), ambas con `hashearClave("demo")`
- [ ] T008 [P] Crear `src/lib/db.ts`: cliente único del sitio, con un comentario de que solo se importa desde código de servidor, reutilizado entre recargas de `next dev` vía `globalThis`
- [ ] T009 Crear `scripts/db/probar.ts` según `contracts/cli.md` § db:probar (claves, orden de migraciones, `destinoValido`, armado de filas de `fotos`). Las funciones puras viven en módulos sin efectos al importarlos: `scripts/db/migraciones.ts` (listar y ordenar los `.sql`, que usa `migrar.ts`) y `scripts/fotos/base.ts` (armar las filas y escribirlas en la base, que usa `procesar.ts` en T014)
- [ ] T010 **(Mateo)** Quickstart §1: proyecto en Railway con la app desde GitHub (`master`) y Postgres en la misma región, variables `DATABASE_URL` (referencia), `GALERIAS_SECRETO`, `NEXT_PUBLIC_IMG_HOST`; TCP proxy y URL pública en `.env.local`; dominio `*.up.railway.app`. Anotar en el plan la región elegida y si Hobby tiene backups programados
- [ ] T011 Quickstart §2: `npm run db:migrar` y `npm run db:sembrar` dos veces cada uno contra la base de Railway

**Checkpoint**: la base existe, migrada y con los datos de ejemplo.

---

## Phase 3: User Story 1 — Las fotos subidas aparecen en el sitio (P1) 🎯 MVP

**Goal**: el script con `--subir` escribe la base y el sitio lee de ahí.

**Independent Test**: quickstart §3 con `npm run dev` contra la base de Railway.

- [ ] T012 [P] [US1] `src/lib/fotos.ts`: sacar `CATEGORIAS`; `destinoValido` valida solo el formato (`portfolio/[a-z]+` o `galerias/<slug>`); actualizar el comentario de cabecera (la Foto es una fila de la base)
- [ ] T013 [P] [US1] `src/content/fotos.ts`: `getFotos(destino, respaldo)` pasa a `async`, llama a `connection()` de `next/server` y consulta `fotos` por `destino` ordenado por `posicion` con `src/lib/db.ts`; sin filas, `respaldo()`. Sin `node:fs`
- [ ] T014 [US1] `scripts/fotos/procesar.ts`: con `--subir`, exigir `DATABASE_URL` junto a las variables de R2; antes de listar R2, verificar que la categoría o la galería exista (FR-015, `contracts/cli.md`); al terminar, en una transacción (función de `scripts/fotos/base.ts`), borrar las fotos del destino e insertar la lista nueva, e imprimir `Base: N fotos en <destino>`. Sin `--subir`, no conectarse. El manifiesto se sigue escribiendo
- [ ] T015 [US1] `src/app/portfolio/[categoria]/page.tsx`: sacar `generateStaticParams` y `dynamicParams` (research R3), `await getFotos(...)`; slug inexistente → `notFound()`
- [ ] T016 [US1] `src/app/galeria/[slug]/page.tsx`: `await getFotos(...)` solo después de verificar la cookie, como hoy
- [ ] T017 [US1] Quickstart §3 (pasos 1–6) con `npm run dev` y `.env.local` apuntando a Railway

**Checkpoint**: US1 funciona en local contra la base real.

---

## Phase 4: User Story 2 — Publicar sin pasos manuales (P1)

**Goal**: cada merge a `master` se publica solo en Railway.

**Independent Test**: quickstart §4.1, §4.5 y §4.7 en el dominio de Railway.

- [ ] T018 [P] [US2] Crear `railway.json`: builder Railpack, `deploy.preDeployCommand` `npm run db:migrar`, `deploy.startCommand` `npm start`, `deploy.healthcheckPath` `/` (research R7)
- [ ] T019 [P] [US2] Crear `src/app/error.tsx` (client component): mensaje amable con el estilo de `src/app/not-found.tsx` y botón para reintentar; nunca muestra el error ni datos
- [ ] T020 [US2] Mergear a `master` y, cuando Railway termine, quickstart §4.1, §4.2, §4.5, §4.6 y §4.7 en el dominio de Railway

**Checkpoint**: el sitio publicado en Railway reemplaza al preview de Vercel.

---

## Phase 5: User Story 3 — Galerías y categorías salen de la base (P2)

**Goal**: ninguna galería ni categoría escrita en el código.

**Independent Test**: quickstart §4.3, §4.4 y §4.8; `git grep -n '"demo"' src` sin resultados.

- [ ] T021 [P] [US3] `src/content/site.ts`: sacar `categorias`; `getCategorias()` y `getCategoria(slug)` `async` con `connection()` y `src/lib/db.ts` (`contracts/getters.md`)
- [ ] T022 [P] [US3] `src/content/galerias.ts`: sacar el array y `clave`/`cantidadFotos` del tipo; `getGaleria(slug)` `async` sin el hash; `claveCorrecta(slug, clave)` con `verificarClave`; `estaVencida` y `formatearFecha` igual
- [ ] T023 [US3] `src/app/page.tsx` y `src/app/portfolio/page.tsx`: `await getCategorias()` en lugar de `site.categorias`
- [ ] T024 [US3] `src/app/portfolio/[categoria]/page.tsx`: `await getCategoria(...)` en la página y en `generateMetadata`
- [ ] T025 [US3] `src/app/galeria/[slug]/page.tsx` y `acciones.ts`: `await getGaleria(...)`; la acción usa `claveCorrecta`; los placeholders de una galería sin fotos son una constante de 40
- [ ] T026 [US3] Mergear a `master` y quickstart §4.3, §4.4 y §4.8 en Railway; además, ver `noindex` en el HTML de `/galeria/ejemplo` (FR-013)

**Checkpoint**: las tres historias andan en el sitio publicado.

---

## Phase 6: Polish

- [ ] T027 Respaldo (FR-010): si T010 encontró backups programados en Hobby, activarlos y hacer el quickstart §5 con ellos. Si no: crear `scripts/db/respaldar.ts` y `scripts/db/restaurar.ts` según `contracts/cli.md` (reusan `scripts/fotos/r2.ts` para subir/bajar del bucket privado), sus scripts en `package.json`, el servicio cron en Railway **(Mateo)** y quickstart §5
- [ ] T028 [P] Actualizar `ARCHITECTURE.md` (Postgres en Railway, `db/`, `scripts/db/`, getters async, render por pedido) y `docs/processes/dev-setup.md` (`DATABASE_URL` en `.env.local`, `db:migrar`, `db:sembrar`; una sola base hasta la 004)
- [ ] T029 Correr `verify:` y anotar en `specs/003-base-de-datos-railway/plan.md` § Verificación los resultados de todo el quickstart, más el consumo que muestra la pestaña *Usage* de Railway después de unos días con el sitio publicado (SC-004)
- [ ] T030 Revisar que `git status`/el diff no tengan `.env.local`, URLs de la base, slugs reales ni contraseñas distintas de `demo` (FR-011, FR-012)

---

## Dependencies & Execution Order

- Setup (T001–T002) → Foundational (T003–T011) → US1 → US2 → US3 → Polish.
- T010 (Mateo) bloquea T011, y T011 bloquea todo lo que corre contra la base.
- US2 depende de US1: publicar sin US1 deja un build que todavía lee
  manifiestos (que en Railway no existen).
- US3 depende de US1 (mismo cliente y mismo patrón de getters) y toca
  archivos que US1 ya cambió (`portfolio/[categoria]`, `galeria/[slug]`): va
  después.
- T027 depende de lo que encuentre T010.

## Parallel Opportunities

- T002 con T001.
- T004, T006 y T008 entre sí (archivos distintos, sin dependencias).
- T012 y T013 entre sí.
- T018 y T019 entre sí.
- T021 y T022 entre sí.

## Implementation Strategy

MVP = Phase 1–3: con eso las fotos ya salen de la base y se ve en local.
US2 lo publica y retira el preview de Vercel. US3 termina de sacar contenido
del código. Cada merge a `master` deja el sitio andando.
