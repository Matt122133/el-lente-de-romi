# Research: Fotos reales — derivadas y grilla con imágenes

Decisiones técnicas del plan 002. Cada una con lo que se eligió, por qué y qué
se descartó.

## R1 — Cómo corre el script

- **Decision**: TypeScript ejecutado directo con Node
  (`node --experimental-strip-types --env-file-if-exists=.env.local`), en
  `scripts/fotos/`. Importa `src/lib/imagenes.ts` con ruta relativa para usar
  las mismas `VARIANTES`, `PREFIJO` y formato de nombre que el sitio.
- **Rationale**: un solo contrato de nombres (FR-004) sin duplicarlo en otro
  archivo. Node 22.15 ya está instalado; no suma `tsx` ni un paso de build.
  `--env-file-if-exists` lee las credenciales de `.env.local`, que ya está
  ignorado por git.
- **Alternatives**: `.mjs` en JS plano (duplica el contrato de nombres);
  `tsx` como dependencia (una dependencia más para lo mismo).
- **Consecuencia**: `tsconfig.json` suma `allowImportingTsExtensions` (válido
  porque ya tiene `noEmit`). El script pide Node ≥ 22.9 aunque el sitio siga
  pidiendo ≥ 20.9.

## R2 — Procesamiento de imagen

- **Decision**: `sharp` 0.35 (ya está en `node_modules` como dependencia de
  Next; pasa a devDependency explícita). Por foto: `rotate()` (aplica la
  orientación EXIF), `resize({ width, withoutEnlargement: true })`, conversión
  a sRGB con `withIccProfile("srgb")`. sharp no copia metadatos salvo que se
  le pida, así que GPS y el resto del EXIF no pasan a las derivadas.
- **Calidad inicial**: AVIF `quality: 55, effort: 4, chromaSubsampling:
  "4:4:4"`; WebP `quality: 80, smartSubsample: true`. Son el punto de partida
  de la comparación con Pixieset (SC-004), no un valor final: viven en una
  constante y cambiarlas sube la versión del pipeline (R4).
- **Rationale**: 4:4:4 en AVIF evita el corrimiento de color en rojos y tonos
  de piel, que es lo primero que Romi notaría (principio IV). `effort: 4` es
  el punto donde el tiempo deja de pagar: con effort más alto, 300 fotos
  pasan los 30 minutos de SC-005.
- **Alternatives**: Cloudflare Image Transformations (sección 5 del doc: plan
  B, menos control del color); `squoosh` (abandonado).

## R3 — ThumbHash

- **Decision**: paquete `thumbhash` 0.1.1. El script lo codifica desde una
  versión de 100 px de la foto en RGBA. El navegador lo decodifica a un data
  URL con `thumbHashToDataURL` (JS puro, sin canvas, ~1 KB).
- **Rationale**: decodificar en el cliente deja ~30 caracteres por foto en la
  página. Mandar el data URL ya armado son ~1-2 KB por foto, o sea 300-600 KB
  extra en una galería de 300.
- **Alternatives**: BlurHash (no guarda la proporción ni el alfa y se ve peor
  en los bordes); color promedio (menos fiel a la foto).

## R4 — Nombres

- **Decision**: `nombre = sha256(versión del pipeline + bytes del
  original)`, en hex, primeros 32 caracteres (128 bits). Ruta de la foto:
  `<destino>/<nombre>`; derivada: `romi/<destino>/<nombre>-<variante>.<formato>`
  (`urlDerivada`); original: `romi/<destino>/<nombre>.jpg`.
- **Rationale**: depende del contenido, así que no se puede adivinar
  (principio VI) y correr el lote de nuevo da los mismos nombres (FR-008).
  La versión del pipeline entra en el hash porque las derivadas se cachean un
  año: si cambia la calidad, cambia la URL y nadie ve una versión vieja.
- **Alternatives**: el nombre del archivo (lleva datos del cliente, y es
  secuencial); un UUID al azar (no es idempotente).

## R5 — Dónde va el original

- **Decision**: dos buckets de R2. El **público** (`R2_BUCKET`, conectado a
  `img.ellentederomi.com`) guarda solo derivadas. El **privado**
  (`R2_BUCKET_ORIGINALES`, sin acceso público) guarda los originales de las
  galerías con la misma clave, y en la fase 3 se entregan con una URL firmada.
- **Rationale**: un dominio público de R2 expone el bucket entero. Si el
  original quedara al lado de las derivadas, se podría bajar sin pasar por la
  contraseña, y la fase 3 promete URLs firmadas (sección 8, principio III).
  Dos buckets cuestan lo mismo que uno.
