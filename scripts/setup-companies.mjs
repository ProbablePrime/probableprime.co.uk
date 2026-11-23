#!/usr/bin/env node
/**
 * One-off setup for the "Companies" content type that powers the
 * "Where I've worked" cards on /about and the /work/[slug] pages.
 *
 * EmDash keeps its schema in the database, so changing seed/seed.json does
 * nothing to a site that is already set up. This script creates the
 * collection, its fields, and the three existing companies (with their
 * logos uploaded to the media library) through the REST API. It is safe to
 * re-run: anything that already exists is left alone.
 *
 * Local dev (signs in with the dev bypass):
 *   node scripts/setup-companies.mjs
 *
 * Production (create a token under Admin > Settings > API Tokens, then):
 *   EMDASH_TOKEN=... node scripts/setup-companies.mjs --url https://probableprime.co.uk
 */
import { BASE, api, authenticate, ensureCollection, ensureFields, uploadImage } from "./lib/emdash-api.mjs";

const COLLECTION = {
	slug: "companies",
	label: "Companies",
	labelSingular: "Company",
	description: "Places I've worked. Shown on the About page; each one gets a page at /work/{slug}.",
	icon: "briefcase",
	urlPattern: "/work/{slug}",
	supports: ["drafts", "revisions", "preview", "seo"],
	admin: { listColumns: ["years", "sort_order"] },
};

const FIELDS = [
	{ slug: "title", label: "Company name", type: "string", required: true, searchable: true },
	{ slug: "logo", label: "Logo", type: "image" },
	{
		slug: "logo_background",
		label: "Logo background (light suits dark logos, dark suits light ones)",
		type: "select",
		validation: { options: ["light", "dark"] },
		defaultValue: "light",
	},
	{ slug: "years", label: "Years (e.g. 2016 – 2020)", type: "string" },
	{ slug: "current", label: "I currently work here", type: "boolean" },
	{ slug: "tech", label: "Focus areas", type: "string" },
	{ slug: "website", label: "Company website", type: "url" },
	{ slug: "summary", label: "Summary (used for search engines and social cards)", type: "text" },
	{ slug: "content", label: "My time there", type: "portableText", searchable: true },
	{ slug: "sort_order", label: "Order on the About page (lowest first)", type: "integer" },
];

const COMPANIES = [
	{
		slug: "track-intelligence",
		logo: "public/images/trackintel.png",
		data: {
			title: "Track Intelligence",
			years: "2011 – 2016",
			current: false,
			tech: "Motorsports, Big Data, Realtime & Embedded",
			website: "https://www.linkedin.com/company/tag-heuer-track-intelligence/",
			sort_order: 1,
		},
	},
	{
		slug: "mixer",
		logo: "public/images/mixer.png",
		data: {
			title: "Mixer",
			years: "2016 – 2020",
			current: false,
			tech: "Streaming, Social, Interactivity",
			website: "https://en.wikipedia.org/wiki/Mixer_(service)",
			sort_order: 2,
		},
	},
	{
		slug: "resonite",
		logo: "public/images/resonite.png",
		data: {
			title: "Resonite",
			logo_background: "dark",
			years: "2020 –",
			current: true,
			tech: "XR, Metaverse, Social",
			website: "https://resonite.com",
			sort_order: 3,
		},
	},
];

async function ensureCompanies() {
	const { items } = await api("GET", `/content/${COLLECTION.slug}?limit=100`);
	const have = new Set(items.map((i) => i.slug));
	for (const company of COMPANIES) {
		if (have.has(company.slug)) {
			console.log(`  = ${company.slug} already exists`);
			continue;
		}
		const logo = await uploadImage(company.logo, `${company.data.title} logo`);
		const created = await api("POST", `/content/${COLLECTION.slug}`, {
			slug: company.slug,
			data: { ...company.data, logo, content: [] },
		});
		const id = created.item?.id ?? created.id;
		await api("POST", `/content/${COLLECTION.slug}/${id}/publish`);
		console.log(`  + ${company.slug} (published)`);
	}
}

await authenticate();
console.log(`Target: ${BASE}`);
await ensureCollection(COLLECTION);
await ensureFields(COLLECTION.slug, FIELDS);
await ensureCompanies();
console.log("Done.");
