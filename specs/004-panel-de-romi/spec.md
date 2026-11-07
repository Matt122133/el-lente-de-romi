# Feature Specification: Panel de Romi

**Feature Branch**: `004-panel-de-romi`

**Created**: 2026-11-07

**Status**: Draft

**Input**: Fase 3 del roadmap (sección 13 del doc), punto 3 del alcance de la
constitución. Una sección privada del sitio donde Romi entra con su login
(sección 5: una sola administradora, sin sistema de cuentas) y maneja sus
galerías de entrega sin ayuda: crear una galería (título, fecha del evento,
vencimiento, contraseña), subirle las fotos desde el navegador directo a R2
(principio III), compartir el link, cambiar contraseña o vencimiento, y
borrarla —fotos incluidas— cuando vence, después de hablar con el cliente.
Hoy las versiones para pantalla se generan en la compu de quien sube con el
script de la 002; desde el panel hay que generarlas en otro lado sin pasar
las fotos por la app y sin cambiar el color (principio IV). Fuera de alcance: la descarga del
original para los invitados, editar el portfolio desde el panel, favoritas,
marca de agua, pagos. La deuda High de la 002 (validar las derivadas con
fotos de Romi contra Pixieset) sigue bloqueando entregar galerías reales.

## Clarifications

### Session 2026-11-07

- Q: ¿Dónde se generan las versiones para pantalla cuando Romi sube desde el
  navegador? → A: En un worker aparte en Railway que corre el mismo pipeline
  de la 002: lee el original del almacenamiento privado y escribe las
  derivadas en el público. No es la app: el servidor del sitio sigue sin
  tocar bytes de imagen. Costo estimado: ~USD 0,35/mes con el volumen real.
- Q: ¿Cómo entra Romi al panel? → A: Mail y contraseña; solo su mail es
  válido. El mail vive en una variable de entorno, nunca en el repo (es un
  dato real y el repo es público). Un segundo factor con código de app
  (TOTP) queda como mejora opcional, fuera de esta feature.
- Q: ¿Los prerrequisitos de la base (respaldo diario, base de desarrollo
  separada) van en esta feature? → A: No. Nadie usa el sitio en producción
  real todavía; siguen como deuda y se resuelven antes de la primera galería
  real.
- Q: ¿Carpeta o .zip? → A: Romi arrastra la carpeta (o elige varias fotos);
  da avance por foto, se retoma si se corta y se procesa a medida que llega.
  Aceptar un .zip queda para después si le resulta incómodo.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Entrar al panel (Priority: P1)

Romi entra a una dirección del sitio que solo ella conoce, escribe su mail
y su contraseña y ve la lista de sus galerías. Nadie más puede entrar, y la
sesión le dura lo suficiente para no tener que escribir la contraseña cada
vez que sube una galería.

**Why this priority**: todo lo demás del panel depende de que solo ella
pueda entrar; sin esto, cualquiera podría crear o borrar galerías.

**Independent Test**: con la contraseña correcta se ve la lista de
galerías; con una incorrecta, no; sin sesión, cualquier página del panel
manda al login.

**Acceptance Scenarios**:

1. **Given** Romi sin sesión, **When** abre cualquier página del panel,
   **Then** ve el login y nada del contenido del panel.
2. **Given** el login, **When** escribe su mail y la contraseña correcta, **Then**
   entra a la lista de galerías y la sesión dura 30 días o hasta que cierre
   sesión.
3. **Given** el login, **When** escribe otro mail o la contraseña
   equivocada, **Then** ve el mismo mensaje en los dos casos (no se revela
   cuál falló).
4. **Given** el login, **When** se equivoca 5 veces seguidas, **Then** tiene
   que esperar 15 minutos antes de volver a intentar.
5. **Given** una sesión abierta, **When** toca "Cerrar sesión", **Then** el
   panel vuelve a pedir la contraseña.
6. **Given** el panel, **Then** ninguna de sus páginas aparece en buscadores.

---

### User Story 2 - Crear una galería y subirle fotos (Priority: P1)

Romi crea una galería con el título, la fecha del evento y la contraseña que
le va a pasar al cliente; el vencimiento se completa solo a un mes. Después
arrastra la carpeta con la selección de fotos (o las elige) y se suben
desde el navegador; no instala nada.
Ve el avance foto por foto; si se corta internet, retoma sin volver a subir
lo que ya estaba. Cuando termina, la galería se ve igual que las de hoy: en
la grilla, con su versión borrosa mientras carga y el original guardado
intacto para la descarga.

