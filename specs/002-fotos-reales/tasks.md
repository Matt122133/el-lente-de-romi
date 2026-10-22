---

description: "Task list for 002-fotos-reales"
---

# Tasks: Fotos reales — derivadas y grilla con imágenes

**Input**: `specs/002-fotos-reales/plan.md`, `spec.md`, `research.md`,
`data-model.md`, `contracts/cli-fotos.md`, `quickstart.md`

**Tests**: no hay runner. La verificación del script es
`scripts/fotos/probar.ts` (research R10), que es parte de `verify:`. El sitio
se verifica con el quickstart en el navegador.

## Phase 1: Setup

- [X] T001 Sumar `thumbhash@0.1.1` a dependencies y `sharp@0.35.5` y `@aws-sdk/client-s3@^3` a devDependencies, más los scripts `"fotos": "node --experimental-strip-types --env-file-if-exists=.env.local scripts/fotos/procesar.ts"` y `"fotos:probar": "node --experimental-strip-types scripts/fotos/probar.ts"`, en `package.json` y `package-lock.json` (con `npm install`)
- [X] T002 [P] Agregar `"allowImportingTsExtensions": true` en `tsconfig.json` (research R1)
- [X] T003 [P] Ignorar `manifiestos/` y `salida/` en `.gitignore`
- [X] T004 [P] Crear `.env.example` con `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_BUCKET_ORIGINALES` y `NEXT_PUBLIC_IMG_HOST`, sin valores y con un comentario por variable (contracts/cli-fotos.md)

## Phase 2: Foundational

- [X] T005 Crear `src/lib/fotos.ts` con el tipo `Foto` (suma `posicion`), el tipo `Manifiesto` y la validación del destino (data-model.md). Sin imports, así Node lo carga sin bundler.
- [X] T006 Hacer que `src/lib/placeholders.ts` importe `Foto` de `src/lib/fotos.ts` y complete `posicion` en `fotosDeMentira`; ajustar los imports de `Foto` en `src/components/JustifiedGrid.tsx` y `src/components/Lightbox.tsx`
- [X] T007 En `src/lib/imagenes.ts`, tomar `IMG_HOST` de `process.env.NEXT_PUBLIC_IMG_HOST` con `https://img.ellentederomi.com` como default (research R7); que siga sin imports

## Phase 3: User Story 1 — Preparar un lote de fotos (P1) 🎯 MVP

**Goal**: el script deja derivadas, manifiesto y, con `--subir`, todo en R2.

**Independent Test**: `npm run fotos:probar` termina en `OK`, y después el
quickstart §1 y §2.

- [X] T008 [US1] Implementar `procesarFoto(bytes, destino)` en `scripts/fotos/pipeline.ts`:
  - nombre = sha256(`PIPELINE` + bytes), 32 hex (R4);
  - `rotate()`, y ancho y alto ya rotados;
  - las 4 variantes × AVIF/WebP con `withoutEnlargement`, `withIccProfile("srgb")` y las calidades de R2 en una constante junto a `PIPELINE`;
  - ThumbHash desde 100 px RGBA (R3);
  - devuelve los buffers con sus claves (vía `urlDerivada` sin host) y la `Foto` sin `posicion`.
- [X] T009 [US1] Implementar en `scripts/fotos/r2.ts`:
  - el cliente S3 contra `https://<R2_ACCOUNT_ID>.r2.cloudflarestorage.com`;
  - `clavesExistentes(bucket, prefijo)` con `ListObjectsV2` paginado;
  - `subir(bucket, clave, bytes, contentType, cacheControl?)`;
  - `variablesFaltantes()`;
  - todo según research R6.
- [X] T010 [US1] Implementar el CLI en `scripts/fotos/procesar.ts` según `contracts/cli-fotos.md`:
  - parseo de flags y validación del destino;
  - chequeo de variables antes de procesar;
  - procesa los `.jpg`/`.jpeg` de la carpeta en orden natural (`Intl.Collator` con `numeric: true`) y avisa por cada archivo que no lo sea;
  - saltea los JPEG rotos con aviso y deduplica por nombre de hash, quedándose con el primero en orden natural;
  - escribe las derivadas en `--salida` (default `salida/`) y el manifiesto en `--manifiestos` (default `manifiestos/`) como `<destino>.json`;
  - con `--subir`, sube lo que falta: derivadas al bucket público con caché inmutable y, solo para `galerias/`, el original sin tocar al bucket privado, hasta 4 en paralelo;
  - imprime el progreso y el resumen.
- [X] T011 [US1] Implementar `scripts/fotos/probar.ts` (research R10). Genera en una carpeta temporal cuatro JPEG con sharp: uno vertical en P3 con EXIF de GPS, uno de 1200 px, uno horizontal con `orientation: 6` y un duplicado con otro nombre, con nombres `2.jpg`, `10.jpg`, `11.jpg` y `copia.jpg`, más un `notas.txt`. Después corre el CLI en modo local dos veces con destino `galerias/prueba` y `--salida` y `--manifiestos` en carpetas temporales (nunca los `salida/` y `manifiestos/` del repo) y comprueba:
  - las cantidades y los anchos;
  - que no se agranda;
  - que no hay GPS y el perfil es sRGB;
  - que la foto con orientación 6 queda con ancho y alto intercambiados;
  - el aviso por `notas.txt`;
  - la deduplicación, el orden natural y los nombres estables.

  Imprime `OK` o sale con 1.

