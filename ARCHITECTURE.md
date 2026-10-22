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
and layout; photos are real wherever a local manifest exists (made by
`npm run fotos`) and placeholders everywhere else; content in TypeScript files.
Photos live in Cloudflare R2: a public bucket with the derivatives (served from
`img.ellentederomi.com`, never through the app) and a private one with the
gallery originals. Postgres for metadata is feature 003.
Contact is WhatsApp only — there are no forms besides the gallery password.

## Top-level layout

    src/
      app/          routes (App Router): /, /portfolio, /portfolio/[categoria],
                    /sobre-mi, /contacto, /galeria/[slug]
      components/   shared UI: header, footer, grid, lightbox, skeletons
      content/      site texts, categories, galleries, photos (from manifiestos/)
                    — the future DB rows
      lib/          pure helpers: Foto type, image URLs, gallery access,
                    placeholder photos
      styles/       theme.css — the visual identity, in one place
    specs/          spec-kit features (spec, plan, tasks)
    docs/           harness process docs and harness ADRs
    scripts/fotos/    local CLI: JPEG folder → derivatives, manifest, R2 upload
    scripts/harness/  plan-coverage sensor and spec-kit gate
    manifiestos/, salida/  local output of scripts/fotos (gitignored: they
                    carry client slugs and photos)

## Module pattern

- A route is `src/app/<ruta>/page.tsx`. Route-local pieces (a form, a server
  action) live next to it, e.g. `galeria/[slug]/FormularioClave.tsx` and
  `acciones.ts`.
- Anything that will come from the database lives in `src/content/` behind a
  getter (`getCategoria`, `getGaleria`, `getFotos`). Pages call the getter,
  never the array, so swapping in a query changes one file. `getFotos` reads
  `manifiestos/<destino>.json` and falls back to placeholder photos.
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
code. `scripts/fotos/` imports `lib/fotos.ts` and `lib/imagenes.ts` with
relative `.ts` paths (Node strip-types, no bundler), so those two files must
stay free of imports. Enforced by review.

## Entry point and bootstrap

`src/app/layout.tsx` renders header, page and footer and sets the metadata from
`src/content/site.ts`. There is no config loading or shared infrastructure yet.
Environment variables are listed in `.env.example`: `GALERIAS_SECRETO` (signs
the gallery access cookie; a development value is used without it),
`NEXT_PUBLIC_IMG_HOST` (image host, default `img.ellentederomi.com`), and the
`R2_*` credentials and bucket names that only `npm run fotos -- --subir` reads
from `.env.local`.

## Current hotspots

- `src/components/JustifiedGrid.tsx` + the `.jgrid` rules in `globals.css` — the
  justified grid, solved in CSS from each photo's width and height (doc
  section 6). Needs `width`/`height` on every photo; never measure in the browser.
- `src/app/galeria/[slug]/page.tsx` — the gallery's states: not found, expired,
  password, open.
- `src/lib/acceso.ts` + `galeria/[slug]/acciones.ts` — the password check and
  the HMAC-signed cookie, scoped to the gallery's path.
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
