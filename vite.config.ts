import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  base: "/static/",
  publicDir: "static",
  server: {
    proxy: {
      "/kuview": "http://127.0.0.1:8001",
      "/api": "http://127.0.0.1:8001",
      "/apis": "http://127.0.0.1:8001",
    },
  },
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
