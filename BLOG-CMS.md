# Blog CMS

A database-backed CMS built into the site. Editors sign in at `/admin`, write posts, and
hit Publish — the post is live immediately. No git, no GitHub, no rebuild.

- Live site: https://aparajita-astro.vercel.app
- Admin: https://aparajita-astro.vercel.app/admin
- Vercel project: `namit2111s-projects/aparajita-astro`
- Database: Turso (SQLite), provisioned through the Vercel marketplace as
  `database-rose-coin` and already linked to the project

The other 14 pages stay statically prerendered exactly as before. Only `/blog`,
`/blog/<slug>` and `/admin/*` run on demand (`export const prerender = false`).

## Environment variables

Set on production, preview and development in Vercel:

| Variable | Where it comes from |
| --- | --- |
| `TURSO_DATABASE_URL` | set by the Turso integration |
| `TURSO_AUTH_TOKEN` | set by the Turso integration |
| `SESSION_SECRET` | generated; used to sign session cookies |

Pull them locally with `npx vercel env pull .env` (`.env` is gitignored).

## Users

```bash
npm run db:setup -- "someone@example.com" "their-password" "Their Name"
```

Creates the tables if they don't exist and adds the user. Running it again for an
existing email **resets that user's password** — that's the password-reset path.
Run it again with a different email to add another editor.

## Writing

`/admin` lists every post with its status.

- **Save draft** — stored but not public. A signed-in editor can open `/blog/<slug>`
  to preview it; logged-out visitors get a 404.
- **Publish** — live immediately.
- Publish / Unpublish / Delete are also on the list page.
- Republishing keeps the original publish date.

The body is Markdown (`## heading`, `**bold**`, `[link](url)`, `> quote`, lists).
The slug comes from the title unless you type one; duplicate slugs are rejected.

## Images

The cover field takes a path — anything in `public/images/` works (`/images/1.webp`).
There is no upload button; that needs blob storage (Vercel Blob + an upload endpoint).

## Why the admin posts JSON

`*.vercel.app` domains reject form-encoded POSTs with
*"Cross-site POST form submissions are forbidden"*, even same-origin. So
`src/components/AdminScript.astro` intercepts admin form submits and sends JSON
instead; `src/lib/body.ts` accepts either shape on the server. Once the site moves to a
custom domain, plain form posts work too and the pages keep working with JS disabled.

## Local development

```bash
npm run dev      # http://localhost:4321
```

It talks to the same Turso database as production, so local edits change live posts.
Provision a second Turso database and point `.env` at it if you want them separate.

## Security notes

- Sessions are HMAC-signed cookies (14 days), httpOnly, secure in production.
- Passwords are scrypt-hashed with a per-user salt.
- Post markdown is rendered with `marked` and is **not** HTML-sanitized: anyone who can
  sign in to `/admin` can put raw HTML on the site. Fine for a small trusted team; add
  `sanitize-html` before handing out wider access.
