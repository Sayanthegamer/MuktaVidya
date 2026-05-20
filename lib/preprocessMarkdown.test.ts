import { preprocessMarkdown } from './preprocessMarkdown';

describe('preprocessMarkdown', () => {
  it('returns empty string when given falsy input', () => {
    expect(preprocessMarkdown('')).toBe('');
    expect(preprocessMarkdown(undefined as unknown as string)).toBe('');
    expect(preprocessMarkdown(null as unknown as string)).toBe('');
  });

  it('converts markdown block equations \\\[ and \\\] to $$', () => {
    const input = 'Here is an equation: \\\[x^2 + y^2 = z^2\\\]';
    const expected = 'Here is an equation: $$x^2 + y^2 = z^2$$';
    expect(preprocessMarkdown(input)).toBe(expected);
  });

  it('converts markdown inline equations \\\( and \\\) to $', () => {
    const input = 'Here is an inline equation: \\(E=mc^2\\)';
    const expected = 'Here is an inline equation: $E=mc^2$';
    expect(preprocessMarkdown(input)).toBe(expected);
  });

  it('leaves already formatted equations untouched (anti-corruption gate)', () => {
    const input = 'This is already good: $$a^2 + b^2 = c^2$$ and $y=mx+b$';
    expect(preprocessMarkdown(input)).toBe(input);
  });

  it('handles mixed equations correctly', () => {
    const input = 'Block \\\[E=mc^2\\\] and inline \\(F=ma\\) and already $$good$$';
    const expected = 'Block $$E=mc^2$$ and inline $F=ma$ and already $$good$$';
    expect(preprocessMarkdown(input)).toBe(expected);
  });
});
