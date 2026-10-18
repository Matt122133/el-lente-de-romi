---
owner: el-lente-de-romi
status: living
last_reviewed: 2026-10-18
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
and their guests see and download the photos. It replaces Pixieset. Today it is
a skeleton: real pages and layout, placeholder photos, content in TypeScript
files. Planned systems it will talk to: Cloudflare R2 for the photos (served
from `img.ellentederomi.com`, never through the app) and Postgres for metadata.
Contact is WhatsApp only — there are no forms besides the gallery password.

## Top-level layout

    src/
      app/          routes (App Router): /, /portfolio, /portfolio/[categoria],
                    /sobre-mi, /contacto, /galeria/[slug]
      components/   shared UI: header, footer, grid, lightbox, skeletons
      content/      site texts, categories, galleries — the future DB rows
      lib/          pure helpers: image URLs, gallery access, placeholder photos
      styles/       theme.css — the visual identity, in one place
    specs/          spec-kit features (spec, plan, tasks)
    docs/           harness process docs and harness ADRs
    scripts/harness/  plan-coverage sensor and spec-kit gate

## Module pattern

- A route is `src/app/<ruta>/page.tsx`. Route-local pieces (a form, a server
  action) live next to it, e.g. `galeria/[slug]/FormularioClave.tsx` and
  `acciones.ts`.
- Anything that will come from the database lives in `src/content/` behind a
  getter (`getCategoria`, `getGaleria`). Pages call the getter, never the array,
  so swapping in a query changes one file.
- Colors, fonts and spacing are CSS variables in `src/styles/theme.css`;
  components only use the variables (doc section 9).
- Server components by default. `"use client"` only where there is state:
  today `JustifiedGrid` (opens the lightbox), `Lightbox`, and `FormularioClave`.

## Dependency direction

`app → components → lib`, and `app/components → content`. `lib/` and
`content/` import nothing from `app/` or `components/`. `lib/acceso.ts` uses
`node:crypto` and must only be imported from server code. Enforced by review.

## Entry point and bootstrap

`src/app/layout.tsx` renders header, page and footer and sets the metadata from
`src/content/site.ts`. There is no config loading or shared infrastructure yet.
The only environment variable is `GALERIAS_SECRETO` (signs the gallery access
cookie); without it a development value is used.

## Current hotspots

- `src/components/JustifiedGrid.tsx` + the `.jgrid` rules in `globals.css` — the
  justified grid, solved in CSS from each photo's width and height (doc
  section 6). Needs `width`/`height` on every photo; never measure in the browser.
- `src/app/galeria/[slug]/page.tsx` — the gallery's states: not found, expired,
  password, open.
- `src/lib/acceso.ts` + `galeria/[slug]/acciones.ts` — the password check and
  the HMAC-signed cookie, scoped to the gallery's path.
- `src/lib/imagenes.ts` — the R2 path contract: host, `romi/` prefix,
  derivative widths. The upload script of roadmap phase 1 must produce exactly
  these names.
- `src/lib/placeholders.ts` — the `Foto` type and deterministic fake photos.

## Adding a new module

1. Spec it with `/speckit-specify`; plan and get the plan to `status: active`.
2. Add the route under `src/app/`; keep its private pieces next to it.
3. Content that Romi will edit goes to `src/content/` behind a getter.
4. New colors or sizes become variables in `theme.css` first.
5. If it introduces a product decision (storage, auth, a new external service),
   record it in section 0 of the project doc.
