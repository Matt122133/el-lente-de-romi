# Feature Specification: Skeleton inicial del sitio

**Feature Branch**: `skeleton-inicial`

**Created**: 2026-10-18

**Status**: Completed (registro retroactivo)

**Input**: Lo construido antes de instalar spec-kit y el harness: el esqueleto
navegable del sitio de Romi con fotos de mentira, derivado del doc del proyecto
(secciones 1, 5, 6, 8, 9 y las respuestas de Romi en la 12). Este spec existe
para que el repo tenga registrado qué hay y por qué; no se escribió antes del
código.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Recorrer el portfolio (Priority: P1)

Alguien que no conoce a Romi entra al sitio, ve la portada, las cuatro
categorías (social, moda, productos, eventos y congresos), entra a una y
recorre las fotos en la grilla justificada; abre una foto grande y navega con
flechas.

**Why this priority**: El portfolio es lo que Pixieset no le da y lo que le
sirve para promocionarse (doc, sección 13, fase 2).

**Independent Test**: Navegar Inicio → Portfolio → una categoría → abrir una
foto → flecha derecha → Escape, sin usar otra sección.

**Acceptance Scenarios**:

1. **Given** la portada, **When** se elige una categoría, **Then** se ve su
   nombre, su descripción y una grilla justificada sin saltos mientras carga.
2. **Given** una grilla, **When** se hace clic en una foto, **Then** se abre a
   pantalla completa con "N / total", flechas, teclado y Escape para cerrar.
3. **Given** una categoría que no existe, **Then** se ve la página 404.

### User Story 2 - Recibir una galería de entrega (Priority: P1)

El cliente de Romi (o un invitado) abre el link de su galería, escribe la
contraseña que le pasó Romi y ve las fotos de su evento.

**Why this priority**: Es lo que hoy resuelve Pixieset y lo que el sitio tiene
que reemplazar (doc, sección 13, fase 3). El skeleton fija su forma.

**Independent Test**: `/galeria/ejemplo` con contraseña `demo`.

**Acceptance Scenarios**:

1. **Given** una galería vigente sin haber entrado, **Then** se pide la
   contraseña y no se muestra ninguna foto.
2. **Given** una contraseña incorrecta, **Then** se ve "La contraseña no es
   correcta." y se puede reintentar.
3. **Given** la contraseña correcta, **Then** se ven título, fecha del evento,
   cantidad de fotos, fecha de vencimiento y la grilla; al recargar se sigue
   adentro.
4. **Given** una galería vencida, **Then** se ve hasta cuándo estuvo
   disponible y el botón de WhatsApp, sin fotos (sección 12: duran un mes).
5. **Given** un slug inexistente, **Then** 404.

### User Story 3 - Contactar a Romi (Priority: P2)

Desde cualquier página se llega a WhatsApp, Instagram o email. No hay
formulario: Romi gestiona todo por WhatsApp (sección 12).

**Independent Test**: Botón de WhatsApp en Inicio, Sobre mí y Contacto.

### Edge Cases

- Datos de contacto todavía no cargados: los botones aparecen deshabilitados,
  no rotos.
- Una cookie de acceso inventada no abre la galería.
- En celular la grilla baja la altura de fila a 160 px.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Páginas Inicio, Portfolio, categoría, Sobre mí, Contacto y
  Galería, con header y footer comunes.
- **FR-002**: Grilla justificada calculada a partir del ancho y alto de cada
  foto, sin medir en el navegador (sección 6).
- **FR-003**: Lightbox con flechas, teclado y Escape; en galerías muestra la
  acción "Descargar".
- **FR-004**: Galería protegida por contraseña con cookie firmada por galería;
  `noindex`.
- **FR-005**: Galería vencida no muestra fotos.
- **FR-006**: Contenido (textos, categorías, contacto, galerías) en
  `src/content/` detrás de getters; identidad visual en `theme.css`; rutas de
  R2 con prefijo `romi/` (sección 9).
- **FR-007**: Descargas (foto individual y .zip) visibles pero deshabilitadas
  hasta la fase 3.

### Key Entities

- **Foto**: id, ruta en R2, width, height, thumbhash, alt.
- **Categoría**: slug, nombre, descripción.
- **Galería**: slug, título, fecha, vence el, clave, cantidad de fotos, tiene zip.

## Success Criteria *(mandatory)*

- **SC-001**: `npm run typecheck` y `npm run build` en verde.
- **SC-002**: Los cinco escenarios de la historia 2 pasan en un navegador real.
- **SC-003**: Ninguna foto ni dato real de clientes en el repo.

## Assumptions

- Las fotos son de mentira; la historia de fotos reales es la fase 1 del
  roadmap.
- Los textos entre corchetes los completa Romi.
