---
owner: el-lente-de-romi
status: living
last_reviewed: 2026-10-21
update_trigger: on-module-change
---

# Architecture

Top-level map of the code. Read it before writing code you might later have to
unwind. The *why* behind the stack (R2, costs, derivatives, downloads) lives in
sections 3–8 of the project doc linked from [`AGENTS.md`](AGENTS.md); this file
only says where things are.

## Overview

The site of El Lente de Romi, a photographer: a public **portfolio** (home,
categories, about, contact) and private **delivery galleries** where her clients
and their guests see and download the photos. It replaces Pixieset. Real pages
and layout. Categories, galleries and photos live in Postgres (feature 003);
the rest of the texts are still in `src/content/site.ts`. Photos are real
wherever `npm run fotos -- --subir` wrote them to the database, placeholders
everywhere else. Photos live in Cloudflare R2: a public bucket with the
derivatives (served from `img.ellentederomi.com`, never through the app) and a
private one with the gallery originals. App and database are hosted on Railway,
deployed from `master` (`railway.json`). Romi manages her delivery galleries in
a private panel at `/panel` (feature 004); her uploads go from the browser to R2
and a separate worker service (`scripts/worker/`, `railway.worker.json`)
generates the derivatives with the same pipeline as `npm run fotos`.
Contact is WhatsApp only — there are no forms besides the gallery password.

## Top-level layout

    src/
      app/          routes (App Router): /, /portfolio, /portfolio/[categoria],
                    /sobre-mi, /contacto, /galeria/[slug]
      components/   shared UI: header, footer, grid, lightbox, skeletons
      content/      getters: site texts, and categories, galleries and photos
                    from the database
      lib/          helpers: Foto type, image URLs, gallery access, password
                    hashing, placeholder photos, the database client
      styles/       theme.css — the visual identity, in one place
    specs/          spec-kit features (spec, plan, tasks)
    docs/           harness process docs and harness ADRs
    db/migraciones/   versioned SQL, applied in order by npm run db:migrar
    scripts/fotos/    local CLI: JPEG folder → derivatives, R2 upload, DB rows
    scripts/db/       migrate, seed the example data, checks without a DB
    scripts/worker/   derivative worker for panel uploads (queue in the fotos table)
    scripts/admin/    npm run admin:clave (hash for Romi's panel password)
    scripts/harness/  plan-coverage sensor and spec-kit gate
    manifiestos/, salida/  local cache of scripts/fotos (gitignored: they
                    carry client slugs and photos; the site no longer reads them)

## Module pattern

- A route is `src/app/<ruta>/page.tsx`. Route-local pieces (a form, a server
  action) live next to it, e.g. `galeria/[slug]/FormularioClave.tsx` and
  `acciones.ts`.
- Content lives in `src/content/` behind async getters (`getCategorias`,
  `getCategoria`, `getGaleria`, `claveCorrecta`, `getFotos`). Pages await the
  getter and never query the database themselves. Getters call `connection()`
  first, so those pages render per request: the build never needs the
  database, and an upload shows up without a deploy. `getFotos` falls back to
  placeholder photos when a destination has no rows.
- The panel lives under `src/app/panel/`: `entrar/` is the only page without a
  session; everything else is in the `(privado)` route group, whose layout and
  every page and action call `exigirSesion()`. `src/proxy.ts` only does the
  optimistic redirect.
- A photo row moves `subiendo → subida → procesando → lista` (or `error`);
  the public site only shows `lista`. Script uploads are inserted as `lista`.
- Schema changes are new files in `db/migraciones/` (`NNN-name.sql`), never
  edits to applied ones; Railway runs `npm run db:migrar` before each deploy.
- Colors, fonts and spacing are CSS variables in `src/styles/theme.css`;
  components only use the variables (doc section 9).
- Server components by default. `"use client"` only where there is state:
  today `JustifiedGrid` (opens the lightbox), `Lightbox`, `Foto` (load state,
  ThumbHash decode) and `FormularioClave`.
- A photo is real when it has a `thumbhash`; then `Foto` draws it with
  `<picture>` (AVIF, WebP fallback, srcset). Without one, `FotoSkeleton`.
  Never `next/image`: its optimizer would route image bytes through the app.

## Dependency direction

`app → components → lib`, and `app/components → content`. `lib/` and
`content/` import nothing from `app/` or `components/`. `lib/acceso.ts` and
`content/fotos.ts` use `node:` modules and must only be imported from server
code, as do `lib/db.ts` and the `content/` getters (they query the database).
`scripts/` imports `lib/fotos.ts`, `lib/imagenes.ts` and `lib/claves.ts` with
relative `.ts` paths (Node strip-types, no bundler), so those files must stay
free of site imports (`node:` modules only). Enforced by review.

## Entry point and bootstrap

`src/app/layout.tsx` renders header, page and footer and sets the metadata from
`src/content/site.ts`. The only shared infrastructure is the database client in
`src/lib/db.ts` (one pool, reused across `next dev` reloads). Environment
variables are listed in `.env.example`: `DATABASE_URL` (Railway's private URL
in production; the public TCP-proxy URL in `.env.local`), `GALERIAS_SECRETO`
(signs the gallery access cookie; a development value is used without it),
`NEXT_PUBLIC_IMG_HOST` (image host, default `img.ellentederomi.com`; inlined at
build time), and the `R2_*` credentials and bucket names that only
`npm run fotos -- --subir` reads from `.env.local`.

## Current hotspots

- `src/components/JustifiedGrid.tsx` + the `.jgrid` rules in `globals.css` — the
  justified grid, solved in CSS from each photo's width and height (doc
  section 6). Needs `width`/`height` on every photo; never measure in the browser.
- `src/app/galeria/[slug]/page.tsx` — the gallery's states: not found, expired,
  password, open.
- `src/lib/acceso.ts` + `src/lib/claves.ts` + `galeria/[slug]/acciones.ts` —
  the scrypt password check against the stored hash and the HMAC-signed
  cookie, scoped to the gallery's path.
- `src/app/panel/(privado)/galerias/[slug]/Subida.tsx` + `acciones.ts` +
  `src/lib/r2.ts` — browser multipart upload: ids by WebCrypto
  (`src/lib/idFoto.ts`, must match `nombreDeHash`), presigned parts, resume by
  id. Needs CORS on the private bucket exposing `ETag`.
- `scripts/worker/` — the queue (`FOR UPDATE SKIP LOCKED`, stuck rows released
  after 10 minutes) and the HTTP wake-up on the private network.
- `scripts/fotos/base.ts` — replaces a destination's photos in one
  transaction; `--subir` refuses a destination that is not in the database.
- `src/lib/imagenes.ts` — the R2 path contract: host, `romi/` prefix,
  derivative widths, derivative and original keys. `scripts/fotos/` imports it,
  so the names the script uploads and the URLs the site asks for cannot drift.
- `scripts/fotos/pipeline.ts` — quality, color and naming of the derivatives
  (constitution IV). Changing anything there means bumping `PIPELINE`, which
  changes every URL (derivatives are cached for a year).
- `src/lib/placeholders.ts` — deterministic fake photos (the `Foto` type is in
  `src/lib/fotos.ts`).

## Adding a new module

1. Spec it with `/speckit-specify`; plan and get the plan to `status: active`.
2. Add the route under `src/app/`; keep its private pieces next to it.
3. Content that Romi will edit goes to `src/content/` behind a getter.
4. New colors or sizes become variables in `theme.css` first.
5. If it introduces a product decision (storage, auth, a new external service),
   record it in section 0 of the project doc.
