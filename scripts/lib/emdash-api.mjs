/**
 * Shared helpers for the one-off setup scripts in scripts/. They talk to
 * EmDash's REST API, because EmDash keeps its schema in the database and
 * seed/seed.json changes never reach a site that is already set up.
 *
 * Every script takes the same arguments:
 *   node scripts/<script>.mjs                      local dev (dev bypass sign-in)
 *   EMDASH_TOKEN=... node scripts/<script>.mjs --url https://probableprime.co.uk
 */
import { readFile } from "node:fs/promises";
import { basename } from "node:path";

const args = process.argv.slice(2);
const urlFlag = args.indexOf("--url");
export const BASE = (urlFlag >= 0 ? args[urlFlag + 1] : "http://localhost:4321").replace(/\/$/, "");
const API = `${BASE}/_emdash/api`;
const isLocal = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(BASE);

const headers = { "X-EmDash-Request": "1" };

export async function authenticate() {
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

export async function api(method, path, body) {
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

/** Create the collection unless it exists. */
export async function ensureCollection(collection) {
	try {
		const existing = await api("GET", `/schema/collections/${collection.slug}`);
		console.log(`Collection "${collection.slug}" already exists`);
		return existing;
	} catch (e) {
		if (e.status !== 404) throw e;
	}
	await api("POST", "/schema/collections", collection);
	console.log(`Created collection "${collection.slug}"`);
}

/** Add any fields the collection is missing; existing fields are left alone. */
export async function ensureFields(collectionSlug, fields) {
	const list = await api("GET", `/schema/collections/${collectionSlug}/fields`);
	const have = new Set((list.items ?? list.fields ?? list).map((f) => f.slug));
	for (const [i, field] of fields.entries()) {
		if (have.has(field.slug)) continue;
		await api("POST", `/schema/collections/${collectionSlug}/fields`, { ...field, sortOrder: i });
		console.log(`  + field ${field.slug}`);
	}
}

/** Upload a local PNG to the media library and return an image field value. */
export async function uploadImage(path, alt) {
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
