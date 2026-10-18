---
owner: el-lente-de-romi
status: living
last_reviewed: 2026-10-18
update_trigger: on-skeleton-filled
---

# Harness onboarding — skeletons to fill

`init-harness-speckit` scaffolds this repo's harness with a few **skeleton**
files that only the team can fill with repo-specific content. This is a
**non-blocking** checklist: you can spec, plan, and ship features before any of
these are filled. Nothing here gates commits or CI. Fill each as you touch the
relevant area, tick its box, and delete this file once every box is checked.

They exist so a coding agent (or a new dev) starting cold has real repo context
instead of placeholders.

## Checklist

- [x] **`ARCHITECTURE.md`** — filled on install (2026-10-18).
- [x] **`SECURITY.md`** — filled on install (2026-10-18).
- [x] **`docs/processes/dev-setup.md`** — filled on install (2026-10-18).
- [x] **`docs/decisions/harness-design.md`** — project context filled.
- [ ] **`.specify/memory/constitution.md`** — drafted on install from the
  project doc (1.0.0). *Done when:* Mateo has read it and either confirmed it or
  amended it via `/speckit-constitution`.

## Conditional items

- [ ] **Authorize the GitHub PAT** — `.mcp.json` points at the GitHub MCP
  server (Docker). Create a personal access token (scope `repo`) and export it
  as `GITHUB_PERSONAL_ACCESS_TOKEN` in your shell profile. See
  `docs/processes/dev-setup.md` § GitHub MCP server.
  *Done when:* `/speckit-taskstoissues` runs without an auth error.
- [ ] **Codex only: add the GitHub MCP server to `~/.codex/config.toml`** — copy
  the `[mcp_servers.github]` snippet from `docs/processes/dev-setup.md`.
  Skip if Codex is not used.

## When you fill one

Edit the file, delete its prompts/markers, tick its box here. When all boxes are
ticked, delete this file — its job is done.
