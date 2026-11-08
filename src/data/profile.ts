/**
 * Hand-maintained profile data: social links (footer) and past/current
 * startups (About page). Colours are each brand's own, kept from the
 * original landing page.
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

export interface Startup {
	href: string;
	logo: string;
	name: string;
	years: string;
	present?: boolean;
	tech: string;
}

export const startups: Startup[] = [
	{
		href: "https://www.linkedin.com/company/tag-heuer-track-intelligence/",
		logo: "/images/trackintel.png",
		name: "Track Intelligence",
		years: "2011 – 2016",
		tech: "Motorsports, Big Data, Realtime & Embedded",
	},
	{
		href: "https://en.wikipedia.org/wiki/Mixer_(service)",
		logo: "/images/mixer.png",
		name: "Mixer",
		years: "2016 – 2020",
		tech: "Streaming, Social, Interactivity",
	},
	{
		href: "https://resonite.com",
		logo: "/images/resonite.png",
		name: "Resonite",
		years: "2020 –",
		present: true,
		tech: "XR, Metaverse, Social",
	},
];

export const personJsonLd = {
	"@context": "https://schema.org",
	"@type": "Person",
	name: "ProbablePrime",
	url: "https://probableprime.co.uk/",
	image: "https://probableprime.co.uk/images/logo.png",
	sameAs: socials.filter((s) => s.sameAs).map((s) => s.href),
	jobTitle: "Software Developer",
};
