# Contrato: getters del sitio

Las páginas siguen pidiendo los datos por los mismos nombres (FR-002); lo
único que cambia es que ahora son `async` y que las páginas los esperan con
`await`. Todos llaman a `connection()` antes de consultar (research R3) y solo
se importan desde código de servidor.

| Getter | Antes | Ahora |
|---|---|---|
| `getCategorias()` | `site.categorias` (array) | `Promise<Categoria[]>`, por `orden` |
| `getCategoria(slug)` | `Categoria \| undefined` | `Promise<Categoria \| undefined>` |
| `getGaleria(slug)` | `Galeria \| undefined`, con `clave` | `Promise<Galeria \| undefined>`, **sin** clave ni hash |
| `claveCorrecta(slug, clave)` | — (comparaba `galeria.clave`) | `Promise<boolean>`; compara con el hash (R4) |
| `getFotos(destino, respaldo)` | lee `manifiestos/<destino>.json` | `Promise<Foto[]>` por `posicion`; sin filas, `respaldo()` |

`estaVencida` y `formatearFecha` no cambian (no tocan la base).

Si la base falla, el getter tira el error: lo agarra `src/app/error.tsx`, que
muestra un mensaje amable sin datos (edge case de la spec, SC-005). Ningún
getter devuelve datos de otro destino ni rutas de una galería cerrada: la
página de la galería pide las fotos solo después de verificar la cookie, como
hoy.
