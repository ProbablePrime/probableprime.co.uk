#!/usr/bin/env node
/**
 * One-off setup for the "Projects" content type that powers the
 * "Things I've built" cards on /about and the /projects/[slug] pages.
 *
 * EmDash keeps its schema in the database, so changing seed/seed.json does
 * nothing to a site that is already set up. This script creates the
 * collection and its fields through the REST API; add the projects
 * themselves in the admin under Projects. It is safe to re-run: anything
 * that already exists is left alone.
 *
 * Local dev (signs in with the dev bypass):
 *   node scripts/setup-projects.mjs
 *
 * Production (create a token under Admin > Settings > API Tokens, then):
 *   EMDASH_TOKEN=... node scripts/setup-projects.mjs --url https://probableprime.co.uk
 */
import { BASE, authenticate, ensureCollection, ensureFields } from "./lib/emdash-api.mjs";

// Keep in step with the "projects" collection in seed/seed.json.
const COLLECTION = {
	slug: "projects",
	label: "Projects",
	labelSingular: "Project",
	description: "Things I've built. Shown on the About page; each one gets a page at /projects/{slug}.",
	icon: "code",
	urlPattern: "/projects/{slug}",
	supports: ["drafts", "revisions", "preview", "seo"],
	admin: { listColumns: ["years", "sort_order"] },
};

const FIELDS = [
	{ slug: "title", label: "Project name", type: "string", required: true, searchable: true },
	{ slug: "logo", label: "Logo or icon", type: "image" },
	{
		slug: "logo_background",
		label: "Logo background (light suits dark logos, dark suits light ones)",
		type: "select",
		validation: { options: ["light", "dark"] },
		defaultValue: "light",
	},
	{ slug: "years", label: "Years (e.g. 2018 – 2021)", type: "string" },
	{ slug: "active", label: "Still active", type: "boolean" },
	{ slug: "role", label: "My role (e.g. Creator, Maintainer)", type: "string" },
	{ slug: "tech", label: "Built with", type: "string" },
	{ slug: "website", label: "Project website", type: "url" },
	{ slug: "repository", label: "Source code (e.g. GitHub URL)", type: "url" },
	{ slug: "summary", label: "Summary (used on the About card, search engines and social cards)", type: "text" },
	{ slug: "content", label: "About the project", type: "portableText", searchable: true },
	{ slug: "sort_order", label: "Order on the About page (lowest first)", type: "integer" },
];

await authenticate();
console.log(`Target: ${BASE}`);
await ensureCollection(COLLECTION);
await ensureFields(COLLECTION.slug, FIELDS);
console.log("Done. Add projects in the admin under Projects.");
