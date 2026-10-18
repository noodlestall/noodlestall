# AGENTS.md – working on Boathouse Noodles

Instructions for AI coding agents (Codex, Claude Code, Copilot, Cursor and similar) and for people. Read this before touching the repository. The most common task is **adding a recipe**; the step-by-step procedure is in the second half of this file.

## What this project is

Boathouse Noodles is a personal recipe archive for family and friends, published for free on GitHub Pages at `https://noodlestall.github.io/noodlestall/`. It is a static Astro site with a deliberately small feature set:

- Homepage index of every recipe with a photograph, number, title, category, time and difficulty.
- Instant client-side search (names, ingredients, tags) and a fold-out Categories menu, closed by default.
- Recipe sheets with ingredient scaling, printing, link copying and WhatsApp sharing.
- A per-recipe shopping list with scaled quantities that can be ticked off, copied or shared. Ticks and the chosen serving count reset when the index page loads.
- The wordmark in the header is the only navigation; it always leads back to the index. There are no other header links.

There is no backend, database, login, editor, favourites, meal planning, nutrition data or imperial conversion. Do not add any of these.

## Repository map

| Path | Purpose |
| --- | --- |
| `src/content/recipes/<slug>/recipe.md` | One folder per recipe. The folder name is the URL slug. Images live beside the file. |
| `src/content.config.ts` | Astro content collection; loads every `*/recipe.md`. |
| `src/lib/recipe-schema.ts` | The Zod schema shared by Astro and the validator. Allowed categories, units and difficulties are defined here. |
| `src/lib/` | Pure helpers: scaling, search/filter state, sharing messages, URL/base-path helpers. Unit tested. |
| `src/scripts/` | Browser scripts for the index page and the recipe sheet. |
| `src/pages/` | `index.astro` (archive), `recipes/[id].astro` (sheet), `404.astro`. |
| `src/components/`, `src/layouts/` | UI pieces and the shared page shell. |
| `src/styles/global.css` | Design tokens (single light paper theme), typography, print styles. |
| `src/assets/fonts/` | Self-hosted Courier Prime (SIL OFL) as the fallback for American Typewriter. |
| `scripts/validate-recipes.ts` | Standalone recipe validator (`npm run validate`). |
| `scripts/serve-dist.mjs` | Serves `dist/` under `/noodlestall/` for local checks and browser tests. |
| `tests/unit/`, `tests/e2e/` | Vitest and Playwright tests. |
| `docs/` | Human-readable guides. |
| `.github/workflows/` | CI for pull requests and the GitHub Pages deployment on `main`. |

## Commands

```bash
npm ci                 # install exact dependencies (Node 22.22 or newer, see .nvmrc)
npm run dev            # local dev server at http://localhost:4321/noodlestall/
npm run validate       # validate every recipe folder (fast, no build)
npm run check          # TypeScript and Astro diagnostics
npm test               # unit tests (Vitest)
npm run build          # production build into dist/
npm run serve          # serve dist/ at http://localhost:4321/noodlestall/
npm run test:e2e       # browser tests (builds first; needs `npx playwright install chromium` once)
npm run verify         # validate + check + unit tests + build, in that order
```

Before committing anything, `npm run verify` must pass. Run `npm run test:e2e` as well when you changed anything outside `src/content/`.

## Recipe format (summary)

Full reference: `docs/RECIPE_FORMAT.md`. The short version:

```yaml
---
title: Creamy Tomato Pasta
description: A comforting weeknight pasta. One or two sentences.
category: dinner            # breakfast | lunch | dinner | desserts | baking | snacks | soups | salads
cuisine: italian            # optional, lowercase, free text
difficulty: easy            # easy | medium | hard
servings: 2                 # the ORIGINAL yield; scaling is calculated from this
prepTimeMinutes: 10
cookTimeMinutes: 20
coverImage: ./cover.webp    # required unless draft: true
coverAlt: Bowl of pasta with tomato sauce
draft: false                # true shows a category placeholder and a "Draft" label
tags: [pasta, vegetarian]   # tags are searchable; use "vegetarian" / "vegan" when the whole recipe qualifies
ingredientGroups:
  - title: Pasta
    ingredients:
      - name: Spaghetti
        quantity: 200
        unit: g             # g | kg | ml | l | piece
      - name: Black pepper
        note: to taste      # qualitative items: no quantity, a note instead
      - name: Fresh basil
        note: a small handful
        optional: true
instructions:
  - title: Cook the pasta
    text: Boil the spaghetti in salted water until al dente.
    image: ./step-01.webp   # optional step photo
    imageAlt: Spaghetti boiling in a pot
source:
  name: Original recipe
  url: null                 # or https://…
---

Optional notes in Markdown go here and appear under the method.
```

