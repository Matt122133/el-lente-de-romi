---
ticket: none
status: completed
covers:
  - src/
  - next.config.ts
  - package.json
  - package-lock.json
  - tsconfig.json
  - .gitignore
  - README.md
  - specs/001-skeleton-inicial/
verify: npm run typecheck && npm run build
analyzed: 2026-10-18
---

<!--
Harness frontmatter:
- ticket: known Jira key, or none when there is no ticket.
- status: draft until a human promotes the analyzed plan to active.
- covers: repository-relative path prefixes this feature may edit.
- verify: command that proves the feature works; run until green.
- analyzed: date the /speckit-analyze report was read before promotion.

Registro retroactivo: el código se escribió antes de instalar el harness
(commits b64e2e5 y ab07363). Este plan no pasó por draft → active; existe para
que el repo registre qué cubre el skeleton y cómo se verificó. Nunca estuvo
`active`, así que no autorizó ningún commit.
-->

# Implementation Plan: Skeleton inicial del sitio

**Branch**: `skeleton-inicial` | **Date**: 2026-10-18 | **Spec**: `specs/001-skeleton-inicial/spec.md`

## Summary

Esqueleto navegable del sitio de Romi en Next.js con fotos de mentira que
tienen proporciones reales, para fijar la forma del portfolio y de las
galerías de entrega antes de tener fotos en R2.

## Technical Context

**Language/Version**: TypeScript 5.9, Node ≥ 20.9
**Primary Dependencies**: Next.js 16.4 (App Router), React 19.3. Nada más.
**Storage**: ninguno todavía; contenido en `src/content/*.ts`
**Testing**: sin runner; typecheck + build + prueba en Chrome headless
**Target Platform**: web, celular primero en la grilla
**Project Type**: sitio web
**Constraints**: CSS propio sin framework; la grilla sin JS de layout

## Constitution Check

- Constitution compliance: cumple I (un solo sitio, contenido detrás de
  getters, theme en un archivo, prefijo `romi/`), III (no hay bytes de imagen
  en la app; `lib/imagenes.ts` apunta a R2), V (identidad neutra hasta la
  diseñadora) y VI (galerías con contraseña, `noindex`, vencimiento; slugs y
  claves de ejemplo). II y IV aplican cuando haya fotos reales.
- Plan-bounded change (harness): `covers:` arriba.
- Verified before done (harness): `npm run typecheck && npm run build`.

## Project Structure

    src/app/          rutas: /, /portfolio, /portfolio/[categoria], /sobre-mi,
                      /contacto, /galeria/[slug] (+ FormularioClave, acciones)
    src/components/   Header, Footer, JustifiedGrid, Lightbox, Skeleton,
                      CategoriaCard, BotonWhatsapp
    src/content/      site.ts, galerias.ts
    src/lib/          imagenes.ts, acceso.ts, placeholders.ts
    src/styles/       theme.css

## Decisiones de diseño

- **D1 — Grilla en CSS**: `flex-grow` y `flex-basis` proporcionales a la
  relación de aspecto. Sin librería y sin medir: no hay saltos de layout.
- **D2 — Acceso a galería por cookie HMAC**: la clave correcta guarda
  `HMAC(slug)` con `GALERIAS_SECRETO`, `httpOnly`, acotada a
  `/galeria/<slug>`, un mes. Sin cuentas (sección 5).
- **D3 — Vencimiento al terminar el día, hora de Argentina**.
- **D4 — Descargas deshabilitadas a la vista**: la forma queda fija; la
  implementación con URLs firmadas es la fase 3.
- **D5 — `agentRules: false`**: `next dev` dejaba un `AGENTS.md` propio en la
  raíz; su contenido útil pasó al `AGENTS.md` del harness.

## Verificación

- `npm run typecheck && npm run build`: verde (2026-10-18).
- Chrome headless contra `next dev`: clave incorrecta muestra el error, clave
  correcta abre la galería con 40 fotos, recargar mantiene el acceso, el
  lightbox abre en 4/40, la flecha pasa a 5/40, Escape cierra.
- curl contra `next start`: vencida muestra el aviso, slug inexistente da 404,
  cookie inventada no abre la galería.
