import cloudflare from "@astrojs/cloudflare";
import react from "@astrojs/react";
import { d1, r2, sandbox } from "@emdash-cms/cloudflare";
import atproto from "@emdash-cms/plugin-atproto";
import { defineConfig, fontProviders } from "astro/config";
import emdash from "emdash/astro";
import { emdashSmtpMarketplace } from "emdash-smtp-marketplace";

export default defineConfig({
	site: "https://probableprime.co.uk",
	output: "server",
	// Keep links to the old static pages working.
	redirects: {
		"/index.html": "/",
		"/contact.html": "/contact",
		"/success.html": "/success",
		"/blog": "/",
		"/pages/about": "/about",
	},
	adapter: cloudflare(),
	image: {
		layout: "constrained",
		responsiveStyles: true,
	},
	integrations: [
		react(),
		emdash({
			database: d1({ binding: "DB", session: "auto", coalesce: true }),
			storage: r2({ binding: "MEDIA" }),
			// Sandboxed plugins run in isolated Workers via the LOADER binding
			// (Workers Paid). Settings for each live in the admin.
			sandboxRunner: sandbox(),
			sandboxed: [
				// Email (magic links, invites) via Resend's HTTP API.
				// Admin > Plugins > SMTP Providers, then Settings > Email.
				emdashSmtpMarketplace(),
				// Syndicate posts to AT Protocol (standard.site) + Bluesky.
				// Admin > AT Protocol: handle + app password.
				atproto,
			],
		}),
	],
	fonts: [
		{
			provider: fontProviders.google(),
			name: "Inter",
			cssVariable: "--font-body",
			weights: [400, 500, 600, 700],
			fallbacks: ["sans-serif"],
		},
		{
			provider: fontProviders.google(),
			name: "JetBrains Mono",
			cssVariable: "--font-mono",
			weights: [400, 500],
			fallbacks: ["monospace"],
		},
	],
	devToolbar: { enabled: false },
});
