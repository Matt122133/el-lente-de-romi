---
ticket: none
status: active
covers:
  - src/
  - scripts/
  - db/
  - package.json
  - package-lock.json
  - railway.json
  - railway.worker.json
  - .env.example
  - ARCHITECTURE.md
  - SECURITY.md
  - docs/processes/dev-setup.md
  - specs/004-panel-de-romi/
verify: npm run typecheck && npm run build && npm run fotos:probar && npm run db:probar && npm run panel:probar
analyzed: 2026-11-07
---

<!--
Harness frontmatter:
- ticket: known Jira key, or none when there is no ticket.
- status: draft until a human promotes the analyzed plan to active.
- covers: repository-relative path prefixes this feature may edit.
- verify: command that proves the feature works; run until green.
- analyzed: date the /speckit-analyze report was read before promotion.
-->

# Implementation Plan: Panel de Romi

**Branch**: `004-panel-de-romi` | **Date**: 2026-11-07 | **Spec**: `specs/004-panel-de-romi/spec.md`

## Summary

Un panel en `/panel` para Romi: entra con su mail y contraseña (variables de
entorno, cookie de sesión firmada, límite de intentos por IP), crea
galerías, arrastra la carpeta de fotos y el navegador las sube por partes
directo al bucket privado de R2 con URLs firmadas. Un worker aparte en
Railway, con el mismo pipeline de la 002, toma cada original de una cola en
la base, genera las derivadas en el bucket público y marca la foto como
lista; la galería pública solo muestra las listas. Desde el panel también
copia el link, cambia contraseña (invalida accesos viejos) o vencimiento, y
borra la galería con todos sus archivos.

## Technical Context

**Language/Version**: TypeScript 5.9, Node ≥ 22.9.

**Primary Dependencies**: Next.js 16.4, React 19.3, `postgres` 3.4.9. Pasan
a `dependencies`: `@aws-sdk/client-s3` y `sharp`; se suma
`@aws-sdk/s3-request-presigner` 3.1155.0 (R3, R5).

**Storage**: Postgres (migración `002-panel.sql`), R2 (los dos buckets de la
002).

**Testing**: sin runner. `npm run panel:probar` (sin base ni red) más los
`probar` existentes y el quickstart contra Railway.

**Target Platform**: app y worker en Railway; panel en Chrome, Edge o Safari
de escritorio.

**Project Type**: sitio web + worker + herramientas de línea de comandos.

**Performance Goals**: 300 fotos en menos de 30 min de punta a punta
(SC-001); el panel muestra el avance cada pocos segundos.

**Constraints**: ningún pedido al sitio lleva bytes de imagen; derivadas del
mismo pipeline; mail y contraseña de Romi fuera del repo.

**Scale/Scope**: una usuaria, ~10 galerías vivas de ~300 fotos, 3.000
fotos/mes.

## Constitution Check

- **I. Romi's site, not a platform**: un solo login, sin tabla de usuarios
  ni roles; el panel es para sus galerías y nada más. Cumple.
- **II. Fast, faithful, cheap**: la galería sigue con ancho, alto y
  ThumbHash; el worker cuesta ~USD 0,35/mes con el volumen real (SC-006).
  Cumple.
- **III. Photo bytes never touch the app**: la subida es multipart firmado
  del navegador a R2 (exactamente lo que pide el principio); las server
  actions solo mueven ids, nombres y ETags; borrar solo manda claves. El
  worker sí lee y escribe imágenes, pero es un servicio aparte que no
  atiende pedidos de visitantes ni de Romi, como prevé la sección 5 del doc;
  el egress que el principio protege es R2 → visitante, que sigue gratis.
  Cumple.
- **IV. The original is sacred**: el original se sube sin tocar y el worker
  verifica su hash antes de procesarlo; las derivadas salen del mismo
  `procesarFoto`. La deuda High de la 002 sigue bloqueando galerías reales.
  Cumple.
- **V. Identity over cloning**: el panel no copia el de Pixieset: tiene lo
  que Romi usa (crear, subir, compartir, borrar). Cumple.
- **VI. Clients' photos are private**: slug con sufijo aleatorio, cookie de
  acceso que se invalida al cambiar la clave, panel con `noindex`, mail y
  hash de Romi en variables, nombres de archivo solo en la base. Cumple.
- **Scope**: punto 3 del alcance. Cumple.
- **Plan-bounded change**: `covers:` arriba (`SECURITY.md` porque cambia el
  modelo de acceso).
- **Verified before done**: `verify:` arriba, más el quickstart.

Re-check después del diseño: sin violaciones.

## Project Structure

### Documentation (this feature)

```text
specs/004-panel-de-romi/
├── spec.md, plan.md, research.md, data-model.md, quickstart.md
├── contracts/panel.md
├── checklists/requirements.md
└── tasks.md
```

### Source Code

