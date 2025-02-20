import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0", // Permite conexões externas
    port: 5173, // Mantém a porta fixa
    strictPort: true, // Evita mudança automática de porta
    watch: {
      usePolling: true, // Corrige problemas de hot reload no Docker
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    include: ["lucide-react"],
    exclude: [],
  },
  build: {
    commonjsOptions: {
      include: [/lucide-react/, /node_modules/],
    },
  },
});
