# Contract: sección Portfolio del panel y destinos `sitio/*`

## Rutas del panel (todas detrás de `exigirSesion()`)

| Ruta | Muestra |
|---|---|
| `/panel/portfolio` | Las cuatro categorías: portada actual (miniatura), nombre, cantidad de fotos, link a su página. Debajo, "Trabajos recientes": las marcadas en orden, cada una con ↑, ↓ y Quitar, y cuántas completa la mezcla automática. |
| `/panel/portfolio/[categoria]` | Las fotos de la categoría en grilla de miniaturas. Cada una con "Portada" (marcada si lo es) y "Reciente" (alterna). Botón "Usar la primera" si hay portada elegida. 404 si la categoría no existe. |

La barra del panel suma "Portfolio" junto a "Galerías".

## Server actions

Todas: `exigirSesion()` primero; validan que la categoría exista y que la foto
pertenezca a `portfolio/<categoria>` con estado `lista`; al terminar,
`revalidatePath` del panel y de `/`, `/portfolio`, `/portfolio/<categoria>`.

| Acción | Entrada | Efecto | Error |
|---|---|---|---|
| `elegirPortada` | categoría, id | `categorias.portada = id` | foto ajena a la categoría |
| `quitarPortada` | categoría | `categorias.portada = NULL` | — |
| `alternarReciente` | categoría, id | si está, la borra y compacta posiciones; si no, la agrega al final | "Ya hay 12 recientes" si no entra |
| `moverReciente` | destino, id, `arriba`/`abajo` | intercambia posición con la vecina | — (en el borde no hace nada) |
| `quitarReciente` | destino, id | la borra y compacta posiciones | — |

Las acciones de recientes corren en una transacción y antes borran las filas
cuya foto ya no existe.

## Script de fotos: destinos `sitio/*`

```
npm run fotos -- --carpeta <carpeta con UNA foto> --destino sitio/portada --subir
npm run fotos -- --carpeta <carpeta con UNA foto> --destino sitio/sobremi --subir
```

- `sitio/<uso>` con un uso fuera de la lista: `✗ sitio/<uso> no existe en la base`.
- Genera las derivadas de siempre más `-og.jpg`; no sube original.
- `portfolio/*` también genera `-og.jpg` desde esta feature; resubir una
  categoría sube solo lo que falta (las demás derivadas ya están).

## Sitio público

| Lugar | Qué muestra |
|---|---|
| Tarjeta de categoría | Portada elegida → primera foto → fondo neutro. Caja 4:5 con recorte. |
| Inicio, "Trabajos recientes" | `getRecientes()`: hasta 12, se abre en el lightbox. Sin fotos en el portfolio, no se muestra la sección. |
| Inicio, portada | `sitio/portada` en dos columnas (≥ 900 px) o apilada; sin foto, como hoy. |
| Inicio "Sobre mí" y `/sobre-mi` | `sitio/sobremi`; sin foto, el skeleton de hoy. |
| `<meta property="og:image">` | `og.jpg` de `sitio/portada` en todas las páginas; en `/portfolio/<categoria>`, la de su portada. Nunca una foto de galería. |
