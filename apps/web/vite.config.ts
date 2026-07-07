import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@medlink/shared': path.resolve(__dirname, '../../packages/shared/src/index.ts'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    coverage: {
      provider: 'v8',
      exclude: [
        'src/main.tsx',
        'postcss.config.js',
        'tailwind.config.ts',
        'vite.config.ts',
        '**/.eslintrc.*',
        'src/lib/axios.ts',
        'src/lib/query-client.ts',
        'src/lib/socket.ts',
        'src/utils/cn.ts',
      ],
      thresholds: { lines: 70 },
    },
  },
});
