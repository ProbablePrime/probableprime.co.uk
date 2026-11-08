/**
 * standard.site ownership verification for the AT Protocol plugin.
 *
 * After "Sync Publication" in Admin > AT Protocol, copy the Publication URI
 * (at://did:plc:.../site.standard.publication/...) into the
 * ATPROTO_PUBLICATION_URI variable (wrangler.jsonc "vars", or .dev.vars
 * locally). Until then this returns 404.
 */
import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";

export const prerender = false;

export const GET: APIRoute = () => {
	const uri = (env as { ATPROTO_PUBLICATION_URI?: string }).ATPROTO_PUBLICATION_URI?.trim();
	if (!uri) return new Response("Not found", { status: 404 });
	return new Response(uri, {
		headers: { "Content-Type": "text/plain; charset=utf-8" },
	});
};
