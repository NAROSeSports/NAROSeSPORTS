// Cloudflare Worker: serves the built app from ./dist and answers /api/preview.
// Only /api/* reaches this code (see run_worker_first in wrangler.jsonc); everything
// else is served straight from the static files.

import { handlePreview } from "./preview";

interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url);
    if (pathname === "/api/preview") {
      if (request.method !== "GET") return new Response("Method not allowed", { status: 405 });
      return handlePreview(request);
    }
    return env.ASSETS.fetch(request);
  },
};
