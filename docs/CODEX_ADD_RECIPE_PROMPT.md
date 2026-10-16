# Codex recipe prompt

Use this template when adding a recipe to the Boathouse Noodles cookbook:

```text
Add this recipe to Boathouse Noodles following AGENTS.md. Use numeric metric ingredient quantities, preserve servings and instructions, create the recipe directory, validate the site, and commit and push when permitted.

Source: [URL or text]
```

## Standard workflow
1. Read the recipe source.
2. Extract the title, description, ingredients, and instructions.
3. Convert reliable amounts to metric.
4. Preserve the original servings.
5. Add optional image assets only when authorized.
6. Create the recipe folder in `src/content/recipes/`.
7. Run validation and build checks.
8. Commit the change.
9. Push to GitHub if permitted.
