---
ticket: none
status: active
covers:
  - src/
  - scripts/
  - db/migraciones/
  - package.json
  - ARCHITECTURE.md
  - specs/005-portadas-y-fotos-del-sitio/
verify: npm run typecheck && npm run build && npm run fotos:probar && npm run db:probar && npm run panel:probar && npm run portfolio:probar
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

# Implementation Plan: Portadas y fotos del sitio

**Branch**: `005-portadas-y-fotos-del-sitio` | **Date**: 2026-11-16 | **Spec**: `specs/005-portadas-y-fotos-del-sitio/spec.md`

## Summary

Llenar con fotos de Romi todo lo que hoy es relleno alrededor del portfolio y
darle a ella la elección desde el panel. La portada de cada categoría se guarda
como columna en `categorias` y los recientes en una tabla aparte, las dos por
id de foto (el hash del contenido), así sobreviven a resubir las fotos. Las
fotos de Romi entran como dos destinos nuevos `sitio/portada` y
`sitio/sobremi`, subidos con el mismo script y pipeline. Para compartir el
link, el pipeline suma una derivada JPEG 1200 × 630 (`-og.jpg`) solo para
portfolio y sitio, sin cambiar `PIPELINE`. El inicio pasa a portada en dos
columnas, tarjetas con portada y recientes reales (marcadas por Romi primero,
completadas con una mezcla determinística). El panel suma `/panel/portfolio`.

## Technical Context

**Language/Version**: TypeScript 5.9, Node ≥ 22.9.

**Primary Dependencies**: Next.js 16.4, React 19.3, `postgres` 3.4.9, `sharp`
0.35 (derivada og). Nada nuevo.

**Storage**: Postgres (migración `003-portadas.sql`), R2 bucket público (las
`-og.jpg`).

**Testing**: sin runner. Nuevo `npm run portfolio:probar` (sin base ni red),
los `probar` existentes y el quickstart contra Railway.

**Target Platform**: app en Railway; sitio y panel en Chrome, Edge, Safari y
celular.

**Project Type**: web (Next.js App Router) + scripts de Node.

**Performance Goals**: el inicio no salta mientras carga (SC-005); la portada
y las tarjetas se piden con prioridad; los recientes, lazy.

**Constraints**: imágenes nunca por la app (principio III); sin nombres de
clientes en el repo (principio VI); el build no necesita la base.

**Scale/Scope**: 4 categorías, ~160 fotos de portfolio, 2 fotos de Romi, 12
recientes.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Romi's site, not a platform** — ✅ El panel suma lo justo que Mateo
  pidió (portada y recientes), no un CMS. Las elecciones viven en la base.
- **II. Fast, faithful, cheap** — ✅ Toda foto nueva en pantalla lleva width,
  height y ThumbHash; las tarjetas usan caja fija 4:5 y la portada usa la
  proporción real: sin saltos. Costo: ~200 JPEG de ~250 KB más en R2 (≈50 MB).
- **III. Photo bytes never touch the app** — ✅ La og es un archivo en R2;
  descartado `opengraph-image` de Next justamente por esto (research R3).
- **IV. The original is sacred** — ✅ El pipeline de las derivadas existentes
  no cambia; la og es sRGB como el resto. Los originales no se tocan.
- **V. Identity over cloning** — ✅ La portada con la foto del lente es
  identidad propia, no un rasgo de Pixieset.
- **VI. Clients' photos are private** — ✅ Las galerías nunca declaran una
  foto propia para compartir (FR-013); el repo no lleva nombres de carpetas ni
  de clientes; las fotos de Romi son de la dueña del sitio.
- **Plan-bounded change** — ✅ `covers:` arriba.
- **Verified before done** — ✅ `verify:` arriba, más el quickstart.

Re-check después del diseño: sin cambios. Nota: `ARCHITECTURE.md` dice que
cambiar el pipeline obliga a cambiar `PIPELINE`; se aclara que eso vale cuando
cambian las derivadas existentes, no al agregar una nueva (research R3).

## Project Structure

### Documentation (this feature)

```text
specs/005-portadas-y-fotos-del-sitio/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/panel-portfolio.md
└── tasks.md             # /speckit-tasks
```

### Source Code (repository root)

```text
db/migraciones/003-portadas.sql          # nueva: portada, recientes, CHECK sitio/*
src/lib/fotos.ts                         # destinoValido + usos de sitio/*
src/lib/imagenes.ts                      # claveOg / urlOg
src/lib/recientes.ts                     # nueva: armarRecientes (pura)
src/content/site.ts                      # getCategorias con portada
src/content/portfolio.ts                 # nueva: getRecientes, getFotoSitio, lecturas del panel
src/components/Foto.tsx                  # prop recorte
src/components/CategoriaCard.tsx         # dibuja la portada
src/app/layout.tsx                       # generateMetadata con og
src/app/page.tsx                         # hero en dos columnas, recientes, sobre mí
src/app/sobre-mi/page.tsx                # foto de Romi
src/app/portfolio/page.tsx               # tarjetas con portada
src/app/portfolio/[categoria]/page.tsx   # og de la portada, alt
src/app/globals.css                      # .hero en dos columnas, tarjetas, panel
src/app/panel/(privado)/layout.tsx       # link Portfolio
src/app/panel/(privado)/portfolio/       # nueva: page, [categoria]/page, acciones.ts
scripts/fotos/pipeline.ts                # derivada og para portfolio y sitio
scripts/fotos/procesar.ts                # og esperada al reutilizar
scripts/fotos/base.ts                    # destinoExiste para sitio/*
scripts/fotos/probar.ts                  # og en el pipeline
scripts/db/probar.ts                     # destinos sitio/*
scripts/portfolio/probar.ts              # nueva: armarRecientes
package.json                             # script portfolio:probar
ARCHITECTURE.md                          # destinos sitio/*, og, sección del panel
```

**Structure Decision**: el mismo layout del repo; una carpeta de rutas nueva en
el panel y un getter nuevo en `src/content/`. El worker (`scripts/worker/`) no
cambia: las galerías no generan og.

## Complexity Tracking

Sin violaciones.
