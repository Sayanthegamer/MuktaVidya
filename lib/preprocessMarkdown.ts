export function preprocessMarkdown(text: string): string {
  if (!text) return "";
  return text
    .replace(/\\\[/g, '$$$$')
    .replace(/\\\]/g, '$$$$')
    .replace(/\\\(/g, '$')
    .replace(/\\\)/g, '$')
    // Ensure display math is separated by blank lines to prevent markdown engines
    // from incorrectly grouping it into the preceding/succeeding paragraph.
    // Replaces cases where $$ is preceded or followed by only a single newline.
    // We strictly use negative lookbehinds/lookaheads to prevent adding extra
    // spaces if they are already double-spaced.
    .replace(/(?<!\n)\n\$\$/g, '\n\n$$$$')
    .replace(/\$\$\n(?!\n)/g, '$$$$\n\n');
}
