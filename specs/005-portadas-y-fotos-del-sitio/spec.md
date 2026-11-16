# Feature Specification: Portadas y fotos del sitio

**Feature Branch**: `005-portadas-y-fotos-del-sitio`

**Created**: 2026-11-16

**Status**: Draft

**Input**: Decidido con Mateo el 16/11/2026, después de subir las primeras fotos
reales de Romi a las cuatro categorías. El sitio público ya tiene fotos de
verdad dentro de cada categoría, pero todo lo que las rodea sigue siendo de
relleno: las tarjetas de categoría son rectángulos grises, "Trabajos recientes"
muestra fotos inventadas, la portada del inicio y "Sobre mí" no tienen foto, y
el link compartido por WhatsApp no trae imagen. Esta feature llena esos
lugares con fotos de Romi y le da a ella, desde el panel, la elección de la
portada de cada categoría y de los trabajos recientes. Cambia un fuera de
alcance de la 004 ("editar el portfolio desde el panel"), acotado a elegir
fotos que ya están subidas. Fuera de alcance: renombrar categorías, los textos
entre corchetes que escribe Romi, subir o borrar fotos del portfolio desde el
panel.

## Clarifications

### Session 2026-11-16

- Q: ¿Qué pasa si Romi marca menos de 12 recientes? → A: Primero las que
  marcó, en su orden, y el resto hasta 12 se completa con la mezcla
  automática (sin repetir fotos).
- Q: ¿Qué foto de Romi va en "Sobre mí"? → A: La `_DSC1837`: en la calle, de
  cuerpo entero, con la cámara en la mano (no repite el fondo blanco de la
  portada).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Tarjetas de categoría con portada (Priority: P1)

Quien entra al inicio o a /portfolio ve las cuatro categorías (social, moda,
productos, eventos) cada una con una foto suya de portada, en vez de un
rectángulo gris. Mientras no haya una portada elegida, la tarjeta muestra la
primera foto de la categoría.

**Why this priority**: las tarjetas son la puerta al portfolio y hoy son lo
único vacío del inicio y de /portfolio; con portada, el sitio deja de verse a
medio hacer.

**Independent Test**: sin elegir nada en el panel, el inicio y /portfolio
muestran en cada tarjeta la primera foto de su categoría, con el borroso de
carga y sin saltos.

**Acceptance Scenarios**:

1. **Given** una categoría con fotos y sin portada elegida, **When** se abre el
   inicio o /portfolio, **Then** su tarjeta muestra la primera foto de esa
   categoría, recortada al formato vertical de la tarjeta.
2. **Given** una categoría sin ninguna foto, **When** se abre el inicio,
   **Then** su tarjeta se ve como hoy (fondo neutro con el nombre) y la página
   no da error.
3. **Given** una categoría con portada elegida, **When** se abre el inicio,
   **Then** la tarjeta muestra esa foto y no la primera.

---

### User Story 2 - Romi elige la portada de cada categoría (Priority: P1)

Romi entra al panel, va a una sección de portfolio, ve las fotos de una
categoría y marca cuál es la portada. Al volver al sitio, la tarjeta de esa
categoría ya muestra la foto que eligió.

**Why this priority**: es la elección que Mateo pidió explícitamente; sin
ella la portada queda librada al orden de los archivos.

**Independent Test**: desde el panel se elige una foto distinta de la primera
como portada de moda; al recargar el inicio, la tarjeta de moda la muestra.

**Acceptance Scenarios**:

1. **Given** Romi con sesión en el panel, **When** abre la sección de
   portfolio, **Then** ve las cuatro categorías, cada una con su portada
   actual y cuántas fotos tiene.
2. **Given** las fotos de una categoría en el panel, **When** Romi marca una
   como portada, **Then** queda marcada en el panel y el sitio público la
   muestra en la próxima carga, sin deploy.
3. **Given** una portada elegida, **When** Romi la quita, **Then** la tarjeta
   vuelve a mostrar la primera foto de la categoría.
