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
import { readFile } from "node:fs/promises";
import { basename } from "node:path";

const args = process.argv.slice(2);
const urlFlag = args.indexOf("--url");
const BASE = (urlFlag >= 0 ? args[urlFlag + 1] : "http://localhost:4321").replace(/\/$/, "");
const API = `${BASE}/_emdash/api`;
const isLocal = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(BASE);

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
			years: "2020 –",
			current: true,
			tech: "XR, Metaverse, Social",
			website: "https://resonite.com",
			sort_order: 3,
		},
	},
];

const headers = { "X-EmDash-Request": "1" };

async function authenticate() {
	if (process.env.EMDASH_TOKEN) {
		headers.Authorization = `Bearer ${process.env.EMDASH_TOKEN}`;
		return;
	}
	if (!isLocal) throw new Error("Set EMDASH_TOKEN to run against a remote site.");
	const res = await fetch(`${API}/setup/dev-bypass?redirect=/`, { redirect: "manual" });
	const cookies = res.headers.getSetCookie().map((c) => c.split(";")[0]);
	if (!cookies.length) throw new Error(`Dev bypass failed (${res.status}). Is \`pnpm dev\` running?`);
	headers.Cookie = cookies.join("; ");
}

async function api(method, path, body) {
	const init = { method, headers: { ...headers } };
	if (body instanceof FormData) init.body = body;
	else if (body !== undefined) {
		init.headers["Content-Type"] = "application/json";
		init.body = JSON.stringify(body);
	}
	const res = await fetch(`${API}${path}`, init);
	const json = await res.json().catch(() => ({}));
	if (!res.ok || json.success === false) {
		const err = new Error(`${method} ${path}: ${res.status} ${JSON.stringify(json.error ?? json)}`);
		err.status = res.status;
		throw err;
	}
	return json.data;
}

async function ensureCollection() {
	try {
		const existing = await api("GET", `/schema/collections/${COLLECTION.slug}`);
		console.log(`Collection "${COLLECTION.slug}" already exists`);
		return existing;
	} catch (e) {
		if (e.status !== 404) throw e;
	}
	await api("POST", "/schema/collections", COLLECTION);
	console.log(`Created collection "${COLLECTION.slug}"`);
}

async function ensureFields() {
	const list = await api("GET", `/schema/collections/${COLLECTION.slug}/fields`);
	const have = new Set((list.items ?? list.fields ?? list).map((f) => f.slug));
	for (const [i, field] of FIELDS.entries()) {
		if (have.has(field.slug)) continue;
		await api("POST", `/schema/collections/${COLLECTION.slug}/fields`, { ...field, sortOrder: i });
		console.log(`  + field ${field.slug}`);
	}
}

async function uploadLogo(path, alt) {
	const bytes = await readFile(path);
	const form = new FormData();
	form.append("file", new Blob([bytes], { type: "image/png" }), basename(path));
	form.append("alt", alt);
	form.append("deduplicate", "true");
	const { item } = await api("POST", "/media", form);
	return {
		provider: "local",
		id: item.id,
		alt,
		width: item.width ?? undefined,
		height: item.height ?? undefined,
		mimeType: item.mimeType,
		filename: item.filename,
		meta: { storageKey: item.storageKey },
	};
}

async function ensureCompanies() {
	const { items } = await api("GET", `/content/${COLLECTION.slug}?limit=100`);
	const have = new Set(items.map((i) => i.slug));
	for (const company of COMPANIES) {
		if (have.has(company.slug)) {
			console.log(`  = ${company.slug} already exists`);
			continue;
		}
		const logo = await uploadLogo(company.logo, `${company.data.title} logo`);
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
await ensureCollection();
await ensureFields();
await ensureCompanies();
console.log("Done.");
