import { defineConfig, type Plugin, type ViteDevServer } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// In production the files in /api run as Vercel Functions. This plugin runs the
// same handlers under `vite dev` so link previews work locally too.
function localApi(): Plugin {
  return {
    name: "local-api",
    configureServer(server: ViteDevServer) {
      server.middlewares.use(async (req, res, next) => {
        const match = req.url?.match(/^\/api\/([a-z-]+)(?:\?|$)/);
        if (!match) return next();
        try {
          const mod = await server.ssrLoadModule(`/api/${match[1]}.ts`);
          const response: Response = await mod.GET(new Request(`http://localhost${req.url}`));
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
