import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://noodlestall.github.io',
  base: '/noodlestall/',
  trailingSlash: 'always',
  compressHTML: true,
  build: {
    format: 'directory'
  },
  vite: {
    define: {
      __BASE_PATH__: JSON.stringify('/noodlestall/')
    }
  }
});
