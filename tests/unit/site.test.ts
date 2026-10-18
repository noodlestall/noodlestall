import { describe, expect, it } from 'vitest';
import { absoluteUrl, formatMinutes, formatRecipeNumber, isoDuration, joinPath, recipePath, titleCase } from '../../src/lib/site';

describe('GitHub Pages subpath handling', () => {
  it('joins the base path without doubling slashes', () => {
    expect(joinPath('/noodlestall/', 'recipes/x/')).toBe('/noodlestall/recipes/x/');
    expect(joinPath('/noodlestall', '/recipes/x/')).toBe('/noodlestall/recipes/x/');
    expect(joinPath('/', 'recipes/x/')).toBe('/recipes/x/');
  });

  it('builds recipe paths and absolute URLs', () => {
    expect(recipePath('/noodlestall/', 'shakshuka')).toBe('/noodlestall/recipes/shakshuka/');
    expect(absoluteUrl('https://noodlestall.github.io', '/noodlestall/recipes/shakshuka/')).toBe(
      'https://noodlestall.github.io/noodlestall/recipes/shakshuka/'
    );
    expect(absoluteUrl('https://noodlestall.github.io/', 'noodlestall/')).toBe('https://noodlestall.github.io/noodlestall/');
  });
});

describe('formatting helpers', () => {
  it('formats minutes', () => {
    expect(formatMinutes(25)).toBe('25 min');
    expect(formatMinutes(60)).toBe('1 h');
    expect(formatMinutes(70)).toBe('1 h 10 min');
    expect(formatMinutes(0)).toBe('0 min');
  });

  it('formats ISO durations', () => {
    expect(isoDuration(25)).toBe('PT25M');
    expect(isoDuration(60)).toBe('PT1H');
    expect(isoDuration(70)).toBe('PT1H10M');
    expect(isoDuration(0)).toBe('PT0M');
  });

  it('formats archive numbers and labels', () => {
    expect(formatRecipeNumber(4)).toBe('No. 004');
    expect(formatRecipeNumber(123)).toBe('No. 123');
    expect(titleCase('middle-eastern')).toBe('Middle-Eastern');
    expect(titleCase('italian')).toBe('Italian');
  });
});

describe('safeJson', () => {
  it('escapes script-closing sequences', async () => {
    const { safeJson } = await import('../../src/lib/site');
    const out = safeJson({ text: 'Stir </script><script>alert(1)</script>' });
    expect(out).not.toContain('</script>');
    expect(JSON.parse(out).text).toBe('Stir </script><script>alert(1)</script>');
  });
});
