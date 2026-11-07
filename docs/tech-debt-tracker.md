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
| 2026-11-06 | High | Feature 002 cerrada sin validar el pipeline con fotos de Romi: falta la comparación lado a lado con su Pixieset (T023: color en piel, nitidez, tiempo a la primera fila; principio IV) y medir SC-005 con un lote suyo de ~300 fotos (T021). Bloquea entregar galerías reales y pasar a producción. Se salda cuando Romi pase el .zip; el resultado va en la sección 13 del doc (fase 1). |
| 2026-11-06 | Medium | El doc no registra el cierre de la 002 ni la decisión de hosting (preview en Vercel, que en el plan Hobby es no comercial; producción a definir). El MCP de gdocs da `invalid_grant`: hay que reautenticarlo y anotar en la sección 0 y la 13. |

## Resolved

| Date identified | Severity | Description | Resolution |
|---|---|---|---|
