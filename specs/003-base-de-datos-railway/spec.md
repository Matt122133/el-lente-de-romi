# Feature Specification: Base de datos y hosting en Railway

**Feature Branch**: `003-base-de-datos-railway`

**Created**: 2026-11-06

**Status**: Draft

**Input**: Pasar los datos del sitio de archivos sueltos a una base de datos y
publicar el sitio en Railway. Hoy las fotos de cada categoría y galería salen
de manifiestos JSON que existen solo en la compu de quien corrió el script de
subida (ignorados por git), y las galerías y categorías están escritas en el
código. Eso obliga a publicar el sitio a mano, desde esa compu, en un preview
de Vercel cuyo plan gratis no permite uso comercial. Con la base de datos como
fuente de verdad, el sitio se publica solo desde GitHub en Railway (plan Hobby
que Mateo ya paga), junto a la base. Las fotos siguen en R2 y nunca pasan por
el sitio (principio III). Fuera de alcance: panel de Romi (004), descarga de
originales con URL firmada (fase 3), dominio propio. La decisión de hosting se
registra en la sección 0 del doc.

## Clarifications

### Session 2026-11-06

- Q: ¿Cómo se crea una galería real antes del panel (004)? → A: No se crea.
  Hasta la 004 solo existen las dos galerías de ejemplo que carga el comando
  de FR-009. Coincide con la deuda de la 002, que ya bloquea galerías reales.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Las fotos subidas aparecen en el sitio publicado (Priority: P1)

Quien sube (hoy Mateo) corre el script de subida sobre una carpeta con destino
una categoría del portfolio o una galería, como en la 002. Además de subir las
derivadas y los originales a R2, el script deja los datos de cada foto en la
base. Sin publicar nada, el sitio en Railway muestra esas fotos en la grilla.

**Why this priority**: Es lo que hoy está roto: las fotos solo se ven en el
sitio publicado si se publica a mano desde la compu que tiene los manifiestos.
Sin esto no se puede ni mostrarle avances a Romi sin un paso manual.

**Independent Test**: Con el sitio publicado en Railway, correr la subida de
50 fotos de prueba a `portfolio/social` y recargar `/portfolio/social` en el
sitio publicado: aparecen las 50, sin ningún deploy de por medio.

**Acceptance Scenarios**:

1. **Given** una carpeta con N JPEG y el destino `portfolio/social`, **When**
   se corre la subida, **Then** la base tiene N fotos para ese destino con
   ruta, ancho, alto, versión borrosa, texto alternativo y posición, y el sitio
   publicado las muestra en ese orden.
2. **Given** el mismo lote corrido dos veces, **Then** la base sigue teniendo
   N fotos para ese destino, no 2N.
3. **Given** un destino que ya tenía fotos, **When** se sube otra carpeta al
   mismo destino, **Then** el destino queda con las fotos de la última carpeta:
   las que ya no están dejan de mostrarse (igual que el manifiesto de la 002).
4. **Given** una categoría sin fotos en la base, **Then** se ven los
   placeholders de siempre.
5. **Given** la subida en modo local (sin subir a R2), **Then** la base no
   cambia.

---

### User Story 2 - Publicar sin pasos manuales (Priority: P1)

Cada cambio de código que llega a la rama principal en GitHub se publica solo
en Railway. La app y la base viven en el mismo proyecto de Railway; la app se
conecta a la base por la red interna.

**Why this priority**: Junto con la US1 es lo que reemplaza el deploy manual a
Vercel, que hoy depende de una compu en particular y de un plan no comercial.

**Independent Test**: Hacer un cambio de texto visible, mergearlo a la rama
principal y ver el cambio en la URL pública de Railway sin correr nada a mano.

**Acceptance Scenarios**:

1. **Given** un merge a la rama principal, **Then** el sitio publicado se
   actualiza solo, y si el build falla queda la versión anterior.
2. **Given** el sitio publicado, **Then** todas las páginas (inicio, portfolio,
   sobre mí, contacto, galerías) responden, incluidas las que se arman en el
   servidor por cada pedido (galería con contraseña).