```text
db/migraciones/002-panel.sql      # galerias.creada/clave_version, fotos.estado/nombre/error/cambiada, intentos_login
src/proxy.ts                      # /panel/* sin cookie → /panel/entrar (R2)
src/lib/sesion.ts                 # firmar/verificar la cookie del panel, exigirSesion (R1, R2)
src/lib/slug.ts                   # título → slug con sufijo (R6), sin imports del sitio
src/lib/orden.ts                  # orden natural compartido por script y panel (R4)
src/lib/imagenes.ts               # + PIPELINE (lo comparten pipeline y navegador, R3)
src/lib/acceso.ts                 # firma slug:version (R7)
src/lib/r2.ts                     # cliente S3 del sitio: firmar partes, completar, abortar, borrar prefijo
src/content/galerias.ts           # + listarGalerias, crear, editar, borrar; getGaleria con clave_version
src/content/fotos.ts              # getFotos solo 'lista'; + estado de subida
src/app/panel/layout.tsx          # noindex (lo heredan todas)
src/app/panel/entrar/page.tsx, acciones.ts   # fuera del grupo: sin sesión
src/app/panel/(privado)/layout.tsx           # exigirSesion, barra con "Cerrar sesión"
src/app/panel/(privado)/page.tsx             # lista
src/app/panel/(privado)/galerias/nueva/page.tsx, ../acciones.ts
src/app/panel/(privado)/galerias/[slug]/page.tsx, Subida.tsx (cliente), acciones.ts
src/app/galeria/[slug]/page.tsx   # "se está preparando" si no hay fotos listas; cookie con versión
scripts/fotos/pipeline.ts         # importa PIPELINE de src/lib/imagenes.ts
scripts/worker/index.ts           # servidor HTTP privado + cola (R5)
scripts/worker/cola.ts            # tomar, liberar colgadas, marcar lista/error (sin efectos al importar)
scripts/admin/clave.ts            # npm run admin:clave
scripts/panel/probar.ts           # npm run panel:probar
package.json, .env.example, ARCHITECTURE.md, SECURITY.md, docs/processes/dev-setup.md
```

**Structure Decision**: el panel vive en `src/app/panel/` como cualquier
ruta; el worker en `scripts/worker/`, al lado del script de fotos, porque
importa su pipeline. `railway.json` sigue siendo de la app; el worker se
configura con variables del servicio (ver § Cierre).

## Decisiones de diseño

- **D1 — Worker con el mismo pipeline** (R5): decisión de producto,
  aclaración del 2026-11-07; va a la sección 0 del doc con la deuda de gdocs.
- **D2 — Login sin tabla de usuarios** (R1).
- **D3 — Cola en Postgres, worker despertado por HTTP privado** (R5): sin
  Redis ni colas pagas, y el worker puede dormir.
- **D4 — Orden por nombre de archivo guardado en la base** (R4): cambia D4
  de la 002 (que no guardaba el nombre porque iba a un manifiesto en
  disco); la base es privada.

## Riesgos

- **Memoria del worker** con originales de 40 MB y AVIF: se procesa de a una
  foto; si Railway lo mata por memoria, se sube el límite del servicio.
- **CORS mal configurado**: la subida falla en el navegador con un error
  claro; quickstart §1.3.
- **Una sola base para dev y prod** (deuda de la 003): las galerías de
  prueba creadas en local aparecen en el sitio publicado. Aceptable sin
  usuarios reales; se resuelve antes de la primera galería real.

## Verificación

- `verify:` verde (2026-11-07): typecheck, build (panel y proxy en la tabla de
  rutas), `fotos:probar`, `db:probar`, `panel:probar`.
- Local: sin sesión o con cookie falsa, todo `/panel/*` redirige al login;
  `/panel/entrar` con `noindex`; el sitio no enlaza al panel. Mateo probó
  login, crear galería, lista, cambiar clave y borrar.
- 50 fotos subidas desde el panel a `galerias/ejemplo`: 50 listas en orden
  natural, el original bajado de R2 igual byte por byte al local (SC-003) y
  las 8 derivadas de una foto **idénticas** a las que generó el script de la
  002 con la misma foto (SC-002).
- Railway (8 vCPU, 4 fotos a la vez): las 50 fotos (276 MB) subieron en ~1
  min a ~55 Mbit/s; el worker las dejó listas en 2 min 25 s (~2,9 s por foto,
  12,5 s cada una con 4 a la vez), memoria máxima 4,4 GB de 8. Proyección a
  300 fotos: ~15 min (SC-001 cumple con margen).
- Pendiente de medir con uso real: consumo en *Usage* (SC-006) y 300 fotos
  de Romi (deuda High de la 002).

## Cierre (2026-11-07)

Desvíos respecto del diseño, encontrados al probar en Railway:

- **sharp con todos los núcleos**: en Linux con glibc arranca con 1 hilo por
  imagen; en Railway una foto tardaba 30–67 s. El worker llama a
  `sharp.concurrency(availableParallelism())`.
- **Worker sin config-as-code**: Railway no tomó `railway.worker.json` (se
  borró). El servicio usa `RAILPACK_START_CMD=npm run worker`,
  `RAILPACK_BUILD_CMD` (sin build de Next), `WORKER_PARALELO=4`, 8 vCPU y 8 GB,
  sin dominio público y sin modo serverless.
- **La cola se revisa cada 10 s** además del aviso de la app (research R5 no
  lo hacía para que el worker pudiera dormir): el aviso por la red privada no
  llega (0 avisos recibidos en la última prueba). Como el worker está siempre
  prendido, no cuesta más. Queda en deuda Low.
- **Subidas fallidas**: el navegador aborta el multipart y borra la fila, y
  una `subiendo` de más de una hora deja de contar como pendiente.
- **Hash en `.env.local`**: Next expande los `$`; `admin:clave` imprime la
  línea escapada.
- Las dos primeras mediciones en Railway las hizo, sin querer, un worker
  local que seguía corriendo contra la misma base: más razones para la deuda
  de separar la base de desarrollo.

Antes de darle el panel a Romi: cambiar `ADMIN_EMAIL` (hoy es el de Mateo) y
generar su contraseña con `npm run admin:clave`.
