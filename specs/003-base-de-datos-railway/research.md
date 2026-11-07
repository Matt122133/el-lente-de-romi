# Research: Base de datos y hosting en Railway

## R1 — Cliente de Postgres

- **Decision**: `postgres` (porsager) **3.4.9**, consultas con SQL escrito a
  mano en tagged templates. Sin ORM.
- **Rationale**: no tiene dependencias, parametriza solo (sin inyección), y
  funciona igual en el sitio y en los scripts que Node corre con
  `--experimental-strip-types`, sin bundler. Son tres tablas y media docena de
  consultas: un ORM agregaría generación de código y un paso de build más.
  3.4.9 es de abril de 2026; la 4.x salió hace una semana (major nueva, sin
  rodaje).
- **Alternatives considered**: `pg` (más verboso, necesita `@types/pg`);
  Drizzle o Prisma (migraciones y tipos generados, demasiado para tres
  tablas; Prisma además suma un binario al deploy).

## R2 — Migraciones

- **Decision**: archivos `db/migraciones/NNN-nombre.sql`, aplicados en orden
  por `scripts/db/migrar.ts` (`npm run db:migrar`), que registra cada uno en
  una tabla `migraciones` y corre cada archivo en una transacción. Railway lo
  corre como *pre-deploy command*: si falla, el deploy no sigue y queda la
  versión anterior (US2, escenario 1).
- **Rationale**: FR-008 pide migraciones versionadas que no borren datos. Un
  runner de ~40 líneas alcanza; solo se avanza, nunca se revierte (para
  deshacer, una migración nueva).
- **Alternatives considered**: `node-pg-migrate` o las migraciones de un ORM
  (otra dependencia para lo que hace un `for` sobre archivos).

## R3 — Render y caché de las páginas

- **Decision**: los getters llaman a `await connection()` (`next/server`)
  antes de consultar, así las páginas que los usan se arman en cada pedido.
  `portfolio/[categoria]` pierde `generateStaticParams` y
  `dynamicParams = false`; un slug que no existe da `notFound()`.
- **Rationale**: (1) el build en Railway no tiene acceso a la red privada de
  la base, así que nada puede consultarla al compilar; (2) SC-001 pide ver las
  fotos en menos de 1 minuto sin deploy. Es el patrón que documenta
  `node_modules/next/dist/docs/01-app/02-guides/self-hosting.md` para leer en
  runtime. El costo es una consulta de unos ms por pedido sobre la red interna
  de Railway; el HTML es chico y las fotos siguen saliendo de R2.
- **Alternatives considered**: ISR con `revalidate = 30` o `unstable_cache`
  (necesita la base en el build para el primer render, o un primer pedido
  lento; agrega invalidación sin necesidad con este tráfico). Cache
  Components (`cacheComponents`): cambio de modelo en todo el sitio, no es
  para esta feature.

## R4 — Hash de la contraseña de galería

- **Decision**: `scrypt` de `node:crypto` (N = 2^15, r = 8, p = 1, sal de 16
  bytes), guardado como `scrypt$<N>$<r>$<p>$<sal b64>$<hash b64>`; se compara
  con `timingSafeEqual`.
- **Rationale**: FR-006 pide un algoritmo lento para contraseñas. scrypt viene
  con Node: cero dependencias y anda en el sitio y en el script de carga. El
  formato guarda los parámetros, así se pueden subir sin invalidar las claves
  viejas.
- **Alternatives considered**: `argon2` o `bcrypt` (módulos nativos: complican
  el build en Railway y en Windows sin ganar nada a esta escala).

## R5 — Una sola base, en Railway, también para desarrollo

- **Decision**: hay una sola base, la de Railway. El sitio publicado la usa
  por la red privada (`DATABASE_URL` de referencia de Railway); `npm run dev`
  y los scripts de Mateo, por la URL pública (TCP proxy) en `.env.local`.
- **Rationale**: hoy la base solo tiene datos de prueba y las galerías de
  ejemplo (FR-015: no hay galerías reales hasta la 004). Una base local
  obligaría a cargar las fotos dos veces y a mantener Docker en Windows. El
  riesgo (romper datos desde dev) no existe mientras no haya datos reales.
- **Revisar en la 004**: cuando haya galerías reales, separar una base de
  desarrollo (otro *environment* de Railway). Queda anotado en Riesgos.
- **Alternatives considered**: Postgres en Docker local (otro paso de setup,
  datos que divergen); environment de desarrollo en Railway ya (duplica
  consumo para nada todavía).

## R6 — Respaldo

- **Decision**: primero se usa lo que ofrezca Railway para el volumen de
  Postgres (pestaña *Backups* del servicio, con programación diaria). Si el
  plan Hobby no lo tiene, `scripts/db/respaldar.ts` (`npm run db:respaldar`)
  exporta las tablas a JSON y lo sube al bucket **privado** de R2
  (`romi/respaldos/AAAA-MM-DD.json`), y corre una vez por día como servicio
  *cron* de Railway (`0 6 * * *`). `npm run db:restaurar -- <archivo>` lo carga
  en una base vacía (SC-006).
- **Rationale**: FR-010 pide un respaldo de 24 h como máximo. Los datos son
  ~1 KB por foto: un JSON alcanza y no hace falta `pg_dump` instalado. El
  bucket privado ya existe y no tiene acceso público (principio VI). Nunca a
  GitHub: el repo es público.
- **A confirmar al implementar**: si Hobby tiene backups programados. La
  tarea del script queda condicionada a eso.
- **Alternatives considered**: `pg_dump` desde una GitHub Action (dejaría el
  dump en un artefacto de un repo público).

## R7 — Railway: build, arranque y Node

- **Decision**: `railway.json` en el repo con `build` por Railpack,
  `preDeployCommand: npm run db:migrar`, `startCommand: npm start` (Next lee
  `PORT`) y `healthcheckPath: /`. `engines.node` pasa a `>=22.9` para que
  Railpack elija un Node que corra los scripts con strip-types (el mismo
  requisito que ya tenía el script de fotos, research R1 de la 002).
- **Rationale**: la config versionada hace que el deploy se reproduzca sin
  clics. Next corre como servidor Node común: no hay adaptador ni el problema
  de trazado de archivos que hubo con `vercel build` en Windows.
- **Variables en Railway**: `DATABASE_URL` (referencia a la base),
  `GALERIAS_SECRETO`, `NEXT_PUBLIC_IMG_HOST` (Railway expone las variables
  también en el build, que es cuando Next las incrusta).
- **Región**: la más cercana a Argentina que ofrezca Railway; se elige al
  crear los servicios, app y base en la misma.

## R8 — Qué pasa con los manifiestos y las categorías en el código

- **Decision**: el sitio deja de leer `manifiestos/`. El script los sigue
  escribiendo en la compu de quien sube, porque también son su caché para no
  recodificar (`anteriores` en `procesar.ts`); con `--subir` además escribe
  la base. Las categorías salen de `site.categorias` y pasan a la tabla
  `categorias` (principio I); la lista repetida de `src/lib/fotos.ts` se va:
  con `--subir`, el destino se valida contra la base (FR-015), y sin
  `--subir`, solo su formato.
- **Rationale**: FR-014 permite seguir dejando los manifiestos para revisar;
  sacarlos rompería la reutilización de derivadas entre corridas.
