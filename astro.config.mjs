// @ts-check
import { defineConfig } from "astro/config";

import react from "@astrojs/react";

// `base` and `site` are overridable via env so CI can publish the same
// source to different URLs without code changes:
//   - Production:  defaults apply → https://aiidateam.github.io/aiida-website/
//   - PR previews: ASTRO_BASE=/aiida-website/pr-preview/pr-<N>
//   - Future custom domain: ASTRO_BASE=/ and ASTRO_SITE=https://aiida.net
const base = process.env.ASTRO_BASE ?? "/aiida-website";
const site = process.env.ASTRO_SITE ?? "https://aiidateam.github.io";

// https://astro.build/config
export default defineConfig({
  site,
  base,
  integrations: [react()],
  // All backward-compatibility redirects from the old website live here.
  // Add new entries to this object — do NOT scatter redirect stubs under
  // src/pages/. Astro emits a meta-refresh HTML page for each entry at
  // build time. Source paths are written WITHOUT the /aiida-website base
  // prefix (Astro applies it automatically to sources), but destinations
  // MUST include the base prefix manually — Astro does not rewrite them.
  redirects: {
    // Old /sections/* layout
    "/sections/about": `${base}/`,
    "/sections/download": `${base}/`,
    "/sections/team": `${base}/team`,
    "/sections/events": `${base}/events`,
    "/sections/science": `${base}/science`,
    "/sections/testimonials": `${base}/testimonials`,
    "/sections/acknowledgements": `${base}/acknowledgements`,
    "/sections/graph_gallery": `${base}/graph_gallery`,
    "/sections/mailing_list": "https://aiida.discourse.group/",

    // Old /news index (the legacy blog landing page)
    "/news": `${base}/blog`,

    // NOTE: legacy per-post URLs (/news/posts/<slug> → /blog/<slug>) are
    // the one exception to the centralization rule. They are emitted by
    // src/pages/news/posts/[...slug].astro because the redirect needs to
    // enumerate every slug in the `blog` content collection, which the
    // static config form cannot do on its own.
  },
});
