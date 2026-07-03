import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import { fileURLToPath, URL } from "node:url";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), svgr()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "@assets": fileURLToPath(new URL("./src/assets", import.meta.url)),
      "@prisma-types": fileURLToPath(new URL("../server/node_modules/@prisma/client", import.meta.url)),
    },
  },
  server: {
    port: 8000,
    host: "0.0.0.0",
  },
});
