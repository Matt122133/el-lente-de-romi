---
ticket: none
status: completed
covers:
  - src/
  - scripts/
  - db/
  - package.json
  - package-lock.json
  - railway.json
  - .env.example
  - ARCHITECTURE.md
  - docs/processes/dev-setup.md
  - specs/003-base-de-datos-railway/
verify: npm run typecheck && npm run build && npm run fotos:probar && npm run db:probar
analyzed: 2026-11-06
---

<!--
Harness frontmatter:
- ticket: known Jira key, or none when there is no ticket.
- status: draft until a human promotes the analyzed plan to active.
- covers: repository-relative path prefixes this feature may edit.
- verify: command that proves the feature works; run until green.
- analyzed: date the /speckit-analyze report was read before promotion.
-->

# Implementation Plan: Base de datos y hosting en Railway

**Branch**: `003-base-de-datos-railway` | **Date**: 2026-11-06 | **Spec**: `specs/003-base-de-datos-railway/spec.md`

## Summary

Las categorías, las galerías y las fotos pasan de archivos (código y
manifiestos locales) a una base Postgres en Railway, y el sitio se publica en
Railway desde `master` sin pasos manuales. Los getters de `src/content/`
mantienen sus nombres, se vuelven `async` y consultan la base en cada pedido
(`connection()`, research R3), así el build no necesita la base y lo que se
sube se ve al instante. El script de fotos, con `--subir`, verifica que el
destino exista y reemplaza sus fotos en la base en una transacción. La
contraseña de galería se guarda con scrypt. Migraciones en SQL versionadas que
Railway corre antes de cada deploy, un comando que carga los datos de ejemplo
y un respaldo diario (de Railway, o un script a R2 si Hobby no lo tiene).

## Technical Context

**Language/Version**: TypeScript 5.9; Node ≥ 22.9 en todos lados (scripts con
strip-types, R7). Local: 22.15.

**Primary Dependencies**: Next.js 16.4, React 19.3; se suma `postgres` 3.4.9
(dependencia, R1). Hash con `node:crypto` (R4).

**Storage**: Postgres en Railway (metadata, R5); fotos en R2 como en la 002.
`manifiestos/` queda solo como caché local del script (R8).

**Testing**: sin runner. `npm run fotos:probar` (002) y `npm run db:probar`
(sin base, contracts/cli.md), más el quickstart contra Railway.

**Target Platform**: Railway (servidor Node, `next start`); scripts en la
compu de quien sube (Windows).

**Project Type**: sitio web + herramientas de línea de comandos.

**Performance Goals**: fotos visibles < 1 min después de subir (SC-001);
deploy < 10 min (SC-002); primera fila no más lenta que el preview de Vercel
(SC-003).

**Constraints**: ningún byte de imagen en la app ni en la base; build sin
acceso a la base; nada real en el repo; credenciales solo en variables.

**Scale/Scope**: ~100 fotos de prueba; diseñado para ~10 galerías vivas de
~300 fotos (~3.000 filas).

## Constitution Check

- **I. Romi's site, not a platform**: es una de las tres concesiones que la
  constitución pide ("content lives in the database"). Sin tenants, sin
  panel. Cumple.
- **II. Fast, faithful, cheap**: `width`, `height` y ThumbHash siguen en cada
  foto. El HTML pasa de estático a armarse por pedido: una consulta de unos
  ms en la red interna; se mide contra el preview (SC-003, quickstart §4.6).
  Costo: la app y la base entran en el consumo del plan Hobby que Mateo ya
  paga por otro proyecto (SC-004). Supera el objetivo de ~USD 3 solo si el
  consumo pasa los USD 5 incluidos; se revisa con el uso real. Cumple, con
  esa salvedad anotada.
- **III. Photo bytes never touch the app**: la base guarda rutas y metadata;
  las imágenes siguen saliendo de R2 (`r2.dev` hasta el dominio propio, como
  en la 002); la subida sigue siendo del script a R2. Cumple.
- **IV. The original is sacred**: no cambia el pipeline de derivadas ni los
  originales. La deuda de la 002 sigue abierta y sigue bloqueando galerías
  reales. Cumple.
- **V. Identity over cloning**: no cambia nada visual. Cumple.
- **VI. Clients' photos are private**: contraseña con hash lento (R4), la
  galería cerrada sigue sin rutas en el HTML, el respaldo va al bucket
  privado y nunca a GitHub (R6), y en el repo solo hay slugs inventados.
  Cumple.
- **Scope**: infraestructura de los puntos 2 y 3 del alcance; no agrega
  funciones. Cumple.
- **Plan-bounded change**: `covers:` arriba. `docs/processes/dev-setup.md`
  porque cambia el setup local (`DATABASE_URL`).
- **Verified before done**: `verify:` arriba, más el quickstart §1–§5 contra
  Railway.

