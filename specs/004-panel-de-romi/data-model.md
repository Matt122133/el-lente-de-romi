# Data model: Panel de Romi

Cambios sobre el modelo de la 003 (`specs/003-base-de-datos-railway/data-model.md`),
en la migración `db/migraciones/002-panel.sql`.

## `galerias` (cambia)

| Columna nueva | Tipo | Reglas |
|---|---|---|
| `creada` | timestamptz | default `now()`; base del vencimiento por defecto (+1 mes) |
| `clave_version` | integer | default 1; la cookie de acceso la firma (research R7) |

## `fotos` (cambia)

| Columna nueva | Tipo | Reglas |
|---|---|---|
| `estado` | text | `subiendo` → `subida` → `procesando` → `lista`, o `error`; default `lista` (las del script, R9) |
| `nombre` | text, nullable | nombre del archivo en la compu de Romi, solo para ordenar (R4); null en las del script |
| `error` | text, nullable | mensaje del último fallo |
| `cambiada` | timestamptz | default `now()`; para detectar `procesando` colgadas (R5) |

- `width`, `height` y `thumbhash` pasan a aceptar null mientras la foto no
  está `lista` (con un CHECK: si `estado = 'lista'`, los tres no son null).
- Índice parcial `fotos_pendientes (cambiada) WHERE estado IN ('subida', 'procesando')`
  para la cola del worker.
- `getFotos` filtra `estado = 'lista'` (FR-009).

Transiciones:

```
subiendo ──terminarSubida──▶ subida ──worker toma──▶ procesando ──ok──▶ lista
                                ▲                         │
                                └──reintentar── error ◀───┘ (falla o hash distinto)
procesando sin cambios > 10 min ──▶ subida
```

## `intentos_login` (nueva)

| Columna | Tipo |
|---|---|
| `ip` | text |
| `fecha` | timestamptz, default `now()` |

Índice `(ip, fecha)`. Las filas de más de un día se borran al registrar un
intento nuevo. Un login correcto borra las de esa IP.

## Variables de entorno nuevas

| Variable | Dónde | Qué |
|---|---|---|
| `ADMIN_EMAIL` | app | el mail de Romi (nunca en el repo) |
| `ADMIN_CLAVE_HASH` | app | hash scrypt de su contraseña (`npm run admin:clave`) |
| `SESION_SECRETO` | app | firma la cookie del panel |
| `WORKER_SECRETO` | app y worker | autoriza `POST /procesar` |
| `WORKER_URL` | app | `http://<worker>.railway.internal:<puerto>` |
| `R2_*` | app y worker | la app firma URLs y borra; el worker lee y escribe |