- **Alternatives**: un solo bucket y confiar en el nombre impredecible (el
  original queda público para siempre; no se puede revocar); un Worker que
  filtre por prefijo (código y costo de más).
- **Pendiente**: es una decisión de producto, así que va como fila en la
  sección 0 del doc cuando se apruebe el plan.

## R6 — Subida a R2 y reintentos

- **Decision**: `@aws-sdk/client-s3` (devDependency, solo el script) contra el
  endpoint S3 de R2. Antes de subir, un `ListObjectsV2` del prefijo de cada
  bucket arma el conjunto de claves existentes, y se sube solo lo que falta.
  Derivadas con `Cache-Control: public, max-age=31536000, immutable` y su
  `Content-Type`. Original con `Content-Type: image/jpeg`, sin tocar los bytes.
  Hasta 4 subidas en paralelo.
- **Rationale**: listar una vez por prefijo es más rápido y barato que un
  `HEAD` por archivo (2.700 en una galería de 300) y resuelve la subida
  cortada a la mitad (Edge Cases). Un PUT simple alcanza: un original de
  ~13 MB está lejos del límite de 5 GB.
- **Alternatives**: `rclone` (otro programa para instalar y configurar);
  subida multipart (de más para estos tamaños; la del navegador es la fase 3).

## R7 — Host de imágenes en el sitio

- **Decision**: `IMG_HOST` sale de `NEXT_PUBLIC_IMG_HOST`, y si no está, de
  `https://img.ellentederomi.com`. Para probar se apunta a la URL `r2.dev` del
  bucket público.
- **Rationale**: FR-013. `NEXT_PUBLIC_` porque la grilla es un componente de
  cliente y arma las URLs en el navegador. Nunca apunta a la app: las fotos no
  se sirven desde `public/`.

## R8 — De dónde lee las fotos el sitio

- **Decision**: manifiestos JSON en `manifiestos/<destino>.json` (ignorados
  por git), leídos con `fs` desde un getter de servidor
  (`src/content/fotos.ts`). Si no hay archivo, se usan las fotos de mentira.
- **Rationale**: FR-011 y FR-012. Es la misma forma que va a tener la consulta
  a la base de datos de la feature 003: se cambia un archivo.
- **Consecuencia**: el sitio publicado no tiene fotos reales hasta la 003. Es
  lo esperado: esta feature es la prueba local de la fase 1.

## R9 — Componente de foto

- **Decision**: `<picture>` con `<source type="image/avif">` y
  `<source type="image/webp">`, ambos con `srcset` de las cuatro variantes, y
  un `<img>` WebP `medium` como respaldo, con `width` y `height`,
  `loading="lazy"` y `decoding="async"`. El contenedor tiene la proporción de
  la foto y el ThumbHash de fondo. La imagen aparece con un fundido cuando
  carga. Si falla, se esconde y queda el ThumbHash.
- **`sizes`**: en la grilla, `(max-width: 600px) <ar×160×1.5>px,
  <ar×280×1.5>px`, porque una fila puede estirarse hasta ~1,5 veces su altura
  base. En el lightbox, `100vw`.
- **Prioridad**: las primeras 6 fotos de la grilla usan `loading="eager"` y
  `fetchPriority="high"`. Es lo que se mide en SC-003.
- **Lightbox**: precarga la foto anterior y la siguiente con `new Image()`
  usando el `srcset` AVIF y el mismo `sizes` (el comentario del Lightbox ya lo
  prevé).
- **No se usa `next/image`**: su optimizador pasaría los bytes por la app
  (principio III). Un loader propio solo armaría URLs que ya arma
  `imagenes.ts`, y sin `<picture>` no se elige AVIF o WebP por tipo.

## R10 — Verificación automática del script

- **Decision**: `scripts/fotos/probar.ts` (`npm run fotos:probar`). Genera con
  sharp 3 JPEG sintéticos en una carpeta temporal (uno vertical en Display P3
  con EXIF de GPS, uno de 1200 px de ancho, uno duplicado de otro con distinto
  nombre), corre el pipeline en modo local y comprueba:
  - 8 derivadas por foto única, con el ancho esperado y sin agrandar;
  - ninguna derivada con GPS y todas con un perfil sRGB;
  - el duplicado aparece una sola vez;
  - el orden natural y los mismos nombres al correrlo dos veces.

  No toca R2.
- **Rationale**: el repo no tiene runner de tests (plan 001). Un script con
  asserts alcanza y entra en `verify:`.
