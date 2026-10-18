/**
 * Recipe sheet interactions: serving scaling, shopping checklist,
 * printing and sharing. State lives in sessionStorage.
 */
import { formatQuantity, parseServings, stepServings } from '../lib/scaling';
import { buildShoppingListMessage, buildWhatsAppUrl } from '../lib/sharing';
import { buildShoppingGroups, itemKey, scaledQuantityLabel, shoppingLabel, type ClientRecipe } from '../lib/shopping';
import { readSession, removeSession, storageKeys, writeSession } from '../lib/storage';

const dataNode = document.getElementById('recipe-data');
const recipe: ClientRecipe | null = dataNode ? (JSON.parse(dataNode.textContent ?? 'null') as ClientRecipe) : null;

function toast(message: string) {
  const node = document.getElementById('toast');
  if (!node) return;
  node.textContent = message;
  node.dataset.visible = 'true';
  window.clearTimeout(Number(node.dataset.timer));
  node.dataset.timer = String(window.setTimeout(() => (node.dataset.visible = 'false'), 2200));
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for browsers without clipboard permission: temporary textarea.
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    let ok = false;
    try {
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      ok = document.execCommand('copy');
    } catch {
      ok = false;
    }
    area.remove();
    return ok;
  }
}

if (recipe) {
  const keys = {
    servings: storageKeys.servings(recipe.id),
    shopping: storageKeys.shopping(recipe.id)
  };

  /* ---------------- Servings & scaling ---------------- */

  const input = document.getElementById('servings-input') as HTMLInputElement | null;
  const note = document.getElementById('servings-note');
  const quantityNodes = new Map<string, HTMLElement>();
  for (const node of document.querySelectorAll<HTMLElement>('[data-ingredient-qty]')) {
    quantityNodes.set(node.dataset.ingredientQty ?? '', node);
  }

  let servings = parseServings(readSession<number>(keys.servings, recipe.servings), recipe.servings);

  function renderServings() {
    if (input) input.value = formatQuantity(servings);
    recipe!.groups.forEach((group, g) => {
      group.ingredients.forEach((ingredient, i) => {
        const node = quantityNodes.get(itemKey(g, i));
        const label = scaledQuantityLabel(ingredient, servings, recipe!.servings);
        if (node && label) node.textContent = label;
      });
    });
    if (note) {
      note.textContent =
        servings === recipe!.servings
          ? `Original recipe for ${formatQuantity(recipe!.servings)} ${recipe!.servings === 1 ? 'serving' : 'servings'}.`
          : `Scaled from ${formatQuantity(recipe!.servings)} to ${formatQuantity(servings)} servings.`;
    }
  }

  function setServings(next: number) {
    servings = parseServings(next, recipe!.servings);
    if (servings === recipe!.servings) removeSession(keys.servings);
    else writeSession(keys.servings, servings);
    renderServings();
    renderShopping();
  }

  input?.addEventListener('change', () => setServings(parseServings(input.value, servings)));
  input?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      setServings(parseServings(input.value, servings));
    }
  });
  for (const button of document.querySelectorAll<HTMLButtonElement>('[data-servings-step]')) {
    button.addEventListener('click', () => setServings(stepServings(servings, button.dataset.servingsStep === '1' ? 1 : -1)));
  }

  /* ---------------- Shopping list ---------------- */

  const checked = new Set<string>(readSession<string[]>(keys.shopping, []));
  const shoppingInputs = [...document.querySelectorAll<HTMLInputElement>('[data-shopping-item]')];
  const shoppingLabels = new Map<string, HTMLElement>();
  for (const node of document.querySelectorAll<HTMLElement>('[data-shopping-label]')) {
    shoppingLabels.set(node.dataset.shoppingLabel ?? '', node);
  }
  const whatsappLink = document.getElementById('shopping-whatsapp') as HTMLAnchorElement | null;
  const shoppingStatus = document.getElementById('shopping-status');

  function shoppingMessage(): string {
    return buildShoppingListMessage({
      recipeTitle: recipe!.title,
      servings,
      groups: buildShoppingGroups(recipe!, servings, checked)
    });
  }

  function renderShopping() {
    recipe!.groups.forEach((group, g) => {
      group.ingredients.forEach((ingredient, i) => {
        const key = itemKey(g, i);
        const label = shoppingLabels.get(key);
        if (label) label.textContent = shoppingLabel(ingredient, servings, recipe!.servings);
      });
    });
    let remaining = 0;
    for (const box of shoppingInputs) {
      const key = box.dataset.shoppingItem ?? '';
      box.checked = checked.has(key);
      box.closest('.shopping__item')?.classList.toggle('shopping__item--done', box.checked);
      if (!box.checked) remaining += 1;
    }
    if (whatsappLink) whatsappLink.href = buildWhatsAppUrl(shoppingMessage());
    if (shoppingStatus) {
      shoppingStatus.textContent =
        remaining === 0 ? 'Everything ticked off.' : `${remaining} ${remaining === 1 ? 'item' : 'items'} still to buy.`;
    }
  }

  for (const box of shoppingInputs) {
    box.addEventListener('change', () => {
      const key = box.dataset.shoppingItem ?? '';
      if (box.checked) checked.add(key);
      else checked.delete(key);
      writeSession(keys.shopping, [...checked]);
      renderShopping();
    });
  }

  document.getElementById('shopping-reset')?.addEventListener('click', () => {
    checked.clear();
    removeSession(keys.shopping);
    renderShopping();
  });

  document.getElementById('shopping-copy')?.addEventListener('click', async () => {
    const ok = await copyText(shoppingMessage());
    toast(ok ? 'Shopping list copied' : 'Could not copy – select the list and copy it by hand');
  });

  /* ---------------- Print & share ---------------- */

  document.getElementById('print-recipe')?.addEventListener('click', () => window.print());

  const copyLink = document.getElementById('copy-link');
  copyLink?.addEventListener('click', async () => {
    const ok = await copyText(copyLink.dataset.url ?? window.location.href);
    toast(ok ? 'Link copied' : 'Could not copy the link');
  });

  renderServings();
  renderShopping();
}
