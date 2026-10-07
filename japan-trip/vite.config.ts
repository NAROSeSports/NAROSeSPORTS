import { defineConfig, type Plugin, type ViteDevServer } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// In production /api/preview runs in the Cloudflare Worker (worker/index.ts).
// This plugin runs the same handler under `vite dev` so link previews work locally too.
function localApi(): Plugin {
  return {
    name: "local-api",
    configureServer(server: ViteDevServer) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith("/api/preview")) return next();
        try {
          const { handlePreview } = await server.ssrLoadModule("/worker/preview.ts");
          const response: Response = await handlePreview(new Request(`http://localhost${req.url}`));
          res.statusCode = response.status;
          response.headers.forEach((value, key) => res.setHeader(key, value));
          res.end(Buffer.from(await response.arrayBuffer()));
        } catch (err) {
          server.config.logger.error(String(err));
          res.statusCode = 500;
          res.end("API error");
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), localApi()],
  server: { host: true },
  // Firebase (loaded only when syncing is on) is one big chunk; that is expected.
  build: { target: "es2022", chunkSizeWarningLimit: 700 },
});
