import { describe, it, expect } from 'vitest';
import { generateWhatsAppMessage } from '../src/lib/sharing';

describe('sharing', () => {
  it('generates a clear WhatsApp message', () => {
    const items = [ { checked: false, label: '200 g Spaghetti' }, { checked: true, label: '5 g Salt' } ];
    const msg = generateWhatsAppMessage('Creamy Tomato Pasta', 2, items);
    expect(msg).toContain('Boathouse Noodles');
    expect(msg).toContain('Creamy Tomato Pasta');
    expect(msg).toContain('200 g Spaghetti');
    expect(msg).not.toContain('5 g Salt');
  });
});
