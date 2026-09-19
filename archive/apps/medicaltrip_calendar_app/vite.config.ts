import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  worker: {
    format: 'es',
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.jsx', '.js', '.mjs', '.json'],
    alias: {
      '@domain': path.resolve(__dirname, './src/domain'),
      '@application': path.resolve(__dirname, './src/application'),
      '@infrastructure': path.resolve(__dirname, './src/infrastructure'),
      '@presentation': path.resolve(__dirname, './src/presentation'),
    },
  },
  server: {
    port: 3000,
    host: true,
  },
  build: {
    target: 'esnext',
    sourcemap: true,
  },
  // @ts-ignore vitest config
  test: {
    globals: true,
    environment: 'node',
    include: [
      'tests/unit/**/*.{test,spec}.{ts,tsx,js,jsx}',
      'tests/integration/**/*.{test,spec}.{ts,tsx,js,jsx}',
    ],
  },
});
