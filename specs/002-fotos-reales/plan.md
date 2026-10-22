---
ticket: none
status: active
covers:
  - scripts/fotos/
  - src/
  - package.json
  - package-lock.json
  - tsconfig.json
  - .gitignore
  - .env.example
  - specs/002-fotos-reales/
  - .specify/memory/constitution.md
verify: npm run typecheck && npm run build && npm run fotos:probar
analyzed: 2026-10-21
---

<!--
Harness frontmatter:
- ticket: known Jira key, or none when there is no ticket.
- status: draft until a human promotes the analyzed plan to active.
- covers: repository-relative path prefixes this feature may edit.
- verify: command that proves the feature works; run until green.
- analyzed: date the /speckit-analyze report was read before promotion.
-->

# Implementation Plan: Fotos reales — derivadas y grilla con imágenes

**Branch**: `galerias-y-harness` | **Date**: 2026-10-21 | **Spec**: `specs/002-fotos-reales/spec.md`

## Summary

Cierra la parte técnica de la fase 1 del roadmap. Un script local
(`npm run fotos`) toma una carpeta de JPEG y genera las 8 derivadas de cada
foto en sRGB, sin GPS y con nombre de hash. Además saca ancho, alto y
ThumbHash, escribe un manifiesto y, si se le pide, sube todo a R2: las
derivadas a un bucket público y, solo en las galerías, el original intacto a
un bucket privado. El sitio lee esos manifiestos detrás de un getter y la
grilla y el lightbox dibujan las fotos reales con `<picture>` AVIF/WebP, carga
diferida y ThumbHash de fondo. Sin manifiesto, todo sigue con las fotos de
mentira. La galería pierde el botón del .zip.

## Technical Context

**Language/Version**: TypeScript 5.9. Sitio en Node ≥ 20.9; el script pide
Node ≥ 22.9 (strip-types y `--env-file-if-exists`, research R1).

**Primary Dependencies**: Next.js 16.4, React 19.3. Se suman `thumbhash`
0.1.1 (dependencia: lo usa el navegador), `sharp` 0.35 y `@aws-sdk/client-s3`
3.x (devDependencies: solo el script).

**Storage**: manifiestos JSON locales (`manifiestos/`, ignorado por git);
Cloudflare R2 con dos buckets (research R5). Sin base de datos: es la 003.

**Testing**: sin runner. `npm run fotos:probar` (asserts sobre JPEG
sintéticos, R10) más el quickstart en el navegador.

**Target Platform**: web; el script corre en la compu de quien sube
(Windows en el caso de Mateo).

**Project Type**: sitio web + herramienta de línea de comandos.

**Performance Goals**: CLS 0; primera fila no más lenta que Pixieset con
"Fast 4G" (SC-003); 300 fotos en menos de 30 min (SC-005).

**Constraints**: ningún byte de imagen pasa por la app (sin `next/image`, sin
`public/`); el original se sube sin modificar; nada real entra en git.

**Scale/Scope**: ~50 fotos para la prueba; diseñado para galerías de ~300
(~4 GB).

## Constitution Check

- **I. Romi's site, not a platform**: un solo prefijo `romi/`, los datos van
  detrás de un getter en `src/content/` y no se agrega nada multi-tenant.
  Cumple.
- **II. Fast, faithful, cheap**: cada foto lleva ancho, alto y ThumbHash; las
  derivadas se sirven con srcset y carga diferida, y la prioridad va a la
  primera fila (R9). Costo: unos centavos de storage en R2 y operaciones
  dentro del free tier. Cumple.
- **III. Photo bytes never touch the app**: las imágenes salen de
  `NEXT_PUBLIC_IMG_HOST` (R2); no se usa `next/image` ni `public/`; el script
  sube directo a R2 desde la compu de quien sube. Cumple.
- **IV. The original is sacred**: el original se sube byte por byte y se
  verifica con hash (SC-006). Las derivadas son AVIF + WebP en sRGB, sin GPS,
  y se comparan contra Pixieset antes de darlas por buenas (quickstart §4).
  Cumple.
- **V. Identity over cloning**: no cambia la identidad visual; el fundido al
  cargar usa las variables de `theme.css`. Cumple.
- **VI. Clients' photos are private**: los nombres son de hash, no
  secuenciales. Los originales van a un bucket privado (R5). Una galería
  cerrada no deja ninguna ruta en el HTML (FR-014). Manifiestos y fotos quedan
  fuera de git; las pruebas usan `galerias/ejemplo`. Cumple.
- **Scope (1.1.0)**: es el punto 1 del alcance (prueba de concepto) y saca el
  ZIP, alineado con la enmienda 1.1.0. Cumple.
- **Plan-bounded change**: `covers:` arriba. `ARCHITECTURE.md` y `docs/` no
  necesitan cobertura.
- **Verified before done**: `npm run typecheck && npm run build &&
  npm run fotos:probar`, más el quickstart en el navegador.

