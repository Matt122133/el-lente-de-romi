# Feature Specification: Fotos reales — derivadas y grilla con imágenes

**Feature Branch**: `galerias-y-harness`

**Created**: 2026-10-21

**Status**: Draft

**Input**: Fase 1 del roadmap (sección 13 del doc): pasar de fotos de mentira a
fotos reales de Romi. (1) Un script local que corre en la compu de quien sube
(sección 5) y, de una carpeta de JPEG originales, genera las derivadas para
pantalla, saca sus datos y los sube a R2 junto con el original intacto. (2) En
el sitio, las fotos reales se dibujan en la grilla justificada y en el
lightbox, con su versión borrosa mientras cargan y sin saltos. Fuera de
alcance: base de datos, panel de Romi, subida desde el navegador, descargas
firmadas, deploy.

## Clarifications

### Session 2026-10-21

- Q: ¿Se sube el original también en el portfolio? → A: No. Hay tres cosas
  distintas: el .zip con todas las fotos del evento, que Romi le pasa al
  cliente por su cuenta y no pasa por el sitio; las fotos de la galería,
  una selección de Romi —muchas pero no todas las del .zip— que ven el cliente
  y sus invitados con el link exclusivo y se descargan de a una, por eso llevan
  original; y el portfolio, que solo se mira y lleva únicamente derivadas.
- Q: ¿En qué orden aparecen las fotos? → A: Por nombre de archivo, en orden
  natural (2 antes que 10). Puede cambiar si Romi lo pide.
- Q: ¿El .zip se sube al sitio? → A: No. Romi se lo pasa al cliente por su
  cuenta. El sitio no guarda ni ofrece el .zip, y la galería deja de mostrar el
  botón "Descargar todo (.zip)". Cambia la decisión del 18/10/2026 de la
  sección 0 del doc y el punto 3 del alcance de la constitución.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Preparar un lote de fotos (Priority: P1)

Quien sube (hoy Mateo, más adelante Romi) apunta el script a una carpeta con
los JPEG que Romi ya editó y le dice a dónde van: una categoría del portfolio o
una galería de entrega. Para una galería, la carpeta es la selección que Romi
eligió mostrar, no el contenido del .zip. El script genera, por cada foto, las
versiones para pantalla en los cuatro tamaños y los dos formatos, calcula su
ancho, alto y versión borrosa, y deja un manifiesto con esos datos. Puede dejarlo todo en una
carpeta local para revisarlo, o además subirlo a R2.

**Why this priority**: Sin derivadas no hay nada real que mostrar, y es lo que
responde las dos preguntas abiertas de la fase 1: si el color aguanta y si la
grilla se siente como la de Pixieset.

**Independent Test**: Correr el script en modo local sobre una carpeta de 5
JPEG de prueba y revisar la salida: 8 archivos por foto con nombre de hash, el
manifiesto con 5 entradas, colores iguales al original en un visor con gestión
de color, sin datos de GPS.

**Acceptance Scenarios**:

1. **Given** una carpeta con N JPEG y el destino `portfolio/social`, **When**
   se corre el script en modo local, **Then** quedan 8 derivadas por foto
   (thumb, medium, large, xlarge × AVIF y WebP) y un manifiesto con N entradas
   que tienen ruta, ancho, alto, versión borrosa y texto alternativo vacío.
2. **Given** una foto vertical de 4000 × 6000, **Then** cada derivada tiene el
   ancho de su variante (480, 1000, 1600, 2400) y la proporción del original.
3. **Given** una foto más angosta que una variante (ej. 1200 px de ancho),
   **Then** esa variante y las mayores no se agrandan: se generan al ancho del
   original.
4. **Given** una foto con EXIF de GPS, **Then** ninguna derivada lo tiene, y el
   original subido de una galería sí (sección 7).
5. **Given** una foto en Adobe RGB o Display P3, **Then** las derivadas quedan
   en sRGB con su perfil y se ven con los mismos tonos de piel que el original.
6. **Given** el modo de subida con destino `galerias/<slug>` y credenciales
   válidas, **Then** las derivadas y el original quedan en R2 bajo
   `romi/<destino>/` y el original es idéntico byte por byte al archivo local.
7. **Given** el modo de subida con destino `portfolio/<categoria>`, **Then**
   solo se suben las derivadas; el original no sale de la compu.
