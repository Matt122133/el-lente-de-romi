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
- `DATABASE_URL` and the `R2_*` keys are server-side only (app, worker and
  local scripts). The app's R2 token only signs upload URLs, completes them and
  deletes keys; it never reads image bytes.
- Panel: `ADMIN_EMAIL` and `ADMIN_CLAVE_HASH` (Romi's mail and the scrypt hash
  from `npm run admin:clave`) are real personal data: Railway and `.env.local`
  only. `SESION_SECRETO` signs the panel cookie (rotating it logs Romi out);
  `WORKER_SECRETO` authorizes the app to wake the worker.
- **The repo is public.** No real client names, e-mails, phones, gallery slugs
  or passwords in code, specs, fixtures, or commit messages (see `AGENTS.md`).

## Dependency scanning

No automation yet. Run `npm audit` when dependencies change, and update Next
for its security releases.

## Auth and trust boundaries

- **Delivery galleries** are protected by a per-gallery password (doc section
  5), stored as a scrypt hash. A correct password sets an `httpOnly`,
  `sameSite=lax` cookie whose value is an HMAC of `slug:clave_version`, scoped
  to `/galeria/<slug>`; changing the password bumps the version and invalidates
  every existing cookie. The page checks it with a constant-time comparison.
  Galleries are `noindex`, and their slugs carry a random suffix.
- Expired galleries render no photos, only a message.
- **Panel** (`/panel`, feature 004): one user, mail + password checked against
  the environment, with scrypt run even on a wrong mail so both failures look
  and take the same. 5 failures from one IP in 15 minutes lock that IP for 15
  minutes (`intentos_login`). The session is an `httpOnly` cookie on `/panel`
  carrying its expiry (30 days) signed with HMAC. `src/proxy.ts` redirects
  without it, and every panel page and server action re-checks with
  `exigirSesion()` — actions are reachable by POST without the page. All panel
  pages are `noindex` and nothing on the public site links to them.
- **Uploads** go from Romi's browser straight to the private bucket with
  presigned multipart URLs (15 minutes). The worker verifies each original's
  hash before processing it. The worker listens only on Railway's private
  network and requires `WORKER_SECRETO`.
- **Planned:** downloads are short-lived signed URLs straight to R2, issued
  only after the cookie check — the app never proxies the files.
- Server actions get Next's built-in origin check; do not disable it.
