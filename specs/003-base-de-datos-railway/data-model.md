# Data model: Base de datos y hosting en Railway

Tres tablas de contenido y una de control. Nunca bytes de imagen
(principio III): solo rutas y metadata, ~1 KB por foto (sección 5 del doc).

## `categorias`

| Columna | Tipo | Reglas |
|---|---|---|
| `slug` | text, PK | `^[a-z]+$` |
| `nombre` | text | no vacío |
| `descripcion` | text | puede tener los `[...]` pendientes de Romi |
| `orden` | int | orden en el inicio y en `/portfolio` |

Carga inicial: las cuatro de hoy (`social`, `moda`, `productos`, `eventos`),
con los mismos textos que `site.categorias`, por `npm run db:sembrar`.

## `galerias`

| Columna | Tipo | Reglas |
|---|---|---|
| `slug` | text, PK | `^[a-z0-9]+(-[a-z0-9]+)*$`; en el repo solo slugs inventados (FR-011) |
| `titulo` | text | no vacío |
| `fecha` | date | día del evento |
| `vence_el` | date | vence al terminar ese día, hora de Argentina (como hoy `estaVencida`) |
| `clave_hash` | text | formato de research R4; nunca texto plano (FR-006) |

Carga inicial (`db:sembrar`): `ejemplo` (vence un año después de la carga,
para que la demo no venza sola) y `ejemplo-vencida` (vencida en una fecha
fija pasada), las dos con contraseña `demo`.

Desaparece `cantidadFotos`: una galería sin fotos en la base muestra 40
placeholders (constante en la página), como la de ejemplo hoy.

## `fotos`

| Columna | Tipo | Reglas |
|---|---|---|
| `destino` | text | `portfolio/<categoria>` o `galerias/<slug>` |
| `id` | text | hash del contenido (nunca secuencial, principio VI) |
| `ruta` | text | ruta en R2 sin prefijo ni variante (`lib/imagenes.ts`) |
| `width`, `height` | int | > 0, ya con la orientación EXIF aplicada |
| `thumbhash` | text | no nulo: en la base solo hay fotos reales |
| `alt` | text | vacío por ahora |
| `posicion` | int | ≥ 0, orden natural del nombre de archivo |

- PK `(destino, id)`; índice por `(destino, posicion)` para `getFotos`.
- Sin clave foránea al destino (es polimórfico): el script verifica que la
  categoría o la galería exista antes de escribir (FR-015).
- **Reemplazo** (FR-003): `--subir` borra las fotos del destino e inserta la
  lista nueva en una sola transacción. Correrlo dos veces deja lo mismo
  (FR-004); dos corridas a la vez, la última que hace commit gana.

## `migraciones` (control)

| Columna | Tipo |
|---|---|
| `nombre` | text, PK (`001-inicial.sql`) |
| `aplicada` | timestamptz |

## Tipos en TypeScript

`Foto` (`src/lib/fotos.ts`) no cambia de forma: es lo que devuelve
`getFotos`. `Galeria` (`src/content/galerias.ts`) pierde `clave` y
`cantidadFotos`; la comprobación de la contraseña pasa a una función que
recibe el slug y la clave escrita y nunca devuelve el hash. `Categoria`
(`src/content/site.ts`) suma `orden` solo en la base.
