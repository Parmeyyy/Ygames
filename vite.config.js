import { defineConfig } from 'vite';

export default defineConfig({
  // Относительные пути: архив для Яндекс Игр открывается не из корня домена
  base: './',
  // Без подмены ненайденных файлов на index.html: локально /sdk.js должен честно отдавать 404
  appType: 'mpa',
  build: {
    chunkSizeWarningLimit: 2000,
  },
});
