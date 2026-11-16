# Tasks: Portadas y fotos del sitio

**Input**: `specs/005-portadas-y-fotos-del-sitio/` (plan, spec, research, data-model, contracts, quickstart)

**Tests**: sin runner. `npm run portfolio:probar` (nuevo) cubre lo que se
prueba sin base ni red; el resto es el quickstart. Las tareas **(op)** son
corridas del script o de la migración contra Railway, no código. Las fotos de
Romi se leen de `prog/fotos-romi/` (fuera del repo); ningún nombre de carpeta
del Drive entra al repo (FR-017).

## Phase 1: Setup

- [X] T001 Crear `db/migraciones/003-portadas.sql` según `data-model.md`: `categorias.portada text NULL`; tabla `recientes (destino, id, posicion)` con PK y CHECKs; reemplazar el CHECK de `fotos.destino` (buscar su nombre real en la base, se espera `fotos_destino_check`) por uno que acepte también `^sitio/[a-z]+$`
- [X] T002 [P] `package.json`: script `portfolio:probar` con el patrón de `panel:probar` (`node --experimental-strip-types --no-warnings scripts/portfolio/probar.ts`)

---

## Phase 2: Foundational

- [X] T003 `src/lib/fotos.ts`: `destinoValido` acepta `sitio/<nombre>`; exportar `USOS_SITIO = ["portada", "sobremi"] as const`, `esSitio(destino)` y `esPortfolio(destino)`
- [X] T004 [P] `src/lib/imagenes.ts`: `claveOg(ruta)` → `romi/<ruta>-og.jpg` y `urlOg(ruta)` con `IMG_HOST`; comentar al lado de `PIPELINE` que agregar una derivada nueva no lo cambia (research R3)
- [X] T005 `scripts/fotos/pipeline.ts`: si el destino no es galería, generar además la derivada og (1200 × 630, `resize({ width: 1200, height: 630, fit: "cover", position: "attention" })`, `withIccProfile("srgb")`, `jpeg({ quality: 80, mozjpeg: true })`, contentType `image/jpeg`) con clave `claveOg(ruta)`
- [X] T006 `scripts/fotos/procesar.ts`: `derivadasEsperadas` incluye la og cuando el destino no es galería; al reutilizar, leer el contentType por extensión (`.jpg` → `image/jpeg`)
- [X] T007 `scripts/fotos/base.ts`: `destinoExiste` acepta `sitio/<uso>` solo si `uso` está en `USOS_SITIO`
- [X] T008 [P] `scripts/fotos/probar.ts`: comprobar que una foto de `portfolio/x` da una og JPEG de 1200 × 630 y que una de `galerias/x` no da og; `scripts/db/probar.ts`: `destinoValido` acepta `sitio/portada` y rechaza `sitio/Portada`, `sitio/` y `sitio/a/b`
- [X] T009 **(op)** `npm run db:migrar` contra Railway → `✓ 003-portadas.sql`
- [X] T010 **(op)** Subir las fotos de Romi: carpetas temporales con `_DSC1721` → `sitio/portada` y `_DSC1837` → `sitio/sobremi` (`npm run fotos -- ... --subir`); resubir las cuatro categorías con las carpetas del 16/11 (`moda`, `social-todo`, `eventos`, `productos-todo`) para que ganen su og. Esperado: mismas cantidades (47, 38, 17, 57)

**Checkpoint**: verify verde, base migrada, og en R2; el sitio público sigue igual.

---

## Phase 3: User Story 1 — Tarjetas de categoría con portada (P1) 🎯 MVP

**Goal**: cada tarjeta muestra la portada elegida o la primera foto.
**Independent Test**: sin elegir nada, inicio y /portfolio muestran la primera foto de cada categoría, sin saltos.

- [X] T011 [US1] `src/content/site.ts`: `Categoria` suma `portada: Foto | null`; `getCategorias()` la resuelve en una consulta (la de `categorias.portada` si existe y está `lista`, si no la de menor `posicion`), con alt "<nombre> — El Lente de Romi" (research R8); `getCategoria` igual
- [X] T012 [P] [US1] `src/components/Foto.tsx`: prop opcional `recorte` (la caja toma el tamaño del contenedor y la imagen `object-fit: cover`); sin `recorte`, igual que hoy
- [X] T013 [US1] `src/components/CategoriaCard.tsx`: con portada, `Foto` con `recorte` dentro de la caja 4:5 y `sizes` para 2 columnas (celular) y 4 (≥ 900 px), prioridad alta; sin portada, `FotoSkeleton` como hoy; `src/app/globals.css`: la caja 4:5 de `.categoria-card` y el hover también sobre `.foto`
- [X] T014 [US1] Verificar en `npm run dev` inicio y /portfolio (quickstart §3, tarjetas)

