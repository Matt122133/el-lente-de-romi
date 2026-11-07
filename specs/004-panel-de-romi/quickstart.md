# Quickstart: validar el panel

## 0. Automático

```sh
npm run typecheck && npm run build && npm run fotos:probar && npm run db:probar && npm run panel:probar
```

## 1. Railway y Cloudflare (Mateo, una vez)

1. `npm run admin:clave` con la contraseña de Romi → pegar el hash en
   `ADMIN_CLAVE_HASH` de la app; `ADMIN_EMAIL` con su mail; `SESION_SECRETO`
   y `WORKER_SECRETO` nuevos; las `R2_*` en la app.
2. Servicio nuevo `worker` desde el mismo repo (`master`), start command
   `npm run worker`, sin dominio público, modo serverless; variables
   `DATABASE_URL` (referencia), `R2_*`, `WORKER_SECRETO`. En la app,
   `WORKER_URL` con su dirección privada.
3. Cloudflare → bucket privado → CORS: `PUT` desde el dominio de Railway y
   `http://localhost:3000`, header `ETag` expuesto.
4. `npm run db:migrar` → `✓ 002-panel.sql`.

## 2. Login (US1)

1. `/panel` sin sesión → `/panel/entrar`. `curl -X POST` a una acción del
   panel sin cookie → sin efecto (SC-005).
2. Mail de Romi + clave → lista. Otro mail con la clave correcta y el mail
   correcto con otra clave → el mismo mensaje.
3. 5 fallos seguidos → bloqueado 15 min; desde otra IP se puede entrar.
4. "Cerrar sesión" → vuelve a pedir la clave.
5. HTML del panel con `noindex`; ningún enlace a `/panel` en el sitio.

## 3. Galería y subida (US2)

1. Crear "Prueba Ñandú" → slug `prueba-nandu-xxxxxx`, vence en un mes.
2. Arrastrar `../fotos-prueba/bodas` (50 JPEG) más un `.txt` → el `.txt` se
   saltea con aviso; avance por foto.
3. DevTools → Network: los PUT van a `r2.cloudflarestorage.com`; ningún
   pedido al sitio lleva más de unos KB (principio III).
4. Cortar la red a la mitad, recargar, arrastrar de nuevo → solo sube lo que
   faltaba (FR-008).
5. Abrir la galería con su clave mientras procesa → solo fotos listas, en
   orden; antes de la primera, "se está preparando".
6. Al terminar: 50 fotos en orden de nombre; una derivada igual byte por
   byte a la que genera `npm run fotos` con la misma foto (SC-002); un
   original bajado de R2 con el mismo sha256 que el local (SC-003).
7. 300 fotos (las 50 × 6 con otro nombre no sirven: mismo hash; usar 300
   distintas) en menos de 30 min de punta a punta (SC-001).

## 4. Compartir, cambiar, borrar (US3)

1. "Copiar link" → la URL pública.
2. Cambiar la clave → la vieja no entra y quien ya estaba tiene que
   escribir la nueva.
3. Vencimiento en el pasado → vencida; extenderlo → vuelve a mostrar fotos.
4. Borrar escribiendo el título → el link da "no existe"; en los dos buckets
   no queda nada bajo `romi/galerias/<slug>/` (SC-004).
5. Lista: cantidad de fotos, vencimiento y estado correctos.

## 5. Costo

Después de procesar las 300: CPU y salida del worker en *Usage* de Railway;
proyectar a 3.000 fotos/mes, menos de USD 1 (SC-006).