4. **Given** alguien sin sesión, **When** intenta cambiar una portada, **Then**
   no puede (igual que el resto del panel).

---

### User Story 3 - Trabajos recientes con fotos reales (Priority: P2)

En el inicio, "Trabajos recientes" muestra unas doce fotos reales mezclando
las cuatro categorías, así quien entra tiene una vista previa de todo lo que
hace Romi sin entrar a cada categoría. Romi puede elegir desde el panel
cuáles van; si no eligió, el sitio arma una mezcla repartida entre las
categorías.

**Why this priority**: es la parte más visible del inicio después de la
portada; hoy muestra fotos inventadas.

**Independent Test**: sin elección, la sección muestra fotos de las cuatro
categorías; después de que Romi elige seis fotos en el panel, muestra esas
seis primero y completa hasta 12 con la mezcla.

**Acceptance Scenarios**:

1. **Given** las cuatro categorías con fotos y ninguna elección, **When** se
   abre el inicio, **Then** "Trabajos recientes" muestra 12 fotos con al menos
   una de cada categoría que tenga fotos, alternadas (no las de una categoría
   todas juntas).
2. **Given** Romi en el panel, **When** marca fotos como "reciente" en
   distintas categorías, **Then** el inicio muestra primero esas fotos, en el
   orden en que ella las dejó, y completa hasta 12 con la mezcla automática
   sin repetir ninguna.
3. **Given** la sección del inicio, **When** el visitante toca una foto,
   **Then** se abre en grande igual que en una categoría.
4. **Given** Romi ya marcó 12, **When** intenta marcar otra, **Then** el panel
   le avisa que llegó al máximo y no la agrega.

---

### User Story 4 - Romi en la portada del inicio y en Sobre mí (Priority: P2)

La portada del inicio pasa a dos columnas: de un lado la foto de Romi con el
lente tapándole el ojo (la que explica el nombre "El Lente de Romi"), del
otro el nombre del sitio y la bajada. En el celular se apilan, foto arriba.
El bloque "Sobre mí" del inicio y la página /sobre-mi muestran otra foto de
la misma sesión de Romi. Estas fotos no pertenecen a ninguna categoría y no
aparecen en el portfolio ni en trabajos recientes.

**Why this priority**: es lo primero que ve alguien que no la conoce, y le
pone cara a la marca (sección 12 del doc: que se note el profesionalismo y
que se tome las cosas en serio).

**Independent Test**: el inicio muestra la foto del lente junto al nombre en
pantalla ancha y apilada en celular; /sobre-mi muestra otra foto de Romi;
ninguna de las dos aparece en el portfolio.

**Acceptance Scenarios**:

1. **Given** una pantalla de computadora, **When** se abre el inicio,
   **Then** la foto del lente y el texto se ven lado a lado, la foto entera o
   con un recorte que no le corta la cara ni el lente.
2. **Given** un celular, **When** se abre el inicio, **Then** la foto va
   arriba y el nombre y la bajada abajo, sin scroll horizontal.
3. **Given** el inicio y /sobre-mi, **When** cargan, **Then** las fotos de
   Romi aparecen con el mismo borroso de carga que el resto y sin saltos.

---

### User Story 5 - El link compartido muestra una foto (Priority: P3)

Cuando alguien comparte el link del sitio por WhatsApp o Instagram, la vista
previa muestra una foto de Romi, el nombre del sitio y su descripción, en vez
de un link pelado.

**Why this priority**: Romi maneja todo su contacto por WhatsApp e Instagram
(sección 12 del doc); la vista previa es su primera impresión ahí.

**Independent Test**: pegar el link del inicio en un chat de WhatsApp muestra
la vista previa con foto.

**Acceptance Scenarios**:

1. **Given** el link del inicio, **When** se comparte en WhatsApp, **Then** la
   vista previa muestra la foto de Romi, el nombre y la descripción.
2. **Given** el link de una categoría, **When** se comparte, **Then** la vista
   previa usa la portada de esa categoría y su nombre.
