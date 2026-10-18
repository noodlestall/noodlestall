import { expect, test, type Page } from '@playwright/test';

/** Shape of the JSON the index page embeds for client-side search. */
interface IndexEntry {
  id: string;
  title: string;
  category: string;
  searchText: string;
}

const PAPER_BACKGROUND = 'rgb(244, 238, 226)';

async function visibleTitles(page: Page) {
  return page.locator('#recipe-index .entry:not([hidden]) .entry__title a').allTextContents();
}

/** The recipe data the page itself ships, already in archive (A–Z) order. */
async function indexData(page: Page): Promise<IndexEntry[]> {
  const raw = await page.locator('#recipe-index-data').textContent();
  return JSON.parse(raw ?? '[]') as IndexEntry[];
}

function titlesMatching(data: IndexEntry[], query: string, category = ''): string[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  return data
    .filter((entry) => (!category || entry.category === category) && words.every((w) => entry.searchText.includes(w)))
    .map((entry) => entry.title);
}

test.describe('Recipe index', () => {
  test('lists every recipe with a photograph, number, category, time and difficulty', async ({ page }) => {
    await page.goto('./');
    await expect(page).toHaveTitle(/Boathouse Noodles/);
    await expect(page.getByRole('link', { name: 'Boathouse Noodles – home' })).toBeVisible();

    const data = await indexData(page);
    expect(data.length).toBeGreaterThan(0);
    await expect(page.locator('.archive-head .eyebrow')).toContainText(`${data.length} recipe`);

    const entries = page.locator('#recipe-index .entry');
    await expect(entries).toHaveCount(data.length);
    for (let i = 0; i < data.length; i += 1) {
      const entry = entries.nth(i);
      await expect(entry.locator('.entry__media img, .entry__media svg')).toHaveCount(1);
      await expect(entry.locator('.entry__number')).toHaveText(/No\. \d{3}/);
      await expect(entry.locator('.entry__meta')).toHaveText(/(Breakfast|Lunch|Dinner|Desserts|Baking|Snacks|Soups|Salads) · \d+ (min|h).* · (Easy|Medium|Hard)/);
      await expect(entry.locator('.entry__desc')).not.toBeEmpty();
    }
    expect(await visibleTitles(page)).toEqual(data.map((entry) => entry.title));
  });

  test('links, images and assets stay under the GitHub Pages base path', async ({ page }) => {
    await page.goto('./');
    const data = await indexData(page);
    const hrefs = await page.locator('#recipe-index .entry__title a').evaluateAll((links) => links.map((a) => a.getAttribute('href')));
    expect(hrefs.length).toBe(data.length);
    for (const href of hrefs) expect(href).toMatch(/^\/noodlestall\/recipes\/[a-z0-9-]+\/$/);

    const imageSources = await page.locator('#recipe-index img').evaluateAll((imgs) => imgs.map((img) => img.getAttribute('src')));
    for (const src of imageSources) expect(src).toMatch(/^\/noodlestall\//);

    const responses = await Promise.all(imageSources.slice(0, 2).map((src) => page.request.get(src!)));
    for (const response of responses) expect(response.ok()).toBeTruthy();

    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://noodlestall.github.io/noodlestall/');
  });

  test('searches names, ingredients and tags instantly and updates the URL', async ({ page }) => {
    await page.goto('./');
    const data = await indexData(page);
    const search = page.getByLabel('Search recipes, ingredients and tags');

    const tomato = titlesMatching(data, 'tomato');
    expect(tomato.length).toBeGreaterThan(0);
    expect(tomato.length).toBeLessThan(data.length);
    await search.fill('tomato');
    await expect.poll(() => visibleTitles(page)).toEqual(tomato);
    await expect(page).toHaveURL(/\?q=tomato$/);
    await expect(page.locator('#results-status')).toHaveText(new RegExp(`^${tomato.length} recipes? match$`));

    const noodles = titlesMatching(data, 'egg noodles');
    expect(noodles.length).toBeGreaterThan(0);
    await search.fill('egg noodles');
    await expect.poll(() => visibleTitles(page)).toEqual(noodles);

    await search.fill('zzzz');
    await expect(page.locator('#empty-state')).toBeVisible();
    await expect(page.locator('#results-status')).toHaveText('No recipes match');

    await search.fill('');
    await expect.poll(() => visibleTitles(page)).toHaveLength(data.length);
    await expect(page.locator('#results-status')).toHaveText(`Showing all ${data.length} recipes`);
  });

  test('category chips filter, combine with search and reset', async ({ page }) => {
    await page.goto('./');
    const data = await indexData(page);

    const soups = titlesMatching(data, '', 'soups');
    expect(soups.length).toBeGreaterThan(0);
    await page.locator('[data-category="soups"]').click();
    await expect.poll(() => visibleTitles(page)).toEqual(soups);
    await expect(page.locator('[data-category="soups"]')).toHaveAttribute('aria-current', 'true');
    await expect(page).toHaveURL(/category=soups/);

    await page.locator('[data-category="soups"]').click();
    await expect.poll(() => visibleTitles(page)).toHaveLength(data.length);
    await expect(page.locator('[data-category=""]')).toHaveAttribute('aria-current', 'true');

    await page.locator('[data-category="dinner"]').click();
    await page.getByLabel('Search recipes, ingredients and tags').fill('tomato');
    await expect.poll(() => visibleTitles(page)).toEqual(titlesMatching(data, 'tomato', 'dinner'));

    await page.getByLabel('Search recipes, ingredients and tags').fill('zzzz');
    await expect(page.locator('#empty-state')).toBeVisible();

    await page.getByLabel('Search recipes, ingredients and tags').fill('');
    await page.locator('[data-category=""]').click();
    await expect.poll(() => visibleTitles(page)).toHaveLength(data.length);
    await expect(page).toHaveURL(/\/noodlestall\/$/);
    await expect(page.getByRole('button', { name: 'Clear filters' })).toHaveCount(0);
  });

  test('the whole entry is clickable, not just the title', async ({ page }) => {
    await page.goto('./');
    const data = await indexData(page);
    const [first, second] = data;
    expect(first && second).toBeTruthy();
    const entry = page.locator('#recipe-index .entry').first();
    await expect(entry.getByRole('link')).toHaveCount(1);

    // Click the description text, well away from the title link.
    const desc = await entry.locator('.entry__desc').boundingBox();
    await page.mouse.click(desc!.x + desc!.width / 2, desc!.y + desc!.height / 2);
    await expect(page).toHaveURL(new RegExp(`/recipes/${first!.id}/$`));

    // Click the photograph of the second entry.
    await page.goBack();
    const mediaLocator = page.locator('#recipe-index .entry').nth(1).locator('.entry__media');
    await mediaLocator.scrollIntoViewIfNeeded();
    const media = await mediaLocator.boundingBox();
    await page.mouse.click(media!.x + media!.width / 2, media!.y + media!.height / 2);
    await expect(page).toHaveURL(new RegExp(`/recipes/${second!.id}/$`));
  });

  test('offers no dropdowns, sorting or letter index', async ({ page }) => {
    await page.goto('./');
    await expect(page.locator('#search select')).toHaveCount(0);
    await expect(page.locator('[data-letter]')).toHaveCount(0);
    await expect(page.getByLabel('Sort')).toHaveCount(0);
  });

  test('restores filters from a shared URL and ignores legacy parameters', async ({ page }) => {
    await page.goto('./?category=desserts&sort=desc&q=chocolate&letter=C');
    const data = await indexData(page);
    const expected = titlesMatching(data, 'chocolate', 'desserts');
    expect(expected.length).toBeGreaterThan(0);
    await expect.poll(() => visibleTitles(page)).toEqual(expected);
    await expect(page.getByLabel('Search recipes, ingredients and tags')).toHaveValue('chocolate');
    await expect(page.locator('[data-category="desserts"]')).toHaveAttribute('aria-current', 'true');
    await expect(page).toHaveURL(/\?q=chocolate&category=desserts$/);
  });

  test('is keyboard accessible from the skip link to the first recipe', async ({ page }) => {
    await page.goto('./');
    const data = await indexData(page);
    await page.keyboard.press('Tab');
    await expect(page.locator('.skip-link')).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('#main')).toBeFocused();

    await page.getByLabel('Search recipes, ingredients and tags').focus();
    await page.keyboard.type('banana');
    await expect.poll(() => visibleTitles(page)).toEqual(titlesMatching(data, 'banana'));

    await page.locator('[data-category="baking"]').focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-category="baking"]')).toHaveAttribute('aria-current', 'true');

    const firstId = data.find((entry) => entry.category === 'baking' && entry.searchText.includes('banana'))?.id;
    expect(firstId).toBeTruthy();
    const firstLink = page.locator('#recipe-index .entry:not([hidden]) .entry__title a').first();
    await firstLink.focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(new RegExp(`/recipes/${firstId}/$`));
  });

  test('always renders on bright paper, even with a dark system preference', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('./');
    await expect(page.locator('#theme-toggle')).toHaveCount(0);
    await expect(page.locator('html')).not.toHaveAttribute('data-theme', /./);
    expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe(PAPER_BACKGROUND);

    await page.emulateMedia({ colorScheme: 'light' });
    await page.reload();
    expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe(PAPER_BACKGROUND);
  });

  test('lays out the index for the viewport', async ({ page }, testInfo) => {
    await page.goto('./');
    const first = await page.locator('#recipe-index .entry').nth(0).boundingBox();
    const second = await page.locator('#recipe-index .entry').nth(1).boundingBox();
    expect(first && second).toBeTruthy();
    const twoColumns = Math.abs(first!.y - second!.y) < 2 && second!.x > first!.x;
    if (testInfo.project.name === 'desktop-1440') expect(twoColumns).toBe(true);
    else expect(twoColumns).toBe(false);

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(overflow).toBe(false);
  });

  test('serves SEO files', async ({ page }) => {
    const robots = await page.request.get('/noodlestall/robots.txt');
    expect(robots.ok()).toBeTruthy();
    expect(await robots.text()).toContain('sitemap-index.xml');
    const sitemap = await page.request.get('/noodlestall/sitemap-index.xml');
    expect(sitemap.ok()).toBeTruthy();
  });
});
