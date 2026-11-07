---
owner: el-lente-de-romi
status: living
last_reviewed: 2026-05-29
update_trigger: on-debt-added-or-resolved
---

# Tech debt tracker

Running ledger of known hazards, work-in-progress shortcuts, and deferred
improvements. Maintained per the harness steering loop (see
[`processes/harness.md`](processes/harness.md)).

## How this works

Each row is one item. New items go at the top of the relevant section.

- **Severity.** `High` (active hazard or correctness risk), `Medium` (hurts
  velocity or clarity), `Low` (cosmetic or speculative).
- **Status.** `Open`, `In progress`, `Resolved`, `Dropped`.
- **Description.** What the debt is, in one sentence.
- **Resolution.** How it was paid, with a commit/plan/ADR reference where
  useful. Empty while `Open`.

## Open

| Date identified | Severity | Description |
|---|---|---|
| 2026-11-06 | Medium | La base de Railway no tiene respaldo: los backups son del plan Pro y el Hobby no los tiene (FR-010 de la 003 queda sin cumplir). Hoy no es grave porque la base se rearma con `db:migrar`, `db:sembrar` y el script de fotos (las fotos siguen en R2). Se resuelve **antes de la primera galería real** (ya no entra en la 004, decisión del 2026-11-07), junto con separar la base de desarrollo de la de producción (hoy es una sola, research R5 de la 003), porque con el panel la base pasa a tener datos que no están en ningún otro lado: `scripts/db/respaldar.ts` y `restaurar.ts` con un JSON diario al bucket privado de R2, corriendo como cron de Railway (research R6 y `contracts/cli.md` de la 003). |
| 2026-11-06 | Low | Falta confirmar que la app y la base entran en los USD 5 de consumo del plan Hobby (SC-004 de la 003): mirar la pestaña *Usage* de Railway después de unos días con el sitio publicado. |
| 2026-11-06 | High | Feature 002 cerrada sin validar el pipeline con fotos de Romi: falta la comparación lado a lado con su Pixieset (T023: color en piel, nitidez, tiempo a la primera fila; principio IV) y medir SC-005 con un lote suyo de ~300 fotos (T021). Bloquea entregar galerías reales y pasar a producción. Se salda cuando Romi pase el .zip; el resultado va en la sección 13 del doc (fase 1). |
| 2026-11-06 | Medium | El doc no registra el cierre de la 002 ni el de la 003, ni la decisión de hosting: app y base en Railway (plan Hobby, uso comercial permitido), Vercel descartado (su plan gratis no es comercial y el front separado de la base sería más lento y obligaría a exponerla). Falta también el roadmap (sección 13). El MCP de gdocs da `invalid_grant`: hay que reautenticarlo y anotar en la sección 0 y la 13. |

## Resolved

| Date identified | Severity | Description | Resolution |
|---|---|---|---|
