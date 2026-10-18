# Deployment

The site is a static build served by GitHub Pages from the `noodlestall` repository. Every push to `main` deploys automatically through GitHub Actions. There is nothing to run by hand after the one-time setup below.

## One-time repository setup

1. On GitHub open **Settings → Pages**.
2. Under **Build and deployment → Source**, choose **GitHub Actions** (not "Deploy from a branch").
3. Leave everything else as it is. No custom domain is required.

That is the only manual step. The first push to `main` after this creates the `github-pages` environment and publishes the site at:

```
https://noodlestall.github.io/noodlestall/
```

If the repository ever lives under a different owner or name, change `site` and `base` in `astro.config.mjs` (or set the `SITE_URL` and `SITE_BASE` environment variables in the workflow), update the sitemap URL in `public/robots.txt`, the base path in `playwright.config.ts` and `scripts/serve-dist.mjs`, and the live URL in `README.md`.

## What happens on push

`.github/workflows/deploy.yml` runs on every push to `main` (and can be started by hand from the Actions tab):

1. Install dependencies with `npm ci` (Node version from `.nvmrc`).
2. `npm run validate` – every recipe folder is checked.
3. `npm run check` – TypeScript and Astro diagnostics.
4. `npm test` – unit tests.
5. `npm run build` – static site into `dist/`.
6. `npm run test:e2e` – browser tests against the built site at phone, tablet and desktop widths.
7. Upload `dist/` and deploy it to GitHub Pages.

Any failing step stops the deployment; the previous version of the site stays online.

`.github/workflows/ci.yml` runs steps 1 to 6 for pull requests, so problems show up before merging.

## The base path

GitHub Pages serves project sites under `/<repository>/`, so every URL on the site starts with `/noodlestall/`. This is configured once in `astro.config.mjs` (`base: '/noodlestall/'`, `trailingSlash: 'always'`) and used everywhere through `import.meta.env.BASE_URL`. Local development (`npm run dev`) and the local server for the build (`npm run serve`) use the same path, so what you see locally is what Pages serves. The browser tests assert that links, images, canonical URLs and share links all include the prefix.

## Checking a deployment

- The Actions tab shows each run. The **deploy** job prints the published URL.
- Open the URL, load a recipe, and check that the cover image and the fonts load (both are served from `/noodlestall/_astro/`).
- `https://noodlestall.github.io/noodlestall/sitemap-index.xml` should list every recipe.

## Local production check

```bash
npm run build
npm run serve
```

Then open http://localhost:4321/noodlestall/. Unknown URLs return the site's 404 page with a 404 status, the same as on GitHub Pages.

## Troubleshooting

| Symptom | Likely cause and fix |
| --- | --- |
| Run fails at "Validate recipes" | A recipe file is invalid. The log names the folder and field. See `RECIPE_FORMAT.md`. |
| Run fails at "Browser tests" | A site feature broke, or a sample recipe used by the tests was changed. Open the uploaded `playwright-report` artifact for details. |
| Deploy job fails with a permissions error | Settings → Pages → Source is not set to GitHub Actions, or the workflow permissions were changed. |
| Site loads but styles or images are missing | The base path does not match the repository name. Check `astro.config.mjs`. |
| Old content after a deploy | Browser cache. Hard-refresh, or wait a minute for the Pages CDN. |
