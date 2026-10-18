import { describe, expect, it } from 'vitest';
import {
  formatQuantity,
  formatQuantityWithUnit,
  formatUnit,
  parseServings,
  presetServings,
  scaleQuantity,
  stepServings
} from '../../src/lib/scaling';

describe('scaleQuantity', () => {
  it('uses scaled = original × selected / originalServings', () => {
    expect(scaleQuantity(200, 4, 2)).toBe(400);
    expect(scaleQuantity(200, 1, 2)).toBe(100);
    expect(scaleQuantity(300, 3, 4)).toBe(225);
  });

  it('always scales from the original quantity, not the previous result', () => {
    const original = 100;
    const doubled = scaleQuantity(original, 4, 2);
    const back = scaleQuantity(original, 2, 2);
    expect(doubled).toBe(200);
    expect(back).toBe(100);
  });

  it('returns the original when the base servings are invalid', () => {
    expect(scaleQuantity(100, 2, 0)).toBe(100);
    expect(scaleQuantity(100, 2, Number.NaN)).toBe(100);
  });
});

describe('formatQuantity', () => {
  it('shows up to two decimals and trims trailing zeros', () => {
    expect(formatQuantity(200)).toBe('200');
    expect(formatQuantity(1.5)).toBe('1.5');
    expect(formatQuantity(1.234)).toBe('1.23');
    expect(formatQuantity(1.235)).toBe('1.24');
    expect(formatQuantity(0.333333)).toBe('0.33');
    expect(formatQuantity(2.5000001)).toBe('2.5');
  });

  it('does not round fractional countable ingredients', () => {
    expect(formatQuantity(scaleQuantity(1, 1, 2))).toBe('0.5');
    expect(formatQuantity(scaleQuantity(3, 2, 4))).toBe('1.5');
  });

  it('handles float noise such as 0.1 + 0.2', () => {
    expect(formatQuantity(0.1 + 0.2)).toBe('0.3');
  });
});

describe('formatUnit', () => {
  it('pluralises piece only', () => {
    expect(formatUnit('piece', 1)).toBe('piece');
    expect(formatUnit('piece', 2)).toBe('pieces');
    expect(formatUnit('piece', 0.5)).toBe('pieces');
    expect(formatUnit('g', 2)).toBe('g');
    expect(formatUnit('l', 1)).toBe('l');
  });

  it('formats a quantity with its unit', () => {
    expect(formatQuantityWithUnit(2, 'piece')).toBe('2 pieces');
    expect(formatQuantityWithUnit(0.5, 'kg')).toBe('0.5 kg');
    expect(formatQuantityWithUnit(1.0000001, 'piece')).toBe('1 piece');
  });
});

describe('parseServings', () => {
  it('accepts numbers and strings, including commas', () => {
    expect(parseServings('4', 2)).toBe(4);
    expect(parseServings('2,5', 2)).toBe(2.5);
    expect(parseServings(3.333, 2)).toBe(3.33);
  });

  it('falls back on invalid input and clamps to the allowed range', () => {
    expect(parseServings('', 2)).toBe(2);
    expect(parseServings('abc', 2)).toBe(2);
    expect(parseServings(-1, 2)).toBe(2);
    expect(parseServings(0, 2)).toBe(2);
    expect(parseServings(0.1, 2)).toBe(0.5);
    expect(parseServings(5000, 2)).toBe(999);
  });
});

describe('stepServings and presets', () => {
  it('steps by whole servings above one and halves below', () => {
    expect(stepServings(2, 1)).toBe(3);
    expect(stepServings(2, -1)).toBe(1);
    expect(stepServings(1, -1)).toBe(0.5);
    expect(stepServings(0.5, 1)).toBe(1);
    expect(stepServings(0.5, -1)).toBe(0.5);
    expect(stepServings(2.5, 1)).toBe(3);
    expect(stepServings(2.5, -1)).toBe(2);
  });

  it('computes ½×, 1× and 2× from the original servings', () => {
    expect(presetServings(2, 0.5)).toBe(1);
    expect(presetServings(2, 1)).toBe(2);
    expect(presetServings(2, 2)).toBe(4);
    expect(presetServings(1, 0.5)).toBe(0.5);
  });
});
