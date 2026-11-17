/**
 * Hand-maintained profile data: social links (footer). Colours are each
 * brand's own, kept from the original landing page. The companies on the
 * About page live in the CMS (Admin > Companies).
 */

export interface Social {
	href: string;
	label: string;
	/** Font Awesome brand icon class */
	icon: string;
	color: string;
	/** Include in the schema.org Person sameAs list */
	sameAs?: boolean;
}

export const socials: Social[] = [
	{ href: "https://github.com/ProbablePrime", label: "GitHub", icon: "fa-github", color: "#221e1b", sameAs: true },
	{ href: "https://x.com/ProbablePrime", label: "X (Twitter)", icon: "fa-x-twitter", color: "#000000", sameAs: true },
	{ href: "https://bsky.app/profile/probableprime.bsky.social", label: "Bluesky", icon: "fa-bluesky", color: "#1889fe", sameAs: true },
	{ href: "https://www.linkedin.com/in/ahref/", label: "LinkedIn", icon: "fa-linkedin-in", color: "#0a66c2", sameAs: true },
	{ href: "https://twitch.tv/ProbablePrime", label: "Twitch", icon: "fa-twitch", color: "#6441a5", sameAs: true },
	{ href: "https://www.youtube.com/c/ProbablePrime", label: "YouTube", icon: "fa-youtube", color: "#e52d27", sameAs: true },
	{ href: "https://discord.com/users/82992971921752064", label: "Discord", icon: "fa-discord", color: "#7289da" },
	{ href: "https://www.patreon.com/probableprime", label: "Patreon", icon: "fa-patreon", color: "#ff424e" },
	{ href: "https://orcid.org/0000-0003-1956-7261", label: "ORCID", icon: "fa-orcid", color: "#a6ce39", sameAs: true },
];

export const kofi = "https://ko-fi.com/probableprime";

export const personJsonLd = {
	"@context": "https://schema.org",
	"@type": "Person",
	name: "ProbablePrime",
	url: "https://probableprime.co.uk/",
	image: "https://probableprime.co.uk/images/logo.png",
	sameAs: socials.filter((s) => s.sameAs).map((s) => s.href),
	jobTitle: "Software Developer",
};
