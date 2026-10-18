import { expect, test } from '@playwright/test';

const TOTAL = 6;

async function visibleTitles(page: import('@playwright/test').Page) {
  return page.locator('#recipe-index .entry:not([hidden]) .entry__title a').allTextContents();
}

test.describe('Recipe index', () => {
  test('lists every recipe with a photograph, number, category, time and difficulty', async ({ page }) => {
    await page.goto('./');
    await expect(page).toHaveTitle(/Boathouse Noodles/);
    await expect(page.getByRole('link', { name: 'Boathouse Noodles – home' })).toBeVisible();

    const entries = page.locator('#recipe-index .entry');
    await expect(entries).toHaveCount(TOTAL);
    for (let i = 0; i < TOTAL; i += 1) {
      const entry = entries.nth(i);
      await expect(entry.locator('.entry__media img, .entry__media svg')).toHaveCount(1);
      await expect(entry.locator('.entry__number')).toHaveText(/No\. \d{3}/);
      await expect(entry.locator('.entry__meta')).toHaveText(/(Breakfast|Lunch|Dinner|Desserts|Baking|Snacks|Soups|Salads) · \d+ (min|h).* · (Easy|Medium|Hard)/);
      await expect(entry.locator('.entry__desc')).not.toBeEmpty();
    }
  });

  test('links, images and assets stay under the GitHub Pages base path', async ({ page }) => {
    await page.goto('./');
    const hrefs = await page.locator('#recipe-index .entry__title a').evaluateAll((links) => links.map((a) => a.getAttribute('href')));
    expect(hrefs.length).toBe(TOTAL);
    for (const href of hrefs) expect(href).toMatch(/^\/noodlestall\/recipes\/[a-z0-9-]+\/$/);

    const imageSources = await page.locator('#recipe-index img').evaluateAll((imgs) => imgs.map((img) => img.getAttribute('src')));
    for (const src of imageSources) expect(src).toMatch(/^\/noodlestall\//);

    const responses = await Promise.all(imageSources.slice(0, 2).map((src) => page.request.get(src!)));
    for (const response of responses) expect(response.ok()).toBeTruthy();

    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://noodlestall.github.io/noodlestall/');
  });

  test('searches names, ingredients and tags instantly and updates the URL', async ({ page }) => {
    await page.goto('./');
    const search = page.getByLabel('Search recipes, ingredients and tags');

    await search.fill('tomato');
    await expect.poll(() => visibleTitles(page)).toEqual(['Creamy Tomato Pasta', 'Shakshuka']);
    await expect(page).toHaveURL(/\?q=tomato$/);

    await search.fill('egg noodles');
    await expect.poll(() => visibleTitles(page)).toEqual(['Chicken Noodle Soup']);

    await search.fill('gluten-free');
    await expect.poll(() => visibleTitles(page)).toEqual(['Chocolate Olive Oil Cake', 'Roasted Chickpea Kale Salad']);

    await search.fill('zzzz');
    await expect(page.locator('#empty-state')).toBeVisible();
    await expect(page.locator('#results-status')).toHaveText('No recipes match');
  });

  test('categories, filters, sorting and the A–Z index work together', async ({ page }) => {
    await page.goto('./');

    await page.locator('[data-category="soups"]').click();
    await expect.poll(() => visibleTitles(page)).toEqual(['Chicken Noodle Soup']);
    await expect(page.locator('[data-category="soups"]')).toHaveAttribute('aria-current', 'true');
    await expect(page).toHaveURL(/category=soups/);

    await page.locator('[data-category="soups"]').click();
    await expect.poll(() => visibleTitles(page)).toHaveLength(TOTAL);

    await page.getByLabel('Diet').selectOption('vegetarian');
    await expect.poll(() => visibleTitles(page)).toEqual(['Banana Bread', 'Chocolate Olive Oil Cake', 'Creamy Tomato Pasta', 'Roasted Chickpea Kale Salad', 'Shakshuka']);

    await page.getByLabel('Cuisine').selectOption('italian');
    await expect.poll(() => visibleTitles(page)).toEqual(['Chocolate Olive Oil Cake', 'Creamy Tomato Pasta']);

    await page.getByLabel('Cooking time').selectOption('30');
    await expect.poll(() => visibleTitles(page)).toEqual(['Creamy Tomato Pasta']);

    await page.getByLabel('Cooking time').selectOption('');
    await page.getByLabel('Difficulty').selectOption('medium');
    await expect.poll(() => visibleTitles(page)).toEqual(['Chocolate Olive Oil Cake']);

    await page.getByLabel('Diet').selectOption('vegan');
    await expect.poll(() => visibleTitles(page)).toEqual([]);
    await expect(page.locator('#empty-state')).toBeVisible();

    await page.getByRole('button', { name: 'Clear filters' }).click();
    await expect.poll(() => visibleTitles(page)).toHaveLength(TOTAL);
    await expect(page).toHaveURL(/\/noodlestall\/$/);

    await page.getByLabel('Sort').selectOption('desc');
    await expect.poll(() => visibleTitles(page)).toEqual(['Shakshuka', 'Roasted Chickpea Kale Salad', 'Creamy Tomato Pasta', 'Chocolate Olive Oil Cake', 'Chicken Noodle Soup', 'Banana Bread']);
    await expect(page).toHaveURL(/sort=desc/);

    await page.getByLabel('Sort').selectOption('asc');
    await page.getByRole('button', { name: 'Titles starting with C' }).click();
    await expect.poll(() => visibleTitles(page)).toEqual(['Chicken Noodle Soup', 'Chocolate Olive Oil Cake', 'Creamy Tomato Pasta']);
    await expect(page.getByRole('button', { name: 'Titles starting with Z' })).toBeDisabled();
  });

  test('restores filters from a shared URL', async ({ page }) => {
    await page.goto('./?category=desserts&sort=desc&q=chocolate');
    await expect.poll(() => visibleTitles(page)).toEqual(['Chocolate Olive Oil Cake']);
    await expect(page.getByLabel('Search recipes, ingredients and tags')).toHaveValue('chocolate');
    await expect(page.getByLabel('Sort')).toHaveValue('desc');
    await expect(page.locator('[data-category="desserts"]')).toHaveAttribute('aria-current', 'true');
  });

  test('is keyboard accessible from the skip link to the first recipe', async ({ page }) => {
    await page.goto('./');
    await page.keyboard.press('Tab');
    await expect(page.locator('.skip-link')).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('#main')).toBeFocused();

    await page.getByLabel('Search recipes, ingredients and tags').focus();
    await page.keyboard.type('banana');
    await expect.poll(() => visibleTitles(page)).toEqual(['Banana Bread']);

    await page.locator('[data-category="baking"]').focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-category="baking"]')).toHaveAttribute('aria-current', 'true');

    const firstLink = page.locator('#recipe-index .entry:not([hidden]) .entry__title a').first();
    await firstLink.focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/recipes\/banana-bread\/$/);
  });

  test('switches between paper and ink mode and remembers the choice', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('./');
    const html = page.locator('html');
    const toggle = page.locator('#theme-toggle');

    await expect(html).not.toHaveAttribute('data-theme', /./);
    const before = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);

    await toggle.click();
    await expect(html).toHaveAttribute('data-theme', 'ink');
    await expect(toggle).toHaveText('Paper mode');
    const after = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(after).not.toBe(before);

    await page.reload();
    await expect(html).toHaveAttribute('data-theme', 'ink');

    await toggle.click();
    await expect(html).toHaveAttribute('data-theme', 'paper');
  });

  test('follows the system preference for dark mode by default', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('./');
    await expect(page.locator('#theme-toggle')).toHaveText('Paper mode');
    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(bg).toBe('rgb(34, 31, 27)');
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
