# Recipe format

Every recipe is one folder under `src/content/recipes/`. The folder name is the recipe's web address (its *slug*), so choose it once and keep it.

```
src/content/recipes/
  creamy-tomato-pasta/      ← slug: lowercase letters, numbers and hyphens
    recipe.md               ← the recipe
    cover.webp              ← main photograph
    step-01.webp            ← optional step photographs
```

`recipe.md` starts with a block of fields between two `---` lines (YAML frontmatter). Anything written after the block is Markdown and appears as **Notes** under the method.

## Full example

```yaml
---
title: Creamy Tomato Pasta
description: A comforting weeknight pasta with burst cherry tomatoes and a splash of cream.
category: dinner
cuisine: italian
difficulty: easy
servings: 2
prepTimeMinutes: 10
cookTimeMinutes: 20
coverImage: ./cover.webp
coverAlt: Bowl of spaghetti in creamy tomato sauce
draft: false
tags:
  - pasta
  - vegetarian
  - weeknight
ingredientGroups:
  - title: Pasta
    ingredients:
      - name: Spaghetti
        quantity: 200
        unit: g
      - name: Salt
        quantity: 5
        unit: g
        note: for the cooking water
  - title: Sauce
    ingredients:
      - name: Cherry tomatoes
        quantity: 300
        unit: g
        note: halved
      - name: Garlic cloves
        quantity: 2
        unit: piece
      - name: Heavy cream
        quantity: 100
        unit: ml
      - name: Fresh basil
        note: a small handful
        optional: true
      - name: Black pepper
        note: to taste
instructions:
  - title: Cook the pasta
    text: Boil the spaghetti in well-salted water until al dente. Keep a cup of the water.
    image: ./step-01.webp
    imageAlt: Spaghetti boiling in a pot
  - title: Make the sauce
    text: Soften the garlic in oil, add the tomatoes and cook until they collapse, then stir in the cream.
  - title: Finish
    text: Toss the pasta through the sauce with a splash of cooking water. Season and add basil.
source:
  name: Boathouse kitchen notebook
  url: null
related:
  - shakshuka
---

The sauce thickens quickly once the cream goes in. Loosen it with pasta water rather than more cream.
```

## Field reference

| Field | Required | Meaning |
| --- | --- | --- |
| `title` | yes | Shown everywhere. Must be unique across recipes. Up to 120 characters. |
| `description` | yes | One or two sentences, up to 400 characters. Appears in the index, on the sheet and in link previews. |
| `category` | yes | One of `breakfast`, `lunch`, `dinner`, `desserts`, `baking`, `snacks`, `soups`, `salads`. Capitalisation does not matter. |
| `cuisine` | no | Free text such as `italian` or `middle-eastern`. Lowercase; shown capitalised. Used for the cuisine filter. |
| `difficulty` | yes | `easy`, `medium` or `hard`. |
| `servings` | yes | The yield of the recipe as written. All scaling is calculated from this number. Use slices for a loaf or cake. |
| `prepTimeMinutes` | yes | Whole minutes, 0 or more. |
| `cookTimeMinutes` | yes | Whole minutes, 0 or more. The total time is calculated. |
| `coverImage` | yes, unless `draft: true` | Relative path to the main photograph in the same folder. |
| `coverAlt` | no | Description of the photograph for screen readers. Defaults to the title. |
| `draft` | no | `true` shows a category placeholder instead of a photo and a "Draft" label. Default `false`. |
| `tags` | no | Short lowercase words. `vegetarian` and `vegan` power the diet filter (vegan counts as vegetarian). Tags are searchable. |
| `ingredientGroups` | yes | One or more groups, each with a `title` and at least one ingredient. Group titles are hidden when there is only one group. |
| `instructions` | yes | One or more steps in order. |
| `source` | no | `name` and optional `url` of where the recipe comes from. Use `url: null` when there is none. |
| `related` | no | Slugs of recipes to show first under "See also". Others are chosen automatically by category and tags. |

### Ingredients

| Field | Required | Meaning |
| --- | --- | --- |
| `name` | yes | What it is, for example `Garlic cloves`. |
| `quantity` | with `unit` | A positive number. Decimals are fine (`0.5`). |
| `unit` | with `quantity` | `g`, `kg`, `ml`, `l` or `piece`. `piece` is shown as "pieces" for anything other than 1. |
| `note` | required when there is no quantity | Short text such as `to taste`, `finely chopped` or `about 350 g peeled`. |
| `optional` | no | `true` marks the ingredient as optional. |

Rules:

- **Metric only.** No cups, spoons, ounces or pounds. Convert before writing the recipe.
- **Numbers are numbers.** Write `quantity: 200`, not `"200"` or `200g`.
- **Quantity and unit go together.** One without the other is an error.
- **No quantity means a note.** `Black pepper` with `note: to taste` is correct; `Black pepper` alone is not.
- **Do not invent amounts.** If the source has none, leave it qualitative.

### Instructions

| Field | Required | Meaning |
| --- | --- | --- |
| `title` | no | A few words shown as the step heading. Defaults to "Step n". |
| `text` | yes | The instruction, usually one to three sentences. |
| `image` | no | Relative path to a step photograph in the recipe folder. |
| `imageAlt` | no | Description of the photograph. |

## Images

- Keep images in the recipe folder and reference them with `./`.
- Formats: `.webp` (preferred), `.jpg`, `.png`, `.avif` or `.svg`.
- Covers look best at 3:2 and at least 1200 px wide. The index shows a square crop, so keep the subject centred.
- Raster images are resized and converted to WebP at build time; nothing else is needed.
- Only use photographs you own or that are licensed for reuse.

## Validation

`npm run validate` checks all of the above and prints one line per recipe. The build (`npm run build`) runs the same schema again, so an invalid recipe can never be published.

Common messages:

| Message | Fix |
| --- | --- |
| `category: Invalid option` | Use one of the eight category names. |
| `unit: Invalid option` | Use `g`, `kg`, `ml`, `l` or `piece`. |
| `quantity and unit must be given together` | Add the missing unit or remove the quantity and add a `note`. |
| `give a numeric quantity with a unit, or a note` | Add `note: to taste` (or similar) to the ingredient. |
| `coverImage is required` | Add `coverImage: ./cover.webp` or set `draft: true`. |
| `file not found` | Check the image file name and that it sits in the recipe folder. |
| `Folder name must be a lowercase kebab-case slug` | Rename the folder, for example `Banana Bread` → `banana-bread`. |