3. **Given** el sitio publicado, **Then** las imágenes se piden a R2, nunca al
   servidor de la app.
4. **Given** un cambio que necesita cambiar la estructura de la base, **Then**
   la publicación aplica ese cambio sin borrar los datos existentes.

---

### User Story 3 - Galerías y categorías salen de la base (Priority: P2)

Las galerías de entrega (título, fecha del evento, vencimiento, contraseña) y
las categorías del portfolio dejan de estar escritas en el código y pasan a la
base (principio I: el contenido vive en la base). La contraseña se guarda
hasheada. Para el visitante nada cambia: la galería pide la contraseña, la
recuerda con la cookie firmada, y una vencida no muestra fotos.

**Why this priority**: Es necesario para que Romi pueda crear galerías sin
tocar código (panel, 004), pero el sitio se puede publicar y mostrar con la
US1 y la US2 aunque esto quede para después.

**Independent Test**: Con la base cargada con las dos galerías de ejemplo,
entrar a `/galeria/ejemplo` con `demo` y ver las fotos; `/galeria/ejemplo-vencida`
muestra que venció; ningún archivo del código contiene las contraseñas.

**Acceptance Scenarios**:

1. **Given** una galería en la base con su contraseña hasheada, **When** el
   visitante escribe la contraseña correcta, **Then** ve las fotos; con una
   incorrecta, no, y el HTML no contiene ninguna ruta de foto (FR-014 de la 002).
2. **Given** una galería cuya fecha de vencimiento ya pasó, **Then** no
   muestra fotos, solo hasta cuándo estuvo disponible y el botón de WhatsApp.
3. **Given** un slug que no existe en la base, **Then** se ve la página de no
   encontrado.
4. **Given** las categorías en la base, **Then** el inicio y el portfolio
   muestran las mismas categorías, títulos y orden que hoy.
5. **Given** una base recién creada, **Then** se puede cargar con las galerías
   y categorías de ejemplo con un solo comando, sin datos reales.

---

### Edge Cases

- La base no responde: las páginas del portfolio muestran un error amable, no
  una página rota ni datos de otra categoría; la galería no muestra fotos.
- La subida a R2 termina pero falla la escritura en la base: correr de nuevo
  lo deja consistente (las fotos ya subidas dicen `↷ ya estaba` y la base se
  completa).
- Se sube a `galerias/<slug>` un slug que no existe como galería en la base:
  el script lo avisa y no sube nada. Hasta la 004 no hay forma de crear
  galerías reales (ver Clarifications).
- Dos subidas al mismo destino a la vez: la última que termina define el
  contenido; no queda una mezcla de las dos.
- Una galería vence mientras alguien la está mirando: el próximo pedido ya no
  muestra fotos.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sitio MUST obtener las fotos de cada categoría y galería, las
  galerías y las categorías desde la base de datos, sin leer archivos locales
  del disco del servidor.
- **FR-002**: Las páginas MUST seguir pidiendo los datos por los mismos puntos
  de acceso de hoy (`getCategoria`, `getGaleria`, `getFotos`), de modo que las
  páginas y los componentes no cambien de comportamiento.
- **FR-003**: La subida (`--subir`) MUST escribir en la base las fotos de su
  destino, reemplazando la lista anterior de ese destino, en un solo paso
  (nadie ve el destino a medio escribir).
- **FR-004**: La subida MUST ser idempotente: correr el mismo lote dos veces
  deja la base igual que una vez.
- **FR-005**: La base MUST guardar por foto: identificador de hash, ruta en
  R2, ancho, alto, versión borrosa, texto alternativo, posición y destino.
  Nunca bytes de imagen (principio III).
- **FR-006**: La contraseña de cada galería MUST guardarse hasheada con un
  algoritmo lento para contraseñas; nunca en texto plano, ni en la base ni en
  el código.
- **FR-007**: El sitio MUST publicarse en Railway automáticamente con cada
  cambio en la rama principal de GitHub, sin pasos manuales ni archivos que
  existan solo en una compu.
