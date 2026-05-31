import { preprocessMarkdown } from './preprocessMarkdown';

describe('preprocessMarkdown', () => {
  it('should handle empty or falsy strings safely', () => {
    expect(preprocessMarkdown('')).toBe('');
    // @ts-expect-error Testing invalid input for robustness
    expect(preprocessMarkdown(null)).toBe('');
    // @ts-expect-error Testing invalid input for robustness
    expect(preprocessMarkdown(undefined)).toBe('');
  });

  it('should convert inline LaTeX delimiters `\\(` and `\\)` to `$`', () => {
    const input = 'This is inline \\(x = 2\\) math.';
    const expected = 'This is inline $x = 2$ math.';
    expect(preprocessMarkdown(input)).toBe(expected);
  });

  it('should convert block LaTeX delimiters `\\[` and `\\]` to `$$` and add missing blank lines', () => {
    const input = 'This is block:\n\\[x = \n2\\]';
    const expected = 'This is block:\n\n$$x = \n2$$';
    expect(preprocessMarkdown(input)).toBe(expected);
  });

  it('should handle multiple occurrences in a single string', () => {
    const input = 'Start \\(a=1\\) middle \\[b=2\\] end \\(c=3\\).';
    const expected = 'Start $a=1$ middle $$b=2$$ end $c=3$.';
    expect(preprocessMarkdown(input)).toBe(expected);
  });

  it('should not corrupt or double-transform existing standard markdown math delimiters', () => {
    const input = 'We already have $x=1$ and block $$y=2$$. Now add \\(z=3\\) and \\[w=4\\].';
    const expected = 'We already have $x=1$ and block $$y=2$$. Now add $z=3$ and $$w=4$$.';
    expect(preprocessMarkdown(input)).toBe(expected);
  });

  it('should safely handle multi-line complex mixed texts without collision and space out equations', () => {
    const input = `
Here is a complex explanation.

First, standard markdown:
$a^2 + b^2 = c^2$

Next, some LaTeX that needs conversion:
\\[
E = mc^2
\\]

And inline: \\(F = ma\\).

Will it break? $$No$$.
    `;
    const expected = `
Here is a complex explanation.

First, standard markdown:
$a^2 + b^2 = c^2$

Next, some LaTeX that needs conversion:

$$

E = mc^2

$$

And inline: $F = ma$.

Will it break? $$No$$.
    `;
    expect(preprocessMarkdown(input)).toBe(expected);
  });

  it('should separate steps correctly when consecutive $$ lines are given', () => {
    const input = `Since $x \to \pi/2$, let $h = x - \pi/2$.
$$ \sin(2x) = -\sin(2h) $$
$$ \cos(x) = -\sin(h) $$`;

    const expected = `Since $x \to \pi/2$, let $h = x - \pi/2$.

$$ \sin(2x) = -\sin(2h) $$

$$ \cos(x) = -\sin(h) $$`;

    expect(preprocessMarkdown(input)).toBe(expected);
  });
});
