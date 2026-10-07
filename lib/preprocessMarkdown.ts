export interface PreprocessMarkdownOptions {
  isStreaming?: boolean;
}

export function preprocessMarkdown(text: string, options?: PreprocessMarkdownOptions): string {
  if (!text) return "";
  let result = text
    .replace(/\\\[/g, '$$$$')
    .replace(/\\\]/g, '$$$$')
    .replace(/\\\(/g, '$')
    .replace(/\\\)/g, '$')
    // Ensure display math is separated by blank lines to prevent markdown engines
    // from incorrectly grouping it into the preceding/succeeding paragraph.
    .replace(/(?<!\n)\n\$\$/g, '\n\n$$$$')
    .replace(/\$\$\n(?!\n)/g, '$$$$\n\n');

  if (options?.isStreaming) {
    // 1. Check for unclosed block math ($$)
    const blockMatches = result.match(/\$\$/g);
    const blockCount = blockMatches ? blockMatches.length : 0;
    if (blockCount % 2 !== 0) {
      result = result.trimEnd() + '\n$$';
    }

    // 2. Check for unclosed inline math ($)
    const withoutBlocks = result.replace(/\$\$[\s\S]*?\$\$/g, '');
    const inlineMatches = withoutBlocks.match(/(?<!\\)\$/g);
    const inlineCount = inlineMatches ? inlineMatches.length : 0;
    if (inlineCount % 2 !== 0) {
      result = result.trimEnd() + '$';
    }

  }

  return result;
}

