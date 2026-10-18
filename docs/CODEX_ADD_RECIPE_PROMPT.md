# Prompt: add a recipe with an AI coding agent

Copy the block below into Codex, Claude Code, GitHub Copilot or any coding agent that has the repository open. Replace the part in square brackets with the recipe link, pasted text, or attach the screenshot or photo.

```text
Add a recipe to Boathouse Noodles. Follow AGENTS.md in this repository exactly.

Source: [paste the URL, the recipe text, or attach the screenshot/photo]

Requirements:
- Create one new folder under src/content/recipes/ with a short kebab-case slug and a recipe.md in the documented format.
- Use metric units only (g, kg, ml, l, piece). Convert from the source where the conversion is reliable and tell me which conversions you made. Never invent a quantity: anything vague stays qualitative with a note such as "to taste".
- Keep the recipe's original number of servings.
- Write the description and the steps in your own words. Fill in source.name and source.url.
- Use only the photograph(s) I provide. If I did not provide one, set draft: true and tell me the recipe needs a photo.
- Run npm run validate and npm run verify and paste the real output. Fix every error.
- Commit on a branch named recipe/<slug> with the message "Add recipe: <Title>". Do not push unless I say so.

When you are done, report: the slug, the conversions you made, anything you left qualitative or ambiguous, whether a photo is missing, and the validation and test results.
```

## Variations

**From a photo of a handwritten card or a cookbook page:** attach the image and add "Transcribe the recipe from the attached image. Ask me about anything you cannot read."

**Several recipes at once:** paste them one after another and add "Create one folder per recipe. Stop and ask before creating more than five."

**Editing an existing recipe:** "Edit src/content/recipes/<slug>/recipe.md: [describe the change]. Keep the slug. Validate and commit on a branch named recipe/<slug>-update."

**Deleting:** "Delete the recipe folder src/content/recipes/<slug>/, run npm run build, and commit on a branch named recipe/remove-<slug>."

## What to check before merging

- The ingredient list reads correctly and the amounts match the source.
- The servings number is the original yield.
- The photo is yours (or licensed) and looks right in the index crop.
- The GitHub Actions checks on the pull request are green.