Rules that the validator and the build enforce:

- Metric units only: `g`, `kg`, `ml`, `l`, `piece`. No cups, tablespoons, ounces or "1 can".
- A quantity must be a number and must come with a unit. An ingredient without a quantity must have a `note` (for example `to taste`).
- `servings` must be a positive number. Keep the source's original yield.
- `category` must be one of the eight categories. `difficulty` must be easy, medium or hard.
- `coverImage` is required unless `draft: true`. Image paths are relative (`./…`) and the files must exist in the recipe folder.
- Folder names are lowercase kebab-case and unique. Titles must be unique.

## Adding a recipe (procedure for agents)

When the owner gives you a recipe as a URL, pasted text, a photo or a screenshot:

1. **Read the source carefully.** Capture title, yield, prep and cook times, every ingredient with its amount, and the method in order. If the source is a URL, fetch it; if fetching fails, ask the owner to paste the text.
2. **Extract the ingredients** into groups that mirror the source (for example "Dough" and "Filling"). Use a single group called "Ingredients" when the source has no sections.
3. **Convert to metric where reliable.** Weights and volumes given in grams or millilitres stay as they are. Convert ounces, pounds, litres and so on exactly. Convert cups and spoons only when the ingredient has a well-known density (water, milk, stock, oil, sugar, flour, butter) and say so in the pull request or commit message. Round sensibly (nearest 5 g or 5 ml for larger amounts).
4. **Never invent a quantity.** If the source says "a handful", "to taste" or "1 can" with no weight, use `note:` without a quantity. If an amount is ambiguous (for example "1 onion" is fine as `1 piece`, but "1 packet" is not), keep it qualitative and flag it to the owner.
5. **Preserve the original servings.** Do not scale the recipe while importing.
6. **Organise the instructions** as numbered steps with a short `title` and a `text` of one to three sentences. Keep the source's order. Do not add steps that are not in the source.
7. **Choose category, cuisine, difficulty and tags.** Pick one of the eight categories. Add `vegetarian` or `vegan` as a tag only when every ingredient qualifies. Add three to six useful tags (main ingredient, occasion, technique).
8. **Create the folder** `src/content/recipes/<slug>/` with a short descriptive kebab-case slug based on the title. Check it does not exist already.
9. **Write `recipe.md`** following the format above.
10. **Images.** Only use photographs the owner provides or that are clearly licensed for reuse. Do not download photographs from recipe websites. Save them as `cover.webp` (or `.jpg`), roughly 1600 px on the long side. If there is no usable image, set `draft: true` and tell the owner the recipe needs a photograph; the site will show a labelled placeholder.
11. **Attribution.** Fill in `source.name` and `source.url` when the recipe comes from a website, book or person. Write the description and step text in your own words; do not copy prose from the source.
12. **Validate:** `npm run validate` and then `npm run verify`. Fix every error. Warnings about missing sources are informational.
13. **Commit** on a descriptive branch, for example `recipe/creamy-tomato-pasta`, with a message such as `Add recipe: Creamy Tomato Pasta`.
14. **Push and open a pull request only when the owner has authorised it.** Merging to `main` deploys the site automatically.

Report back with: the slug, anything you could not convert reliably, anything you left qualitative, whether an image is missing, and the validation and test results (quote the actual command output; do not claim tests passed unless they ran).

A copy-and-paste prompt for this workflow is in `docs/CODEX_ADD_RECIPE_PROMPT.md`.

## Editing a recipe

Edit `recipe.md` in place. Keep the slug unchanged so links keep working. Re-run `npm run validate` and `npm run build`.

## Deleting a recipe

Delete the whole folder under `src/content/recipes/`. Re-run `npm run build` to confirm the site still builds.

## Code changes

- Keep the typewriter design: one bright theme (ivory paper, charcoal ink), thin rules, square controls, no shadows, gradients or large radii. There is no dark mode, theme switch, sorting control, dropdown filter or letter index; do not add them back. Design tokens live at the top of `src/styles/global.css`.
- Keep JavaScript small. Pure logic goes in `src/lib/` with unit tests; DOM wiring goes in `src/scripts/`.
- Every link, image and share URL must respect the GitHub Pages base path. Use `import.meta.env.BASE_URL` on the server and the helpers in `src/lib/site.ts`.
- Do not add dependencies without a clear need.
- Do not add the excluded features listed at the top of this file.
