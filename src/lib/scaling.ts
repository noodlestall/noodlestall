import type { Unit } from './recipe-schema';

export const MIN_SERVINGS = 0.5;
export const MAX_SERVINGS = 999;

/** scaled = original × selected / originalServings. Always computed from the original quantity. */
export function scaleQuantity(original: number, selectedServings: number, originalServings: number): number {
  if (!Number.isFinite(original) || !Number.isFinite(selectedServings) || !(originalServings > 0)) {
    return original;
  }
  return (original * selectedServings) / originalServings;
}

/** Up to two decimal places, trailing zeros removed. Never rounds countable items to whole numbers. */
export function formatQuantity(value: number): string {
  if (!Number.isFinite(value)) return '0';
  const rounded = Math.round((value + Number.EPSILON) * 100) / 100;
  return rounded.toString();
}

/** "piece" becomes "pieces" for anything other than exactly one. Metric units never change. */
export function formatUnit(unit: Unit | string, quantity: number): string {
  if (unit === 'piece') return quantity === 1 ? 'piece' : 'pieces';
  return unit;
}

export function formatQuantityWithUnit(quantity: number, unit: Unit | string): string {
  const rounded = Math.round((quantity + Number.EPSILON) * 100) / 100;
  return `${formatQuantity(rounded)} ${formatUnit(unit, rounded)}`;
}

/** Normalises user input for the servings field. Returns the fallback for invalid input. */
export function parseServings(input: string | number, fallback: number): number {
  const value = typeof input === 'number' ? input : Number(String(input).replace(',', '.'));
  if (!Number.isFinite(value) || value <= 0) return fallback;
  const rounded = Math.round(value * 100) / 100;
  return Math.min(MAX_SERVINGS, Math.max(MIN_SERVINGS, rounded));
}

/** Step used by the + and − buttons: whole servings above one, halves at or below one. */
export function stepServings(current: number, direction: 1 | -1): number {
  if (direction === 1) {
    return parseServings(current < 1 ? current + 0.5 : Math.floor(current) + 1, current);
  }
  return parseServings(current <= 1 ? current - 0.5 : Math.ceil(current) - 1, current);
}

export function presetServings(originalServings: number, factor: number): number {
  return parseServings(originalServings * factor, originalServings);
}
