// Builds the Vercel site from web/ into dist/. The api/ folder is deployed by Vercel separately.
import { defineConfig } from 'vite';

export default defineConfig({
  root: 'web',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: { input: { main: 'web/index.html', learn: 'web/learn.html', admin: 'web/admin.html' } },
  },
  server: { fs: { allow: ['..'] } }, // lets the site load ../standalone/aaw-arcade.html
});
