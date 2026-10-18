<!--
Sync Impact Report
- Version change: template → 1.0.0 (initial ratification)
- Principles: I. Romi's site, not a platform · II. Fast, faithful, cheap ·
  III. Photo bytes never touch the app · IV. The original is sacred ·
  V. Identity over cloning · VI. Clients' photos are private
- Added sections: Scope boundaries, Working with the project doc
- Removed sections: none
- Templates: ✅ .specify/templates/plan-template.md (Constitution Check already
  points here via the harness gate) · ✅ spec-template.md, tasks-template.md
  (no principle-driven sections required) · ✅ AGENTS.md / CLAUDE.md (defer to
  this document)
- Source: derived from the project doc (sections 0, 1, 5–10, 12, 13) on
  2026-10-18. Pending Mateo's review.
-->

# El Lente de Romi Constitution

## Core Principles

### I. Romi's site, not a platform

This is the website of **one** photographer. The value is her identity, her own
business rules, and promotion — not competing with Pixieset on price or
features. Multi-tenant, plans, billing, and generic admin panels are out until
the site works for Romi and a second photographer actually exists. The only
concessions to that future are three that cost nothing today: content lives in
the database (not in code), the visual identity lives in one theme file, and
every R2 path starts with the `romi/` prefix. Nothing beyond those three.

### II. Fast, faithful, cheap

The three non-negotiable requirements, in this order of tie-breaking:
**it flows fast, it keeps the quality, it is cheap to run** (target: about
USD 3 a month). Every photo carries its `width`, `height`, and a ThumbHash so
the grid lays out before any image loads — no layout shift. Display images are
pre-generated derivatives served with srcset and lazy loading, never originals
scaled down by CSS. A change that makes the gallery feel slower than Pixieset
is a regression even if it adds a feature.

### III. Photo bytes never touch the app

Photos live in Cloudflare R2 and reach the visitor from `img.ellentederomi.com`
directly. Uploads go from the browser to R2 with presigned multipart URLs;
downloads are short-lived signed URLs to R2. The app server and the database
never carry image bytes: no images in the database (not as BLOB, not as
base64), no route handler or server action that proxies a photo or a ZIP.
Rationale: egress is the cost that decides whether this is USD 3 or USD 30 a
month, and request limits break uploads of 4 GB galleries.

### IV. The original is sacred

A download delivers the original file **byte for byte**, never recompressed.
Derivatives for the screen are AVIF with WebP fallback, converted to sRGB with
the ICC profile preserved, and with GPS/location EXIF stripped (it stays in the
original). Any change to the derivative pipeline is checked against Romi's own
photos, side by side with Pixieset, before it ships — skin tones shifting is a
defect she will notice immediately.

### V. Identity over cloning

The site exists so Romi stops looking like every other Pixieset gallery. Keep
what she values from Pixieset (the justified grid, the ordering options, the
quality); do not copy it feature by feature. Each Pixieset feature is added
only when Romi asked for it. The visual identity comes from her designer
through `theme.css`; until then the site stays neutral and clean, small
typography, photos first.

### VI. Clients' photos are private

Delivery galleries are private by default: per-gallery password, `noindex`,
unguessable photo names (content hashes, never sequential), and they expire —
Romi tells clients a gallery lasts one month and talks to them before deleting
it. Expired galleries show no photos. Clients and guests never create an
account. **The repository is public**: no real client name, contact, gallery
slug, or password is ever committed.

## Scope boundaries

In scope, in roadmap order (project doc section 13):

1. Proof of concept: real photos in R2, derivatives, grid, measured against
   Pixieset.
2. Portfolio: home, categories (social, fashion, products, events and
   congresses), about, contact.
3. Delivery galleries: Romi's panel to create, upload and publish; password;
   single-photo download for guests; the client's full ZIP (the one Romi
   already builds, uploaded as-is).
4. Whatever Romi asks for after using it (favorites, watermark, payments).

Out of scope until this document is amended: online store, prints and albums,
blog, price list, booking, contact form (contact is WhatsApp and social links),
client accounts, multi-tenant.

## Working with the project doc

The product documentation is the Google Doc linked from `AGENTS.md`. This
constitution states the principles; the doc holds the reasoning, the numbers,
and the dated product decision log (section 0). When an amendment here comes
from a product decision, the decision is also recorded in section 0 of the doc
with its date and reason.

## Governance

This constitution prevails over every other document in the repository,
including `AGENTS.md` and the harness process docs. Every spec and plan checks
compliance in its Constitution Check; a plan that needs to break a principle
amends this document first.

Amendments: edit via `/speckit-constitution`, bump the version, and add an
entry to the history below with the date and why. MAJOR when a principle is
reversed or removed, MINOR when a principle or section is added or scope moves,
PATCH for wording. Mateo approves every amendment; scope changes that come from
Romi cite her request.

### History

- **1.0.0** (2026-10-18) — Ratified, derived from the project doc.

**Version**: 1.0.0 | **Ratified**: 2026-10-18 | **Last Amended**: 2026-10-18