**Checkpoint**: tarjetas con foto en producción tras el deploy.

---

## Phase 4: User Story 2 — Romi elige la portada (P1)

**Goal**: desde el panel, Romi elige o quita la portada de cada categoría.
**Independent Test**: elegir en el panel una foto que no es la primera; el inicio la muestra al recargar.

- [X] T015 [US2] Crear `src/content/portfolio.ts` (servidor): `listarCategoriasPanel()` (slug, nombre, cantidad de fotos listas, portada resuelta, si es elegida) y `fotosDeCategoria(slug)` (fotos listas con `esPortada` y `esReciente`)
- [X] T016 [US2] Crear `src/app/panel/(privado)/portfolio/acciones.ts` con `elegirPortada` y `quitarPortada` según `contracts/panel-portfolio.md`: `exigirSesion()`, validar categoría y pertenencia de la foto, `revalidatePath` del panel, `/`, `/portfolio` y la categoría
- [X] T017 [US2] Crear `src/app/panel/(privado)/portfolio/page.tsx`: las cuatro categorías con miniatura de portada (derivada `thumb`), nombre, cantidad y link a su página del panel
- [X] T018 [US2] Crear `src/app/panel/(privado)/portfolio/[categoria]/page.tsx`: grilla de miniaturas (`thumb`, lazy) con botón "Portada" por foto (marcado en la actual) y "Usar la primera" si hay elegida; 404 si la categoría no existe; `exigirSesion()`
- [X] T019 [P] [US2] `src/app/panel/(privado)/layout.tsx`: link "Portfolio" junto a "Galerías"; `src/app/globals.css`: grilla de miniaturas del panel (3 columnas en celular, botones de al menos 44 px)

**Checkpoint**: quickstart §4 pasos 1, 2 y 5.

---

## Phase 5: User Story 3 — Trabajos recientes reales (P2)

**Goal**: 12 fotos que mezclan las cuatro categorías; primero las que marcó Romi.
**Independent Test**: sin marcas, fotos de las cuatro categorías alternadas y estables; con 3 marcadas, esas 3 primero y completa hasta 12.

- [X] T020 [US3] Crear `src/lib/recientes.ts` (sin imports de sitio): `armarRecientes(marcadas, porCategoria, total = 12)` según research R5 (marcadas primero; reparto alternado por orden de categoría; índices espaciados `floor(i * n / k)`; saltea marcadas y portadas, salvo una portada que sea la única foto disponible de su categoría; sin repetidos; determinística; si una categoría se queda corta, completan las otras)
- [X] T021 [P] [US3] Crear `scripts/portfolio/probar.ts`: casos de `armarRecientes` (sin marcadas → 12 con las 4 categorías y nunca dos seguidas de la misma mientras haya otras; 3 marcadas → primero esas en orden; 12 marcadas → solo esas; categoría con 1 foto que es su portada → igual aparece; ninguna foto → vacío; misma entrada → misma salida; sin repetidos)
- [X] T022 [US3] `src/content/portfolio.ts`: `getRecientes()` (una consulta con todas las fotos listas de `portfolio/*` y otra con `recientes`; ignora marcas cuya foto no existe; alt por categoría) y `recientesPanel()` (las marcadas, en orden, con su categoría)
- [X] T023 [US3] `src/app/panel/(privado)/portfolio/acciones.ts`: `alternarReciente`, `moverReciente`, `quitarReciente` en transacción, limpiando antes las marcas huérfanas y con el tope de 12 ("Ya hay 12 recientes")
- [X] T024 [US3] Panel: botón "Reciente" en `src/app/panel/(privado)/portfolio/[categoria]/page.tsx`; sección "Trabajos recientes" en `src/app/panel/(privado)/portfolio/page.tsx` con ↑, ↓, Quitar y cuántas completa la mezcla
- [X] T025 [US3] `src/app/page.tsx`: "Trabajos recientes" usa `getRecientes()` con `JustifiedGrid`; si viene vacío, no se muestra la sección

**Checkpoint**: quickstart §3 (recientes) y §4 pasos 3 y 4.

---

## Phase 6: User Story 4 — Romi en la portada y en Sobre mí (P2)

**Goal**: portada en dos columnas con la foto del lente; Sobre mí con la _DSC1837.
**Independent Test**: inicio en compu (lado a lado) y en 390 px (apilado, sin scroll horizontal); /sobre-mi con la foto.

