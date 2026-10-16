import { describe, it, expect } from 'vitest';
import { scaleQuantity, formatQuantity } from '../src/lib/scaling';

describe('scaling', () => {
  it('scales quantities correctly', () => {
    expect(scaleQuantity(200, 4, 2)).toBe(400);
    expect(scaleQuantity(20, 1, 2)).toBe(10);
  });
  it('formats decimals appropriately', () => {
    expect(formatQuantity(1)).toBe('1');
    expect(formatQuantity(1.234)).toBe('1.23');
  });
});
