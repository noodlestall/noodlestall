/**
 * Client-side search and category filtering for the recipe index.
 * Entries are pre-rendered A–Z; this script only hides and shows them.
 * Coming home also clears every ticked shopping list.
 */
import { SHOPPING_PREFIX, clearSessionPrefix } from '../lib/storage';
import {
  applyFilters,
  hasActiveFilters,
  parseFilters,
  serializeFilters,
  type FilterState,
  type RecipeIndexEntry
} from '../lib/search';

function $<T extends HTMLElement>(selector: string): T | null {
  return document.querySelector<T>(selector);
}

clearSessionPrefix(SHOPPING_PREFIX);

const dataNode = document.getElementById('recipe-index-data');
const list = document.getElementById('recipe-index');
const form = document.getElementById('search') as HTMLFormElement | null;

if (dataNode && list && form) {
  const entries = JSON.parse(dataNode.textContent ?? '[]') as RecipeIndexEntry[];
  const nodes = new Map<string, HTMLElement>();
  for (const li of list.querySelectorAll<HTMLElement>('.entry[data-id]')) {
    nodes.set(li.dataset.id ?? '', li);
  }

  const input = $<HTMLInputElement>('#q')!;
  const categoryChips = [...form.querySelectorAll<HTMLAnchorElement>('[data-category]')];
  const status = $<HTMLElement>('#results-status')!;
  const empty = $<HTMLElement>('#empty-state')!;

  let state: FilterState = parseFilters(new URLSearchParams(window.location.search));

  function syncControls() {
    input.value = state.q;
    for (const chip of categoryChips) {
      const active = (chip.dataset.category ?? '') === state.category;
      if (active) chip.setAttribute('aria-current', 'true');
      else chip.removeAttribute('aria-current');
    }
  }

  function syncUrl() {
    const query = serializeFilters(state);
    const url = `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`;
    window.history.replaceState(null, '', url);
  }

  function describe(count: number): string {
    if (count === 0) return 'No recipes match';
    if (!hasActiveFilters(state)) return `Showing all ${count} recipes`;
    return `${count} ${count === 1 ? 'recipe' : 'recipes'} match`;
  }

  function render() {
    const visible = applyFilters(entries, state);
    const visibleIds = new Set(visible.map((entry) => entry.id));

    for (const [id, node] of nodes) {
      node.hidden = !visibleIds.has(id);
    }

    empty.hidden = visible.length > 0;
    status.textContent = describe(visible.length);
    syncControls();
    syncUrl();
  }

  function update(patch: Partial<FilterState>) {
    state = { ...state, ...patch };
    render();
  }

  input.addEventListener('input', () => update({ q: input.value }));
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    update({ q: input.value });
  });

  for (const chip of categoryChips) {
    chip.addEventListener('click', (event) => {
      event.preventDefault();
      const category = (chip.dataset.category ?? '') as FilterState['category'];
      update({ category: state.category === category ? '' : category });
    });
  }

  window.addEventListener('popstate', () => {
    state = parseFilters(new URLSearchParams(window.location.search));
    render();
  });

  render();
}