- [X] T026 [US4] `src/content/portfolio.ts`: `getFotoSitio(uso)` → la foto de `sitio/<uso>` o `null`, con alt "Romi, fotógrafa de El Lente de Romi"
- [X] T027 [US4] `src/app/page.tsx` + `src/app/globals.css`: `.hero` en dos columnas desde 900 px (foto entera en su proporción, alto máximo `min(78vh, 760px)`, con prioridad) y apilado en celular (foto arriba, alto máximo 70vh, recorte anclado arriba); sin foto, el hero de hoy
- [X] T028 [P] [US4] Bloque "Sobre mí" de `src/app/page.tsx` y `src/app/sobre-mi/page.tsx`: `getFotoSitio("sobremi")` con `Foto` en caja 4:5 con `recorte`; sin foto, `FotoSkeleton`

**Checkpoint**: quickstart §3 (portada y Sobre mí).

---

## Phase 7: User Story 5 — El link compartido muestra una foto (P3)

**Goal**: vista previa con foto en WhatsApp e Instagram.
**Independent Test**: `og:image` en `/` y `/portfolio/moda` apunta a una `-og.jpg` que responde `image/jpeg`; las galerías no declaran fotos propias.

- [X] T029 [US5] `src/app/layout.tsx`: pasar `metadata` a `generateMetadata` (con `connection()` primero): `title`/`description` de hoy, sin `metadataBase` (la og ya es absoluta), `openGraph` (`siteName`, `locale: "es_AR"`, `type: "website"`, imagen `urlOg` de `sitio/portada` con 1200 × 630 y alt) y `twitter: summary_large_image`; sin foto, sin imagen
- [X] T030 [US5] `src/app/portfolio/[categoria]/page.tsx`: `generateMetadata` suma `openGraph.images` con la og de la portada de la categoría
- [X] T031 [US5] `src/app/galeria/[slug]/page.tsx`: confirmar que su metadata no declara imágenes propias y hereda la de Romi; dejar comentado por qué (FR-013)

**Checkpoint**: quickstart §3 (`og:image`) y §5 (WhatsApp).

---

## Phase 8: User Story 6 — Texto alternativo (P3)

**Goal**: ninguna foto del portfolio con alt vacío.
**Independent Test**: en /portfolio/moda, el inicio y las tarjetas, todas las `img` tienen alt con la categoría.

- [X] T032 [US6] `src/app/portfolio/[categoria]/page.tsx`: las fotos de `getFotos` con alt vacío reciben "<nombre> — El Lente de Romi" (las tarjetas, recientes y fotos de Romi ya lo traen de T011, T022 y T026)

---

## Phase 9: Polish

- [X] T033 [P] `ARCHITECTURE.md`: destinos `sitio/*`, derivada og y la regla de `PIPELINE`, `src/content/portfolio.ts`, `src/lib/recientes.ts`, la sección Portfolio del panel y la tabla `recientes`
- [X] T034 Correr `verify:` completo hasta verde
- [ ] T035 Quickstart completo en local y, tras el deploy, contra Railway (§3, §4 en compu y celular, §5). Hecho: §3 en Railway (portada, 12 recientes, og de inicio y categoría 200 `image/jpeg`, galería sin foto propia, panel protegido). Falta: §4 tocando los botones del panel en compu y celular, y §5 en WhatsApp (Mateo)

- [X] T036 `src/app/globals.css`: `.seccion` pisaba el padding lateral de `.contenedor` (venía de antes de la 005; las secciones quedaban pegadas al borde). Pasa a `padding-block` (encontrado al verificar el inicio, agregado al cerrar)

---

## Dependencies & Execution Order

- Setup (T001–T002) → Foundational (T003–T010) → historias.
- US1 (T011–T014) antes que US2 (la página del panel muestra la portada resuelta de T011).
- US3 depende de T015 (getter del panel) y de T011 (portadas, para saltearlas en la mezcla).
- US4 y US5 dependen solo de Foundational (T010 sube las fotos de Romi y las og); US5 usa T011 para la portada de la categoría.
- US6 depende de T011, T022 y T026.
- Polish al final.

### Parallel Opportunities

- T002 con T001; T004 y T008 con el resto de Foundational.
- T012 con T011; T019 con T015–T018; T021 con T020–T022; T028 con T027.
- US4 y US5 pueden ir en paralelo con US2–US3 una vez hecha la Foundational.

## Implementation Strategy

MVP = Foundational + US1: las tarjetas ya muestran fotos sin tocar el panel.
Después US2 (lo que Mateo pidió explícitamente), US3 y US4 (lo más visible del
inicio), y por último US5 y US6, que no cambian lo que se ve en pantalla.
