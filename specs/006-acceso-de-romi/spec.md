# Feature Specification: Acceso de Romi al panel

**Feature Branch**: `006-acceso-de-romi`

**Created**: 2026-11-16

**Status**: Draft

**Input**: Pedido de Mateo el 16/11/2026. Romi entra al panel con su mail. Mateo
no está seguro de cuál de dos mails usa ella (uno es el dueño del Drive donde
compartió las fotos, el otro el que le pasó, que puede ser un secundario), así
que el panel tiene que aceptar cualquiera de los dos con la misma contraseña.
Hoy el login acepta un solo mail y una contraseña. Contraseña inicial `1234`,
que Mateo le cambia después. Los mails reales viven solo en la configuración
del servidor, nunca en el repo (principio VI: el repo es público). Fuera de
alcance: cuentas separadas, una contraseña por mail, cambiar la contraseña
desde el panel, recuperar la contraseña.

## Clarifications

### Session 2026-11-16

- Q: ¿Quiénes quedan en la lista de producción? → A: Los dos mails de Romi y
  el de Mateo, con la misma contraseña. Sacar el de Mateo más adelante es solo
  editar la variable.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Romi entra con cualquiera de sus mails (Priority: P1)

Romi abre el panel, escribe uno de sus dos mails y la contraseña que le pasó
Mateo, y entra a la lista de sus galerías. Si escribe el otro mail, también
entra. Nadie más entra.

**Why this priority**: es todo el objetivo: que Romi pueda usar el panel sin
depender de adivinar cuál de sus mails quedó configurado.

**Independent Test**: con cada uno de los mails configurados y la contraseña
correcta se entra; con un mail que no está en la lista, no.

**Acceptance Scenarios**:

1. **Given** dos mails configurados, **When** Romi entra con el primero y la
   contraseña correcta, **Then** ve el panel.
2. **Given** dos mails configurados, **When** entra con el segundo, **Then**
   también ve el panel.
3. **Given** un mail configurado escrito con mayúsculas o espacios alrededor,
   **When** entra, **Then** se lo acepta igual.
4. **Given** un mail que no está en la lista, **When** intenta entrar con la
   contraseña correcta, **Then** ve el mismo mensaje que con una contraseña
   equivocada y no entra.
5. **Given** un solo mail configurado (como hasta hoy), **When** se entra con
   él, **Then** funciona igual que antes.

---

### Edge Cases

- La lista tiene comas de más, espacios o un elemento vacío: se ignoran los
  vacíos y nunca un mail vacío deja entrar.
- La configuración no tiene ningún mail: nadie entra (igual que hoy).
- Un mail de la lista con mayúsculas en la configuración: se compara sin
  distinguir mayúsculas.
- Varios intentos fallidos con mails distintos de la lista: cuentan para el
  mismo límite de intentos por IP de hoy.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: La configuración del panel MUST aceptar uno o varios mails de
  administradora, separados por coma.
- **FR-002**: El login MUST dejar entrar si el mail escrito coincide con
  cualquiera de los configurados (sin distinguir mayúsculas y sin los espacios
  de alrededor) y la contraseña es correcta.
- **FR-003**: Un mail fuera de la lista MUST dar el mismo mensaje y tardar lo
  mismo que una contraseña equivocada (FR-016 de la 004).
- **FR-004**: Todos los mails de la lista MUST compartir la única contraseña
  configurada.
- **FR-005**: Un elemento vacío de la lista MUST NOT dejar entrar con un mail
  vacío.
- **FR-006**: Una configuración con un solo mail MUST seguir funcionando sin
  cambios.
- **FR-007**: Los mails reales MUST NOT escribirse en el repo; solo en la
  configuración del servidor y en el archivo local de variables.
- **FR-008**: La lista de producción MUST tener los dos mails de Romi y el de
  Mateo (para soporte), los tres con la misma contraseña.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Romi entra al panel en producción con cualquiera de sus dos mails
  al primer intento.
- **SC-002**: Un mail fuera de la lista no entra en el 100 % de los intentos, y
  el mensaje es indistinguible del de contraseña equivocada.
- **SC-003**: Las pruebas existentes del panel siguen pasando sin cambios.

## Assumptions

- La contraseña inicial `1234` es temporal: Mateo la cambia por una generada
  apenas Romi entre por primera vez, con el mismo comando de siempre. Mientras
  tanto la protege el límite de intentos por IP (5 fallos, 15 minutos). Riesgo
  aceptado por Mateo el 16/11/2026.
- Una sola administradora con una sola contraseña (constitución, principio I):
  varios mails son alias de la misma persona, no cuentas.
- Las sesiones abiertas no se invalidan al cambiar la lista.
