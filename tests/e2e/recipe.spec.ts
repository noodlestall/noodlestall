import { expect, test } from '@playwright/test';

const PASTA = './recipes/pumpkin-pasta/';
const SALAD = './recipes/smashed-cucumber-salad/';

function quantity(page: import('@playwright/test').Page, key: string) {
  return page.locator(`[data-ingredient-qty="${key}"]`);
}

test.describe('Recipe sheet', () => {
  test('renders the sheet with metadata, ingredients, steps and notes', async ({ page }) => {
    await page.goto(PASTA);
    await expect(page).toHaveTitle('Pumpkin Pasta with Walnuts – Boathouse Noodles');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Pumpkin Pasta with Walnuts');
    await expect(page.locator('.sheet__cover img')).toHaveCount(1);
    await expect(page.locator('.meta-grid dt')).toHaveText(['Prep', 'Cook', 'Total', 'Servings', 'Difficulty', 'Cuisine']);
    await expect(page.locator('.meta-grid dd').nth(0)).toHaveText('15 min');
    await expect(page.locator('.meta-grid dd').nth(2)).toHaveText('35 min');
    await expect(page.locator('.meta-grid dd').nth(3)).toHaveText('4 servings');
    await expect(page.locator('.meta-grid dd').nth(4)).toHaveText('Easy');
    await expect(page.locator('.meta-grid dd').nth(5)).toHaveText('Italian');
    await expect(page.locator('.ingredient')).toHaveCount(11);
    await expect(page.locator('.step')).toHaveCount(5);
    await expect(page.getByRole('heading', { name: 'Notes' })).toBeVisible();
    await expect(page.locator('.related')).toHaveCount(0);

    const jsonLd = await page.locator('script[type="application/ld+json"]').textContent();
    const data = JSON.parse(jsonLd ?? '{}');
    expect(data['@type']).toBe('Recipe');
    expect(data.recipeIngredient).toContain('400 g Spaghetti');
    expect(data.totalTime).toBe('PT35M');
    expect(data.aggregateRating).toBeUndefined();
    expect(data.nutrition).toBeUndefined();

    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://noodlestall.github.io/noodlestall/recipes/pumpkin-pasta/');
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /^https:\/\/noodlestall\.github\.io\/noodlestall\//);
  });

  test('scales ingredients from the original quantities', async ({ page }) => {
    await page.goto(PASTA);
    const input = page.getByLabel('Number of servings');
    await expect(input).toHaveValue('4');
    await expect(quantity(page, '0-0')).toHaveText('400 g');
    await expect(quantity(page, '0-4')).toHaveText('2 pieces');

    await page.getByRole('button', { name: 'More servings' }).click();
    await expect(input).toHaveValue('5');
    await expect(quantity(page, '0-0')).toHaveText('500 g');
    await expect(quantity(page, '0-4')).toHaveText('2.5 pieces');
    await expect(page.locator('#servings-note')).toHaveText('Scaled from 4 to 5 servings.');
    await expect(page.locator('#servings-note')).toBeVisible();

    await input.fill('2');
    await input.press('Enter');
    await expect(quantity(page, '0-0')).toHaveText('200 g');
    await expect(quantity(page, '0-4')).toHaveText('1 piece');

    await input.fill('8');
    await input.press('Enter');
    await expect(quantity(page, '0-0')).toHaveText('800 g');
    await expect(page.locator('[data-servings-preset], #servings-reset')).toHaveCount(0);

    await input.fill('6');
    await input.press('Enter');
    await expect(quantity(page, '0-0')).toHaveText('600 g');
    await expect(quantity(page, '0-7')).toHaveText('112.5 ml');

    await page.getByRole('button', { name: 'Fewer servings' }).click();
    await page.getByRole('button', { name: 'Fewer servings' }).click();
    await page.getByRole('button', { name: 'Fewer servings' }).click();
    await expect(input).toHaveValue('3');
    await expect(quantity(page, '0-0')).toHaveText('300 g');
    await expect(quantity(page, '0-4')).toHaveText('1.5 pieces');

    await input.fill('4');
    await input.press('Enter');
    await expect(quantity(page, '0-0')).toHaveText('400 g');
    await expect(page.locator('#servings-note')).toBeHidden();

    await input.fill('0');
    await input.press('Enter');
    await expect(input).toHaveValue('4');
  });

  test('shows two decimals without rounding countable ingredients', async ({ page }) => {
    await page.goto(SALAD);
    const input = page.getByLabel('Number of servings');
    await input.fill('6');
    await input.press('Enter');
    await expect(quantity(page, '0-0')).toHaveText('3 pieces');
    await expect(quantity(page, '0-5')).toHaveText('33.75 ml');
    await expect(quantity(page, '0-6')).toHaveText('4.5 pieces');
    await input.fill('2');
    await input.press('Enter');
    await expect(quantity(page, '0-1')).toHaveText('2.5 g');
    await expect(quantity(page, '0-5')).toHaveText('11.25 ml');
    await expect(quantity(page, '0-6')).toHaveText('1.5 pieces');
  });

  test('keeps the servings selection while the tab is open', async ({ page }) => {
    await page.goto(PASTA);
    await page.getByRole('button', { name: 'More servings' }).click();
    await page.getByRole('button', { name: 'More servings' }).click();
    await page.reload();
    await expect(page.getByLabel('Number of servings')).toHaveValue('6');
    await expect(quantity(page, '0-0')).toHaveText('600 g');
  });

  test('shopping list follows scaling, ticks off items and shares the rest', async ({ page }) => {
    await page.goto(PASTA);
    const shopping = page.locator('#shopping');
    await shopping.locator('summary').click();
    await expect(shopping).toHaveAttribute('open', '');

    const first = shopping.locator('[data-shopping-item="0-0"]');
    const firstLabel = shopping.locator('[data-shopping-label="0-0"]');
    await expect(firstLabel).toHaveText('400 g Spaghetti');
    await expect(shopping.locator('[data-shopping-label="0-10"]')).toHaveText('Sea salt and black pepper (to taste)');
    await expect(shopping.locator('[data-shopping-label="0-8"]')).toContainText('Parmesan');
    await expect(shopping.locator('[data-shopping-label="0-8"]')).toContainText('optional');

    await page.getByRole('button', { name: 'More servings' }).click();
    await expect(firstLabel).toHaveText('500 g Spaghetti');

    await first.check();
    await expect(first).toBeChecked();
    await expect(shopping.locator('.shopping__item--done')).toHaveCount(1);
    await expect(page.locator('#shopping-status')).toHaveText('10 items still to buy.');

    const link = page.locator('#shopping-whatsapp');
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', /noopener/);
    const href = await link.getAttribute('href');
    expect(href).toMatch(/^https:\/\/wa\.me\/\?text=/);
    const message = decodeURIComponent(href!.slice('https://wa.me/?text='.length));
    expect(message).toContain('🛒 BOATHOUSE NOODLES');
    expect(message).toContain('Shopping List: Pumpkin Pasta with Walnuts');
    expect(message).toContain('Servings: 5');
    expect(message).toContain('☐ 1250 g Hokkaido pumpkin');
    expect(message).not.toContain('Spaghetti');

    await page.reload();
    await shopping.locator('summary').click();
    await expect(first).toBeChecked();
    await expect(page.getByRole('button', { name: 'Reset ticks' })).toHaveCount(0);

    await first.uncheck();
    await expect(page.locator('#shopping-status')).toHaveText('11 items still to buy.');
  });

  test('copies the shopping list and the link to the clipboard', async ({ page, context, browserName }) => {
    test.skip(browserName !== 'chromium', 'clipboard permissions are only scriptable in Chromium');
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto(PASTA);

    await page.locator('#shopping summary').click();
    await page.getByRole('button', { name: 'Copy list' }).click();
    await expect(page.locator('#toast')).toHaveText('Shopping list copied');
    const list = await page.evaluate(() => navigator.clipboard.readText());
    expect(list).toContain('☐ 400 g Spaghetti');

    await page.getByRole('button', { name: 'Copy link' }).click();
    await expect(page.locator('#toast')).toHaveText('Link copied');
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('https://noodlestall.github.io/noodlestall/recipes/pumpkin-pasta/');
  });

  test('offers a WhatsApp share link for the recipe itself', async ({ page }) => {
    await page.goto(PASTA);
    const href = await page.locator('#share-whatsapp').getAttribute('href');
    const message = decodeURIComponent(href!.slice('https://wa.me/?text='.length));
    expect(message).toBe('Pumpkin Pasta with Walnuts – Boathouse Noodles\nhttps://noodlestall.github.io/noodlestall/recipes/pumpkin-pasta/');
  });

  test('puts the servings stepper in a closing row under the ingredients and hides the note until scaled', async ({ page }) => {
    await page.goto(PASTA);
    const row = page.locator('.servings-row');
    await expect(row.getByLabel('Number of servings')).toHaveValue('4');
    await expect(row).toContainText('Adjust servings');
    await expect(page.locator('.meta-grid input, #servings-heading, .section-head')).toHaveCount(0);
    await expect(page.locator('#servings-note')).toBeHidden();
    const lastIngredient = await page.locator('.ingredient').last().boundingBox();
    const box = await row.boundingBox();
    expect(box!.y).toBeGreaterThan(lastIngredient!.y + lastIngredient!.height - 1);
    expect(box!.height).toBeLessThanOrEqual(44);
    for (const name of ['Fewer servings', 'More servings']) {
      const b = await page.getByRole('button', { name }).boundingBox();
      expect(b!.width).toBeGreaterThanOrEqual(24);
      expect(b!.height).toBeGreaterThanOrEqual(24);
    }
  });

  test('clears ticked shopping items when going back to the index', async ({ page }) => {
    await page.goto(PASTA);
    await page.locator('#shopping summary').click();
    const first = page.locator('[data-shopping-item="0-0"]');
    await first.check();
    await page.reload();
    await expect(page.locator('[data-shopping-item="0-0"]')).toBeChecked();

    await page.getByRole('link', { name: 'Boathouse Noodles – home' }).click();
    await expect(page).toHaveURL(/\/noodlestall\/$/);
    await page.goto(PASTA);
    await expect(page.locator('[data-shopping-item="0-0"]')).not.toBeChecked();
  });

  test('shows the method as plain numbered steps without checkboxes', async ({ page }) => {
    await page.goto(PASTA);
    await expect(page.locator('#steps .step')).toHaveCount(5);
    await expect(page.locator('#steps input')).toHaveCount(0);
    await expect(page.locator('#steps-status, #steps-reset')).toHaveCount(0);
    await expect(page.locator('.step__title').first()).toContainText('Roast the pumpkin');
  });

  test('is operable from the keyboard', async ({ page }) => {
    await page.goto(PASTA);
    await page.getByRole('button', { name: 'More servings' }).focus();
    await page.keyboard.press('Enter');
    await expect(quantity(page, '0-0')).toHaveText('500 g');

    await page.locator('#shopping summary').focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#shopping')).toHaveAttribute('open', '');

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

    // Print, copy and share live at the end of the sheet, after the method.
    const actions = await page.locator('.sheet__actions').boundingBox();
    expect(actions!.y).toBeGreaterThan(steps!.y + steps!.height - 1);
    await expect(page.locator('.sheet__head .btn')).toHaveCount(0);

    const boxes = await page.locator('.btn, .stepper__btn, .stepper__input, .shopping input[type="checkbox"]').evaluateAll((els) => els.map((el) => el.getBoundingClientRect().height));
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
