---

description: "Task list for 001-skeleton-inicial (registro retroactivo)"
---

# Tasks: Skeleton inicial del sitio

**Input**: `specs/001-skeleton-inicial/plan.md`, `specs/001-skeleton-inicial/spec.md`

**Tests**: sin tests automatizados; verificación por typecheck, build y
navegador (ver plan.md § Verificación).

## Phase 1: Setup

- [x] T001 Proyecto Next.js 16 + TypeScript en la raíz (`package.json`, `tsconfig.json`, `next.config.ts`)
- [x] T002 [P] Identidad visual en variables CSS (`src/styles/theme.css`)
- [x] T003 [P] Layout con header y footer (`src/app/layout.tsx`, `src/components/Header.tsx`, `src/components/Footer.tsx`)

## Phase 2: Foundational

- [x] T004 Contenido del sitio detrás de getters (`src/content/site.ts`)
- [x] T005 Fotos de mentira con proporciones reales (`src/lib/placeholders.ts`)
- [x] T006 Skeletons de foto y texto (`src/components/Skeleton.tsx`)
- [x] T007 Contrato de rutas de R2 con prefijo `romi/` (`src/lib/imagenes.ts`)

## Phase 3: User Story 1 — Portfolio (P1)

- [x] T008 [US1] Grilla justificada en CSS (`src/components/JustifiedGrid.tsx`, `src/app/globals.css`)
- [x] T009 [US1] Inicio, Portfolio y categoría (`src/app/page.tsx`, `src/app/portfolio/`)
- [x] T010 [US1] Lightbox con flechas, teclado y Escape (`src/components/Lightbox.tsx`)

## Phase 4: User Story 2 — Galería de entrega (P1)

- [x] T011 [US2] Galerías de ejemplo y vencimiento (`src/content/galerias.ts`)
- [x] T012 [US2] Cookie de acceso firmada (`src/lib/acceso.ts`)
- [x] T013 [US2] Formulario y server action de contraseña (`src/app/galeria/[slug]/FormularioClave.tsx`, `acciones.ts`)
- [x] T014 [US2] Página de galería con sus cuatro estados (`src/app/galeria/[slug]/page.tsx`)

## Phase 5: User Story 3 — Contacto (P2)

- [x] T015 [US3] Botón de WhatsApp y páginas Sobre mí y Contacto (`src/components/BotonWhatsapp.tsx`, `src/app/sobre-mi/`, `src/app/contacto/`)

## Phase 6: Polish

- [x] T016 README reducido a la definición del sitio
- [x] T017 `agentRules: false` en `next.config.ts`
- [x] T018 Verificación en navegador (plan.md § Verificación)
