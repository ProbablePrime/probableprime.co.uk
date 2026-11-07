# probableprime.co.uk

Personal website for me. Extremely opinionated because its my space, not yours.

## Goals

Most people over complicate their websites, What if I didn't?

- No React on the public site. 
    - The [EmDash](https://emdashcms.com) admin at `/_emdash/admin` uses React; but that's ok... I guess :3
    - TODO: Write a blog post on why I don't like React
- No Babel - Its 2026, we don't need no babel
- No Servers - It runs on Cloudflare Workers, with D1 for content and R2 for media
- Limited CSS Frameworks - We don't need Megabytes of CSS for this

## How it's built

An [Astro](https://astro.build) site with the EmDash CMS, started from EmDash's `cloudflare:blog` template.

| Path | What | Source |
| --- | --- | --- |
| `/` | Landing page (the original site) | `src/pages/index.astro`, `src/styles/landing.css` |
| `/contact`, `/success` | Contact form (Turnstile + Resend) | `src/pages/contact.astro`, `src/lib/contact.ts` |
| `/blog`, `/posts/*`, `/pages/*`, `/category/*`, `/tag/*`, `/search`, `/rss.xml` | Blog (EmDash template) | `src/pages/`, `src/layouts/Base.astro` |
| `/7` | 7 | `public/7/` |

Blog branding overrides live in `src/styles/theme.css`. The schema and first-run content are in `seed/seed.json`. See `AGENTS.md` for the template's notes.

## Local development

Requires Node 22.23.4+ and pnpm.

```sh
pnpm install
npx emdash secrets generate --write .env   # once; keep .env out of git
pnpm dev
```

- Site: http://localhost:4321/
- Admin: http://localhost:4321/_emdash/admin (or the dev bypass link printed on startup)

To test the contact form locally, put `TURNSTILE_SECRET`, `RESEND_API_KEY`, `CONTACT_TO` and `CONTACT_FROM` in `.dev.vars`.

## Deploying

```sh
pnpm wrangler secret put EMDASH_ENCRYPTION_KEY   # first time only, value from .env
pnpm run deploy
```

The first deploy creates the D1 database and R2 bucket named in `wrangler.jsonc`. Then open https://probableprime.co.uk/_emdash/admin to run the setup wizard and register a passkey. Passkeys are tied to the hostname, so do setup on the real domain.
