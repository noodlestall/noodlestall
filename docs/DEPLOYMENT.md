# Deployment

## Local dev
```bash
npm install
npm run dev
```

## GitHub Pages
This project is built for the base path `/noodlestall/` and is configured for GitHub Pages in `astro.config.mjs`.

### GitHub Actions workflow
- `ci.yml` runs checks and tests.
- `deploy.yml` builds the Astro site and deploys the static output to Pages.

## Required repository settings
- GitHub Pages enabled for GitHub Actions.
- Repository is public or private and configured for Pages.
- Site URL will be `https://noodlestall.github.io/noodlestall/`.

## Production build
```bash
npm run build
```
