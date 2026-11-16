# Research: Portadas y fotos del sitio

Decisiones de diseño de la 005. Cada una: qué se eligió, por qué y qué se
descartó.

## R1. Dónde se guardan la portada y los recientes

**Decision**: la portada es una columna `portada` (id de foto, nullable) en
`categorias`. Los recientes son una tabla aparte `recientes (destino, id,
posicion)`. Ninguna de las dos tiene FK a `fotos`: se resuelven con un join y,
si la foto ya no está, se ignoran (vuelve la primera foto o la mezcla).

**Rationale**: `reemplazarFotos` (scripts/fotos/base.ts) borra y vuelve a
insertar las filas de un destino al resubir. Una marca guardada en la fila de
`fotos` se perdería en cada resubida y rompería FR-016. El id de una foto es el
hash de su contenido más `PIPELINE`, así que la misma foto vuelve con el mismo
id y la elección se conserva sola. Sin FK, borrar fotos nunca falla por una
elección colgada.

**Alternatives considered**: una columna `reciente` en `fotos` (se pierde al
resubir); FK con `ON DELETE SET NULL` (`fotos` tiene PK compuesta y el borrado
en bloque de `reemplazarFotos` igual dejaría la elección en nulo aunque la foto
vuelva en la misma transacción).

## R2. Las fotos de Romi: un destino nuevo `sitio/...`

**Decision**: dos destinos nuevos con una foto cada uno: `sitio/portada` (la
_DSC1721) y `sitio/sobremi` (la _DSC1837). Se suben con el mismo script:
`npm run fotos -- --carpeta <carpeta con una foto> --destino sitio/portada
--subir`. El CHECK de `fotos.destino` y `destinoValido` aceptan
`sitio/<nombre>`, y `destinoExiste` acepta solo los usos conocidos (lista fija
en `src/lib/fotos.ts`). No llevan original en el bucket privado (como el
portfolio).

**Rationale**: reutiliza el pipeline entero (derivadas, medidas, ThumbHash,
color), así cumple FR-011 sin código nuevo de procesamiento. Como no son
`portfolio/*`, no entran en categorías, recientes ni en el panel.

**Alternatives considered**: guardarlas como una categoría oculta (mezcla
conceptos y obliga a filtrarla en todos lados); URLs fijas en `site.ts` (rompe
"el contenido vive en la base", principio I, y no tendría ThumbHash).

## R3. Imagen para compartir: una derivada JPEG `og`

**Decision**: el pipeline genera, solo para destinos `portfolio/*` y `sitio/*`,
una derivada más: `romi/<ruta>-og.jpg`, 1200 × 630, recorte `cover` con
posición `attention` de sharp (busca la zona con más detalle, en general la
cara), sRGB, JPEG mozjpeg calidad 80 (≈150–300 KB). Las galerías no la
generan, así el worker no cambia. **`PIPELINE` no se cambia**: las derivadas
existentes no cambian ni un byte; solo se agrega un archivo nuevo. Cambiarlo
cambiaría los ids y perdería todas las elecciones de portada.

**Rationale**: WhatsApp e Instagram muestran JPEG y PNG de forma fiable; WebP y
AVIF fallan en varias versiones. 1200 × 630 es lo que piden Open Graph y
WhatsApp (que además descarta imágenes muy pesadas). Sale directo de R2,
nunca de la app (principio III).

**Alternatives considered**: usar la derivada `large.webp` (vista previa
inconsistente en WhatsApp); generar la imagen al vuelo con `opengraph-image`
de Next (pasaría bytes de la foto por la app, prohibido); un JPEG para todas
las fotos, galerías incluidas (cambia el worker y suma archivos que nadie usa).

## R4. Dónde se declara la imagen para compartir

**Decision**: `generateMetadata` en `src/app/layout.tsx` declara
`openGraph` y `twitter` (sin `metadataBase`: la URL de la og ya es absoluta) con la `og.jpg` de `sitio/portada`
(llama a `connection()` primero, como los getters). La página de categoría la
pisa con la `og.jpg` de su portada. Las galerías de entrega heredan la de Romi
y nunca declaran una propia (FR-013). Sin foto de Romi subida, no se declara
imagen.

