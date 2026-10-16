# Recipe format

Each recipe is a Markdown file with YAML frontmatter and optional folder assets.

## Required fields
- `title`
- `description`
- `category`
- `tags`
- `servings`
- `prepTime`
- `cookTime`
- `totalTime`
- `ingredients`
- `instructions`

## Allowed units
`g`, `kg`, `ml`, `l`, `piece`

## Example
```yaml
---
title: Creamy Tomato Pasta
description: A quick, comforting pasta for busy weeknights.
category: Dinner
tags:
  - Pasta
  - Weeknight
servings: 2
prepTime: 10 min
cookTime: 20 min
totalTime: 30 min
difficulty: Medium
cuisine: Italian
dietary:
  - Vegetarian
cover: './cover.svg'
images:
  - './step-01.svg'
ingredients:
  - name: Spaghetti
    quantity: 200
    unit: g
    group: Pasta
  - name: Garlic cloves
    quantity: 2
    unit: piece
    group: Sauce
instructions:
  - step: 1
    text: Cook the spaghetti in salted water until al dente.
    image: './step-01.svg'
---
```

## Validation rules
- Servings must be positive.
- Quantities must be positive numbers when present.
- Units must be one of the supported values.
- Image paths should resolve within the recipe folder.
- The slug is derived from the folder name.
