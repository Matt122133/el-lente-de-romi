# Research: Panel de Romi

## R1 — Login de Romi

- **Decision**: mail + contraseña contra dos variables de entorno,
  `ADMIN_EMAIL` y `ADMIN_CLAVE_HASH` (formato scrypt de `src/lib/claves.ts`,
  la 003). `npm run admin:clave` pide la contraseña por consola y imprime el
  hash para pegarlo en Railway. La sesión es una cookie `httpOnly`,
  `secure`, `sameSite=lax`, path `/panel`, con `vence` firmado con HMAC
  (`SESION_SECRETO`, distinto de `GALERIAS_SECRETO`). Sin tabla de sesiones:
  hay una sola usuaria, y cerrar sesión borra la cookie. Cambiar
  `SESION_SECRETO` cierra todas las sesiones.
- **Mismo mensaje y mismo tiempo** (FR-016): si el mail no coincide igual se
  corre scrypt contra el hash guardado antes de rechazar.
- **Límite de intentos** (FR-002): tabla `intentos_login (ip, fecha)`; 5
  fallidos de la misma IP en 15 minutos bloquean esa IP 15 minutos. Por IP y
  no global, para que un tercero no pueda dejar a Romi afuera. La IP sale
  del primer valor de `x-forwarded-for` (Railway lo pone).
- **Rationale**: es lo que pide la sección 5 ("login simple") y la
  aclaración del 2026-11-07. Las variables evitan que el mail real entre al
  repo (principio VI).
- **Alternatives considered**: tabla de usuarios (no hay más usuarios);
  Auth.js o similar (dependencia grande para una sola cuenta); TOTP (queda
  como mejora opcional).

## R2 — Dónde se controla el acceso

- **Decision**: `src/proxy.ts` redirige a `/panel/entrar` cualquier
  `/panel/*` sin cookie de sesión válida (chequeo optimista, como indica
  `node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md`), y
  además **cada** página del panel y **cada** server action del panel llama
  a `exigirSesion()`, que verifica la firma y el vencimiento y si no,
  redirige o tira. Las server actions se pueden invocar por POST sin pasar
  por la página, así que el proxy solo no alcanza (SC-005).

## R3 — Subida del navegador a R2

- **Decision**: multipart directo al bucket **privado** con URLs firmadas
  (principio III: "presigned multipart URLs"). Partes de 8 MB; una foto de
  menos de 8 MB es un multipart de una parte. Flujo por foto:
  1. El navegador calcula el id = SHA-256(`PIPELINE` + bytes) con
     WebCrypto, el mismo que `nombreDeHash` del pipeline (la constante
     `PIPELINE` pasa a `src/lib/imagenes.ts` para compartirla).
  2. Server action `empezarSubida(slug, [{id, nombre, tamaño}])`: devuelve
     las que ya están (se saltean, FR-008) y para las nuevas crea la fila
     `fotos` en estado `subiendo`, inicia el multipart y firma las URLs de
     cada parte (15 minutos).
  3. El navegador sube las partes con `fetch` PUT (4 fotos en paralelo).
  4. Server action `terminarSubida(slug, id, partes)`: completa el multipart,
     pasa la foto a `subida` y despierta al worker (R5).
- **CORS del bucket privado**: permitir `PUT` desde el dominio del sitio y
  `localhost:3000`, exponiendo `ETag`. Lo configura Mateo en Cloudflare (el
  token del sitio no tiene permiso de configurar buckets).
- **Dependencias**: `@aws-sdk/client-s3` pasa a `dependencies` (ahora lo usa
  el sitio) y se suma `@aws-sdk/s3-request-presigner` **3.1155.0**, la misma
  versión que el cliente instalado.
- **Alternatives considered**: PUT simple por foto (más simple, pero la
  constitución pide multipart y una foto de 40 MB se reintentaría entera);
  subir a la app y de ahí a R2 (prohibido, principio III).

## R4 — Orden de las fotos

- **Decision**: la fila guarda `nombre` (el nombre del archivo; la base es
  privada, nunca va al repo ni a las URLs). Al terminar cada tanda, la
  server action recalcula `posicion` de toda la galería ordenando por
  `nombre` con `Intl.Collator("es", { numeric: true })`, el mismo orden
  natural del script (FR-009).

## R5 — Worker de derivadas

- **Decision**: un segundo servicio de Railway desde el mismo repo
  (`npm run worker`, `scripts/worker/`). Corre el `procesarFoto` del
  pipeline de la 002 sin cambios (mismo color, SC-002). Cada foto:
  baja el original del bucket privado, verifica que su hash sea el id (si no,
  `error`), genera las 8 derivadas, las sube al bucket público y deja la fila
  en `lista` con `width`, `height` y `thumbhash`.
- **Cola en la base**: toma fotos `subida` con
  `UPDATE … SET estado = 'procesando' … FOR UPDATE SKIP LOCKED`, de a una
  (memoria acotada). Una foto que queda en `procesando` más de 10 minutos
  (worker que murió) vuelve a `subida`. Falla → `error` con el mensaje; el
  panel permite reintentar (vuelve a `subida`).
- **Cómo se despierta**: expone `POST /procesar` solo en la red privada de
  Railway (`worker.railway.internal`), protegido con `WORKER_SECRETO`.
  `terminarSubida` lo llama sin esperar respuesta. Al recibirlo, o al
  arrancar, vacía la cola y queda quieto: así puede estar en modo
  *serverless* y dormir sin tráfico (no hace polling, que lo mantendría
  despierto).
- **Dependencias**: `sharp` pasa a `dependencies` (el worker corre en
  Railway con las dependencias de producción); el sitio no lo importa.
- **Costo**: ~4 s de CPU por foto; con 3.000 fotos por mes, ~3,3 h de CPU,
  ~4 GB de salida hacia R2: ~USD 0,35/mes (aclaración del 2026-11-07).
- **Principio III**: el worker no es el servidor del sitio; ningún pedido de
  un visitante ni de Romi transporta bytes de imagen. Coincide con la
  sección 5 del doc ("se puede mover … a un worker").

## R6 — Slug

- **Decision**: título → minúsculas, sin acentos (NFD + quitar marcas), `ñ`
  → `n`, todo lo que no sea `[a-z0-9]` → guion, sin guiones repetidos ni en
  los bordes, hasta 40 caracteres, más un sufijo aleatorio de 6 caracteres
  `[a-z0-9]` (`boda-nandu-k3x9qa`). El sufijo lo hace imposible de adivinar
  (principio VI) y resuelve los repetidos (FR-004).

## R7 — Cambiar la contraseña invalida accesos

- **Decision**: `galerias.clave_version` (int). La cookie de acceso firma
  `slug:version` en lugar de `slug`; cambiar la clave suma 1 y las cookies
  viejas dejan de validar (FR-011). Afecta a `src/lib/acceso.ts` y a la
  página de la galería.

## R8 — Borrar una galería

- **Decision**: server action con sesión: lista los objetos bajo
  `romi/galerias/<slug>/` en los dos buckets y los borra con
  `DeleteObjects` de a 1.000, aborta los multipart pendientes de ese
  prefijo, y recién después borra la galería y sus fotos de la base en una
  transacción. Si falla a mitad, se puede repetir (SC-004). Nunca toca bytes:
  solo claves.

## R9 — Galerías del script y del panel conviven

- Las fotos que sube el script de la 002 entran directo en estado `lista`
  (default de la columna), así el portfolio y la galería de ejemplo siguen
  igual.
