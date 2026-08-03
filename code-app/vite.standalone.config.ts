import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";

// Build de secours pour previsualiser l'app sans installer Node : un seul
// fichier HTML autonome, ouvrable directement en double-clic (file://),
// sans lien avec la config de build normale (code-app/vite.config.ts).
export default defineConfig({
  plugins: [react(), viteSingleFile()],
  build: { outDir: "dist-standalone" },
});