3. **Given** el link de una galería de entrega, **When** se comparte, **Then**
   la vista previa no muestra ninguna foto del cliente (principio VI).

---

### User Story 6 - Texto alternativo en las fotos del portfolio (Priority: P3)

Cada foto del portfolio tiene un texto alternativo que dice de qué categoría
es y de quién (por ejemplo, "Fotografía de moda — El Lente de Romi"), en vez
de estar vacío. Lo usan los lectores de pantalla y los buscadores.

**Why this priority**: es barato y mejora accesibilidad y posicionamiento,
que es parte del porqué del sitio (sección 5 del doc), pero no cambia lo que
se ve.

**Independent Test**: las fotos de /portfolio/moda tienen un texto
alternativo no vacío que nombra la categoría.

**Acceptance Scenarios**:

1. **Given** cualquier foto de una categoría, del inicio o de una portada,
   **When** se inspecciona, **Then** tiene texto alternativo con el nombre de
   la categoría y el del sitio.
2. **Given** las fotos de Romi de la portada y de Sobre mí, **When** se
   inspeccionan, **Then** su texto alternativo describe que es Romi.

---

### Edge Cases

- La portada elegida deja de existir porque se volvieron a subir las fotos de
  la categoría sin ella: la tarjeta vuelve a la primera foto, sin error.
- Se vuelven a subir las fotos de una categoría y la portada sigue entre
  ellas: la elección se conserva.
- Una foto marcada como reciente deja de existir: desaparece de trabajos
  recientes y su lugar lo ocupa la mezcla automática.
- Una categoría con menos fotos que las que le tocarían en la mezcla: las que
  faltan las completan las otras categorías.
- Ninguna categoría tiene fotos: "Trabajos recientes" no se muestra o muestra
  el relleno de hoy, pero el inicio no da error.
- Faltan las fotos de Romi (no se subieron): la portada y Sobre mí se ven como
  hoy, con el fondo neutro.
- Romi elige desde el panel en el celular: la grilla de fotos de la categoría
  se puede usar con el dedo.
- Las fotos de las galerías de entrega nunca se pueden elegir como portada ni
  como reciente.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Cada tarjeta de categoría (en el inicio y en /portfolio) MUST
  mostrar la portada elegida de esa categoría, o su primera foto si no hay
  una elegida, o el fondo neutro de hoy si la categoría no tiene fotos.
- **FR-002**: El panel MUST tener una sección de portfolio, detrás del mismo
  login que el resto, que liste las cuatro categorías con su portada actual y
  su cantidad de fotos.
- **FR-003**: Romi MUST poder ver las fotos de una categoría en el panel y
  elegir una como portada, o quitar la elección.
- **FR-004**: Solo una foto de esa misma categoría MUST poder ser su portada.
- **FR-005**: Un cambio de portada o de recientes MUST verse en el sitio
  público en la próxima carga, sin deploy.
- **FR-006**: "Trabajos recientes" MUST mostrar primero las fotos que Romi
  marcó, en el orden que ella eligió (hasta 12), y completar hasta 12 con la
  mezcla automática de FR-007, sin repetir fotos.
- **FR-007**: Sin fotos marcadas, "Trabajos recientes" MUST mostrar 12 fotos
  repartidas entre las categorías con fotos, alternadas, siempre las mismas
  mientras no cambien las fotos (no una mezcla distinta en cada visita).
- **FR-008**: Romi MUST poder marcar y desmarcar fotos de cualquier categoría
  como recientes y cambiar su orden desde el panel.
- **FR-009**: La portada del inicio MUST mostrar la foto de Romi con el lente
  junto al nombre y la bajada en dos columnas en pantallas anchas, apiladas
  (foto arriba) en celular.
- **FR-010**: El bloque "Sobre mí" del inicio y la página /sobre-mi MUST
  mostrar la `_DSC1837` de la sesión de Romi (en la calle, con la cámara).