- **FR-008**: Los cambios de estructura de la base MUST aplicarse con
  migraciones versionadas en el repo, que se corren al publicar y no borran
  datos.
- **FR-009**: MUST existir un comando que carga una base vacía con las
  categorías del portfolio y las dos galerías de ejemplo (slugs inventados,
  contraseña `demo`), y que se puede correr más de una vez sin duplicar.
- **FR-010**: MUST existir una forma documentada de hacer y restaurar un
  respaldo de la base, y un respaldo automático de no más de 24 h de
  antigüedad (por Railway o por un trabajo programado).
- **FR-011**: Ningún dato real de clientes (nombres, slugs reales,
  contraseñas) MUST quedar en el repo: ni en migraciones, ni en el comando de
  carga, ni en tests (principio VI).
- **FR-012**: Las credenciales de la base MUST vivir solo en variables de
  entorno (Railway y `.env.local`), nunca en el repo.
- **FR-013**: Las galerías MUST seguir con `noindex`, contraseña y vencimiento
  como hoy (principio VI); una galería vencida no expone ninguna ruta de foto.
- **FR-014**: El script de subida MUST dejar de depender de los manifiestos
  para que el sitio funcione; en modo local puede seguir dejándolos para
  revisar el resultado.
- **FR-015**: La subida a `galerias/<slug>` MUST fallar sin subir nada si la
  galería no existe en la base. Esta feature no agrega ninguna forma de crear
  galerías: hasta la 004 solo existen las de ejemplo.

### Key Entities

- **Categoría**: una sección del portfolio (social, moda, productos, eventos y
  congresos). Slug, título, descripción, orden. Tiene fotos.
- **Galería**: una entrega a un cliente. Slug inventado o real (solo en la
  base, nunca en el repo), título, fecha del evento, fecha de vencimiento,
  contraseña hasheada. Tiene fotos; sus originales están en el bucket privado.
- **Foto**: una imagen ya subida a R2. Identificador de hash del contenido,
  ruta, ancho, alto, versión borrosa, texto alternativo, posición. Pertenece a
  una categoría o a una galería.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Desde que termina una subida, las fotos se ven en el sitio
  publicado en menos de 1 minuto, sin ningún deploy.
- **SC-002**: Un merge a la rama principal se ve publicado en menos de 10
  minutos sin intervención.
- **SC-003**: Las páginas del portfolio y de una galería abierta tardan lo
  mismo o menos en mostrar la primera fila que en el preview de Vercel
  (medido igual, red "Fast 4G", caché vacía).
- **SC-004**: El costo mensual que suma el sitio queda dentro del consumo del
  plan Hobby de Railway que Mateo ya paga (USD 5 de consumo incluido).
- **SC-005**: Con la base caída, ninguna página expone datos de otra galería ni
  rutas de fotos de una galería cerrada.
- **SC-006**: Un respaldo de la base se restaura en una base nueva y el sitio
  apuntado a ella muestra las mismas fotos.

## Assumptions

- Railway corre la app como un servidor Node normal: no hace falta adaptar
  Next.js como en Cloudflare ni compilar en la compu de nadie.
- La región de Railway más cercana a Argentina es aceptable: el HTML viaja
  desde ahí, pero las fotos siguen saliendo del edge de Cloudflare. Se
  confirma la región al crear el servicio.
- El plan Hobby que Mateo ya paga alcanza en consumo para la app y la base
  (unos MB de metadata: ~1 KB por foto, sección 5 del doc). Si se pasa, se
  revisa contra el objetivo de ~USD 3 del principio II.
- Para desarrollar en local se usa una base Postgres propia (local o una base
  de desarrollo en Railway); el plan decide cuál.
- Las fotos de prueba (Wikimedia) siguen siendo el contenido del sitio
  publicado hasta que Romi pase las suyas; la deuda de la 002 (validación con
  sus fotos) sigue bloqueando galerías reales.
- El preview de Vercel se da de baja cuando el sitio en Railway funcione; es
  una acción de Mateo en su cuenta, no parte del código.
- La rama principal es `master`; hasta mergear el PR #2, lo que se publica
  sale de la rama que Mateo elija en Railway.
