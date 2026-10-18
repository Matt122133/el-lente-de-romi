# Security

Security posture for el-lente-de-romi. Read before touching the gallery access,
secrets, or anything that serves photos.

## Reporting

Write to the repository owner (Mateo) privately; do not open a public issue for
a vulnerability. This is a one-person project: expect an answer within days, not
hours.

## Secrets

- Secrets live in environment variables, never in the repo. `.env*` is ignored
  except `.env.example`.
- `GALERIAS_SECRETO` signs the gallery access cookie. In production it MUST be
  set to a long random value; the fallback in `src/lib/acceso.ts` is only for
  development. Rotating it logs every client out of every gallery, which is
  harmless.
- Planned: R2 access keys and the database URL, both server-side only.
- **The repo is public.** No real client names, e-mails, phones, gallery slugs
  or passwords in code, specs, fixtures, or commit messages (see `AGENTS.md`).

## Dependency scanning

No automation yet. Run `npm audit` when dependencies change, and update Next
for its security releases.

## Auth and trust boundaries

- **Delivery galleries** are protected by a per-gallery password (doc section
  5). A correct password sets an `httpOnly`, `sameSite=lax` cookie whose value
  is an HMAC of the gallery slug, scoped to `/galeria/<slug>`. The page checks
  it with a constant-time comparison. Galleries are `noindex`.
- Today the example passwords are plain text in `src/content/galerias.ts`. When
  galleries move to the database, store a password hash, never the password.
- Expired galleries render no photos, only a message.
- **Planned (phase 3):** downloads are short-lived signed URLs straight to R2,
  issued only after the cookie check — the app never proxies the files. Romi's
  admin panel gets its own login (one user).
- Server actions get Next's built-in origin check; do not disable it.