**Rationale**: un solo lugar para todas las páginas generales, incluidas
/contacto y /sobre-mi. `connection()` evita que el build necesite la base.

**Alternatives considered**: metadata en cada página (repetido en cinco
lugares); imagen fija en el repo (`public/`), descartada porque es una foto y
pasaría por la app.

## R5. La mezcla automática de recientes

**Decision**: una función pura `armarRecientes(marcadas, porCategoria, 12)` en
`src/lib/recientes.ts`: primero las marcadas, en su orden; después reparte los
lugares que quedan entre las categorías con fotos, en el orden de
`categorias.orden`, alternando (una de cada una por vuelta). Dentro de cada
categoría elige fotos espaciadas parejo a lo largo de la sesión (índices
`floor(i * n / k)`), no las primeras, que suelen ser casi iguales. Saltea las ya
marcadas y la portada de cada categoría (ya se ve arriba, en su tarjeta),
salvo que la categoría no tenga otra foto disponible: así toda categoría con
fotos aparece al menos una vez. Es
determinística: mismas fotos de entrada, misma salida (FR-007).

**Rationale**: pura y sin base, así se prueba en `npm run portfolio:probar`.
Con ~160 fotos en total, traerlas todas en una consulta es barato.

**Alternatives considered**: al azar en cada visita (FR-007 lo prohíbe y
rompería la caché del navegador); `ORDER BY random()` con semilla en SQL (más
difícil de probar).

## R6. Panel: una sección de portfolio con acciones simples

**Decision**: `/panel/portfolio` lista las cuatro categorías (portada actual,
cantidad de fotos) y los recientes marcados, con botones ↑ ↓ y "Quitar".
`/panel/portfolio/[categoria]` muestra las fotos de la categoría en grilla de
miniaturas; cada una tiene dos botones: "Portada" y "Reciente" (alterna). Todo
son server actions que llaman a `exigirSesion()`, validan que la foto sea de
esa categoría y que no se pase de 12, y hacen `revalidatePath`. La barra del
panel suma el link "Portfolio".

**Rationale**: botones en vez de arrastrar: funcionan igual con el dedo en el
celular y no suman una librería. Mismo patrón de seguridad que las acciones de
la 004.

**Alternatives considered**: arrastrar para ordenar (librería y
accesibilidad); editar todo en una sola página (con 160 fotos se vuelve larga e
incómoda en el celular).

## R7. Portada del inicio en dos columnas

**Decision**: `.hero` pasa a una grilla de dos columnas desde 900 px: la foto
de Romi a la izquierda, dentro de una caja con su proporción real y alto máximo
`min(78vh, 760px)` (se ve entera, sin recorte), y el nombre y la bajada a la
derecha. En celular se apilan, foto arriba, con alto máximo de 70vh y recorte
`object-position` centrado arriba para no cortar la cara. La foto se pide con
prioridad (es lo primero que se ve). Si no hay foto, el hero queda como hoy.

**Rationale**: la foto es vertical; en la franja horizontal de hoy perdería
más de la mitad. Mostrarla entera respeta la foto.

## R8. Texto alternativo

**Decision**: el alt se completa al leer, no se guarda: si `fotos.alt` está
vacío, el getter pone `"<nombre de la categoría> — El Lente de Romi"`. Las fotos
de Romi llevan `"Romi, fotógrafa de El Lente de Romi"`. La columna `alt` sigue
existiendo para cuando Romi quiera describir fotos una por una.

**Rationale**: cero migración de datos y vale para fotos que se suban después.

## R9. Tarjetas de categoría

**Decision**: `CategoriaCard` recibe la foto de portada (o nada) y la dibuja
con `Foto` en modo recorte: caja 4:5 fija, `object-fit: cover`. Hace falta una
variante de `Foto` (prop `recorte`) que use la proporción de la caja y no la de
la foto. Sin foto, el `FotoSkeleton` de hoy. Las portadas de las cuatro
tarjetas se traen en una sola consulta con `getCategorias()`.