8. **Given** el mismo lote corrido dos veces, **Then** los nombres son los
   mismos (el nombre sale del contenido) y no se duplica nada en R2.

---

### User Story 2 - Ver fotos reales en el portfolio (Priority: P1)

Un visitante entra a una categoría del portfolio y ve las fotos reales de Romi
en la grilla justificada. Antes de que cargue cada foto ya ve su versión
borrosa en el lugar exacto, y nada salta. Al abrir una, el lightbox muestra la
versión grande adecuada a su pantalla.

**Why this priority**: Es la comparación con Pixieset que pide la fase 1, y lo
que hay que mostrarle a Romi.

**Independent Test**: Con un manifiesto local de una categoría, abrir
`/portfolio/<categoria>` con la red limitada a "Fast 4G" y la caché vacía.

**Acceptance Scenarios**:

1. **Given** una categoría con manifiesto, **When** se abre, **Then** cada
   celda muestra primero la versión borrosa de su foto y después la foto, sin
   que cambie el tamaño ni la posición de ninguna celda.
2. **Given** un navegador que soporta AVIF, **Then** baja AVIF; si no, WebP.
3. **Given** una pantalla de celular, **Then** las celdas bajan la variante
   chica y no la de 2400 px.
4. **Given** una grilla larga, **Then** las fotos fuera de pantalla no se bajan
   hasta acercarse al scroll.
5. **Given** el lightbox abierto, **Then** muestra una variante grande acorde
   al ancho de la pantalla, con la versión borrosa mientras carga.
6. **Given** una categoría sin manifiesto, **Then** se ve igual que hoy, con
   las fotos de mentira.

---

### User Story 3 - Ver fotos reales en una galería de entrega (Priority: P2)

El cliente entra con la contraseña a una galería de ejemplo y ve las fotos
reales con el mismo comportamiento que en el portfolio. La descarga de cada
foto sigue deshabilitada (es de la fase 3) y ya no hay botón de .zip.

**Why this priority**: Confirma que la grilla aguanta un volumen real (~300
fotos) y no solo las de una categoría, pero depende de lo mismo que la US2.

**Independent Test**: Galería de ejemplo con manifiesto local de ~50 fotos,
entrar con la contraseña y recorrerla.

**Acceptance Scenarios**:

1. **Given** una galería con manifiesto, **When** se entra con la contraseña,
   **Then** se ven sus fotos reales, en el orden de sus nombres de archivo, la
   cantidad del encabezado coincide y no aparece "Descargar todo (.zip)".
2. **Given** una galería vencida o sin contraseña, **Then** no se ve ninguna
   foto real ni su versión borrosa en el HTML.

### Edge Cases

- Un archivo que no es JPEG, o un JPEG roto, en la carpeta: se saltea con un
  aviso que dice cuál, y el resto del lote sigue.
- Dos archivos idénticos con distinto nombre: una sola entrada en el
  manifiesto, en la posición del primero según el orden natural.
- Faltan las credenciales de R2 en modo subida: falla antes de procesar nada,
  diciendo qué variable falta.
- Una subida que se corta a la mitad: volver a correr el lote completa lo que
  falta sin rehacer lo que ya está.
- Foto con orientación EXIF (tomada girada): las derivadas salen derechas y el
  ancho y alto del manifiesto son los de la foto derecha.
- Manifiesto con una foto cuyas derivadas no existen en R2: la celda queda con
  la versión borrosa, sin ícono de imagen rota ni salto de layout.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El script MUST tomar una carpeta de JPEG y un destino
  (`portfolio/<categoria>` o `galerias/<slug>`) y procesar todas las fotos de
  la carpeta.
- **FR-002**: Por cada foto MUST generar las variantes de `src/lib/imagenes.ts`
  (480, 1000, 1600, 2400 px de ancho) en AVIF y WebP, sin agrandar nunca la
  foto.
- **FR-003**: Las derivadas MUST quedar en sRGB con su perfil de color, con la
  orientación aplicada y sin metadatos de ubicación (sección 7, principio IV).
- **FR-004**: El nombre de cada foto MUST salir de un hash de su contenido,
  nunca de su nombre de archivo ni de un número de orden (principio VI), y las
  derivadas MUST seguir exactamente el formato de `urlDerivada`.
- **FR-005**: Por cada foto MUST calcular ancho, alto y versión borrosa
  (ThumbHash) y escribirlos en un manifiesto del lote junto con la ruta.
