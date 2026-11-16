# Quickstart: validar la 005

Requisitos: `.env.local` completo (base y R2), las fotos de Romi bajadas fuera
del repo (`prog/fotos-romi/`, ver memoria del proyecto) y las cuatro categorías
con fotos en la base.

## 1. Sin base ni red

```
npm run typecheck && npm run build && npm run fotos:probar && npm run db:probar && npm run panel:probar && npm run portfolio:probar
```

`portfolio:probar` cubre `armarRecientes` (marcadas primero, completa hasta 12,
alterna categorías, no repite, determinística, categoría corta) y los destinos
`sitio/*`.

## 2. Migración y fotos de Romi

1. `npm run db:migrar` → aplica `003-portadas.sql`.
2. Carpetas temporales con una foto cada una (fuera del repo):
   `_DSC1721` → `sitio/portada`, `_DSC1837` → `sitio/sobremi`; subirlas con el
   comando de `contracts/panel-portfolio.md`.
3. Resubir las cuatro categorías con la misma carpeta de antes para que
   ganen su `-og.jpg`. Esperado: `↷ ya estaba` en derivadas, sube solo las og;
   la cantidad de fotos no cambia.

## 3. Sitio (local con `npm run dev`, después en Railway)

- Inicio: portada con la foto del lente en dos columnas; en 390 px de ancho,
  apilada, sin scroll horizontal. Tarjetas con la primera foto de cada
  categoría. "Trabajos recientes" con 12 fotos de las cuatro categorías,
  alternadas; tocar una abre el lightbox.
- `/sobre-mi` y el bloque del inicio con la _DSC1837.
- Inspeccionar: alt no vacío en tarjetas, recientes y categorías.
- Ver el HTML de `/` y `/portfolio/moda`: `og:image` apunta a `…-og.jpg` del
  host de imágenes; esa URL responde 200 `image/jpeg`. En
  `/galeria/ejemplo` no hay `og:image` de una foto de la galería.
- Recargar varias veces: los recientes no cambian.

## 4. Panel

1. `/panel/portfolio`: cuatro categorías con portada y cantidad.
2. Moda → elegir como portada una foto que no sea la primera → el inicio la
   muestra al recargar. "Usar la primera" la devuelve.
3. Marcar 3 recientes de categorías distintas → el inicio las muestra
   primero, en ese orden, y completa hasta 12. Moverlas con ↑ ↓; quitar una.
4. Marcar hasta 12 e intentar una más → aviso "Ya hay 12 recientes".
5. Resubir moda con el script → la portada elegida se conserva.
6. Probar 2 y 3 desde el celular.

## 5. Compartir

Pegar el link de Railway del inicio y de `/portfolio/social` en un chat de
WhatsApp: vista previa con foto. (Si WhatsApp ya cacheó el link sin imagen,
probar con `?v=2`.)
