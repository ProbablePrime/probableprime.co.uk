import { handleContactForm } from "./contact.js";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/contact" && request.method === "POST") {
      return handleContactForm(request, env);
    }

    // everything else: serve static files as before
    return env.ASSETS.fetch(request);
  }
};
