import { defineConfig } from 'vite';

export default defineConfig({
  // Относительные пути: архив для Яндекс Игр открывается не из корня домена
  base: './',
  build: {
    chunkSizeWarningLimit: 2000,
  },
});
