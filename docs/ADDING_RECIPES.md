# Adding recipes

1. Create a new folder in `src/content/recipes/`.
2. Add a `recipe.md` file.
3. Include required YAML frontmatter.
4. Add optional assets in the same folder.
5. Add the recipe folder name as the unique slug.
6. Validate the recipe by running `npm run check`.
7. Build the site and ensure it renders.

## Example folder structure
```text
src/content/recipes/
  creamy-tomato-pasta/
    recipe.md
    cover.svg
    step-01.svg
```

## Source attribution
If the recipe came from a website or article, add `sourceName` and `sourceUrl` when appropriate.
