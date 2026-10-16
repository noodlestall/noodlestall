# Boathouse Noodles

A modern editorial recipe website for quick browsing, cooking, scaling ingredients, and planning a single-recipe shopping list.

## Stack
- Astro
- TypeScript
- Zod
- Vitest
- Playwright
- GitHub Pages

## Development
```bash
npm install
npm run dev
```

## Commands
```bash
npm run check
npm run test
npm run test:e2e
npm run build
```

## Site structure
- `src/content/recipes/`: recipe folders and markdown recipe files
- `src/pages/`: homepage, browse pages, and recipe detail pages
- `src/components/`: UI blocks
- `src/lib/`: scaling, search, and sharing helpers
- `src/styles/global.css`: design tokens and styling
- `docs/`: maintenance and deployment notes

## Recipe maintenance
- One folder per recipe.
- Stable slug = folder name.
- Recipes use numeric metric units only.
- Missing optional images do not break the build.

## GitHub Pages deployment
This project is configured for the base path `/noodlestall/` and the site URL is:
`https://noodlestall.github.io/noodlestall/`

## Authoring workflow
Use the prompt template in `docs/CODEX_ADD_RECIPE_PROMPT.md` when adding a recipe from a source URL or recipe text.

## Notes
The website is intentionally static, simple, and low-maintenance.
