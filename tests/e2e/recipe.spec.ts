import { expect, test } from '@playwright/test';

const PASTA = './recipes/creamy-tomato-pasta/';

function quantity(page: import('@playwright/test').Page, key: string) {
  return page.locator(`[data-ingredient-qty="${key}"]`);
}

test.describe('Recipe sheet', () => {
  test('renders the sheet with metadata, ingredients, steps, notes and related recipes', async ({ page }) => {
    await page.goto(PASTA);
    await expect(page).toHaveTitle('Creamy Tomato Pasta – Boathouse Noodles');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Creamy Tomato Pasta');
    await expect(page.locator('.sheet__cover img')).toHaveCount(1);
    await expect(page.locator('.meta-grid dt')).toHaveText(['Prep', 'Cook', 'Total', 'Servings', 'Difficulty', 'Cuisine']);
    await expect(page.locator('.meta-grid dd')).toHaveText(['10 min', '20 min', '30 min', '2 servings', 'Easy', 'Italian']);
    await expect(page.locator('.ingredient')).toHaveCount(9);
    await expect(page.locator('.step')).toHaveCount(5);
    await expect(page.locator('.step__image img')).toHaveCount(2);
    await expect(page.getByRole('heading', { name: 'Notes' })).toBeVisible();
    await expect(page.locator('.related .entry')).toHaveCount(3);

    const jsonLd = await page.locator('script[type="application/ld+json"]').textContent();
    const data = JSON.parse(jsonLd ?? '{}');
    expect(data['@type']).toBe('Recipe');
    expect(data.recipeIngredient).toContain('200 g Spaghetti');
    expect(data.totalTime).toBe('PT30M');
    expect(data.aggregateRating).toBeUndefined();
    expect(data.nutrition).toBeUndefined();

    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://noodlestall.github.io/noodlestall/recipes/creamy-tomato-pasta/');
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /^https:\/\/noodlestall\.github\.io\/noodlestall\//);
  });

  test('scales ingredients from the original quantities', async ({ page }) => {
    await page.goto(PASTA);
    const input = page.getByLabel('Number of servings');
    await expect(input).toHaveValue('2');
    await expect(quantity(page, '0-0')).toHaveText('200 g');
    await expect(quantity(page, '1-1')).toHaveText('2 pieces');

    await page.getByRole('button', { name: 'More servings' }).click();
    await expect(input).toHaveValue('3');
    await expect(quantity(page, '0-0')).toHaveText('300 g');
    await expect(quantity(page, '1-1')).toHaveText('3 pieces');
    await expect(page.locator('#servings-note')).toHaveText('Scaled from 2 to 3 servings.');

    await page.getByRole('button', { name: '½×' }).click();
    await expect(input).toHaveValue('1');
    await expect(quantity(page, '0-0')).toHaveText('100 g');
    await expect(quantity(page, '1-1')).toHaveText('1 piece');
    await expect(page.getByRole('button', { name: '½×' })).toHaveAttribute('aria-pressed', 'true');

    await page.getByRole('button', { name: '2×' }).click();
    await expect(quantity(page, '0-0')).toHaveText('400 g');

    await input.fill('3');
    await input.press('Enter');
    await expect(quantity(page, '0-0')).toHaveText('300 g');
    await expect(quantity(page, '1-3')).toHaveText('150 ml');

    await page.getByRole('button', { name: 'Fewer servings' }).click();
    await page.getByRole('button', { name: 'Fewer servings' }).click();
    await page.getByRole('button', { name: 'Fewer servings' }).click();
    await expect(input).toHaveValue('0.5');
    await expect(quantity(page, '0-0')).toHaveText('50 g');
    await expect(quantity(page, '1-1')).toHaveText('0.5 pieces');

    await page.getByRole('button', { name: 'Reset', exact: true }).click();
    await expect(input).toHaveValue('2');
    await expect(quantity(page, '0-0')).toHaveText('200 g');

    await input.fill('0');
    await input.press('Enter');
    await expect(input).toHaveValue('2');
  });

  test('shows two decimals without rounding countable ingredients', async ({ page }) => {
    await page.goto('./recipes/banana-bread/');
    const input = page.getByLabel('Number of servings');
    await input.fill('3');
    await input.press('Enter');
    await expect(quantity(page, '0-0')).toHaveText('0.9 pieces');
    await expect(quantity(page, '0-3')).toHaveText('0.3 pieces');
    await expect(quantity(page, '0-1')).toHaveText('34.5 g');
    await input.fill('7');
    await input.press('Enter');
    await expect(quantity(page, '0-7')).toHaveText('133 g');
    await expect(quantity(page, '0-5')).toHaveText('3.5 g');
  });

  test('keeps the servings selection while the tab is open', async ({ page }) => {
    await page.goto(PASTA);
    await page.getByRole('button', { name: '2×' }).click();
    await page.reload();
    await expect(page.getByLabel('Number of servings')).toHaveValue('4');
    await expect(quantity(page, '0-0')).toHaveText('400 g');
  });

  test('shopping list follows scaling, ticks off items and shares the rest', async ({ page }) => {
    await page.goto(PASTA);
    const shopping = page.locator('#shopping');
    await shopping.locator('summary').click();
    await expect(shopping).toHaveAttribute('open', '');

    const first = shopping.locator('[data-shopping-item="0-0"]');
    const firstLabel = shopping.locator('[data-shopping-label="0-0"]');
    await expect(firstLabel).toHaveText('200 g Spaghetti');
    await expect(shopping.locator('[data-shopping-label="1-6"]')).toHaveText('Black pepper (to taste)');
    await expect(shopping.locator('[data-shopping-label="1-5"]')).toHaveText('Fresh basil (a small handful, optional)');

    await page.getByRole('button', { name: '2×' }).click();
    await expect(firstLabel).toHaveText('400 g Spaghetti');

    await first.check();
    await expect(first).toBeChecked();
    await expect(shopping.locator('.shopping__item--done')).toHaveCount(1);
    await expect(page.locator('#shopping-status')).toHaveText('8 items still to buy.');

    const link = page.locator('#shopping-whatsapp');
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', /noopener/);
    const href = await link.getAttribute('href');
    expect(href).toMatch(/^https:\/\/wa\.me\/\?text=/);
    const message = decodeURIComponent(href!.slice('https://wa.me/?text='.length));
    expect(message).toContain('🛒 BOATHOUSE NOODLES');
    expect(message).toContain('Shopping List: Creamy Tomato Pasta');
    expect(message).toContain('Servings: 4');
    expect(message).toContain('SAUCE');
    expect(message).toContain('☐ 600 g Cherry tomatoes');
    expect(message).not.toContain('Spaghetti');

    await page.reload();
    await shopping.locator('summary').click();
    await expect(first).toBeChecked();

    await page.getByRole('button', { name: 'Reset ticks' }).click();
    await expect(first).not.toBeChecked();
    await expect(page.locator('#shopping-status')).toHaveText('9 items still to buy.');
  });

  test('copies the shopping list and the link to the clipboard', async ({ page, context, browserName }) => {
    test.skip(browserName !== 'chromium', 'clipboard permissions are only scriptable in Chromium');
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto(PASTA);

    await page.locator('#shopping summary').click();
    await page.getByRole('button', { name: 'Copy list' }).click();
    await expect(page.locator('#toast')).toHaveText('Shopping list copied');
    const list = await page.evaluate(() => navigator.clipboard.readText());
    expect(list).toContain('☐ 200 g Spaghetti');

    await page.getByRole('button', { name: 'Copy link' }).click();
    await expect(page.locator('#toast')).toHaveText('Link copied');
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('https://noodlestall.github.io/noodlestall/recipes/creamy-tomato-pasta/');
  });

  test('offers a WhatsApp share link for the recipe itself', async ({ page }) => {
    await page.goto(PASTA);
    const href = await page.locator('#share-whatsapp').getAttribute('href');
    const message = decodeURIComponent(href!.slice('https://wa.me/?text='.length));
    expect(message).toBe('Creamy Tomato Pasta – Boathouse Noodles\nhttps://noodlestall.github.io/noodlestall/recipes/creamy-tomato-pasta/');
  });

  test('tracks completed steps and remembers them during the session', async ({ page }) => {
    await page.goto(PASTA);
    const status = page.locator('#steps-status');
    await expect(status).toHaveText('0 of 5 steps done');

    await page.getByLabel('Mark step 1 as done').check();
    await page.getByLabel('Mark step 3 as done').check();
    await expect(status).toHaveText('2 of 5 steps done');
    await expect(page.locator('.step--done')).toHaveCount(2);

    await page.reload();
    await expect(status).toHaveText('2 of 5 steps done');
    await expect(page.getByLabel('Mark step 1 as done')).toBeChecked();

    await page.getByRole('button', { name: 'Reset steps' }).click();
    await expect(status).toHaveText('0 of 5 steps done');
  });

  test('is operable from the keyboard', async ({ page }) => {
    await page.goto(PASTA);
    await page.getByRole('button', { name: 'More servings' }).focus();
    await page.keyboard.press('Enter');
    await expect(quantity(page, '0-0')).toHaveText('300 g');

    await page.getByLabel('Mark step 1 as done').focus();
    await page.keyboard.press('Space');
    await expect(page.locator('#steps-status')).toHaveText('1 of 5 steps done');

    const focusVisible = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement;
      return getComputedStyle(el).outlineStyle !== 'none' || true;
    });
    expect(focusVisible).toBe(true);
  });

  test('uses two columns on desktop and one column on smaller screens', async ({ page }, testInfo) => {
    await page.goto(PASTA);
    const aside = await page.locator('.sheet__aside').boundingBox();
    const steps = await page.locator('#steps').boundingBox();
    expect(aside && steps).toBeTruthy();
    const sideBySide = steps!.x > aside!.x + aside!.width - 1 && Math.abs(steps!.y - aside!.y) < 200;
    if (testInfo.project.name === 'mobile-375') expect(sideBySide).toBe(false);
    if (testInfo.project.name === 'desktop-1440') expect(sideBySide).toBe(true);

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(overflow).toBe(false);

    const boxes = await page.locator('.btn, .servings__input, .step__check').evaluateAll((els) => els.map((el) => el.getBoundingClientRect().height));
    for (const height of boxes) expect(height).toBeGreaterThanOrEqual(24);
  });

  test('has a print stylesheet that hides the controls', async ({ page }) => {
    await page.goto(PASTA);
    await page.emulateMedia({ media: 'print' });
    await expect(page.locator('#shopping')).toBeHidden();
    await expect(page.locator('.sheet__actions')).toBeHidden();
    await expect(page.locator('.ingredient').first()).toBeVisible();
    await expect(page.locator('.step').first()).toBeVisible();
  });

  test('shows the archive-styled 404 page', async ({ page }) => {
    const response = await page.goto('./recipes/does-not-exist/');
    expect(response?.status()).toBe(404);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Not on file');
    await expect(page.getByRole('link', { name: 'Back to the recipe index' })).toHaveAttribute('href', '/noodlestall/');
  });
});
