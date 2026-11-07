# Quickstart: validar base de datos y Railway

## 0. Automático

```sh
npm run typecheck && npm run build && npm run fotos:probar && npm run db:probar
```

El build no necesita la base (research R3). Tiene que terminar en `OK`.

## 1. Railway (una vez, lo hace Mateo)

1. Proyecto nuevo en Railway, servicio desde el repo de GitHub (rama
   `master`) y un servicio de Postgres, los dos en la región más cercana a
   Argentina.
2. Variables del servicio de la app: `DATABASE_URL` = referencia a la de
   Postgres, `GALERIAS_SECRETO` (nuevo, largo), `NEXT_PUBLIC_IMG_HOST` (URL
   `r2.dev`).
3. En Postgres, activar el TCP proxy y copiar la URL pública a
   `DATABASE_URL` de `.env.local` (research R5).
4. Generar el dominio público del servicio (`*.up.railway.app`).
5. Mirar la pestaña *Backups* de Postgres: si deja programar uno diario,
   activarlo y anotarlo en el plan; si no, va el script (§5).

## 2. Base

1. `npm run db:migrar` → `✓ 001-inicial.sql`. Otra vez → `Base al día`.
2. `npm run db:sembrar` dos veces → 4 categorías y 2 galerías, sin duplicar.

## 3. Fotos (US1)

1. `npm run fotos -- --carpeta ../fotos-prueba/bodas --destino portfolio/social --subir`
   → `Base: 50 fotos en portfolio/social` (las derivadas dicen `↷ ya estaba`).
2. Sin deployar nada, abrir `/portfolio/social` en el dominio de Railway:
   las 50, en orden, en menos de 1 minuto (SC-001).
3. Lo mismo a `galerias/ejemplo`.
4. `--destino galerias/no-existe --subir` → código 1, `no existe en la base`,
   y en R2 no aparece nada bajo `romi/galerias/no-existe/`.
5. Subir una carpeta de 5 fotos a `portfolio/moda` y después otra de 3 al
   mismo destino: quedan 3 (FR-003).
6. Sin `--subir`: la base no cambia.

## 4. Sitio publicado (US2, US3)

1. `/`, `/portfolio`, `/portfolio/social`, `/sobre-mi`, `/contacto`: 200, las
   categorías en el mismo orden y con los mismos textos que en el preview.
2. `/portfolio/no-existe`: página de no encontrado.
3. `/galeria/ejemplo` sin cookie: pide la contraseña y el HTML no tiene
   ningún hash de foto; con `demo`, las 50; con otra, error.
4. `/galeria/ejemplo-vencida`: dice hasta cuándo estuvo, sin fotos.
5. DevTools: las imágenes vienen de `r2.dev`; nada de imágenes del dominio de
   Railway (FR-001, principio III).
6. Primera fila con "Fast 4G" y caché vacía: igual o mejor que el preview de
   Vercel (SC-003).
7. Hacer un cambio de texto visible, mergearlo a `master` y verlo publicado
   en menos de 10 minutos (SC-002).
8. Apagar el servicio de Postgres un momento: el portfolio muestra la página
   de error, la galería no muestra fotos (SC-005). Prenderlo de nuevo.

## 5. Respaldo (FR-010, SC-006)

Con backups de Railway: restaurar el último en una base nueva, apuntar
`DATABASE_URL` local a ella y ver las mismas fotos con `npm run dev`.

Con el script: `npm run db:respaldar`, ver el JSON en el bucket privado,
`npm run db:restaurar -- <archivo>` sobre una base vacía y migrada, y lo mismo.

## 6. Después

- Dar de baja el proyecto de Vercel (acción de Mateo).
- Anotar en la sección 0 del doc: Railway como hosting de app y base.
