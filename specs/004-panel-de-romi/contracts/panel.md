# Contrato: panel

Todas las rutas bajo `/panel`, con `noindex` y sin enlaces desde el sitio
público (FR-014). Sin sesión, todas redirigen a `/panel/entrar` (proxy) y
además cada página y cada acción llama a `exigirSesion()` (research R2).

## Páginas

| Ruta | Qué muestra |
|---|---|
| `/panel/entrar` | mail, contraseña, "Entrar"; un único mensaje de error |
| `/panel` | lista de galerías: título, cantidad de fotos listas, vencimiento, estado (vigente / vence en ≤ 7 días / vencida), botón "Nueva galería" |
| `/panel/galerias/nueva` | título, fecha del evento, contraseña; vencimiento precargado a un mes |
| `/panel/galerias/[slug]` | zona para arrastrar la carpeta, avance por foto, fotos con error y "Reintentar", "Copiar link", cambiar contraseña y vencimiento, "Borrar galería" (pide escribir el título) |

## Server actions (todas exigen sesión)

| Acción | Entrada | Efecto |
|---|---|---|
| `entrar` | mail, clave | límite de intentos (R1); setea la cookie y va a `/panel` |
| `salir` | — | borra la cookie |
| `crearGaleria` | título, fecha, clave, vence | slug (R6), hash de la clave; va a la galería |
| `editarGaleria` | slug, clave?, vence? | clave nueva → hash nuevo y `clave_version + 1` |
| `borrarGaleria` | slug, título escrito | si coincide el título, R8 |
| `empezarSubida` | slug, `[{id, nombre, tamaño}]` | ver R3: devuelve `{ya: id[], nuevas: [{id, uploadId, partes: url[]}]}` |
| `terminarSubida` | slug, id, `[{numero, etag}]` | completa el multipart, `subida`, despierta al worker |
| `reintentar` | slug, id | `error` → `subida`, despierta al worker |
| `estadoGaleria` | slug | conteo por estado y las fotos con error (el panel lo consulta cada pocos segundos mientras hay pendientes) |

Ninguna acción recibe ni devuelve bytes de imagen.

## Worker

`POST /procesar` en la red privada, header `Authorization: Bearer
<WORKER_SECRETO>`; responde `202` enseguida y vacía la cola en segundo plano.
Sin el secreto, `401`. No tiene dominio público.

## Comandos nuevos

- `npm run admin:clave`: pide la contraseña dos veces (sin mostrarla) e
  imprime el hash para `ADMIN_CLAVE_HASH`.
- `npm run worker`: arranca el worker (Railway).
- `npm run panel:probar`: verificación sin base ni red (slug, firma y
  vencimiento de la sesión, cookie de acceso con versión, orden natural,
  transiciones de estado, id de la foto igual en el navegador y en Node).
