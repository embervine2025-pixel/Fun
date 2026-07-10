import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { viteSingleFile } from "vite-plugin-singlefile";

// viteSingleFile inlines everything into dist/index.html so the built app
// can be opened straight from the filesystem (file://) or hosted anywhere.
export default defineConfig({
  plugins: [react(), tailwindcss(), viteSingleFile()],
});
