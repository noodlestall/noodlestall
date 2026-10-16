export const basePath = '/noodlestall/';

export function clampServings(value: number, min = 1) {
  return Math.max(min, Math.round(value));
}

export function formatQuantity(value: number, digits = 2) {
  if (!Number.isFinite(value)) return '0';
  const rounded = Number(value.toFixed(digits));
  return Number.isInteger(rounded) ? String(rounded) : rounded.toString();
}

export function scaleQuantity(original: number, selected: number, originalServings: number) {
  if (!originalServings || originalServings <= 0) return original;
  return (original * selected) / originalServings;
}

export function getIngredientDisplay(quantity: number | undefined, unit: string | undefined) {
  if (quantity === undefined || unit === undefined) return '—';
  return `${formatQuantity(quantity)} ${unit}`;
}
