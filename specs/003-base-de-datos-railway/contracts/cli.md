# Contrato: comandos

Todos leen `.env.local` si existe (`--env-file-if-exists`) y la conexión de
`DATABASE_URL`. Ninguno imprime la URL ni la contraseña de la base.

## `npm run fotos` (cambia)

Igual que en `specs/002-fotos-reales/contracts/cli-fotos.md`, más:

- Con `--subir`, **antes de subir nada**: si el destino es
  `portfolio/<categoria>` y la categoría no está en la base, o es
  `galerias/<slug>` y la galería no está, sale con código 1 y
  `✗ <destino> no existe en la base` (FR-015). Sin `DATABASE_URL`, sale con
  código 1 y lo dice, igual que con las variables de R2 que faltan.
- Con `--subir`, al terminar de subir: reemplaza las fotos del destino en la
  base en una transacción (data-model, FR-003) e imprime
  `Base: N fotos en <destino>`.
- Sin `--subir`: no se conecta a la base (US1, escenario 5); el destino se
  valida solo por formato.
- El manifiesto local se sigue escribiendo (research R8).

## `npm run db:migrar` (nuevo)

Aplica en orden los `db/migraciones/*.sql` que no están en `migraciones`, cada
uno en su transacción. Imprime `✓ <archivo>` por cada uno aplicado o
`Base al día`. Ante un error, sale con código 1 y no aplica los siguientes.
Lo corre Railway antes de cada deploy (R7).

## `npm run db:sembrar` (nuevo)

Carga o actualiza (upsert) las cuatro categorías y las dos galerías de
ejemplo (data-model). Correrlo dos veces no duplica (FR-009). No toca
`fotos`. Solo datos inventados (FR-011).

## `npm run db:respaldar` y `npm run db:restaurar -- <archivo>` (condicionales)

Solo si Railway Hobby no tiene backups programados (research R6).
`respaldar` sube `romi/respaldos/<AAAA-MM-DD>.json` al bucket privado.
`restaurar` carga ese JSON en una base vacía y migrada; si la base tiene
datos, sale con código 1 sin tocar nada.

## `npm run db:probar` (nuevo)

Verificación sin base ni red: hash y verificación de claves (correcta,
incorrecta, formato inválido, parámetros distintos), orden de las
migraciones por nombre, validación de destinos y armado de las filas de
`fotos` a partir de un lote. Termina con `OK`.
