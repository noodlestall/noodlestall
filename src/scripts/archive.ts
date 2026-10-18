/**
 * Client-side search, filtering and sorting for the recipe index.
 * Entries are pre-rendered; this script only hides, shows and reorders them.
 */
import {
  EMPTY_FILTERS,
  applyFilters,
  availableLetters,
  hasActiveFilters,
  parseFilters,
  serializeFilters,
  type FilterState,
  type RecipeIndexEntry
} from '../lib/search';

function $<T extends HTMLElement>(selector: string): T | null {
  return document.querySelector<T>(selector);
}

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
  const selects = {
    diet: $<HTMLSelectElement>('#diet')!,
    time: $<HTMLSelectElement>('#time')!,
    difficulty: $<HTMLSelectElement>('#difficulty')!,
    cuisine: $<HTMLSelectElement>('#cuisine')!,
    sort: $<HTMLSelectElement>('#sort')!
  };
  const categoryChips = [...form.querySelectorAll<HTMLAnchorElement>('[data-category]')];
  const letterButtons = [...form.querySelectorAll<HTMLButtonElement>('[data-letter]')];
  const clearButton = $<HTMLButtonElement>('#clear-filters')!;
  const status = $<HTMLElement>('#results-status')!;
  const empty = $<HTMLElement>('#empty-state')!;

  let state: FilterState = parseFilters(new URLSearchParams(window.location.search));

  function syncControls() {
    input.value = state.q;
    selects.diet.value = state.diet;
    selects.time.value = state.time;
    selects.difficulty.value = state.difficulty;
    selects.cuisine.value = state.cuisine;
    selects.sort.value = state.sort;
    for (const chip of categoryChips) {
      const active = (chip.dataset.category ?? '') === state.category;
      if (active) chip.setAttribute('aria-current', 'true');
      else chip.removeAttribute('aria-current');
    }
    for (const button of letterButtons) {
      button.setAttribute('aria-pressed', String(button.dataset.letter === state.letter && state.letter !== ''));
    }
    clearButton.disabled = !hasActiveFilters({ ...state, sort: 'asc' });
  }

  function syncUrl() {
    const query = serializeFilters(state);
    const url = `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`;
    window.history.replaceState(null, '', url);
  }

  function describe(count: number): string {
    const order = state.sort === 'asc' ? 'A – Z' : 'Z – A';
    if (count === 0) return 'No recipes match';
    if (!hasActiveFilters({ ...state, sort: 'asc' })) return `Showing all ${count} recipes, ${order}`;
    return `${count} ${count === 1 ? 'recipe' : 'recipes'} match, ${order}`;
  }

  function render() {
    const visible = applyFilters(entries, state);
    const visibleIds = new Set(visible.map((entry) => entry.id));

    for (const [id, node] of nodes) {
      node.hidden = !visibleIds.has(id);
    }
    // Append in sorted order; appendChild moves existing nodes, so the DOM is reordered in place.
    for (const entry of visible) {
      const node = nodes.get(entry.id);
      if (node) list!.appendChild(node);
    }

    // Letters are only enabled when they have matches under the other active filters.
    const lettersAvailable = availableLetters(applyFilters(entries, { ...state, letter: '' }));
    for (const button of letterButtons) {
      button.disabled = !lettersAvailable.has(button.dataset.letter ?? '');
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

  for (const [key, select] of Object.entries(selects)) {
    select.addEventListener('change', () => update({ [key]: select.value } as Partial<FilterState>));
  }

  for (const chip of categoryChips) {
    chip.addEventListener('click', (event) => {
      event.preventDefault();
      const category = (chip.dataset.category ?? '') as FilterState['category'];
      update({ category: state.category === category ? '' : category });
    });
  }

  for (const button of letterButtons) {
    button.addEventListener('click', () => {
      const letter = button.dataset.letter ?? '';
      update({ letter: state.letter === letter ? '' : letter });
    });
  }

  clearButton.addEventListener('click', () => {
    state = { ...EMPTY_FILTERS, sort: state.sort };
    render();
    input.focus();
  });

  window.addEventListener('popstate', () => {
    state = parseFilters(new URLSearchParams(window.location.search));
    render();
  });

  if (window.location.hash === '#search') {
    input.focus({ preventScroll: false });
  }

  render();
}
