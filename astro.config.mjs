// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

/**
 * GitHub Pages project site: https://<owner>.github.io/noodlestall/
 * `site` and `base` can be overridden through environment variables when the
 * repository is forked under a different account or name.
 */
const site = process.env.SITE_URL ?? 'https://noodlestall.github.io';
const base = process.env.SITE_BASE ?? '/noodlestall/';

export default defineConfig({
  site,
  base,
  trailingSlash: 'always',
  output: 'static',
  compressHTML: true,
  build: {
    format: 'directory'
  },
  image: {
    responsiveStyles: false
  },
  integrations: [
    sitemap({
      filter: (page) => !page.endsWith('/404/')
    })
  ]
});