**Why this priority**: es lo que la saca de Pixieset y del límite de
almacenamiento que más le molesta (sección 12).

**Independent Test**: crear la galería "Prueba panel", subirle 50 JPEG,
abrir el link con la contraseña y ver las 50 en orden, con el original
guardado idéntico al archivo de su compu.

**Acceptance Scenarios**:

1. **Given** el formulario de galería nueva, **When** Romi pone título,
   fecha y contraseña, **Then** la galería se crea con vencimiento a un mes
   de la fecha de creación, un link con un slug sacado del título, y queda
   en la lista.
2. **Given** dos galerías con el mismo título, **Then** cada una tiene un
   slug distinto.
3. **Given** una galería recién creada, **When** Romi elige una carpeta de
   300 JPEG, **Then** cada foto se sube directo al almacenamiento sin pasar
   por el servidor del sitio, y la pantalla muestra cuántas van.
4. **Given** una subida cortada a la mitad, **When** Romi vuelve a elegir la
   misma carpeta, **Then** solo se suben las que faltaban.
5. **Given** fotos subidas, **Then** la galería las muestra en orden natural
   del nombre de archivo, con las mismas versiones para pantalla que genera
   el script de la 002 (mismo color, tamaños y formatos), y el original
   queda idéntico byte por byte.
6. **Given** un archivo que no es JPEG en la carpeta, **Then** se saltea con
   un aviso y el resto sigue.
7. **Given** una galería que todavía se está procesando, **Then** el
   cliente ve solo las fotos ya listas, en su orden; si todavía no hay
   ninguna lista, ve el aviso de que la galería se está preparando (no
   placeholders).

---

### User Story 3 - Compartir, cambiar y borrar (Priority: P2)

Desde la lista, Romi copia el link y la contraseña de una galería para
mandárselos al cliente, le cambia la contraseña o el vencimiento, y la
borra cuando ya habló con el cliente. La lista le marca cuáles vencieron y
cuáles vencen en los próximos 7 días.

**Why this priority**: es como trabaja hoy (sección 12: avisa que duran un
mes y habla con el cliente antes de borrar). Sin borrar, el almacenamiento
se acumula y el costo sube (sección 4).

**Independent Test**: cambiar la contraseña de "Prueba panel" y entrar con
la nueva; extender el vencimiento de una vencida y verla otra vez; borrarla
y comprobar que el link da "no existe" y que sus fotos ya no están en el
almacenamiento.

**Acceptance Scenarios**:

1. **Given** una galería, **When** Romi toca "Copiar link", **Then** queda en
   el portapapeles la dirección pública de la galería.
2. **Given** una galería, **When** Romi le cambia la contraseña, **Then** la
   anterior deja de funcionar y quien ya había entrado tiene que escribir la
   nueva.
3. **Given** una galería vencida, **When** Romi le extiende el vencimiento,
   **Then** vuelve a mostrar fotos.
4. **Given** una galería, **When** Romi la borra y confirma escribiendo su
   título, **Then** desaparecen la galería, sus fotos de la grilla, sus
   versiones para pantalla y sus originales; el link da "no existe".
5. **Given** la lista, **Then** cada galería muestra cuántas fotos tiene,
   cuándo vence y si está vencida o por vencer.

---

### Edge Cases

- Romi cierra la pestaña a mitad de una subida: lo ya subido queda; la
  galería muestra solo las fotos procesadas.
- Una foto de 40 MB o una carpeta de 600 fotos: se sube igual, de a partes,
  sin límites de tamaño del servidor.
- El procesamiento de una foto falla: la foto queda marcada con error en el
  panel y se puede reintentar; no bloquea al resto.
- Romi borra una galería mientras alguien la está mirando: el próximo pedido
  da "no existe".
- Dos pestañas del panel subiendo a la misma galería: no se duplican fotos
  (el nombre sale del contenido).
- Un slug que coincide con uno ya usado: se le agrega un sufijo.
- El título tiene acentos o ñ: el slug los transforma ("Boda Ñandú" →
  `boda-nandu`).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El panel MUST estar detrás de un login con mail y contraseña
  de una sola administradora; solo su mail es válido; ninguna página ni acción del panel MUST responder sin
  sesión válida.
- **FR-002**: El login MUST limitar los intentos fallidos (5 seguidos → 15
  minutos de espera) y la sesión MUST vencer a los 30 días o al cerrar
  sesión.