- **FR-006**: En modo subida, MUST subir las derivadas a R2 bajo
  `romi/<destino>/` con caché de un año. Solo para destinos `galerias/<slug>`
  MUST subir además el original, sin ninguna modificación, porque los
  invitados lo descargan de a uno (fase 3); el portfolio no lleva original.
- **FR-007**: Las credenciales y los buckets MUST venir de variables de entorno
  documentadas en `.env.example`; ningún valor real va al repo.
- **FR-008**: Volver a correr un lote MUST ser seguro: mismos nombres, sin
  duplicados, y completa lo que haya quedado sin subir.
- **FR-009**: El sitio MUST tener un componente de foto que elija formato
  (AVIF, si no WebP) y tamaño según la pantalla, cargue en diferido y muestre
  la versión borrosa en el lugar exacto de la foto hasta que cargue.
- **FR-010**: La grilla justificada y el lightbox MUST usar ese componente
  cuando la foto tiene datos reales, y seguir mostrando el skeleton actual con
  las fotos de mentira.
- **FR-011**: Las fotos de una categoría o galería MUST salir de su manifiesto
  a través de los getters de `src/content/`; si no hay manifiesto, se usan las
  de mentira.
- **FR-012**: Los manifiestos y las fotos reales MUST quedar fuera del repo
  (ignorados por git), porque llevan slugs reales y el repo es público.
- **FR-013**: El host de las imágenes MUST poder cambiarse por variable de
  entorno (para probar con la URL pública del bucket mientras no esté
  `img.ellentederomi.com`), y nunca puede ser la propia app (principio III).
- **FR-014**: Una galería sin contraseña válida o vencida MUST NOT incluir en
  la página ninguna ruta ni versión borrosa de sus fotos.
- **FR-015**: Las fotos MUST aparecer en el orden natural de su nombre de
  archivo original (2 antes que 10), guardado como posición en el manifiesto,
  porque el nombre del archivo en R2 es un hash y no sirve para ordenar.
- **FR-016**: La galería MUST NOT mostrar el botón "Descargar todo (.zip)" ni
  guardar si una galería tiene .zip: el .zip lo pasa Romi por su cuenta.

### Key Entities

- **Foto**: ya existe en `src/lib/placeholders.ts`. Ruta (sin prefijo ni
  variante), ancho, alto, versión borrosa, texto alternativo; se suma su
  posición en el lote.
- **Manifiesto de lote**: el destino y la lista de fotos de una carpeta
  procesada; es lo que después va a ser una fila por foto en la base de datos
  (feature 003).
- **Original**: el JPEG tal cual lo entregó Romi, guardado en R2 al lado de sus
  derivadas, solo en galerías y solo para descargar de a uno.
- **.zip del evento**: todas las fotos, solo para el cliente. Lo pasa Romi
  por su cuenta; no existe en el sitio.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: ~50 fotos reales de Romi se ven en una categoría del portfolio y
  en una galería de ejemplo.
- **SC-002**: Cero saltos de layout mientras carga la grilla (CLS 0 medido en
  el navegador).
- **SC-003**: Con caché vacía y red "Fast 4G", la primera fila de la grilla se
  ve completa en no más tiempo que la misma galería en Pixieset.
- **SC-004**: En la comparación lado a lado con Pixieset, Mateo y Romi no
  notan diferencia de color ni de nitidez en tonos de piel.
- **SC-005**: Un lote de 300 fotos se procesa en la compu de quien sube en
  menos de 30 minutos (lo que hoy le lleva subir a Pixieset, sección 12).
- **SC-006**: El original descargado de R2 tiene el mismo hash que el archivo
  local.

## Assumptions

- Mateo consigue ~50 fotos reales de Romi, con su permiso, para la prueba;
  nunca se commitean.
- Para probar se usa la URL pública del bucket de R2 (r2.dev) o un dominio de
  prueba; conectar `img.ellentederomi.com` es parte del deploy y queda afuera.
- Las fotos son JPEG (sección 12: Romi entrega solo JPEG).
- El texto alternativo queda vacío por ahora; lo carga Romi desde el panel
  (feature 004).
- Las categorías del portfolio son las cuatro que ya existen en
  `src/content/site.ts`.
- La comparación con Pixieset (SC-003, SC-004) es manual y la anota Mateo en
  el doc.
