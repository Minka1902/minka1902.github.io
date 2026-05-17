import path from 'path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id: string) => {
          if (id.includes('firebase')) return 'vendor-firebase';
          if (['react', 'react-dom', 'react-router-dom'].some(pkg => id.includes(`node_modules/${pkg}/`) || id.includes(`node_modules\\${pkg}\\`))) return 'vendor-react';
          if (id.includes('lucide-react')) return 'vendor-ui';
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.ts'],
    pool: 'forks',
  },
});
