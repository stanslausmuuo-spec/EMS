import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/',
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        ws: true,
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('scheduler')) return 'vendor-react';
            if (id.includes('framer-motion') || id.includes('motion')) return 'vendor-motion';
            if (id.includes('@radix-ui') || id.includes('radix')) return 'vendor-radix';
            if (id.includes('qrcode')) return 'vendor-qrcode';
            if (id.includes('socket.io')) return 'vendor-socket';
            if (id.includes('lucide-react')) return 'vendor-lucide';
            return 'vendor';
          }
        },
      },
    },
  },
});
