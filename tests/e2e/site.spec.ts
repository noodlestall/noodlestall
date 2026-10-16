import { test, expect } from '@playwright/test';

test.describe('Boathouse Noodles site', ()=>{
  test('homepage loads', async ({ page })=>{
    await page.goto('http://localhost:3000/noodlestall/');
    await expect(page).toHaveTitle(/Boathouse Noodles/);
  });
});
