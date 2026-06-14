import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

import { cloudflare } from "@cloudflare/vite-plugin";

const port = Number(process.env.PORT ?? 4173);

export default defineConfig({
  plugins: [react(), cloudflare()],
  server: {
    port
  },
  preview: {
    port
  },
  optimizeDeps: {
    exclude: ['lucide-react']
  }
});