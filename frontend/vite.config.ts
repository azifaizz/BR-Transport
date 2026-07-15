import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    react(),
    TanStackRouterVite(),
    tailwindcss()
  ],
  resolve: {
    tsconfigPaths: true
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) return 'vendor-react';
            if (id.includes('@tanstack')) return 'vendor-tanstack';
            if (id.includes('recharts')) return 'vendor-charts';
            if (id.includes('jspdf') || id.includes('html2canvas')) return 'vendor-pdf';
            return 'vendor-core';
          }
        }
      }
    },
    chunkSizeWarningLimit: 600
  },
  server: {
    port: 3000,
  },
});
