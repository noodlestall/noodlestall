# Boathouse Noodles

A personal recipe archive for family and friends, designed to look like a carefully kept collection of typewritten recipe sheets. Built with [Astro](https://astro.build), published for free on GitHub Pages.

**Live site:** https://noodlestall.github.io/noodlestall/

## What it does

- **Recipe index** with a photograph, archive number, title, category, total time and difficulty for every recipe. Two columns on desktop, one on phones.
- **Instant search** across names, ingredients and tags, category filters and shareable URLs such as `/?category=soups&q=chicken`.
- **Recipe sheets** with a large photograph, times, servings, grouped ingredients, numbered steps with optional step photos, notes and source attribution.
- **Ingredient scaling** from the original servings with + / − or direct entry. Metric only, two decimal places, nothing is rounded away.
- **Shopping list** per recipe using the scaled quantities: tick items off, copy the rest or send them via WhatsApp. Ticks are cleared when you return to the index.
- **Print**, **copy link** and **share via WhatsApp** on every recipe.
- **One bright paper theme**: ivory background, charcoal type, no dark mode or theme switch.
- Semantic HTML, keyboard support, visible focus, reduced-motion support, Open Graph tags, sitemap, robots.txt and schema.org Recipe data.

Nothing is stored beyond the browser session: no accounts, no favourites, no cloud sync.

## Quick start

Requirements: Node.js 22.22 or newer (see `.nvmrc`) and npm.

```bash
npm ci
npm run dev
```

Open http://localhost:4321/noodlestall/ (the site always lives under the `/noodlestall/` path, exactly as on GitHub Pages).

## Everyday commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server with live reload |
| `npm run validate` | Checks every recipe folder against the schema (fast) |
| `npm run check` | TypeScript and Astro diagnostics |
| `npm test` | Unit tests (Vitest) |
| `npm run build` | Production build into `dist/` |
| `npm run serve` | Serves `dist/` at http://localhost:4321/noodlestall/ |
| `npm run test:e2e` | Browser tests with Playwright at 375 px, 768 px and 1440 px (run `npx playwright install chromium` once) |
| `npm run verify` | `validate`, `check`, `test` and `build` in one go |

## Adding, editing and deleting recipes

Each recipe is a folder under `src/content/recipes/` containing `recipe.md` (YAML frontmatter plus optional Markdown notes) and its images:

```
src/content/recipes/
  pumpkin-pasta/
    recipe.md
    cover.webp
```

- Format reference: [`docs/RECIPE_FORMAT.md`](docs/RECIPE_FORMAT.md)
- Step-by-step guide for people: [`docs/ADDING_RECIPES.md`](docs/ADDING_RECIPES.md)
- Instructions for AI coding agents: [`AGENTS.md`](AGENTS.md)
- Copy-and-paste prompt for an AI agent: [`docs/CODEX_ADD_RECIPE_PROMPT.md`](docs/CODEX_ADD_RECIPE_PROMPT.md)

Adding or deleting a folder and pushing to `main` is enough; the site rebuilds itself.

## Deployment

Pushing to `main` runs validation, type checks and browser tests, builds the site and deploys it to GitHub Pages. Unit tests run locally only (`npm test`, included in `npm run verify`). Pull requests run the same checks without deploying. One-time repository setup and troubleshooting: [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

## Design

Typography does the work: `"American Typewriter", "Courier Prime", "Courier New", Georgia, serif`. American Typewriter is used where the system provides it (macOS, iOS); elsewhere the self-hosted, SIL-OFL-licensed Courier Prime takes over. Ivory paper, charcoal ink, thin rules, square controls, generous whitespace. Design tokens live at the top of `src/styles/global.css`.

## Licence

Code is released under the MIT licence (see `LICENSE`). Courier Prime is licensed under the SIL Open Font License 1.1 (`src/assets/fonts/OFL.txt`). Recipes and photographs belong to their authors.
