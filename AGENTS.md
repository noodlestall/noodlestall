# GitHub Copilot recipe authoring workflow

## Project overview
Boathouse Noodles is a static recipe website built with Astro, TypeScript, GitHub Pages, and Markdown recipes. Recipes live in `src/content/recipes/*` with one folder per recipe and optional assets in the same folder. The website is designed for quick browsing, cooking, ingredient scaling, and a single-recipe shopping list.

## Architecture
- `src/content.config.ts`: Zod schema for recipes and content collection definition.
- `src/content/recipes/*`: recipe source files and related assets.
- `src/pages/*`: routes for home, recipe list, recipe detail, and 404.
- `src/components/*`: reusable UI blocks.
- `src/lib/*`: scaling, search, sharing, and browser-state helpers.
- `src/styles/global.css`: design tokens and shared styles.
- `public/`: static assets such as `robots.txt`, placeholders, or icons.

## Recipe schema
Recipes must follow the required frontmatter shape:
- `title`, `description`, `category`, `tags`, `servings`, `prepTime`, `cookTime`, `totalTime`
- `ingredients`: array of objects with `name`, `quantity`, `unit`, `group`, `optional`, `note`
- `instructions`: array of step objects with `step`, `text`, and optional `image`

Allowed units:
- `g`, `kg`, `ml`, `l`, `piece`

Allowed categories:
- Breakfast, Lunch, Dinner, Desserts, Baking, Snacks, Soups, Salads

## Rules
- Keep recipe ingredients in metric units only.
- Preserve the original recipe servings as the base for scaling.
- Use one folder per recipe.
- Stable slug is the folder name.
- Do not invent missing quantities.
- If an ingredient is qualitative only, represent it as text in `note` or leave quantity undefined.
- Use relative image paths inside each recipe folder.
- Keep optional images in the same folder as the recipe.

## Validation
Run:
- `npm install`
- `npm run check`
- `npm run test`
- `npm run build`

## Adding a recipe
1. Create a new folder under `src/content/recipes`.
2. Add `recipe.md` with YAML frontmatter and Markdown content.
3. Add `cover.svg` or other assets.
4. Validate the frontmatter and slug using the schema.
5. Commit the change and run the site checks.

## Editing a recipe
- Update the YAML, ingredient values, and steps in place.
- Re-run validation and build.

## Deleting a recipe
- Remove the recipe directory.
- Re-run validation/build to confirm the site updates.

## Attribution
If a recipe source is from a link or external article, add `sourceName` and `sourceUrl` in frontmatter when appropriate.
Do not copy photography without sufficient rights.

## Commit and push workflow
- Keep commits clear and focused.
- Name branches descriptively.
- Merge to `main` only after validation passes.

## Notes
This project is intentionally static and lightweight. Avoid adding backend services or user accounts.
