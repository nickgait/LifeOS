import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  root: '.',
  base: './',

  // Build configuration
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        todo: resolve(__dirname, 'ToDoList/index.html'),
        fitness: resolve(__dirname, 'Fitness/index.html'),
        finance: resolve(__dirname, 'Finance/index.html'),
        investments: resolve(__dirname, 'Investments/index.html'),
        habits: resolve(__dirname, 'Habits/index.html'),
        goals: resolve(__dirname, 'Goals/index.html'),
        journal: resolve(__dirname, 'Journal/index.html'),
        poetry: resolve(__dirname, 'Poetry/index.html'),
      },
      output: {
        manualChunks: {
          'vendor': ['chart.js'],
          'shared': [
            './shared/storage-utils.js',
            './shared/data-manager.js',
            './shared/dashboard-widgets.js',
            './shared/theme-manager.js',
          ],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },

  // Server configuration
  server: {
    port: 3000,
    host: true,
    open: true,
  },

  // Preview configuration
  preview: {
    port: 4173,
    host: true,
  },

  // Resolve configuration
  resolve: {
    alias: {
      '@shared': resolve(__dirname, 'shared'),
      '@modules': resolve(__dirname, '.'),
      '@types': resolve(__dirname, 'types'),
    },
  },

  // Test configuration (for Vitest)
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '*.config.ts',
        'dist/',
      ],
    },
  },
});
