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
| `/`, `/posts/*`, `/pages/*`, `/category/*`, `/tag/*`, `/search`, `/rss.xml` | Blog (EmDash template) | `src/pages/`, `src/layouts/Base.astro` |
| `/about` | About text (from the CMS) + startups | `src/pages/about.astro`, `src/data/profile.ts` |
| `/contact`, `/success` | Contact form (Turnstile + Resend) | `src/pages/contact.astro`, `src/lib/contact.ts` |
| `/.well-known/site.standard.publication` | AT Protocol ownership proof | `src/pages/.well-known/` |
| `/7` | 7 | `public/7/` |

Blog branding overrides live in `src/styles/theme.css`. Social links and startups are in `src/data/profile.ts`. The schema and first-run content are in `seed/seed.json`. See `AGENTS.md` for the template's notes.

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

## Plugins

Both run in EmDash's plugin sandbox (`sandboxRunner` in `astro.config.mjs`, `LOADER` binding in `wrangler.jsonc`), which needs Workers Paid. Their settings live in the admin, not in env vars.

### Email (`emdash-smtp-marketplace`)

Used for magic-link sign-in, user invites and account recovery. Sends through Resend's HTTP API.

1. Admin > Plugins > SMTP Providers: choose Resend, paste a Resend API key, set the default sender (an address on a domain verified in Resend).
2. Settings > Email: select SMTP as the transport.
3. Send a test email from Settings > Email.

The contact form does not use this; it calls Resend directly from `src/lib/contact.ts`.

### Bluesky / AT Protocol (`@emdash-cms/plugin-atproto`)

Publishes each post as a `site.standard.document` record on your PDS and, optionally, cross-posts to Bluesky.

1. Create an app password at https://bsky.app/settings/app-passwords.
2. Admin > AT Protocol: handle, app password, Site URL `https://probableprime.co.uk`, Site Name `ProbablePrime`. Save, then Test Connection.
3. Sync Publication. Copy the Publication URI it shows (`at://...`).
4. Add it to `wrangler.jsonc` under `"vars": { "ATPROTO_PUBLICATION_URI": "at://..." }` and deploy. `/.well-known/site.standard.publication` then serves it, which proves you own the site.

Posts published after that are synced automatically; synced posts get a `<link rel="site.standard.document">` tag.
