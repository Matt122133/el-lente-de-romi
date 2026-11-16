# Data model: Portadas y fotos del sitio

Una migración nueva, `db/migraciones/003-portadas.sql`. No toca filas
existentes.

## categorias (cambia)

| Columna | Tipo | Regla |
|---|---|---|
| `portada` | `text NULL` | id de una foto de `portfolio/<slug>`. Nulo = la primera foto por `posicion`. Si la foto ya no existe, se trata como nulo. |

## recientes (nueva)

| Columna | Tipo | Regla |
|---|---|---|
| `destino` | `text NOT NULL` | `CHECK (destino ~ '^portfolio/[a-z]+$')`: solo fotos del portfolio. |
| `id` | `text NOT NULL` | id de la foto. Sin FK (research R1). |
| `posicion` | `integer NOT NULL` | `CHECK (posicion >= 0)`. Orden en "Trabajos recientes". |

PK `(destino, id)`. Máximo 12 filas: lo hace cumplir la acción del panel dentro
de la transacción (FR-006). Una fila cuya foto ya no existe se ignora al leer y
se borra la próxima vez que Romi toca los recientes.

## fotos (cambia solo el CHECK)

El CHECK de `destino` y `destinoValido` (`src/lib/fotos.ts`) pasan a aceptar
también `sitio/<nombre>` (`^sitio/[a-z]+$`). Usos válidos, lista fija en
`src/lib/fotos.ts`: `sitio/portada`, `sitio/sobremi`. El script rechaza
cualquier otro `sitio/*` (`destinoExiste`).

## Derivadas en R2

Para destinos `portfolio/*` y `sitio/*`, además de las de hoy:
`romi/<ruta>-og.jpg` (1200 × 630, JPEG). Las galerías no cambian. `PIPELINE`
no cambia (research R3).

## Lecturas

- `getCategorias()`: cada categoría con su foto de portada resuelta (la
  elegida si existe, si no la primera, si no `null`), en una sola consulta.
- `getRecientes()`: las marcadas que siguen existiendo, en orden, más la
  mezcla de `armarRecientes` hasta 12. Cada foto con su alt (research R8).
- `getFotoSitio(uso)`: la foto de `sitio/<uso>` o `null`.
- Panel: categorías con cantidad de fotos y portada; fotos de una categoría con
  dos marcas (`esPortada`, `esReciente`); lista de recientes marcados.