**Checkpoint**: `npm run fotos:probar` en verde; el quickstart §1 con fotos reales.

## Phase 4: User Story 2 — Ver fotos reales en el portfolio (P1)

**Goal**: la grilla y el lightbox dibujan las fotos reales con su versión borrosa y sin saltos.

**Independent Test**: quickstart §3, pasos 1 a 5.

- [X] T012 [P] [US2] Crear `src/content/fotos.ts` con `getFotos(destino, respaldo)`: lee `manifiestos/<destino>.json` con `fs` desde `process.cwd()`, devuelve sus fotos ordenadas por `posicion` o `respaldo()` si no hay archivo. Comentario de solo servidor, como en `lib/acceso.ts`.
- [X] T013 [P] [US2] Crear `src/components/Foto.tsx` (`"use client"`) según research R9:
  - contenedor con `aspect-ratio`;
  - fondo con `thumbHashToDataURL` en `useMemo`;
  - `<picture>` con AVIF y WebP vía `srcSet()`, y un `<img>` con `width`, `height`, `alt`, `sizes`, `loading` y `fetchPriority` por prop `prioridad`;
  - fundido al cargar y la imagen escondida si falla.
- [X] T014 [P] [US2] Agregar los estilos `.foto`, `.foto img` y `.foto-cargada` en `src/app/globals.css` (fondo cover, `object-fit: cover`, transición de opacidad, `prefers-reduced-motion` sin transición), usando solo variables de `theme.css`
- [X] T015 [US2] En `src/components/JustifiedGrid.tsx`, si `foto.thumbhash` dibujar `<Foto>` con `sizes` = `(max-width: 600px) <ar×160×1.5>px, <ar×alturaFila×1.5>px` y `prioridad` para los índices < 6; si no, `FotoSkeleton` como hoy (D3)
- [X] T016 [US2] En `src/components/Lightbox.tsx`:
  - si la foto tiene `thumbhash`, dibujar `<Foto>` con `sizes="100vw"` y `prioridad`;
  - precargar la anterior y la siguiente con `new Image()` (srcset AVIF, `sizes="100vw"`) en un `useEffect`;
  - si no, `FotoSkeleton`.
- [X] T017 [US2] En `src/app/portfolio/[categoria]/page.tsx`, usar `getFotos(\`portfolio/${slug}\`, () => fotosDeMentira(slug, 24))`

**Checkpoint**: con un manifiesto de `portfolio/social`, el quickstart §3 pasos 3 a 5.

## Phase 5: User Story 3 — Fotos reales en una galería de entrega (P2)

**Goal**: la galería con contraseña muestra las fotos reales y ya no ofrece el .zip.

**Independent Test**: quickstart §3, pasos 6 y 7.

- [X] T018 [US3] Sacar `tieneZip` del tipo y de las galerías de ejemplo en `src/content/galerias.ts` (FR-016)
- [X] T019 [US3] En `src/app/galeria/[slug]/page.tsx`:
  - sacar el botón "Descargar todo (.zip)";
  - llamar a `getFotos(\`galerias/${slug}\`, () => fotosDeMentira(slug, galeria.cantidadFotos))` **solo** en la rama con acceso (FR-014);
  - mostrar en el encabezado la cantidad de fotos de esa lista.

**Checkpoint**: quickstart §3 pasos 6 y 7.

## Phase 6: Polish

- [X] T020 Actualizar `ARCHITECTURE.md`: `scripts/fotos/` en el layout, `src/content/fotos.ts` y `Foto.tsx` en el patrón, `NEXT_PUBLIC_IMG_HOST` y las variables de R2 en bootstrap, `Foto.tsx` como cliente
- [ ] T021 Correr `npm run typecheck && npm run build && npm run fotos:probar` (verify) y el quickstart §1 a §3 en el navegador, incluida una corrida de un lote grande (~300 fotos, o las que haya) con el tiempo del resumen para SC-005; anotar el resultado en `specs/002-fotos-reales/plan.md` § Verificación
- [X] T022 Revisar que `git status` no muestre `manifiestos/`, `salida/`, `.env.local` ni JPEG reales antes de commitear
- [ ] T023 Quickstart §4 con Romi: la misma tanda en su Pixieset y en `/galeria/ejemplo`, lado a lado (SC-003, SC-004, principio IV). Anotar el resultado en el doc (sección 13, fase 1). Bloquea `status: completed`: si el color no aguanta, se ajusta research R2, se sube `PIPELINE` y se repite.

## Dependencies & Execution Order

- Setup (T001–T004) → Foundational (T005–T007) → US1, US2 y US3.
- **US1** no depende de US2 ni de US3.
- **US2** se puede escribir en paralelo con US1. Para probarla con fotos
  reales necesita un manifiesto, que lo da US1 (o uno escrito a mano).
- **US3** depende de T012 (`getFotos`) y de T015 (la grilla con `<Foto>`).
- T008 → T009 → T010 → T011 en ese orden: comparten archivos o los usan.

## Parallel Example

```text
Después de la Foundational:
  US1: T008 (pipeline.ts)
  US2: T012 (content/fotos.ts) | T013 (Foto.tsx) | T014 (globals.css)
```

## Implementation Strategy

1. **MVP**: Setup, Foundational y US1. Con eso ya se pueden revisar las
   derivadas en local y medir el color.
2. US2: se ve en el portfolio y se compara con Pixieset (quickstart §4).
3. US3: la galería.
4. Polish y verify.
