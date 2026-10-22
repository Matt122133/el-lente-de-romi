# Data model: Fotos reales

Todavía no hay base de datos. Lo que está acá es la forma del manifiesto que
deja el script y que lee el sitio; la feature 003 lo convierte en tablas.

## Foto (`src/lib/placeholders.ts`, se mueve a `src/lib/fotos.ts`)

| Campo | Tipo | Regla |
|---|---|---|
| `id` | string | El nombre de hash (R4). Único dentro del lote. |
| `ruta` | string | `<destino>/<id>`, sin prefijo `romi/` ni variante. Entra tal cual en `urlDerivada`. |
| `width` | number | Ancho en px del original **ya rotado** (Edge Cases). |
| `height` | number | Alto en px del original ya rotado. |
| `thumbhash` | string \| null | ThumbHash en base64. `null` solo en las fotos de mentira, y es lo que las distingue. |
| `alt` | string | Vacío por ahora (lo carga Romi en la 004). |
| `posicion` | number | 0..N-1, por orden natural del nombre de archivo original (FR-015). |

Las fotos de mentira mantienen la misma forma, con `thumbhash: null` y
`posicion` igual a su índice.

El tipo se mueve de `placeholders.ts` a `src/lib/fotos.ts` porque deja de ser
de mentira. `placeholders.ts` lo importa de ahí y conserva el generador.

## Manifiesto (`manifiestos/<destino>.json`, ignorado por git)

```text
{
  version: 1,                       // versión del formato del manifiesto
  pipeline: "2026-10-21",           // versión del pipeline que entró en el hash (R4)
  destino: "portfolio/social" | "galerias/<slug>",
  generado: ISO-8601,
  fotos: Foto[]                     // ordenadas por posicion
}
```

- `destino` cumple `^(portfolio/(social|moda|productos|eventos)|galerias/[a-z0-9-]+)$`.
  La lista de categorías sale de `site.categorias`.
- El nombre de archivo original **no** se guarda en el manifiesto: puede
  tener el nombre del cliente y solo sirve para ordenar, que ya queda en
  `posicion`.

## Galeria (`src/content/galerias.ts`)

- Se saca `tieneZip` (FR-016).
- `cantidadFotos` se queda para las de mentira. Si hay manifiesto, la página
  usa la cantidad de fotos del manifiesto.

## Objetos en R2

| Bucket | Clave | Contenido |
|---|---|---|
| público (`R2_BUCKET`) | `romi/<destino>/<id>-<variante>.<avif\|webp>` | 8 derivadas por foto |
| privado (`R2_BUCKET_ORIGINALES`) | `romi/galerias/<slug>/<id>.jpg` | Original byte por byte. Solo galerías. |