- **FR-003**: Romi MUST poder crear una galería con título, fecha del
  evento, contraseña y vencimiento (por defecto, un mes desde la creación).
- **FR-004**: El slug MUST generarse del título (minúsculas, sin acentos,
  guiones), ser único y no ser secuencial; nunca entra al repo.
- **FR-005**: Las fotos MUST subirse del navegador directo al almacenamiento
  con permisos temporales y por partes; ningún byte de imagen pasa por el
  servidor del sitio (principio III).
- **FR-006**: Las versiones para pantalla, el ancho, el alto y la versión
  borrosa de cada foto MUST generarse con el mismo pipeline de la 002
  (formatos, tamaños, sRGB, sin GPS), en un proceso aparte del servidor del
  sitio que lee el original del almacenamiento privado.
- **FR-007**: El original MUST guardarse byte por byte en el almacenamiento
  privado (principio IV).
- **FR-008**: Una subida interrumpida MUST poder retomarse sin volver a
  subir lo que ya estaba.
- **FR-009**: La galería pública MUST mostrar solo fotos completamente
  procesadas, en orden natural del nombre de archivo.
- **FR-010**: Romi MUST poder copiar el link de una galería, cambiar su
  contraseña y su vencimiento.
- **FR-011**: Cambiar la contraseña MUST invalidar el acceso de quien entró
  con la anterior.
- **FR-012**: Borrar una galería MUST pedir confirmación escribiendo el
  título y MUST eliminar la galería, sus filas de fotos y todos sus archivos
  en el almacenamiento (derivadas y originales).
- **FR-013**: La lista MUST mostrar, por galería, cantidad de fotos,
  vencimiento y estado (vigente, vence en ≤ 7 días, vencida).
- **FR-014**: Las páginas del panel MUST no indexarse (`noindex`) y no
  aparecer en ningún enlace del sitio público.
- **FR-015**: La contraseña de Romi MUST guardarse con el mismo hash lento
  que las de galería; ni la contraseña ni su mail MUST aparecer en el repo
  (principio VI): viven en variables de entorno.
- **FR-016**: El login MUST dar el mismo mensaje y tardar lo mismo con un
  mail equivocado que con una contraseña equivocada.

### Key Entities

- **Administradora**: Romi. Una sola; su mail y su contraseña hasheada, en
  variables de entorno.
- **Sesión**: prueba de que Romi entró; vence a los 30 días.
- **Galería**: ya existe (003). Suma fecha de creación y una versión de la
  contraseña para invalidar accesos viejos (FR-011).
- **Foto**: ya existe (003). Suma un estado de procesamiento (subiendo,
  subida, procesando, lista, con error) para que el panel muestre el avance y la
  galería pública solo vea las listas.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Romi crea una galería y le sube 300 fotos sin ayuda y sin
  instalar nada, en menos de 30 minutos (lo que hoy tarda en Pixieset,
  sección 12).
- **SC-002**: Las fotos subidas desde el panel se ven igual que las subidas
  con el script de la 002: mismas versiones para pantalla y mismo color.
- **SC-003**: El original de cualquier foto subida desde el panel tiene el
  mismo hash que el archivo de la compu de Romi.
- **SC-004**: Borrar una galería deja 0 archivos suyos en el almacenamiento.
- **SC-005**: Ninguna página ni acción del panel responde contenido sin
  sesión (probado sobre todas las rutas del panel).
- **SC-006**: El costo mensual del sitio no sube más de USD 1 por el
  procesamiento de fotos con el volumen real (10 galerías × 300 fotos).

## Assumptions

- Romi usa una compu con un navegador actual (Chrome, Edge o Safari); no se
  pide que el panel funcione en el celular para subir, sí para mirar la
  lista.
- El costo del worker entra en el consumo del plan Hobby que Mateo ya paga
  (hoy, con 3 proyectos, por debajo de los USD 5).
- Las galerías de ejemplo siguen existiendo; la primera galería real espera
  a que se salden la deuda High de la 002 (comparación con Pixieset) y la de
  la 003 (respaldo y base de desarrollo separada).
- El portfolio se sigue subiendo con el script de la 002 por ahora.
- La descarga del original por los invitados va en otra feature; esta deja
  el original guardado y listo para eso.
- El borrado no es automático al vencer: Romi decide cuándo, después de
  hablar con el cliente (sección 12).
