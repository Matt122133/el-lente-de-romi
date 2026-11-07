# Quickstart: validar fotos reales

## 0. Automático

```sh
npm run typecheck && npm run build && npm run fotos:probar
```

`fotos:probar` no toca R2 ni los `salida/` y `manifiestos/` del repo
(research R10). Tiene que terminar con `OK`.

## 1. Script en modo local (US1)

1. Copiar 5 JPEG reales de Romi a una carpeta **fuera del repo**.
2. `npm run fotos -- --carpeta <esa carpeta> --destino portfolio/social`
3. Revisar:
   - `salida/romi/portfolio/social/` tiene 40 archivos con nombre de hash;
   - `manifiestos/portfolio/social.json` tiene 5 fotos, en el orden de los
     nombres de archivo;
   - una derivada `xlarge` abierta en un visor con gestión de color al lado
     del original: mismos tonos de piel;
   - `git status` limpio (nada de `salida/` ni `manifiestos/`).

## 2. Subida a R2

Prerrequisito: los dos buckets creados en Cloudflare (el de derivadas con
acceso público `r2.dev` activado, el de originales sin acceso público), un
token con escritura en los dos y `.env.local` completo según `.env.example`.

1. `npm run fotos -- --carpeta <~50 fotos> --destino portfolio/social --subir`
2. Volver a correr lo mismo: todas las fotos dicen `↷ ya estaba`.
3. `npm run fotos -- --carpeta <~50 fotos> --destino galerias/ejemplo --subir`
4. Bajar un original del bucket privado desde el panel de Cloudflare y
   comparar `sha256sum` con el archivo local: iguales (SC-006).
5. Abrir la URL `r2.dev` de una derivada de galería: se ve. La del original en
   el bucket privado no existe públicamente.

## 3. Sitio (US2, US3)

1. En `.env.local`: `NEXT_PUBLIC_IMG_HOST=https://<bucket>.r2.dev`
2. `npm run dev` (con `npm run build && npm start`, hay que hacer el build
   de nuevo después de cada corrida del script: el portfolio es estático).
3. `/portfolio/social` con DevTools, red "Fast 4G" y caché deshabilitada:
   - cada celda muestra primero la versión borrosa y después la foto;
   - Performance → Layout Shift: 0 (SC-002);
   - Network: se piden `.avif`; en vista de celular, variantes `thumb` o
     `medium`;
   - al bajar el scroll se piden las siguientes, no todas de entrada.
4. Abrir el lightbox: variante grande, flechas y Escape como antes; al pasar
   a la siguiente, ya está cargada.
5. `/portfolio/moda` (sin manifiesto): skeletons como hoy.
6. `/galeria/ejemplo`, contraseña `demo`:
   - fotos reales;
   - la cantidad del encabezado coincide;
   - no hay botón "Descargar todo (.zip)".
7. `/galeria/ejemplo-vencida` y `/galeria/ejemplo` sin cookie: ver el código
   fuente y buscar el nombre de una foto. No aparece (FR-014).

## 4. Comparación con Pixieset (SC-003, SC-004)

La misma tanda de fotos en el Pixieset de Romi y en `/galeria/ejemplo`, lado a
lado, con caché vacía:

- tiempo hasta ver la primera fila completa;
- color y nitidez en piel;
- sensación de la grilla.

Anotar el resultado en el doc (fase 1 de la sección 13). Si el color no
aguanta, se ajusta la calidad (research R2), se sube la versión del pipeline
y se repite.