Re-check después del diseño: sin violaciones; no hace falta Complexity
Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/003-base-de-datos-railway/
├── spec.md, plan.md, research.md, data-model.md, quickstart.md
├── contracts/getters.md, contracts/cli.md
├── checklists/requirements.md
└── tasks.md            # /speckit-tasks
```

### Source Code

```text
db/migraciones/001-inicial.sql   # categorias, galerias, fotos, migraciones
scripts/db/
├── conexion.ts         # cliente postgres desde DATABASE_URL (scripts)
├── migraciones.ts      # listar y ordenar los .sql (sin efectos al importar)
├── migrar.ts           # npm run db:migrar (R2)
├── sembrar.ts          # npm run db:sembrar (categorías y galerías de ejemplo)
├── respaldar.ts        # condicional (R6)
├── restaurar.ts        # condicional (R6)
└── probar.ts           # npm run db:probar
scripts/fotos/base.ts            # filas de fotos y reemplazo en la base (sin efectos al importar)
scripts/fotos/procesar.ts        # --subir: valida destino y escribe la base
src/lib/db.ts           # cliente único del sitio (server-only)
src/lib/claves.ts       # hashear / verificar (scrypt), sin imports del sitio
src/lib/fotos.ts        # sin la lista CATEGORIAS; destinoValido solo formato
src/content/site.ts     # sin categorias; getCategorias/getCategoria async
src/content/galerias.ts # sin el array; getGaleria/claveCorrecta async
src/content/fotos.ts    # getFotos async desde la base
src/app/page.tsx, src/app/portfolio/page.tsx              # await getCategorias()
src/app/portfolio/[categoria]/page.tsx                    # sin generateStaticParams
src/app/galeria/[slug]/page.tsx, acciones.ts              # await; claveCorrecta
src/app/error.tsx       # error amable si la base falla
railway.json            # build, preDeploy db:migrar, start, healthcheck (R7)
package.json            # postgres; scripts db:*; engines node >=22.9
.env.example            # DATABASE_URL, sin valor
ARCHITECTURE.md, docs/processes/dev-setup.md
```

**Structure Decision**: SQL y migraciones en `db/` (no son código del sitio
ni de un script en particular); los scripts de base en `scripts/db/`, junto a
`scripts/fotos/`. El hash de claves vive en `src/lib/claves.ts` sin imports
para que lo carguen el sitio y `sembrar.ts` sin bundler, el mismo criterio
que `src/lib/fotos.ts` en la 002.

## Decisiones de diseño

- **D1 — Railway para app y base**: decisión de producto (hosting) que va a
  la sección 0 del doc con el motivo: Vercel Hobby no permite uso comercial y
  el deploy manual con manifiestos es frágil; Railway junta todo en el plan
  que Mateo ya paga. Hasta que el MCP de gdocs vuelva, queda en la deuda
  Medium ya abierta.
- **D2 — Render por pedido, sin caché** (R3).
- **D3 — Una sola base hasta la 004** (R5).
- **D4 — Fotos con destino de texto y sin FK** (data-model): el script
  verifica la existencia; el borrado de galerías llega con el panel.
- **D5 — Las galerías de ejemplo se siembran, no se crean** (FR-015): la
  `ejemplo` vence un año después de sembrar para que la demo no se apague
  sola.

## Riesgos

- **Primera fila más lenta que en Vercel** (SC-003): el HTML ya no sale de
  una CDN sino de una región de Railway. Si se nota, se prueba caché de
  página (ISR con `revalidate`) en una feature aparte, no acá.
- **Una base para dev y producción** (R5): un error en local afecta lo
  publicado. Aceptable con datos de prueba; se separa antes de la primera
  galería real (004).
- **Backups en Hobby** (R6): si no existen, la tarea del script es
  obligatoria, no opcional.

## Verificación

- `verify:` verde (2026-11-06): typecheck, build (con `.next` limpio; `/`,
  `/portfolio`, `/portfolio/[categoria]` y `/galeria/[slug]` quedan dinámicas
  y el build no toca la base), `fotos:probar` y `db:probar` → `OK`.
- Railway: app `el-lente-de-romi` desde la rama `003-base-de-datos-railway`
  y Postgres con volumen y backups disponibles en Hobby (R6: no hace falta el
  script de respaldo). Mateo puso la app en modo serverless (se apaga sin
  tráfico: la primera visita después de dormir tarda más).
- Quickstart §2: `db:migrar` → `✓ 001-inicial.sql`, otra vez `Base al día`;
  `db:sembrar` dos veces → 4 categorías y 2 galerías, sin duplicar; la clave
  guardada es `scrypt$32768$8$…`.
- Quickstart §3: 50 fotos de prueba a `portfolio/social` y a
  `galerias/ejemplo` → `Base: 50 fotos`; `galerias/no-existe` → código 1 y
  nada en ningún bucket; 5 y después 3 a `portfolio/moda` → quedan 3 (después
  se borraron a mano para que `moda` siga con placeholders); sin `--subir`
  no se conecta a la base.
- Quickstart §4 en `el-lente-de-romi-production.up.railway.app` (deploy
  `07f69bd`): todas las páginas 200 en 0,4–1,3 s; `/portfolio/no-existe` y
  `/galeria/no-existe` 404; `/portfolio/social` con 50 fotos de `r2.dev` y
  ninguna imagen servida por Railway; galería cerrada sin hashes y con
  `noindex, nofollow`; vencida con su fecha; categorías desde la base en el
  mismo orden.
- §4.3: Mateo entró a `/galeria/ejemplo` con `demo` en el navegador y anda.
- §4.7 / SC-002: PR #4 mergeado a `master` y la app de Railway pasada a
  `master`; el push disparó el deploy de `2e2f804` solo.
- No probados: base apagada (§4.8; el código tiene `error.tsx`).

## Cierre (2026-11-06)

Completada, con dos cosas pasadas a `docs/tech-debt-tracker.md`:

- **Respaldo (FR-010, SC-006, T027)**: Railway solo tiene backups en el plan
  Pro. Deuda Medium, a resolver antes de la primera galería real (004) con el
  script de research R6. Hoy la base se rearma desde los comandos y R2.
- **Consumo (SC-004)**: se confirma mirando *Usage* en unos días. Deuda Low.

La decisión de hosting (Railway; Vercel descartado) va a la sección 0 del
doc cuando vuelva el MCP de gdocs (deuda Medium ya abierta).
