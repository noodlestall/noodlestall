# Adding, editing and deleting recipes

This guide is for people. If you are an AI coding agent, read `AGENTS.md` instead; it contains the same workflow with extra rules.

You do not need to know how the website works. A recipe is one folder with one text file and some pictures. Add the folder, push it to GitHub, and the website updates itself within a few minutes.

## Adding a recipe by hand

1. **Pick a slug.** Lowercase words joined by hyphens, based on the title: `lemon-drizzle-cake`. Check that `src/content/recipes/` does not already contain it.
2. **Create the folder** `src/content/recipes/lemon-drizzle-cake/`.
3. **Copy an existing `recipe.md`** from another recipe into the new folder and edit it. The field-by-field reference is in `RECIPE_FORMAT.md`.
4. **Convert everything to metric.** Grams, kilograms, millilitres, litres or pieces. If an amount cannot be converted reliably, leave the quantity out and describe it in `note:` instead (for example `note: a handful`).
5. **Keep the original number of servings.** The site scales from that number.
6. **Add the photograph** as `cover.webp` or `cover.jpg` in the same folder and set `coverImage: ./cover.webp`. No photo yet? Set `draft: true`; the recipe appears with a placeholder and a "Draft" label until you add one.
7. **Optional step photos** go in the same folder as `step-01.webp`, `step-02.webp` and so on, referenced from the matching instruction with `image: ./step-01.webp`.
8. **Check it.** In a terminal, inside the project folder:

   ```bash
   npm run validate
   ```

   Every recipe is listed with a tick or a cross and a reason. Fix anything marked `error:`.

9. **Look at it** (optional):

   ```bash
   npm run dev
   ```

   Open http://localhost:4321/noodlestall/ in your browser.

10. **Publish.** Commit the new folder and push to GitHub. On `main`, the site rebuilds and deploys automatically. If you work on a branch, open a pull request; the checks run there too.

## Adding a recipe with an AI coding agent

Open the repository in Codex, Claude Code, Copilot or a similar tool and paste the prompt from `CODEX_ADD_RECIPE_PROMPT.md` together with the recipe link, text or screenshot. The agent follows `AGENTS.md`: it writes the folder, validates it and commits. Ask it to push only when you have looked at the result.

Things the agent will not do on its own, by design:

- invent missing quantities,
- download photographs from other websites,
- push to GitHub without your say-so.

## Editing a recipe

1. Open `src/content/recipes/<slug>/recipe.md`.
2. Change the fields or the notes. Keep the folder name as it is so existing links keep working.
3. Run `npm run validate`, then commit and push.

## Deleting a recipe

1. Delete the folder `src/content/recipes/<slug>/`.
2. Run `npm run build` to confirm, then commit and push.

## Images

- **Where:** always in the recipe's own folder, referenced with `./`.
- **Format:** `.webp` or `.jpg`. The build resizes and optimises them, so a normal phone photo (resized to roughly 1600 px wide to keep the repository small) is fine.
- **Shape:** 3:2 landscape works best. The index shows a square crop of the centre.
- **Rights:** use your own photos or images licensed for reuse. Do not copy pictures from recipe websites.
- **Describe them:** `coverAlt` and `imageAlt` help people using screen readers.

## Checks that run automatically

| Check | When | What it catches |
| --- | --- | --- |
| `npm run validate` | you run it, and on every push | invalid fields, bad units, missing images, duplicate titles |
| `npm run build` | on every push | anything the validator missed, broken image references |
| `npm test` and `npm run test:e2e` | on every push | the site's own features; recipes do not affect them unless a sample recipe changed |

If a push fails, open the **Actions** tab on GitHub, click the failed run and read the first red line. It names the recipe and the field.
