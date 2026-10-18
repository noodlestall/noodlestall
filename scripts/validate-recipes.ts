/**
 * Validates every recipe folder under src/content/recipes without starting Astro.
 *
 *   npm run validate
 *
 * Checks: frontmatter shape (shared Zod schema), allowed units and categories,
 * numeric quantities, unique kebab-case slugs, cover image presence (unless draft),
 * image files existing inside the recipe folder, and duplicate titles.
 * Exits with code 1 when anything fails so CI stops before the build.
 */
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join, resolve, isAbsolute } from 'node:path';
import { parse as parseYaml } from 'yaml';
import { plainRecipeSchema } from '../src/lib/recipe-schema';

const ROOT = resolve(process.cwd(), 'src/content/recipes');
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

interface Report {
  slug: string;
  errors: string[];
  warnings: string[];
}

function splitFrontmatter(markdown: string): { frontmatter: string; body: string } | null {
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return null;
  return { frontmatter: match[1] ?? '', body: match[2] ?? '' };
}

function checkImage(folder: string, value: unknown, field: string, report: Report) {
  if (typeof value !== 'string') return;
  if (isAbsolute(value) || !value.startsWith('./')) {
    report.errors.push(`${field}: use a relative path inside the recipe folder, e.g. ./cover.webp (got "${value}")`);
    return;
  }
  const target = resolve(folder, value);
  if (!target.startsWith(folder)) {
    report.errors.push(`${field}: "${value}" points outside the recipe folder`);
    return;
  }
  if (!existsSync(target)) {
    report.errors.push(`${field}: file not found – ${value}`);
    return;
  }
  if (!/\.(webp|jpe?g|png|avif|svg)$/i.test(value)) {
    report.warnings.push(`${field}: unusual image format "${value}"; prefer .webp, .jpg, .png or .svg`);
  }
}

function validateFolder(slug: string): Report {
  const report: Report = { slug, errors: [], warnings: [] };
  const folder = join(ROOT, slug);

  if (!SLUG_PATTERN.test(slug)) {
    report.errors.push('Folder name must be a lowercase kebab-case slug, e.g. creamy-tomato-pasta');
  }

  const file = join(folder, 'recipe.md');
  if (!existsSync(file)) {
    report.errors.push('Missing recipe.md');
    return report;
  }

  const parts = splitFrontmatter(readFileSync(file, 'utf8'));
  if (!parts) {
    report.errors.push('recipe.md must start with a YAML frontmatter block between --- lines');
    return report;
  }

  let raw: unknown;
  try {
    raw = parseYaml(parts.frontmatter);
  } catch (error) {
    report.errors.push(`YAML could not be parsed: ${(error as Error).message}`);
    return report;
  }

  const result = plainRecipeSchema.safeParse(raw);
  if (!result.success) {
    for (const issue of result.error.issues) {
      const path = issue.path.length ? issue.path.join('.') : '(root)';
      report.errors.push(`${path}: ${issue.message}`);
    }
    return report;
  }

  const data = result.data;
  checkImage(folder, data.coverImage, 'coverImage', report);
  data.instructions.forEach((step, i) => checkImage(folder, step.image, `instructions[${i}].image`, report));

  if (data.draft) report.warnings.push('Marked as draft – shown with a placeholder and a Draft label');
  if (!data.coverImage && data.draft) report.warnings.push('No cover image yet');
  if (data.prepTimeMinutes + data.cookTimeMinutes === 0) report.warnings.push('Total time is 0 minutes');
  if (!data.source?.name) report.warnings.push('No source attribution (fine for your own recipes)');

  return report;
}

function main() {
  if (!existsSync(ROOT)) {
    console.error(`Recipe folder not found: ${ROOT}`);
    process.exit(1);
  }

  const folders = readdirSync(ROOT).filter((name) => statSync(join(ROOT, name)).isDirectory());
  const reports = folders.map(validateFolder);

  const titles = new Map<string, string>();
  for (const slug of folders) {
    try {
      const parts = splitFrontmatter(readFileSync(join(ROOT, slug, 'recipe.md'), 'utf8'));
      const title = parts ? String((parseYaml(parts.frontmatter) as { title?: string })?.title ?? '') : '';
      const key = title.trim().toLowerCase();
      if (key && titles.has(key)) {
        reports.find((r) => r.slug === slug)?.errors.push(`Duplicate title "${title}" also used by ${titles.get(key)}`);
      } else if (key) {
        titles.set(key, slug);
      }
    } catch {
      /* already reported */
    }
  }

  let errorCount = 0;
  for (const report of reports) {
    const status = report.errors.length ? '✗' : '✓';
    console.log(`${status} ${report.slug}`);
    for (const error of report.errors) console.log(`    error: ${error}`);
    for (const warning of report.warnings) console.log(`    note:  ${warning}`);
    errorCount += report.errors.length;
  }

  console.log('');
  console.log(`${reports.length} recipe folder(s), ${errorCount} error(s).`);
  if (errorCount > 0) process.exit(1);
}

main();