- **FR-011**: Las fotos de Romi MUST tener derivadas, medidas y borroso de
  carga como cualquier foto del sitio, y MUST NOT aparecer en ninguna
  categoría, en trabajos recientes ni en las opciones del panel.
- **FR-012**: El inicio, /portfolio, /sobre-mi y cada categoría MUST declarar
  una imagen para la vista previa al compartir: la foto de Romi en las páginas
  generales y la portada en cada categoría. Esa imagen MUST estar en un
  formato que WhatsApp e Instagram muestren.
- **FR-013**: Las galerías de entrega MUST NOT declarar ninguna foto del
  cliente como imagen de vista previa.
- **FR-014**: Toda foto del portfolio que se muestre en el sitio MUST tener
  texto alternativo con el nombre de su categoría y el del sitio; las fotos de
  Romi, uno que diga que es ella.
- **FR-015**: Ninguna imagen MUST pasar por el servidor de la app: las
  portadas, recientes, fotos de Romi y la imagen para compartir se sirven
  desde el host de imágenes (principio III).
- **FR-016**: Las elecciones de Romi MUST sobrevivir a volver a subir las
  fotos de una categoría, mientras la foto elegida siga en ella.
- **FR-017**: El repo MUST NOT contener nombres de clientes ni nombres de las
  carpetas del Drive que los llevan (principio VI).

### Key Entities

- **Categoría**: la que ya existe (slug, nombre, descripción, orden), con una
  portada opcional: una referencia a una de sus fotos.
- **Foto del portfolio**: la que ya existe; puede estar marcada como reciente,
  con una posición dentro de trabajos recientes.
- **Foto del sitio**: una foto de Romi que no es de ninguna categoría ni
  galería, con un uso (portada del inicio, sobre mí); tiene las mismas
  derivadas, medidas y borroso que el resto.
- **Imagen para compartir**: la versión de una foto en el formato y tamaño que
  piden las vistas previas de WhatsApp e Instagram.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El inicio y /portfolio no muestran ningún rectángulo gris de
  relleno mientras las cuatro categorías tengan fotos y las fotos de Romi
  estén subidas.
- **SC-002**: Romi cambia la portada de una categoría desde el panel en menos
  de un minuto y sin ayuda, y lo ve reflejado al recargar el sitio.
- **SC-003**: Con la mezcla automática, "Trabajos recientes" tiene fotos de las
  cuatro categorías en el 100 % de las cargas.
- **SC-004**: Pegar el link del inicio y el de una categoría en WhatsApp
  muestra una vista previa con foto.
- **SC-005**: El inicio no salta mientras carga (mismo criterio que la grilla:
  ninguna foto cambia el alto de la página al aparecer) y no se siente más
  lento que hoy.
- **SC-006**: El 100 % de las fotos del portfolio que se ven en el sitio tienen
  texto alternativo no vacío.

## Assumptions

- La foto de la portada del inicio es la `_DSC1721` de la sesión de Romi (la
  del lente tapándole el ojo). La de Sobre mí es la `_DSC1837` (en la calle,
  con la cámara en la mano). Cambiar
  estas fotos desde el panel queda fuera de esta feature: se suben una vez,
  como las del portfolio.
- Las fotos de Romi son de ella, la dueña del sitio: mostrarlas no choca con
  el principio VI, que protege a los clientes.
- Las fotos del portfolio las sigue subiendo Mateo con el script; el panel
  solo elige entre las que ya están.
- Las sobrantes del Drive ya se sumaron a sus categorías el 16/11/2026
  (graduación a social, catering a productos), así que la mezcla de recientes
  las incluye sin trabajo extra.
- 12 es el máximo de recientes porque la grilla del inicio está pensada para
  esa cantidad hoy.
- El texto alternativo por categoría es genérico; describir cada foto una por
  una queda para cuando Romi quiera hacerlo.
- La deuda High de la 002 (validar el color contra Pixieset con Romi) no
  bloquea esta feature: el portfolio ya está en producción con estas fotos.