Re-check después del diseño: sin violaciones; no hace falta Complexity
Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/002-fotos-reales/
├── spec.md, plan.md, research.md, data-model.md, quickstart.md
├── contracts/cli-fotos.md
├── checklists/requirements.md
└── tasks.md            # /speckit-tasks
```

### Source Code

```text
scripts/fotos/
├── procesar.ts         # CLI (contrato en contracts/cli-fotos.md)
├── pipeline.ts         # una foto → derivadas + Foto (sharp, thumbhash, hash)
├── r2.ts               # listar claves existentes y subir lo que falta
└── probar.ts           # verificación con JPEG sintéticos (R10)
src/lib/fotos.ts        # tipo Foto (sale de placeholders.ts) y tipo Manifiesto
src/lib/imagenes.ts     # IMG_HOST desde NEXT_PUBLIC_IMG_HOST; urlOriginal
src/lib/placeholders.ts # importa Foto de fotos.ts; suma posicion
src/content/fotos.ts    # getFotos(destino, respaldo): lee manifiestos/ en el servidor
src/components/Foto.tsx # <picture> + ThumbHash + fundido + error (R9)
src/components/JustifiedGrid.tsx, Lightbox.tsx   # usan Foto si hay thumbhash
src/app/portfolio/[categoria]/page.tsx, src/app/galeria/[slug]/page.tsx
src/content/galerias.ts # sin tieneZip
src/app/globals.css     # estilos de .foto (fundido, fondo)
.gitignore              # manifiestos/, salida/
.env.example            # variables de R2 y NEXT_PUBLIC_IMG_HOST, sin valores
package.json            # scripts fotos y fotos:probar; dependencias
tsconfig.json           # allowImportingTsExtensions
```

**Structure Decision**: el script vive en `scripts/fotos/`, fuera de `src/`,
porque no es parte del sitio. Comparte con el sitio solo `src/lib/imagenes.ts`
y el tipo de `src/lib/fotos.ts`, ambos sin imports, así Node los puede cargar
sin bundler. `ARCHITECTURE.md` se actualiza con el script y el nuevo getter.

## Decisiones de diseño

- **D1 — Dos buckets** (research R5): derivadas en uno público y originales en
  uno privado. Es una decisión de producto y está anotada en la sección 0 del
  doc (21/10/2026).
- **D2 — La versión del pipeline entra en el hash** (R4): las derivadas se
  cachean un año, así que cambiar la calidad tiene que cambiar la URL.
- **D3 — Real o de mentira se decide por `thumbhash`**: `null` dibuja el
  skeleton de siempre y cualquier otro valor dibuja la foto. No hace falta un
  flag aparte (FR-010).
- **D4 — El manifiesto no guarda el nombre de archivo**: puede tener datos
  del cliente, y el orden ya queda en `posicion`.
- **D5 — Portada de galería, inicio y tarjetas de categoría siguen con
  skeleton**: el spec cubre la grilla y el lightbox. Elegir la foto de portada
  es del panel (004).

## Cierre

La feature no pasa a `completed` hasta que se hace la comparación con
Pixieset con Romi (T023, principio IV). `verify:` en verde no alcanza.

## Riesgos

- **Tiempo de codificación AVIF**: si 300 fotos pasan los 30 min (SC-005), se
  baja `effort` antes que la calidad, y se mide de nuevo.
- **`fs` en páginas estáticas**: `/portfolio/[categoria]` se genera en el
  build y lee el manifiesto en ese momento. Hay que hacer el build otra vez
  después de correr el script. En `next dev` se lee en cada request. Queda en
  el quickstart.

## Verificación

- `npm run typecheck && npm run build && npm run fotos:probar`: verde
  (2026-10-21). `probar` cubre derivadas y anchos sin agrandar, sin EXIF/GPS,
  perfil sRGB desde un original P3, orientación EXIF, duplicados, archivos
  que no son JPEG, JPEG roto, orden natural y nombres estables.
- Quickstart §1 y §3 con 30 JPEG **sintéticos** (no fotos de Romi), con las
  derivadas servidas desde `salida/` por un servidor estático aparte en el
  puerto 4000 (`NEXT_PUBLIC_IMG_HOST`). Probado en Chrome headless con "Fast
  4G" y la caché deshabilitada:
  - `/portfolio/social`: CLS 0; el ThumbHash se ve antes que la foto; pide
    solo AVIF; carga diferida (19 de 30 al entrar, 30 después del scroll);
  - en celular (390 px, DPR 3): `thumb`, `medium` y `large`, nunca `xlarge`;
  - lightbox: `large` en 1280 px, precarga de la vecina (con caché aparece en
    3 ms), flechas y Escape;
  - `/portfolio/moda` sin manifiesto: 24 skeletons, ninguna imagen pedida;
  - `/galeria/ejemplo` y `/galeria/ejemplo-vencida` cerradas: ninguna ruta ni
    ThumbHash en el HTML (FR-014). Con la contraseña: 30 fotos, "30 fotos" en
    el encabezado y sin botón de .zip.
- Tiempo con fotos sintéticas de 4 a 8 MP: 30 fotos en 50 s, y 0 s al correr
  de nuevo.
- **Pendiente** (T021, T023): quickstart §2 contra R2 real (hacen falta los
  buckets), ~50 fotos reales de Romi, un lote de ~300 para medir SC-005 y la
  comparación con Pixieset con Romi (§4).
